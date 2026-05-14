from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ConsultationNote, LabResult, ScanResult, Drug, Prescription
from .serializers import (
    ConsultationNoteSerializer, LabResultSerializer, ScanResultSerializer, 
    DrugSerializer, PrescriptionSerializer
)
from apps.users.models import AuditLog

class IsDoctorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'doctor')

class ConsultationNoteViewSet(viewsets.ModelViewSet):
    queryset = ConsultationNote.objects.all()
    serializer_class = ConsultationNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrReadOnly]

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        serializer.save(doctor=appointment.doctor, patient=appointment.patient)
        AuditLog.objects.create(
            user=self.request.user,
            action='Created Consultation Note',
            details=f"For Patient: {appointment.patient.full_name}, Appointment: {appointment.id}"
        )

class LabResultViewSet(viewsets.ModelViewSet):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='Uploaded Lab Result',
            details=f"Test: {serializer.validated_data.get('test_name')} for Patient ID: {serializer.validated_data.get('patient').id}"
        )

class ScanResultViewSet(viewsets.ModelViewSet):
    queryset = ScanResult.objects.all()
    serializer_class = ScanResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='Uploaded Scan Result',
            details=f"Scan: {serializer.validated_data.get('scan_type')} for Patient ID: {serializer.validated_data.get('patient').id}"
        )

class DrugViewSet(viewsets.ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def check_interactions(self, request):
        drug_ids = request.data.get('drug_ids', [])
        drugs = Drug.objects.filter(id__in=drug_ids)
        interactions = []
        
        for i, drug1 in enumerate(drugs):
            for drug2 in drugs[i+1:]:
                # simple mock logic: if drug2's name is in drug1's interactions
                if drug2.name in drug1.interactions or drug1.name in drug2.interactions:
                    interactions.append(f"Interaction found between {drug1.name} and {drug2.name}")
        
        return Response({"interactions": interactions}, status=status.HTTP_200_OK)

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrReadOnly]

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        serializer.save(doctor=appointment.doctor, patient=appointment.patient)
        AuditLog.objects.create(
            user=self.request.user,
            action='Created Prescription',
            details=f"For Patient: {appointment.patient.full_name}, Appointment: {appointment.id}"
        )
