from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.users.models import Patient, Doctor
from apps.appointments.models import Appointment

class ConsultationNote(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='consultation_note')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='consultation_notes')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultation_notes')
    
    # SOAP format
    subjective = models.TextField(blank=True)
    objective = models.TextField(blank=True)
    assessment = models.TextField(blank=True)
    plan = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_locked(self):
        # 24-hour lock logic
        if not self.created_at:
            return False
        return timezone.now() > self.created_at + timedelta(hours=24)

    def __str__(self):
        return f"Consultation for {self.patient} on {self.appointment.date}"


class LabResult(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_results')
    test_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='lab_results/')
    status = models.CharField(max_length=50, default='Available')
    reported_by = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Lab: {self.test_name} for {self.patient}"


class ScanResult(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='scan_results')
    scan_type = models.CharField(max_length=255)
    file = models.FileField(upload_to='scan_results/')
    reported_by = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # New fields for scan reports
    findings = models.JSONField(default=list, blank=True, null=True)
    status = models.CharField(max_length=50, default='completed', blank=True, null=True)
    scan_date = models.DateField(blank=True, null=True, db_index=True) # PERF: Index for filtering

    def __str__(self):
        return f"Scan: {self.scan_type} for {self.patient}"


class ScanOrder(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='scan_orders')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='scan_orders')
    scan_type = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='pending') # pending/in_progress/completed
    ordered_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Order: {self.scan_type} for {self.patient} by {self.doctor}"

class ChatMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField(blank=True, null=True) # Allow empty message if there's an attachment
    attachment = models.FileField(upload_to='chat_attachments/', null=True, blank=True)
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True, db_index=True) # PERF: Index for sorting
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"From {self.sender} to {self.receiver} at {self.sent_at}"

class BlockedUser(models.Model):
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_users')
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_by')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker} blocked {self.blocked}"


class Drug(models.Model):
    name = models.CharField(max_length=255, unique=True)
    generic_name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    interactions = models.JSONField(default=list, blank=True, help_text="List of drug names this drug interacts with")
    
    # New fields for Kaggle dataset
    use_case = models.TextField(null=True, blank=True)
    side_effects = models.JSONField(default=list, blank=True, null=True)
    substitutes = models.JSONField(default=list, blank=True, null=True)
    manufacturer = models.CharField(max_length=255, null=True, blank=True)
    dosage_form = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'drugs'

    def __str__(self):
        return self.name



class Prescription(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='prescription')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    notes = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Prescription for {self.patient} on {self.created_at.date()}"


class PrescribedMedication(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medications')
    drug = models.ForeignKey(Drug, on_delete=models.CASCADE)
    dosage = models.CharField(max_length=100) # e.g., "500mg"
    frequency = models.CharField(max_length=100) # e.g., "Twice a day"
    duration = models.CharField(max_length=100) # e.g., "5 days"
    instructions = models.TextField(blank=True)

    def __str__(self):
        return f"{self.drug.name} - {self.dosage}"
