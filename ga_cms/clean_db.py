import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.auth_module.models import CustomUser
from apps.users.models import Doctor, Receptionist, Technician, Patient
from apps.appointments.models import Appointment

print("--- Starting Database Cleanup ---")

# 1. Delete all appointments
appt_count = Appointment.objects.count()
Appointment.objects.all().delete()
print(f"Deleted {appt_count} Appointments (Invoices & History cascaded).")

# 2. Identify the senior doctor / admin
users_to_keep = CustomUser.objects.filter(role='senior_doctor') | CustomUser.objects.filter(is_superuser=True)
keep_ids = list(users_to_keep.values_list('id', flat=True))

print(f"Keeping Users: {[u.email for u in users_to_keep]}")

# 3. Delete all other users (this cascades to Doctor, Receptionist, Technician, Patient)
users_to_delete = CustomUser.objects.exclude(id__in=keep_ids)
user_count = users_to_delete.count()
users_to_delete.delete()
print(f"Deleted {user_count} Users (Cascaded to roles).")

# 4. Clean up any orphaned Patients (if they didn't have a linked CustomUser)
orphaned_patients = Patient.objects.all()
patient_count = orphaned_patients.count()
orphaned_patients.delete()
if patient_count > 0:
    print(f"Deleted {patient_count} orphaned Patients.")

print("--- Cleanup Complete! ---")
