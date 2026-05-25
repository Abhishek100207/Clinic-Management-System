from rest_framework import serializers
from .models import DoctorAvailability, Appointment, RescheduleHistory, Invoice, ConsultationReview

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorAvailability
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_mobile = serializers.CharField(source='patient.mobile_number', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = (
            'locked_until', 'distance_to_clinic', 'meeting_link',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'amount_paid'
        )

class RescheduleHistorySerializer(serializers.ModelSerializer):
    rescheduled_by_name = serializers.CharField(source='rescheduled_by.get_full_name', read_only=True)

    class Meta:
        model = RescheduleHistory
        fields = '__all__'

class RescheduleRequestSerializer(serializers.Serializer):
    new_date = serializers.DateField()
    new_time = serializers.TimeField()
    reason = serializers.CharField(required=True)


class InvoiceSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_mobile = serializers.CharField(source='patient.mobile_number', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    doctor_specialty = serializers.CharField(source='doctor.specialty', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'


class ConsultationReviewSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = ConsultationReview
        fields = '__all__'
        read_only_fields = ('patient', 'doctor', 'created_at')
