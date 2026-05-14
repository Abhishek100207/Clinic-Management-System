from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsultationNoteViewSet, LabResultViewSet, ScanResultViewSet, 
    DrugViewSet, PrescriptionViewSet
)

router = DefaultRouter()
router.register(r'consultation-notes', ConsultationNoteViewSet, basename='consultation-note')
router.register(r'lab-results', LabResultViewSet, basename='lab-result')
router.register(r'scan-results', ScanResultViewSet, basename='scan-result')
router.register(r'drugs', DrugViewSet, basename='drug')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')

urlpatterns = [
    path('', include(router.urls)),
]

