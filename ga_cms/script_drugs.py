import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.medical_records.models import Drug

if __name__ == '__main__':
    drugs = Drug.objects.all()
    for drug in drugs:
        try:
            print(f"{drug.name} ({drug.generic_name}) - Interactions: {drug.interactions}")
        except UnicodeEncodeError:
            print(f"{drug.name} ({drug.generic_name}) - Interactions: [Encoding Error]")

