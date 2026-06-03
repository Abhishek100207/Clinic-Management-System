import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()
from apps.auth_module.models import CustomUser
print(list(CustomUser.objects.values_list('username', flat=True)))
