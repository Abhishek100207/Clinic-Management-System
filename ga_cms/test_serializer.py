import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.appointments.serializers import AppointmentSerializer

payload = {
    "patient": 1,
    "doctor": 1,
    "date": "2026-05-25",
    "time": "10:00:00",
    "appointment_type": "virtual",
    "location": "",
    "patient_location": "",
    "reason": "Test",
    "status": "pending"
}

serializer = AppointmentSerializer(data=payload)
if not serializer.is_valid():
    print("Appointment Validation Errors:", serializer.errors)
else:
    print("Appointment Serializer is VALID")

from apps.appointments.serializers import InvoiceSerializer

invoice_payload = {
    "appointment": 1,
    "patient": 1,
    "doctor": 1,
    "consultation_fee": 500,
    "tax": 90,
    "total_amount": 590,
    "payment_status": "PENDING",
    "payment_mode": "",
    "transaction_id": ""
}

inv_serializer = InvoiceSerializer(data=invoice_payload)
if not inv_serializer.is_valid():
    print("Invoice Validation Errors:", inv_serializer.errors)
else:
    print("Invoice Serializer is VALID")
