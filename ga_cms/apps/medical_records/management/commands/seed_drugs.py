import json
from django.core.management.base import BaseCommand
from apps.medical_records.models import Drug

class Command(BaseCommand):
    help = 'Seeds the database with basic mock drugs'

    def handle(self, *args, **kwargs):
        drugs_data = [
            {
                "name": "Amoxicillin",
                "generic_name": "Amoxicillin",
                "description": "Antibiotic used to treat a number of bacterial infections.",
                "interactions": ["Methotrexate"]
            },
            {
                "name": "Ibuprofen",
                "generic_name": "Ibuprofen",
                "description": "Nonsteroidal anti-inflammatory drug used for treating pain, fever, and inflammation.",
                "interactions": ["Aspirin", "Methotrexate"]
            },
            {
                "name": "Paracetamol",
                "generic_name": "Acetaminophen",
                "description": "Medication used to treat pain and fever.",
                "interactions": []
            },
            {
                "name": "Methotrexate",
                "generic_name": "Methotrexate",
                "description": "Chemotherapy agent and immune system suppressant.",
                "interactions": ["Amoxicillin", "Ibuprofen"]
            },
            {
                "name": "Pantoprazole",
                "generic_name": "Pantoprazole",
                "description": "Proton pump inhibitor used for the treatment of stomach ulcers.",
                "interactions": []
            }
        ]

        for drug in drugs_data:
            Drug.objects.get_or_create(
                name=drug['name'],
                defaults={
                    'generic_name': drug['generic_name'],
                    'description': drug['description'],
                    'interactions': drug['interactions']
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded drugs'))
