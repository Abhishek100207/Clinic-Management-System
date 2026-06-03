from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'get_full_name', 'role', 'avatar_url']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['full_name'] = instance.get_full_name()
        ret.pop('get_full_name', None)
        
        if instance.role == 'doctor' and hasattr(instance, 'doctor'):
            # Fetch availabilities
            availabilities = []
            for av in instance.doctor.availabilities.all():
                availabilities.append({
                    'day_of_week': av.day_of_week,
                    'start_time': av.start_time.strftime('%H:%M'),
                    'end_time': av.end_time.strftime('%H:%M'),
                    'appointment_type': av.appointment_type,
                })
            
            ret['doctor_profile'] = {
                'id': instance.doctor.id,
                'availabilities': availabilities
            }
            
        return ret
