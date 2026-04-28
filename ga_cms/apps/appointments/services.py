import datetime
from decimal import Decimal
from django.utils import timezone
from .models import DoctorAvailability, Appointment
from apps.users.models import Doctor

def calculate_distance(patient_pincode, clinic_pincode='100001'):
    """Mock distance calculation."""
    if not patient_pincode:
        return None
    try:
        # Mock logic based on numeric difference
        diff = abs(int(patient_pincode) - int(clinic_pincode))
        distance = Decimal(str(diff)) * Decimal('0.01')
        if distance == 0:
            return Decimal('1.2')
        return min(distance, Decimal('100.0')) # Cap at 100km
    except ValueError:
        return Decimal('5.5')

def generate_available_slots(doctor_id, target_date, appointment_type):
    """Generate 20 min slots for a doctor on a specific date for a specific type."""
    if isinstance(target_date, str):
        target_date = datetime.datetime.strptime(target_date, '%Y-%m-%d').date()

    day_of_week = target_date.weekday()
    availabilities = DoctorAvailability.objects.filter(
        doctor_id=doctor_id,
        day_of_week=day_of_week,
        appointment_type=appointment_type
    )

    all_slots = []
    for avail in availabilities:
        current_time = datetime.datetime.combine(target_date, avail.start_time)
        end_time = datetime.datetime.combine(target_date, avail.end_time)
        slot_duration = datetime.timedelta(minutes=avail.slot_duration)

        while current_time + slot_duration <= end_time:
            all_slots.append(current_time.time())
            current_time += slot_duration

    # Remove booked or locked slots
    now = timezone.now()
    booked_appointments = Appointment.objects.filter(
        doctor_id=doctor_id,
        date=target_date,
        appointment_type=appointment_type
    ).exclude(status='cancelled')

    booked_times = []
    for appt in booked_appointments:
        if appt.status != 'pending' or (appt.status == 'pending' and appt.locked_until and appt.locked_until > now):
            booked_times.append(appt.time)

    available_slots = [slot for slot in all_slots if slot not in booked_times]
    return [slot.strftime('%H:%M:%S') for slot in available_slots]

def send_notification(user, message_type, context):
    """Stub function to mock SMS/push notifications."""
    print(f"NOTIFICATION to {user}: [{message_type}] {context}")

