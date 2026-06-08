import datetime
from decimal import Decimal
from django.utils import timezone
from .models import DoctorAvailability, Appointment, DoctorCalendarOverride
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

    # Check for doctor overrides
    override = DoctorCalendarOverride.objects.filter(doctor_id=doctor_id, date=target_date).first()
    
    all_slots = []
    
    if override:
        if override.status in ['leave', 'hold', 'unavailable']:
            # No slots available for leave, hold or unavailable
            return []
        elif override.status == 'available' and override.sessions:
            # Generate slots dynamically from custom sessions
            for session in override.sessions:
                # session format: {"start_time": "09:00", "end_time": "12:00", "appointment_type": "in_person", "slot_duration": 20}
                if session.get('appointment_type') == appointment_type:
                    try:
                        start_time_str = session.get('start_time')
                        end_time_str = session.get('end_time')
                        slot_dur_min = int(session.get('slot_duration', 20))
                        
                        start_time = datetime.datetime.strptime(start_time_str, '%H:%M').time()
                        end_time = datetime.datetime.strptime(end_time_str, '%H:%M').time()
                        
                        current_time = datetime.datetime.combine(target_date, start_time)
                        end_combined = datetime.datetime.combine(target_date, end_time)
                        slot_duration = datetime.timedelta(minutes=slot_dur_min)
                        
                        while current_time + slot_duration <= end_combined:
                            all_slots.append(current_time.time())
                            current_time += slot_duration
                    except Exception as e:
                        print("Error parsing custom session:", e)

    # If no override custom sessions were successfully processed and it is NOT a leave/hold/unavailable, fall back to standard weeklies
    if not all_slots and (not override or override.status == 'available'):
        day_of_week = target_date.weekday()
        availabilities = DoctorAvailability.objects.filter(
            doctor_id=doctor_id,
            day_of_week=day_of_week,
            appointment_type=appointment_type
        )
        
        # Fallback for testing: if doctor has no schedule configured, assume 09:00 to 17:00
        if not availabilities.exists():
            current_time = datetime.datetime.combine(target_date, datetime.time(9, 0))
            end_time = datetime.datetime.combine(target_date, datetime.time(18, 0))
            slot_duration = datetime.timedelta(minutes=20)
            
            while current_time + slot_duration <= end_time:
                all_slots.append(current_time.time())
                current_time += slot_duration
        else:
            for avail in availabilities:
                current_time = datetime.datetime.combine(target_date, avail.start_time)
                end_time = datetime.datetime.combine(target_date, avail.end_time)
                slot_duration = datetime.timedelta(minutes=avail.slot_duration)

                while current_time + slot_duration <= end_time:
                    all_slots.append(current_time.time())
                    current_time += slot_duration


    # Remove booked or locked slots across ALL appointment types for this doctor
    now = timezone.now()
    # Convert 'now' to local date/time for accurate past-slot filtering
    current_date = now.date()
    current_time_val = now.time()

    booked_appointments = Appointment.objects.filter(
        doctor_id=doctor_id,
        date=target_date
    ).exclude(status='cancelled')

    booked_times = []
    for appt in booked_appointments:
        # A slot is considered booked if it's confirmed/active, or if it's pending but still under a 5-min lock
        if appt.status != 'pending' or (appt.status == 'pending' and appt.locked_until and appt.locked_until > now):
            booked_times.append(appt.time)

    # Determine availability status for each slot
    results = []
    for slot in all_slots:
        is_available = True
        if slot in booked_times:
            is_available = False
        elif target_date == current_date and slot <= current_time_val:
            is_available = False
        
        results.append({
            "time": slot.strftime('%H:%M:%S'),
            "available": is_available
        })

    return results

def send_notification(user, message_type, context):
    """Stub function to mock SMS/push notifications."""
    print(f"NOTIFICATION to {user}: [{message_type}] {context}")

