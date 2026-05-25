import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.appointments.models import Appointment

appt = Appointment.objects.last()
if appt:
    print(f"ID: {appt.id}, Patient: {appt.patient}, Location: '{appt.patient_location}'")
else:
    print("No appointments")
