from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('senior_doctor', 'Senior Doctor'),
        ('doctor', 'Doctor'),
        ('receptionist', 'Receptionist'),
        ('technician', 'Technician'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    avatar_url = models.URLField(blank=True, null=True)
    google_id = models.CharField(max_length=200, unique=True, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} ({self.role})"
