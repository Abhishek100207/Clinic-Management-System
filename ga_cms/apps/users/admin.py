from django.contrib import admin
from .models import Doctor, Receptionist, Technician, Patient

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty', 'registration_number')

@admin.register(Receptionist)
class ReceptionistAdmin(admin.ModelAdmin):
    list_display = ('user',)

@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ('user',)

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'patient_id', 'mobile_number')
