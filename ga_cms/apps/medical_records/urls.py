from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsultationNoteViewSet, LabResultViewSet, ScanResultViewSet, 
    DrugViewSet, PrescriptionViewSet, DrugSearchView, ScanOrderViewSet
)

router = DefaultRouter()
router.register(r'consultation-notes', ConsultationNoteViewSet, basename='consultation-note')
router.register(r'lab-results', LabResultViewSet, basename='lab-result')
router.register(r'scan-results', ScanResultViewSet, basename='scan-result')
router.register(r'drugs', DrugViewSet, basename='drug')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'scan-orders', ScanOrderViewSet, basename='scan-order')

urlpatterns = [
    path('drugs/search', DrugSearchView.as_view(), name='drug-search'),
    path('', include(router.urls)),
]

