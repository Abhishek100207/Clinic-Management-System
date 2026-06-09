from django.contrib import admin
from apps.auth_module.admin import CustomUserAdmin
from .models import (
    Doctor, Receptionist, Technician, Patient, AuditLog,
    DoctorUser, ReceptionistUser, TechnicianUser, PatientUser
)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'user__email', 'action', 'details')
    readonly_fields = ('timestamp', 'user', 'action', 'ip_address', 'details')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

class DoctorInline(admin.StackedInline):
    model = Doctor
    can_delete = False
    verbose_name_plural = 'Doctor Profile'

@admin.register(DoctorUser)
class DoctorUserAdmin(CustomUserAdmin):
    inlines = [DoctorInline]
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='doctor')

class ReceptionistInline(admin.StackedInline):
    model = Receptionist
    can_delete = False
    verbose_name_plural = 'Receptionist Profile'

@admin.register(ReceptionistUser)
class ReceptionistUserAdmin(CustomUserAdmin):
    inlines = [ReceptionistInline]
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='receptionist')

class TechnicianInline(admin.StackedInline):
    model = Technician
    can_delete = False
    verbose_name_plural = 'Technician Profile'

@admin.register(TechnicianUser)
class TechnicianUserAdmin(CustomUserAdmin):
    inlines = [TechnicianInline]
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='technician')

class PatientInline(admin.StackedInline):
    model = Patient
    fk_name = 'user'
    can_delete = False
    verbose_name_plural = 'Patient Profile'

@admin.register(PatientUser)
class PatientUserAdmin(CustomUserAdmin):
    inlines = [PatientInline]
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='patient')
