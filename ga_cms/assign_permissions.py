import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.auth_module.models import CustomUser

# Create Groups
doctor_group, _ = Group.objects.get_or_create(name='Doctor')
technician_group, _ = Group.objects.get_or_create(name='Technician')
receptionist_group, _ = Group.objects.get_or_create(name='Receptionist')

# Models
# Medical Records
from apps.medical_records.models import ConsultationNote, LabResult, ScanResult, ScanOrder, Prescription, PrescribedMedication
# Appointments
from apps.appointments.models import Appointment, Invoice, DoctorAvailability
# Users
from apps.users.models import Patient

def get_perms(model, actions):
    content_type = ContentType.objects.get_for_model(model)
    perms = []
    for action in actions:
        codename = f'{action}_{model._meta.model_name}'
        try:
            perm = Permission.objects.get(content_type=content_type, codename=codename)
            perms.append(perm)
        except Permission.DoesNotExist:
            print(f"Permission {codename} not found")
    return perms

# Doctor Permissions (wherever necessary)
doctor_models = [
    (ConsultationNote, ['add', 'change', 'view', 'delete']),
    (LabResult, ['view']), # Doctors view reports, maybe add?
    (ScanResult, ['view']),
    (ScanOrder, ['add', 'change', 'view', 'delete']),
    (Prescription, ['add', 'change', 'view', 'delete']),
    (PrescribedMedication, ['add', 'change', 'view', 'delete']),
    (Appointment, ['view', 'change']), # Doctors manage their appointments
    (Patient, ['view', 'add', 'change']), 
    (DoctorAvailability, ['add', 'change', 'view', 'delete']),
]

# Technician Permissions (read and write to reports)
technician_models = [
    (LabResult, ['add', 'change', 'view', 'delete']),
    (ScanResult, ['add', 'change', 'view', 'delete']),
    (ScanOrder, ['view', 'change']), # View orders, maybe change status
]

# Receptionist Permissions (tasks related to her: appointments, patients, billing)
receptionist_models = [
    (Patient, ['add', 'change', 'view']),
    (Appointment, ['add', 'change', 'view', 'delete']),
    (Invoice, ['add', 'change', 'view', 'delete']),
    (DoctorAvailability, ['view']),
]

# Assign permissions to groups
doctor_group.permissions.clear()
for model, actions in doctor_models:
    doctor_group.permissions.add(*get_perms(model, actions))

technician_group.permissions.clear()
for model, actions in technician_models:
    technician_group.permissions.add(*get_perms(model, actions))

receptionist_group.permissions.clear()
for model, actions in receptionist_models:
    receptionist_group.permissions.add(*get_perms(model, actions))

print("Permissions assigned to groups successfully.")

# Assign Users to Groups
try:
    suraj = CustomUser.objects.get(username='Suraj')
    suraj.groups.add(doctor_group)
    print("Added Suraj to Doctor group")
except CustomUser.DoesNotExist:
    print("User Suraj not found")

try:
    kishore = CustomUser.objects.get(username='Kishore')
    kishore.groups.add(technician_group)
    print("Added Kishore to Technician group")
except CustomUser.DoesNotExist:
    print("User Kishore not found")

try:
    vaishnavi = CustomUser.objects.get(username='Vaishnavi')
    vaishnavi.groups.add(receptionist_group)
    print("Added Vaishnavi to Receptionist group")
except CustomUser.DoesNotExist:
    print("User Vaishnavi not found")

print("Users assigned to their respective groups.")
