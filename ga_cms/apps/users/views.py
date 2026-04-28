from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

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
