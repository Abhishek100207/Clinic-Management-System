import os
import django
import dj_database_url

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
from django.conf import settings

neon_url = 'postgresql://neondb_owner:npg_1tXBcFboR4xh@ep-long-firefly-a4step9h-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
settings.DATABASES['neon'] = dj_database_url.config(default=neon_url)

django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import Doctor, Receptionist, Technician
User = get_user_model()

usernames = ['Suraj', 'Vaishnavi', 'Kishore']

for username in usernames:
    neon_user = User.objects.using('neon').filter(username=username).first()
    if neon_user:
        print(f'Copying {username}...')
        local_user, created = User.objects.using('default').get_or_create(username=username, defaults={
            'password': neon_user.password,
            'role': neon_user.role,
            'first_name': neon_user.first_name,
            'email': neon_user.email,
            'is_staff': neon_user.is_staff,
            'is_superuser': neon_user.is_superuser,
            'is_active': neon_user.is_active,
        })
        if not created:
            local_user.password = neon_user.password
            local_user.role = neon_user.role
            local_user.first_name = neon_user.first_name
            local_user.email = neon_user.email
            local_user.save()
            
        if neon_user.role == 'doctor':
            profile = Doctor.objects.using('neon').filter(user=neon_user).first()
            if profile:
                Doctor.objects.using('default').update_or_create(user=local_user, defaults={
                    'specialty': profile.specialty,
                    'registration_number': profile.registration_number,
                    'accepts_inperson': profile.accepts_inperson,
                    'accepts_virtual': profile.accepts_virtual,
                    'is_visible_to_patients': profile.is_visible_to_patients,
                    'average_rating': profile.average_rating,
                    'total_reviews': profile.total_reviews,
                })
        elif neon_user.role == 'receptionist':
            profile = Receptionist.objects.using('neon').filter(user=neon_user).first()
            if profile:
                Receptionist.objects.using('default').update_or_create(user=local_user)
        elif neon_user.role == 'technician':
            profile = Technician.objects.using('neon').filter(user=neon_user).first()
            if profile:
                Technician.objects.using('default').update_or_create(user=local_user)
print('Done!')
