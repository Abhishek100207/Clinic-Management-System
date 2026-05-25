import os
import django
import datetime
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.auth_module.models import CustomUser
from apps.users.models import Doctor, Patient, Receptionist
from apps.appointments.models import Appointment, Invoice

def seed_realtime():
    print("Starting real-time database seeding...")
    
    # 1. Ensure Doctors exist
    # Dr. Sarah Johnson
    sarah_user, _ = CustomUser.objects.get_or_create(
        email='sarah.johnson@gaclinic.com',
        defaults={'username': 'sarah_johnson', 'first_name': 'Sarah', 'last_name': 'Johnson', 'role': 'doctor'}
    )
    if sarah_user.pk and not sarah_user.password:
        sarah_user.set_password('admin')
        sarah_user.save()
        
    doc_sarah, _ = Doctor.objects.get_or_create(
        user=sarah_user,
        defaults={'specialty': 'Cardiology', 'registration_number': 'DOC-SARAH-101', 'is_visible_to_patients': True}
    )
    
    # Dr. Robert Chen
    robert_user, _ = CustomUser.objects.get_or_create(
        email='robert.chen@gaclinic.com',
        defaults={'username': 'robert_chen', 'first_name': 'Robert', 'last_name': 'Chen', 'role': 'doctor'}
    )
    if robert_user.pk and not robert_user.password:
        robert_user.set_password('admin')
        robert_user.save()
        
    doc_robert, _ = Doctor.objects.get_or_create(
        user=robert_user,
        defaults={'specialty': 'Pediatrics', 'registration_number': 'DOC-ROBERT-102', 'is_visible_to_patients': True}
    )

    # 2. Ensure Receptionist Shailaja K exists
    shailaja_user, _ = CustomUser.objects.get_or_create(
        email='receptionist@gmail.com',
        defaults={'username': 'receptionist', 'first_name': 'Shailaja', 'last_name': 'K', 'role': 'receptionist'}
    )
    if shailaja_user.pk and not shailaja_user.password:
        shailaja_user.set_password('admin')
        shailaja_user.save()
    
    Receptionist.objects.get_or_create(user=shailaja_user)

    # 3. Create or Get Patient Profiles
    patients_data = [
        {"name": "Arjun Mehra", "email": "arjun@gmail.com", "mobile": "9999900001", "gender": "Male", "dob": "1992-04-12"},
        {"name": "Priya Sharma", "email": "priya@gmail.com", "mobile": "9999900002", "gender": "Female", "dob": "1995-08-22"},
        {"name": "Vikram Singh", "email": "vikram@gmail.com", "mobile": "9999900003", "gender": "Male", "dob": "1988-11-05"},
        {"name": "Sneha Patel", "email": "sneha@gmail.com", "mobile": "9999900004", "gender": "Female", "dob": "1994-01-30"},
        {"name": "Rahul Verma", "email": "rahul@gmail.com", "mobile": "9999900005", "gender": "Male", "dob": "1991-07-15"},
        {"name": "Anjali Sharma", "email": "anjali@gmail.com", "mobile": "9999900006", "gender": "Female", "dob": "1998-09-18"},
    ]

    patients = {}
    for idx, p_info in enumerate(patients_data):
        user, _ = CustomUser.objects.get_or_create(
            email=p_info["email"],
            defaults={'username': f'patient_{idx+1}', 'first_name': p_info["name"].split()[0], 'last_name': p_info["name"].split()[1], 'role': 'patient'}
        )
        if user.pk and not user.password:
            user.set_password('admin')
            user.save()
            
        pat, _ = Patient.objects.get_or_create(
            user=user,
            defaults={
                'patient_id': f"PAT-{100+idx}",
                'full_name': p_info["name"],
                'date_of_birth': p_info["dob"],
                'gender': p_info["gender"],
                'mobile_number': p_info["mobile"],
                'city': 'Mumbai'
            }
        )
        patients[p_info["name"]] = pat

    # 4. Re-create Queue Appointments & Invoices for Today
    # Clean today's appointments and invoices to prevent duplicates
    today = datetime.date.today()
    Appointment.objects.filter(date=today).delete()
    # Invoices for today
    Invoice.objects.filter(date_generated__date=today).delete()
    
    # Yesterday & two days ago dates
    yesterday = today - datetime.timedelta(days=1)
    two_days_ago = today - datetime.timedelta(days=2)

    # Let's seed:
    # 1. Arjun Mehra (T-101) - Completed, 2 hours ago
    appt_arjun = Appointment.objects.create(
        patient=patients["Arjun Mehra"],
        doctor=doc_sarah,
        date=today,
        time="10:00:00",
        appointment_type="in_person",
        status="completed",
        queue_token="T-101",
        queue_type="scheduled",
        priority=3,
        check_in_time=timezone.now() - datetime.timedelta(hours=2),
        amount_paid=590
    )
    Invoice.objects.create(
        invoice_id="INV-782103",
        appointment=appt_arjun,
        patient=patients["Arjun Mehra"],
        doctor=doc_sarah,
        consultation_fee=500,
        tax=90,
        total_amount=590,
        payment_status="PAID",
        payment_mode="CARD",
        transaction_id="TXN827364519"
    )

    # 2. Priya Sharma (T-102) - In Progress (active), 45 mins ago
    appt_priya = Appointment.objects.create(
        patient=patients["Priya Sharma"],
        doctor=doc_robert,
        date=today,
        time="11:30:00",
        appointment_type="virtual",
        status="in_progress",
        queue_token="T-102",
        queue_type="scheduled",
        priority=3,
        check_in_time=timezone.now() - datetime.timedelta(minutes=45),
        amount_paid=354
    )
    Invoice.objects.create(
        invoice_id="INV-492817",
        appointment=appt_priya,
        patient=patients["Priya Sharma"],
        doctor=doc_robert,
        consultation_fee=300,
        tax=54,
        total_amount=354,
        payment_status="PAID",
        payment_mode="UPI",
        transaction_id="TXN918273645"
    )

    # 3. Vikram Singh (T-103) - Waiting (checked_in), 30 mins ago
    appt_vikram = Appointment.objects.create(
        patient=patients["Vikram Singh"],
        doctor=doc_sarah,
        date=today,
        time="09:15:00",
        appointment_type="in_person",
        status="checked_in",
        queue_token="T-103",
        queue_type="walkin",
        priority=2,
        check_in_time=timezone.now() - datetime.timedelta(minutes=30),
        amount_paid=590
    )
    Invoice.objects.create(
        invoice_id="INV-582910",
        appointment=appt_vikram,
        patient=patients["Vikram Singh"],
        doctor=doc_sarah,
        consultation_fee=500,
        tax=90,
        total_amount=590,
        payment_status="PAID",
        payment_mode="CASH",
        transaction_id="CASH-COUNTER-091"
    )

    # 4. Sneha Patel (T-104) - Waiting (checked_in), Emergency, 10 mins ago
    appt_sneha = Appointment.objects.create(
        patient=patients["Sneha Patel"],
        doctor=doc_sarah,
        date=today,
        time="11:00:00",
        appointment_type="in_person",
        status="checked_in",
        queue_token="T-104",
        queue_type="emergency",
        priority=1,
        check_in_time=timezone.now() - datetime.timedelta(minutes=10)
    )
    Invoice.objects.create(
        invoice_id="INV-381029",
        appointment=appt_sneha,
        patient=patients["Sneha Patel"],
        doctor=doc_sarah,
        consultation_fee=500,
        tax=90,
        total_amount=590,
        payment_status="PENDING"
    )

    # 5. Rahul Verma (T-105) - Rescheduled (delayed), 25 mins ago
    appt_rahul = Appointment.objects.create(
        patient=patients["Rahul Verma"],
        doctor=doc_robert,
        date=today,
        time="14:00:00",
        appointment_type="virtual",
        status="rescheduled",
        queue_token="T-105",
        queue_type="scheduled",
        priority=3,
        delay_offset=20,
        check_in_time=timezone.now() - datetime.timedelta(minutes=25)
    )
    Invoice.objects.create(
        invoice_id="INV-672948",
        appointment=appt_rahul,
        patient=patients["Rahul Verma"],
        doctor=doc_robert,
        consultation_fee=300,
        tax=54,
        total_amount=354,
        payment_status="PENDING"
    )

    # 6. Anjali Sharma (T-106) - Cancelled (missed), 90 mins ago
    appt_anjali = Appointment.objects.create(
        patient=patients["Anjali Sharma"],
        doctor=doc_sarah,
        date=today,
        time="14:30:00",
        appointment_type="in_person",
        status="cancelled",
        queue_token="T-106",
        queue_type="scheduled",
        priority=3,
        check_in_time=timezone.now() - datetime.timedelta(minutes=90)
    )

    print("Dynamic patient queue and billing invoices seeded successfully on Neon PostgreSQL database!")

if __name__ == '__main__':
    seed_realtime()
