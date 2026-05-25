import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.appointments.models import Appointment, DoctorAvailability

avail = DoctorAvailability.objects.all()
print("Availabilities:", [(a.id, a.doctor.user.get_full_name(), a.appointment_type, a.start_time, a.end_time) for a in avail])

from apps.appointments.services import generate_available_slots
import datetime
slots = generate_available_slots(1, str(datetime.date.today()), 'in_person')
print("Slots Today:", [s['time'] for s in slots if s['available']])

