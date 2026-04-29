from django.urls import path
from .views import AuditLogListView, DoctorListView, PatientListView

urlpatterns = [
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),
    path('patients/', PatientListView.as_view(), name='patient-list'),
]
