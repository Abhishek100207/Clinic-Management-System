import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.appointments.models import Appointment

try:
    appt = Appointment.objects.get(id=26)
    appt.status = 'confirmed'
    appt.save()
    print("Updated appointment 26 to confirmed")
except Exception as e:
    print(f"Error: {e}")
