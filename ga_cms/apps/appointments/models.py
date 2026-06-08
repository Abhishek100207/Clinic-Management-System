from django.db import models
from apps.users.models import Doctor, Patient
from apps.auth_module.models import CustomUser

class DoctorAvailability(models.Model):
    APPOINTMENT_TYPE_CHOICES = [
        ('in_person', 'In-Person'),
        ('virtual', 'Virtual'),
    ]

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(help_text="0=Monday, 6=Sunday")
    start_time = models.TimeField()
    end_time = models.TimeField()
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES)
    slot_duration = models.IntegerField(default=20, help_text="Duration in minutes")

    class Meta:
        verbose_name_plural = "Doctor Availabilities"

    def __str__(self):
        return f"{self.doctor} - Day {self.day_of_week} ({self.start_time} to {self.end_time}) [{self.appointment_type}]"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
        ('missed', 'Missed'),
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ('in_person', 'In-Person'),
        ('virtual', 'Virtual'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField(db_index=True) # PERF: Index for filtering
    time = models.TimeField()
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True) # PERF: Index for filtering
    locked_until = models.DateTimeField(null=True, blank=True, help_text="For 5-minute hold logic")
    distance_to_clinic = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Cached distance for in-person")
    meeting_link = models.URLField(max_length=500, null=True, blank=True)
    patient_location = models.CharField(max_length=255, blank=True, null=True, help_text="Location specified by the patient")
    razorpay_order_id = models.CharField(max_length=255, blank=True, null=True, help_text="Razorpay Order ID")
    razorpay_payment_id = models.CharField(max_length=255, blank=True, null=True, help_text="Razorpay Payment ID")
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True, help_text="Razorpay Signature")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Amount paid in INR")
    
    # Queue-related fields
    queue_token = models.CharField(max_length=20, blank=True, null=True, help_text="Queue Token, e.g. T-102")
    queue_type = models.CharField(max_length=20, default='scheduled', help_text="scheduled | walkin | emergency")
    priority = models.IntegerField(default=3, help_text="1: Emergency, 2: Walk-in, 3: Regular")
    delay_offset = models.IntegerField(default=0, help_text="Delay offset in minutes")
    check_in_time = models.DateTimeField(null=True, blank=True, help_text="Timestamp when checked in")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient} with {self.doctor} on {self.date} at {self.time}"


class RescheduleHistory(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reschedule_history')
    rescheduled_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    original_date = models.DateField()
    original_time = models.TimeField()
    new_date = models.DateField()
    new_time = models.TimeField()
    reason = models.TextField()
    patient_counter_proposed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Reschedule Histories"

    def __str__(self):
        return f"Reschedule for Appointment ID {self.appointment.id} by {self.rescheduled_by}"


class Invoice(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('PAID', 'PAID'),
        ('PENDING', 'PENDING'),
        ('FAILED', 'FAILED'),
    ]

    invoice_id = models.CharField(max_length=20, unique=True)
    appointment = models.OneToOneField(Appointment, null=True, blank=True, on_delete=models.SET_NULL, related_name='invoice')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='invoices')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_mode = models.CharField(max_length=50, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    date_generated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_id} for {self.patient}"


class ConsultationReview(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='review')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='reviews')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reviews')
    
    # Ratings (1 to 5)
    consultation_rating = models.IntegerField(default=0)
    doctor_rating = models.IntegerField(default=0)
    receptionist_rating = models.IntegerField(default=0)
    technician_rating = models.IntegerField(default=0)
    hospital_rating = models.IntegerField(default=0)
    
    # Comments
    consultation_comments = models.TextField(blank=True, null=True)
    doctor_comments = models.TextField(blank=True, null=True)
    receptionist_comments = models.TextField(blank=True, null=True)
    technician_comments = models.TextField(blank=True, null=True)
    hospital_comments = models.TextField(blank=True, null=True)
    general_comments = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Consultation Reviews"
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Review for {self.appointment} by {self.patient}"


class DoctorCalendarOverride(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('leave', 'On Leave'),
        ('hold', 'On Hold'),
        ('unavailable', 'Unavailable'),
    ]
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='calendar_overrides')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    reason = models.TextField(blank=True, null=True)
    sessions = models.JSONField(null=True, blank=True, help_text="Custom available session times")

    class Meta:
        unique_together = ('doctor', 'date')
        verbose_name_plural = "Doctor Calendar Overrides"

    def __str__(self):
        return f"Override for {self.doctor} on {self.date}: {self.status}"


class SpecialistReferral(models.Model):
    referrer = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='referrals_sent')
    referred_to = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='referrals_received')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='specialist_referrals')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Specialist Referrals"
        ordering = ['-created_at']

    def __str__(self):
        return f"Referral: {self.referrer} to {self.referred_to} for {self.patient}"

