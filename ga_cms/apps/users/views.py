from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers, status
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from .models import AuditLog, Doctor, Patient, Receptionist, Technician

User = get_user_model()

class StandardPagination(PageNumberPagination): # PERF: Standard pagination for list endpoints
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

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
        
        logs = AuditLog.objects.select_related('user').all().order_by('-timestamp') # PERF: select_related and order by timestamp
        
        paginator = StandardPagination() # PERF: Add pagination
        page = paginator.paginate_queryset(logs, request)
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)

from .models import Doctor, Patient
from apps.auth_module.serializers import UserSerializer

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'specialty', 'registration_number', 'average_rating', 'total_reviews']

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Patient
        fields = ['id', 'user', 'patient_id', 'full_name', 'email', 'mobile_number', 'blood_group', 'known_allergies', 'chronic_conditions']

class DoctorListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        doctors = Doctor.objects.select_related('user').filter(is_visible_to_patients=True).order_by('id') # PERF: select_related
        
        paginator = StandardPagination() # PERF: Add pagination
        page = paginator.paginate_queryset(doctors, request)
        if page is not None:
            serializer = DoctorSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = DoctorSerializer(doctors, many=True)
        return Response(serializer.data)

class PatientListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Admin, Receptionist, Doctor can see all patients.
        # Patients can only see themselves.
        if request.user.role == 'patient':
            patients = Patient.objects.select_related('user').filter(user=request.user).order_by('id') # PERF: select_related
        else:
            patient_id = request.query_params.get('id')
            if patient_id:
                patients = Patient.objects.select_related('user').filter(id=patient_id).order_by('id')
            else:
                patients = Patient.objects.select_related('user').all().order_by('id') # PERF: select_related
            
        paginator = StandardPagination() # PERF: Add pagination
        page = paginator.paginate_queryset(patients, request)
        if page is not None:
            serializer = PatientSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
            
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)

class AddStaffView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['senior_doctor']:
            return Response({'error': 'Only Senior Doctors can add staff.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        required_fields = ['username', 'email', 'password', 'role']
        if not all(field in data for field in required_fields):
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=data['username']).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email__iexact=data['email']).exists():
            return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role=data['role']
            )

            # Profile creation logic (similar to register-verify but admin driven)
            if user.role in ['senior_doctor', 'doctor']:
                Doctor.objects.get_or_create(
                    user=user, 
                    defaults={'specialty': 'General', 'registration_number': f"DOC-{user.id}"}
                )
            elif user.role == 'receptionist':
                Receptionist.objects.get_or_create(user=user)
            elif user.role == 'technician':
                Technician.objects.get_or_create(user=user)

            from .services import log_security_event
            log_security_event(request.user, 'STAFF_CREATED', request, f"Created staff user: {user.username} as {user.role}")

            return Response({'detail': f'Staff account for {user.username} created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ListStaffView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['senior_doctor', 'doctor', 'technician', 'receptionist']:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Return all users who are NOT patients
        staff_users = User.objects.exclude(role='patient').order_by('-created_at')
        serializer = UserSerializer(staff_users, many=True)
        return Response(serializer.data)

from django.db.models import Sum
from apps.appointments.models import Invoice

class AdminSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['senior_doctor']:
            return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        staff_count = User.objects.exclude(role='patient').count()
        patient_count = Patient.objects.count()
        
        # Calculate revenue from paid invoices
        revenue_agg = Invoice.objects.filter(payment_status='paid').aggregate(total=Sum('total_amount'))
        total_revenue = revenue_agg['total'] or 0
        
        # We can mock growth or calculate it if needed
        # For now, let's keep it simple
        return Response({
            'staffCount': staff_count,
            'patientCount': patient_count,
            'revenue': total_revenue,
            'growth': 15  # Mocked growth metric
        })

from apps.appointments.serializers import AppointmentSerializer
from apps.medical_records.serializers import ScanOrderSerializer

class DashboardBootstrapAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Fetch User Profile
        if user.role == 'patient':
            try:
                profile = PatientSerializer(user.patient).data
            except:
                profile = {}
        elif user.role in ['doctor', 'senior_doctor']:
            try:
                profile = DoctorSerializer(user.doctor).data
            except:
                profile = {}
        else:
            profile = {}
            
        # 2. Fetch Relevant Appointments (e.g. today's or pending)
        from apps.appointments.models import Appointment
        from django.utils import timezone
        
        today = timezone.now().date()
        appointments_qs = Appointment.objects.select_related('patient', 'doctor', 'doctor__user').all()
        if user.role == 'patient':
            appointments_qs = appointments_qs.filter(patient__user=user)
        elif user.role in ['doctor', 'senior_doctor']:
            appointments_qs = appointments_qs.filter(doctor__user=user)
            
        appointments_data = AppointmentSerializer(appointments_qs, many=True).data

        # 3. Compile response
        response_data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.get_full_name(),
                'role': user.role,
                'profile': profile
            },
            'appointments': appointments_data,
        }
        
        return Response(response_data)
