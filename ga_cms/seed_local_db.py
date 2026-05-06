import os
import django
from django.utils import timezone
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.auth_module.models import CustomUser
from apps.users.models import Doctor, Patient, Receptionist, Technician

def seed():
    # 1. Create Admin
    admin_user, created = CustomUser.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@gmail.com',
            'first_name': 'Senior',
            'last_name': 'Doctor Admin',
            'role': 'senior_doctor',
            'is_superuser': True,
            'is_staff': True
        }
    )
    if created:
        admin_user.set_password('admin')
        admin_user.save()
        print("Created Superuser: admin/admin")

    # 2. Create Doctor
    doc_user, created = CustomUser.objects.get_or_create(
        email='doctor@gmail.com',
        defaults={
            'username': 'doctor',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'role': 'doctor'
        }
    )
    if created:
        doc_user.set_password('admin')
        doc_user.save()
    
    doc_profile, created_p = Doctor.objects.get_or_create(
        user=doc_user,
        defaults={'specialty': 'Cardiology', 'registration_number': 'DOC123', 'is_visible_to_patients': True}
    )
    if created or created_p:
        print("Ensured Doctor exists: doctor@gmail.com/admin")

    # 3. Create Patient
    pat_user, created = CustomUser.objects.get_or_create(
        email='patient@gmail.com',
        defaults={
            'username': 'patient',
            'first_name': 'Mani',
            'role': 'patient'
        }
    )
    if created:
        pat_user.set_password('admin')
        pat_user.save()

    pat_profile, created_p = Patient.objects.get_or_create(
        user=pat_user,
        defaults={
            'patient_id': 'PAT-001',
            'full_name': 'Mani',
            'date_of_birth': date(1990, 1, 1),
            'gender': 'Male',
            'mobile_number': '9876543210',
            'city': 'Mumbai'
        }
    )
    if created or created_p:
        print("Ensured Patient exists: patient@gmail.com/admin")

if __name__ == '__main__':
    seed()
