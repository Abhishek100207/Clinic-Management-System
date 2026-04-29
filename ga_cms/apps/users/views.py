from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    ip_address = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user_name', 'action', 'ip_address', 'details', 'timestamp']
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.get_full_name() or obj.user.username} ({obj.user.role})"
        return "System / Anonymous"

class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['senior_doctor']:
            return Response({'error': 'Permission denied. Senior Doctor access only.'}, status=403)
        
        logs = AuditLog.objects.all()[:100] # Limit to latest 100 for now
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)

from .models import Doctor, Patient
from apps.auth_module.serializers import UserSerializer

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'specialty', 'registration_number']

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Patient
        fields = ['id', 'user', 'patient_id', 'full_name', 'email', 'mobile_number', 'blood_group', 'known_allergies', 'chronic_conditions']

class DoctorListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        doctors = Doctor.objects.filter(is_visible_to_patients=True)
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data)

class PatientListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Admin, Receptionist, Doctor can see all patients.
        # Patients can only see themselves.
        if request.user.role == 'patient':
            patients = Patient.objects.filter(user=request.user)
        else:
            patients = Patient.objects.all()
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)
