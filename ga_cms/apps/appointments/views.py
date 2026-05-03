import datetime
from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import DoctorAvailability, Appointment, RescheduleHistory
from .serializers import (
    DoctorAvailabilitySerializer,
    AppointmentSerializer,
    RescheduleRequestSerializer
)
from .services import generate_available_slots, calculate_distance, send_notification

class SlotAvailabilityView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        appt_type = request.query_params.get('appointment_type')

        if not all([doctor_id, date_str, appt_type]):
            return Response({"error": "doctor_id, date, and appointment_type are required"}, status=status.HTTP_400_BAD_REQUEST)

        slots = generate_available_slots(doctor_id, date_str, appt_type)
        return Response({"available_slots": slots})

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Appointment.objects.filter(patient__user=user)
        elif user.role in ['doctor', 'senior_doctor']:
            return Appointment.objects.filter(doctor__user=user)
        # Receptionist or Admin
        return Appointment.objects.all()

    def create(self, request, *args, **kwargs):
        # Apply 5-minute lock and distance calculation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        doctor = serializer.validated_data['doctor']
        date = serializer.validated_data['date']
        time = serializer.validated_data['time']
        appt_type = serializer.validated_data['appointment_type']
        patient = serializer.validated_data['patient']

        # Verify slot is still available
        available_slots = generate_available_slots(doctor.id, date, appt_type)
        if time.strftime('%H:%M:%S') not in available_slots and time.strftime('%H:%M') not in [s[:5] for s in available_slots]:
             return Response({"error": "Slot is no longer available"}, status=status.HTTP_400_BAD_REQUEST)

        distance = None
        if appt_type == 'in_person':
            distance = calculate_distance(patient.pincode)

        locked_until = timezone.now() + datetime.timedelta(minutes=5)
        
        # Patient bookings start as 'pending' for doctor approval.
        # Receptionist/Doctor bookings could be auto-confirmed.
        appt_status = 'pending' if request.user.role == 'patient' else 'confirmed'

        appointment = serializer.save(
            status=appt_status,
            locked_until=locked_until,
            distance_to_clinic=distance
        )

        send_notification(patient.user, "Booking Confirmed", f"Appointment with {doctor} on {date} at {time}")
        
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(appointment).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        serializer = RescheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_date = serializer.validated_data['new_date']
        new_time = serializer.validated_data['new_time']
        reason = serializer.validated_data['reason']

        # Check slot availability
        available_slots = generate_available_slots(appointment.doctor.id, new_date, appointment.appointment_type)
        if new_time.strftime('%H:%M:%S') not in available_slots and new_time.strftime('%H:%M') not in [s[:5] for s in available_slots]:
             return Response({"error": "New slot is not available"}, status=status.HTTP_400_BAD_REQUEST)

        # Log history
        RescheduleHistory.objects.create(
            appointment=appointment,
            rescheduled_by=request.user,
            original_date=appointment.date,
            original_time=appointment.time,
            new_date=new_date,
            new_time=new_time,
            reason=reason
        )

        appointment.date = new_date
        appointment.time = new_time
        appointment.status = 'rescheduled'
        appointment.save()

        send_notification(
            appointment.patient.user, 
            "Appointment Rescheduled", 
            f"Your appointment was rescheduled to {new_date} at {new_time}. Reason: {reason}"
        )

        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=['post'])
    def counter_propose(self, request, pk=None):
        appointment = self.get_object()
        history = appointment.reschedule_history.last()
        if history:
            history.patient_counter_proposed = True
            history.save()
            return Response({"status": "Counter proposal recorded"})
        return Response({"error": "No reschedule history found"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'checked_in'
        appointment.save()
        send_notification(appointment.doctor.user, "Patient Arrived", f"Patient {appointment.patient} is waiting.")
        return Response(self.get_serializer(appointment).data)
