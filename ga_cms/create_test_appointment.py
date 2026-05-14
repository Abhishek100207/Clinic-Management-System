import os
import django
from datetime import date, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.appointments.models import Appointment
from apps.users.models import Patient, Doctor

doctor = Doctor.objects.first()
patient = Patient.objects.first()

if not doctor or not patient:
    print("Error: Please make sure you have at least one doctor and one patient in the database.")
else:
    # Create a real appointment in the DB
    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        date=date.today(),
        time=time(10, 30),
        appointment_type='in_person',
        status='pending'
    )
    print(f"--- SUCCESS ---")
    print(f"Successfully created a real appointment in the database!")
    print(f"Appointment ID: {appointment.id}")
    print(f"Patient: {patient.user.full_name}")
    print(f"Doctor: {doctor.user.full_name}")
    print(f"---------------")
    print(f"You can now use this Appointment ID or find this appointment in the list to test the consultation!")
