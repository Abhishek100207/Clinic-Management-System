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
        return ret
