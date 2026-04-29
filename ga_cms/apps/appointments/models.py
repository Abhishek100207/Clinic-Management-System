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
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ('in_person', 'In-Person'),
        ('virtual', 'Virtual'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    locked_until = models.DateTimeField(null=True, blank=True, help_text="For 5-minute hold logic")
    distance_to_clinic = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Cached distance for in-person")
    meeting_link = models.URLField(max_length=500, null=True, blank=True)
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
