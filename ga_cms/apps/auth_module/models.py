from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('senior_doctor', 'Senior Doctor'),
        ('doctor', 'Doctor'),
        ('receptionist', 'Receptionist'),
        ('technician', 'Technician'),
        ('patient', 'Patient'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    avatar_url = models.URLField(blank=True, null=True)
    google_id = models.CharField(max_length=200, unique=True, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError
        
        if self.role in ['receptionist', 'technician']:
            existing = CustomUser.objects.filter(role=self.role).exclude(pk=self.pk)
            if existing.exists():
                role_name = dict(self.ROLE_CHOICES).get(self.role, self.role)
                raise ValidationError(f"A {role_name} account already exists. Please edit the existing account.")

    def __str__(self):
        return f"{self.email} ({self.role})"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_staff_profile(sender, instance, created, **kwargs):
    from django.contrib.auth.models import Group

    # Create associated profile if needed
    if instance.role in ['doctor', 'senior_doctor']:
        from apps.users.models import Doctor
        Doctor.objects.get_or_create(
            user=instance,
            defaults={
                'specialty': 'General',
                'registration_number': f'REG-{instance.id}'
            }
        )
    elif instance.role == 'receptionist':
        from apps.users.models import Receptionist
        Receptionist.objects.get_or_create(user=instance)
    elif instance.role == 'technician':
        from apps.users.models import Technician
        Technician.objects.get_or_create(user=instance)

    # Automatically assign the user to the correct permission Group
    role_to_group = {
        'doctor': 'Doctor',
        'senior_doctor': 'Doctor',
        'receptionist': 'Receptionist',
        'technician': 'Technician'
    }
    
    group_name = role_to_group.get(instance.role)
    if group_name:
        # Get or create the group in case it doesn't exist
        group, _ = Group.objects.get_or_create(name=group_name)
        # Clear existing groups to ensure they only have their respective permissions
        instance.groups.clear()
        instance.groups.add(group)
