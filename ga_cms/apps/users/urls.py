from django.urls import path
from .views import (
    AuditLogListView, DoctorListView, PatientListView,
    AddStaffView, ListStaffView
)

urlpatterns = [
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('patients/', PatientListView.as_view(), name='patient-list'),
    path('staff/add/', AddStaffView.as_view(), name='staff-add'),
    path('staff/', ListStaffView.as_view(), name='staff-list'),
]
