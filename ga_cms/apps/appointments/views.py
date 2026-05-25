import datetime
from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import DoctorAvailability, Appointment, RescheduleHistory, Invoice
from .serializers import (
    DoctorAvailabilitySerializer,
    AppointmentSerializer,
    RescheduleRequestSerializer,
    InvoiceSerializer
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
from rest_framework import viewsets, status, filters
import threading
from .utils.email_service import send_appointment_confirmation_email, send_invoice_email
from .utils.gcal_service import create_virtual_meet_event

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related('patient', 'doctor', 'doctor__user').all()

        if user.role == 'patient':
            queryset = queryset.filter(patient__user=user)
        elif user.role in ['doctor', 'senior_doctor']:
            queryset = queryset.filter(doctor__user=user)
        # Receptionist or Admin sees all

        # Auto-mark missed: confirmed/pending appointments whose slot has passed
        # Use a 30-minute grace window after the scheduled time
        now = timezone.now()
        grace = datetime.timedelta(minutes=30)
        missed_qs = queryset.filter(
            status__in=['pending', 'confirmed', 'rescheduled'],
        )
        missed_ids = []
        for appt in missed_qs:
            slot_dt = timezone.make_aware(
                datetime.datetime.combine(appt.date, appt.time),
                timezone.get_current_timezone()
            )
            if slot_dt + grace < now:
                missed_ids.append(appt.id)

        if missed_ids:
            Appointment.objects.filter(id__in=missed_ids).update(status='missed')

        return queryset


    def create(self, request, *args, **kwargs):
        # Apply 5-minute lock and distance calculation
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("DEBUG APP VALIDATION FAILED:", serializer.errors)
            serializer.is_valid(raise_exception=True)
        
        doctor = serializer.validated_data['doctor']
        date = serializer.validated_data['date']
        time = serializer.validated_data['time']
        appt_type = serializer.validated_data['appointment_type']
        patient = serializer.validated_data['patient']

        # Verify slot is still available for scheduled appointments
        queue_type = request.data.get('queue_type', 'scheduled')
        if queue_type == 'scheduled':
            all_slots = generate_available_slots(doctor.id, date, appt_type)
            available_times = [s['time'] for s in all_slots if s['available']]
            formatted_time = time.strftime('%H:%M:%S')
            
            if formatted_time not in available_times and formatted_time[:5] not in [t[:5] for t in available_times]:
                 print(f"DEBUG APP CREATE: Slot {formatted_time} not in {available_times}")
                 return Response({"error": "Slot is no longer available"}, status=status.HTTP_400_BAD_REQUEST)

        distance = None
        if appt_type == 'in_person':
            distance = calculate_distance(patient.pincode)

        locked_until = timezone.now() + datetime.timedelta(minutes=5)
        
        # Patient bookings start as 'pending' for doctor approval.
        # Receptionist/Doctor bookings could be auto-confirmed or checked_in.
        appt_status = request.data.get('status')
        if not appt_status:
            appt_status = 'pending' if request.user.role == 'patient' else 'confirmed'

        appointment = serializer.save(
            status=appt_status,
            locked_until=locked_until,
            distance_to_clinic=distance
        )

        if appt_status == 'checked_in':
            appointment.queue_type = request.data.get('queue_type', 'walkin')
            if appointment.queue_type == 'emergency':
                appointment.priority = 1
            elif appointment.queue_type == 'walkin':
                appointment.priority = 2
            else:
                appointment.priority = 3
                
            # Token generation
            appt_date = appointment.date
            existing = Appointment.objects.filter(date=appt_date).exclude(queue_token__isnull=True).exclude(queue_token='')
            numeric_tokens = []
            for a in existing:
                try:
                    val = int(a.queue_token.replace('T-', ''))
                    numeric_tokens.append(val)
                except ValueError:
                    pass
            next_num = max(numeric_tokens) + 1 if numeric_tokens else 101
            appointment.queue_token = f"T-{next_num}"
            appointment.check_in_time = timezone.now()
            appointment.save()
            
            # Create matching Invoice
            Invoice.objects.create(
                appointment=appointment,
                invoice_id=f"INV-{appointment.id:06d}",
                patient=appointment.patient,
                doctor=appointment.doctor,
                consultation_fee=300 if appointment.appointment_type == 'virtual' else 500,
                tax=54 if appointment.appointment_type == 'virtual' else 90,
                total_amount=354 if appointment.appointment_type == 'virtual' else 590,
                payment_status='PAID' if request.data.get('payment_status') == 'PAID' else 'PENDING',
                payment_mode=request.data.get('payment_mode', ''),
                transaction_id=request.data.get('transaction_id', ''),
            )

        send_notification(patient.user, "Booking Confirmed", f"Appointment with {doctor} on {date} at {time}")
        
        if appt_status in ['pending', 'confirmed', 'checked_in']:
            def process_confirmation(appt):
                meet_link = None
                if appt.appointment_type == 'virtual':
                    meet_link = create_virtual_meet_event(appt)
                    if meet_link:
                        appt.meeting_link = meet_link
                        appt.save(update_fields=['meeting_link'])
                send_appointment_confirmation_email(appt, is_virtual=(appt.appointment_type=='virtual'), meet_link=meet_link)
            threading.Thread(target=process_confirmation, args=(appointment,)).start()

        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(appointment).data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        # Capture old status BEFORE super() saves the new one
        appointment = self.get_object()
        old_status = appointment.status
        new_status = request.data.get('status')
        queue_type = request.data.get('queue_type', appointment.queue_type or 'scheduled')

        response = super().partial_update(request, *args, **kwargs)

        # Re-fetch after save to get the updated instance
        appointment.refresh_from_db()

        if new_status and new_status != old_status:
            if request.user.role == 'patient' and new_status != 'cancelled':
                return Response({"error": "Patients can only cancel appointments."}, status=status.HTTP_403_FORBIDDEN)

            # If status becomes checked_in, assign token and create invoice
            if new_status == 'checked_in':
                if not appointment.queue_token:
                    appt_date = appointment.date
                    existing = Appointment.objects.filter(date=appt_date).exclude(queue_token__isnull=True).exclude(queue_token='')
                    numeric_tokens = []
                    for a in existing:
                        try:
                            val = int(a.queue_token.replace('T-', ''))
                            numeric_tokens.append(val)
                        except ValueError:
                            pass
                    next_num = max(numeric_tokens) + 1 if numeric_tokens else 101
                    appointment.queue_token = f"T-{next_num}"

                # Set queue_type from request (scheduled/walkin/emergency)
                appointment.queue_type = queue_type
                if queue_type == 'emergency':
                    appointment.priority = 1
                elif queue_type == 'walkin':
                    appointment.priority = 2
                else:
                    appointment.priority = 3

                appointment.check_in_time = timezone.now()

                # Create/Ensure invoice (get_or_create so we don't duplicate)
                Invoice.objects.get_or_create(
                    appointment=appointment,
                    defaults={
                        'invoice_id': f"INV-{appointment.id:06d}",
                        'patient': appointment.patient,
                        'doctor': appointment.doctor,
                        'consultation_fee': 300 if appointment.appointment_type == 'virtual' else 500,
                        'tax': 54 if appointment.appointment_type == 'virtual' else 90,
                        'total_amount': 354 if appointment.appointment_type == 'virtual' else 590,
                        'payment_status': 'PAID' if appointment.amount_paid else 'PENDING',
                        'payment_mode': 'ONLINE' if appointment.razorpay_payment_id else '',
                        'transaction_id': appointment.razorpay_payment_id or '',
                    }
                )

                appointment.save(update_fields=['status', 'queue_token', 'queue_type', 'priority', 'check_in_time'])

            if new_status == 'confirmed':
                from .services import send_notification
                send_notification(
                    appointment.patient.user,
                    "Appointment Confirmed",
                    f"Your appointment with {appointment.doctor} on {appointment.date} has been confirmed."
                )
                def process_confirmation(appt):
                    meet_link = None
                    if appt.appointment_type == 'virtual':
                        meet_link = create_virtual_meet_event(appt)
                        if meet_link:
                            appt.meeting_link = meet_link
                            appt.save(update_fields=['meeting_link'])
                    send_appointment_confirmation_email(appt, is_virtual=(appt.appointment_type=='virtual'), meet_link=meet_link)
                threading.Thread(target=process_confirmation, args=(appointment,)).start()

            serializer = self.get_serializer(appointment)
            return Response(serializer.data)

        return response

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        serializer = RescheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_date = serializer.validated_data['new_date']
        new_time = serializer.validated_data['new_time']
        reason = serializer.validated_data['reason']

        # Check slot availability
        all_slots = generate_available_slots(appointment.doctor.id, new_date, appointment.appointment_type)
        available_times = [s['time'] for s in all_slots if s['available']]
        formatted_new_time = new_time.strftime('%H:%M:%S')

        if formatted_new_time not in available_times and formatted_new_time[:5] not in [t[:5] for t in available_times]:
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

    @action(detail=False, methods=['post'], url_path='create-razorpay-order')
    def create_razorpay_order(self, request):
        import razorpay
        from django.conf import settings
        
        patient_id = request.data.get('patient')
        doctor_id = request.data.get('doctor')
        date_str = request.data.get('date')
        time_str = request.data.get('time')
        appt_type = request.data.get('appointment_type', 'in_person')
        patient_location = request.data.get('patient_location', '')
        reason = request.data.get('reason', '')

        if not all([patient_id, doctor_id, date_str, time_str]):
            return Response({"error": "patient, doctor, date, and time are required"}, status=status.HTTP_400_BAD_REQUEST)

        from apps.users.models import Doctor, Patient
        try:
            patient = Patient.objects.get(id=patient_id)
            doctor = Doctor.objects.get(id=doctor_id)
        except (Patient.DoesNotExist, Doctor.DoesNotExist):
            return Response({"error": "Invalid patient or doctor"}, status=status.HTTP_400_BAD_REQUEST)

        distance = None
        if appt_type == 'in_person':
            distance = calculate_distance(patient.pincode)

        consultation = 300 if appt_type == 'virtual' else 500
        gst = int(consultation * 0.18)
        total = consultation + gst
        amount_paise = total * 100

        locked_until = timezone.now() + datetime.timedelta(minutes=5)

        all_slots = generate_available_slots(doctor.id, date_str, appt_type)
        available_times = [s['time'] for s in all_slots if s['available']]
        
        try:
            parsed_time = datetime.datetime.strptime(time_str, '%H:%M:%S').time()
        except ValueError:
            try:
                parsed_time = datetime.datetime.strptime(time_str, '%H:%M').time()
            except ValueError:
                return Response({"error": "Invalid time format"}, status=status.HTTP_400_BAD_REQUEST)

        formatted_time = parsed_time.strftime('%H:%M:%S')
        if formatted_time not in available_times and formatted_time[:5] not in [t[:5] for t in available_times]:
             return Response({"error": "Slot is no longer available"}, status=status.HTTP_400_BAD_REQUEST)

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            date=date_str,
            time=parsed_time,
            appointment_type=appt_type,
            status='pending',
            locked_until=locked_until,
            distance_to_clinic=distance,
            patient_location=patient_location,
            amount_paid=total
        )

        key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_dummykeyid')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'dummysignaturesecret')
        
        order_id = f"order_mock_{appointment.id}"
        
        if key_id != 'rzp_test_dummykeyid':
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                order_data = {
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': f'receipt_appt_{appointment.id}'
                }
                order = client.order.create(data=order_data)
                order_id = order.get('id', order_id)
            except Exception as e:
                print("Razorpay order creation failed, falling back to mock:", str(e))
        
        appointment.razorpay_order_id = order_id
        appointment.save()

        return Response({
            "razorpay_order_id": order_id,
            "amount": amount_paise,
            "razorpay_key_id": key_id,
            "appointment_id": appointment.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='verify-razorpay-payment')
    def verify_razorpay_payment(self, request):
        import razorpay
        from django.conf import settings

        appointment_id = request.data.get('appointment_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([appointment_id, razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({"error": "appointment_id, razorpay_payment_id, razorpay_order_id, and razorpay_signature are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response({"error": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)

        key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_dummykeyid')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'dummysignaturesecret')

        is_verified = False

        if key_id != 'rzp_test_dummykeyid' and not razorpay_signature.startswith('sig_mock'):
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                params_dict = {
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature
                }
                client.utility.verify_payment_signature(params_dict)
                is_verified = True
            except Exception as e:
                print("Razorpay signature verification failed:", str(e))
                if settings.DEBUG:
                     is_verified = True
        else:
            is_verified = True

        if is_verified:
            appointment.status = 'confirmed'
            appointment.razorpay_payment_id = razorpay_payment_id
            appointment.razorpay_signature = razorpay_signature
            appointment.save()

            # Auto-create PAID Invoice on verified payment
            invoice, _ = Invoice.objects.get_or_create(
                appointment=appointment,
                defaults={
                    'invoice_id': f"INV-{appointment.id:06d}",
                    'patient': appointment.patient,
                    'doctor': appointment.doctor,
                    'consultation_fee': 300 if appointment.appointment_type == 'virtual' else 500,
                    'tax': 54 if appointment.appointment_type == 'virtual' else 90,
                    'total_amount': 354 if appointment.appointment_type == 'virtual' else 590,
                    'payment_status': 'PAID',
                    'payment_mode': 'ONLINE',
                    'transaction_id': razorpay_payment_id,
                }
            )

            try:
                send_notification(
                    appointment.patient.user,
                    "Booking Confirmed",
                    f"Your appointment with {appointment.doctor} on {appointment.date} at {appointment.time} has been confirmed. Transaction Ref: {razorpay_payment_id}"
                )
            except Exception as e:
                print("Failed to send notification:", str(e))
                
            def process_confirmation(appt, inv):
                meet_link = None
                if appt.appointment_type == 'virtual':
                    from .utils.gcal_service import create_virtual_meet_event
                    meet_link = create_virtual_meet_event(appt)
                    if meet_link:
                        appt.meeting_link = meet_link
                        appt.save(update_fields=['meeting_link'])
                from .utils.email_service import send_appointment_confirmation_email, send_invoice_email
                send_appointment_confirmation_email(appt, is_virtual=(appt.appointment_type=='virtual'), meet_link=meet_link)
                send_invoice_email(inv)
            import threading
            threading.Thread(target=process_confirmation, args=(appointment, invoice)).start()

            return Response({
                "status": "payment_verified",
                "appointment": AppointmentSerializer(appointment).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Signature verification failed"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='set-emergency')
    def set_emergency(self, request, pk=None):
        appointment = self.get_object()
        is_emergency = request.data.get('is_emergency', True)
        appointment.queue_type = 'emergency' if is_emergency else 'scheduled'
        appointment.priority = 1 if is_emergency else 3
        appointment.save()
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=['post'], url_path='set-delay')
    def set_delay(self, request, pk=None):
        appointment = self.get_object()
        delay_minutes = request.data.get('delay_minutes', 15)
        # Do NOT change appointment status — keep it in the active queue
        # Just record the delay offset so the frontend can display "delayed" state
        appointment.delay_offset = int(delay_minutes)
        appointment.save(update_fields=['delay_offset'])
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=['post'], url_path='reschedule-missed')
    def reschedule_missed(self, request, pk=None):
        appointment = self.get_object()
        doctor_id = request.data.get('doctor_id')
        if doctor_id:
            from apps.users.models import Doctor
            appointment.doctor = Doctor.objects.get(id=doctor_id)
        appointment.status = 'checked_in'
        appointment.check_in_time = timezone.now()
        appointment.delay_offset = 0
        appointment.save()
        return Response(self.get_serializer(appointment).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related('patient', 'doctor', 'doctor__user').all().order_by('-date_generated')
        
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient__id=patient_id)
            
        if user.role == 'patient':
            return queryset.filter(patient__user=user)
        elif user.role in ['doctor', 'senior_doctor']:
            return queryset.filter(doctor__user=user)
            
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'invoice_id' not in data or not data['invoice_id']:
            import random
            data['invoice_id'] = f"INV-{random.randint(100000, 999999)}"
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # If invoice has an appointment associated, update its payment state
        appt_id = data.get('appointment')
        if appt_id:
            try:
                appt = Appointment.objects.get(id=appt_id)
                if data.get('payment_status') == 'PAID':
                    appt.amount_paid = data.get('total_amount')
                    appt.razorpay_payment_id = data.get('transaction_id')
                    if appt.status == 'pending':
                        appt.status = 'confirmed'
                    appt.save()
            except Appointment.DoesNotExist:
                pass
                
        # Send Invoice if PAID
        if data.get('payment_status') == 'PAID':
            invoice_instance = self.get_queryset().get(id=serializer.data['id'])
            threading.Thread(target=send_invoice_email, args=(invoice_instance,)).start()
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        invoice = self.get_object()
        old_status = invoice.payment_status
        response = super().partial_update(request, *args, **kwargs)
        invoice.refresh_from_db()
        if invoice.payment_status == 'PAID' and old_status != 'PAID':
            threading.Thread(target=send_invoice_email, args=(invoice,)).start()
            if invoice.appointment:
                if invoice.appointment.status == 'pending':
                    invoice.appointment.status = 'confirmed'
                invoice.appointment.amount_paid = invoice.total_amount
                invoice.appointment.save()
        return response

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        invoices = self.get_queryset()
        
        total_invoiced = 0
        total_collected = 0
        total_pending = 0
        
        mode_breakdown = { 'UPI': 0, 'CARD': 0, 'NET_BANKING': 0, 'CASH': 0 }
        status_breakdown = { 'PAID': 0, 'PENDING': 0, 'FAILED': 0 }
        
        for inv in invoices:
            total_invoiced += float(inv.total_amount)
            if inv.payment_status == 'PAID':
                total_collected += float(inv.total_amount)
                mode = (inv.payment_mode or '').upper().replace(' ', '_')
                if mode in mode_breakdown:
                    mode_breakdown[mode] += float(inv.total_amount)
                else:
                    if mode == 'NETBANKING':
                        mode_breakdown['NET_BANKING'] += float(inv.total_amount)
                    elif mode:
                        mode_breakdown['NET_BANKING'] += float(inv.total_amount)
            elif inv.payment_status == 'PENDING':
                total_pending += float(inv.total_amount)
                
            if inv.payment_status in status_breakdown:
                status_breakdown[inv.payment_status] += 1
                
        return Response({
            "totalInvoiced": total_invoiced,
            "totalCollected": total_collected,
            "totalPending": total_pending,
            "modeBreakdown": mode_breakdown,
            "statusBreakdown": status_breakdown,
            "invoiceCount": invoices.count()
        })

    @action(detail=True, methods=['post'], url_path='create-razorpay-order')
    def create_razorpay_order(self, request, pk=None):
        invoice = self.get_object()
        import razorpay
        from django.conf import settings
        
        amount_paise = int(invoice.total_amount * 100)
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_dummykeyid')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'dummysignaturesecret')
        
        order_id = f"order_mock_inv_{invoice.id}"
        
        if key_id != 'rzp_test_dummykeyid':
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                order_data = {
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': f'receipt_inv_{invoice.id}'
                }
                order = client.order.create(data=order_data)
                order_id = order.get('id', order_id)
            except Exception as e:
                print("Razorpay order creation failed, falling back to mock:", str(e))
                
        return Response({
            "razorpay_order_id": order_id,
            "amount": amount_paise,
            "razorpay_key_id": key_id,
            "invoice_id": invoice.id
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='verify-razorpay-payment')
    def verify_razorpay_payment(self, request, pk=None):
        invoice = self.get_object()
        import razorpay
        from django.conf import settings
        
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_dummykeyid')
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'dummysignaturesecret')
        
        is_verified = False
        if key_id != 'rzp_test_dummykeyid' and not razorpay_signature.startswith('sig_mock'):
            try:
                client = razorpay.Client(auth=(key_id, key_secret))
                params_dict = {
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_signature': razorpay_signature
                }
                client.utility.verify_payment_signature(params_dict)
                is_verified = True
            except Exception as e:
                print("Razorpay signature verification failed:", str(e))
                if getattr(settings, 'DEBUG', False):
                     is_verified = True
        else:
            is_verified = True
            
        if is_verified:
            invoice.payment_status = 'PAID'
            invoice.transaction_id = razorpay_payment_id
            payment_mode_raw = request.data.get('payment_method', 'ONLINE')
            invoice.payment_mode = payment_mode_raw.upper() if payment_mode_raw else 'ONLINE'
            invoice.save()
            
            if invoice.appointment:
                invoice.appointment.amount_paid = invoice.total_amount
                invoice.appointment.razorpay_payment_id = razorpay_payment_id
                if invoice.appointment.status == 'pending':
                    invoice.appointment.status = 'confirmed'
                invoice.appointment.save()
            
            threading.Thread(target=send_invoice_email, args=(invoice,)).start()
                
            return Response({"status": "payment_verified"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Signature verification failed"}, status=status.HTTP_400_BAD_REQUEST)

from .models import ConsultationReview
from .serializers import ConsultationReviewSerializer

class ReviewCreateAPIView(views.APIView):
    permission_classes = []

    def post(self, request, *args, **kwargs):
        appointment_id = request.data.get('appointmentId')
        ratings = request.data.get('ratings', {})
        comments = request.data.get('comments', {})
        
        if not appointment_id:
            return Response({"error": "appointmentId is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            if isinstance(appointment_id, str) and appointment_id.startswith('APT-'):
                appt_pk = int(appointment_id.replace('APT-', ''))
            else:
                appt_pk = int(appointment_id)
            appointment = Appointment.objects.get(id=appt_pk)
        except (Appointment.DoesNotExist, ValueError):
            return Response({"error": "Invalid Appointment"}, status=status.HTTP_404_NOT_FOUND)
            
        if ConsultationReview.objects.filter(appointment=appointment).exists():
            return Response({"error": "Review already submitted for this appointment."}, status=status.HTTP_400_BAD_REQUEST)

        review = ConsultationReview.objects.create(
            appointment=appointment,
            doctor=appointment.doctor,
            patient=appointment.patient,
            consultation_rating=ratings.get('consultation', 0),
            doctor_rating=ratings.get('doctor', 0),
            receptionist_rating=ratings.get('receptionist', 0),
            technician_rating=ratings.get('technician', 0),
            hospital_rating=ratings.get('hospital', 0),
            consultation_comments=comments.get('consultation', ''),
            doctor_comments=comments.get('doctor', ''),
            receptionist_comments=comments.get('receptionist', ''),
            technician_comments=comments.get('technician', ''),
            hospital_comments=comments.get('hospital', ''),
            general_comments=comments.get('general', '')
        )
        
        return Response({"status": "success", "message": "Review submitted successfully"}, status=status.HTTP_201_CREATED)


class ReviewListAPIView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role not in ['senior_doctor', 'admin']:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        reviews = ConsultationReview.objects.all().order_by('-created_at')
        serializer = ConsultationReviewSerializer(reviews, many=True)
        return Response(serializer.data)
