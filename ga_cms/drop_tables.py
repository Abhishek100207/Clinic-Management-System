import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from django.db import connection

tables = [
    'medical_records_consultationnote',
    'medical_records_labresult',
    'medical_records_scanresult',
    'medical_records_drug',
    'medical_records_prescription',
    'medical_records_prescribedmedication',
]

with connection.cursor() as cursor:
    for table in tables:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            print(f"Dropped {table}")
        except Exception as e:
            print(f"Failed to drop {table}: {e}")
