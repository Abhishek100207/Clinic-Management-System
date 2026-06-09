import csv
import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.medical_records.models import Drug

class Command(BaseCommand):
    help = 'Seeds the database with drugs from Kaggle CSV'

    def handle(self, *args, **kwargs):
        # Hardcoded path as requested
        csv_path = os.path.join(settings.BASE_DIR, 'data', 'medicine_dataset.csv')
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"Error: File not found at {csv_path}"))
            self.stdout.write(self.style.WARNING("Please place the medicine_dataset.csv file in the ga_cms/data/ directory."))
            return

        self.stdout.write(self.style.SUCCESS(f"Reading data from {csv_path}..."))
        
        try:
            with open(csv_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                count = 0
                batch_size = 1000
                batch = {}
                
                for row in reader:
                    drug_name = row.get('drug_name') or row.get('name')
                    if not drug_name:
                        continue
                        
                    use_case = row.get('use_case') or row.get('indication') or row.get('use')
                    
                    # Handle side_effects
                    side_effects_raw = row.get('side_effects') or row.get('sideEffects')
                    side_effects = []
                    if side_effects_raw:
                        if side_effects_raw.startswith('['):
                            try:
                                side_effects = json.loads(side_effects_raw)
                            except:
                                side_effects = [s.strip() for s in side_effects_raw.split(',')]
                        else:
                            side_effects = [s.strip() for s in side_effects_raw.split(',')]
                            
                    # Handle substitutes
                    substitutes_raw = row.get('substitutes')
                    substitutes = []
                    if substitutes_raw:
                        if substitutes_raw.startswith('['):
                            try:
                                substitutes = json.loads(substitutes_raw)
                            except:
                                substitutes = [s.strip() for s in substitutes_raw.split(',')]
                        else:
                            substitutes = [s.strip() for s in substitutes_raw.split(',')]
                            
                    manufacturer = row.get('manufacturer')
                    dosage_form = row.get('dosage_form') or row.get('form')
                    
                    # Deduplicate within batch
                    batch[drug_name] = Drug(
                        name=drug_name,
                        use_case=use_case,
                        side_effects=side_effects,
                        substitutes=substitutes,
                        manufacturer=manufacturer,
                        dosage_form=dosage_form,
                    )
                    
                    if len(batch) >= batch_size:
                        Drug.objects.bulk_create(
                            batch.values(),
                            update_conflicts=True,
                            update_fields=['use_case', 'side_effects', 'substitutes', 'manufacturer', 'dosage_form'],
                            unique_fields=['name']
                        )
                        count += len(batch)
                        self.stdout.write(self.style.SUCCESS(f"Seeded {count} drugs..."))
                        batch = {}
                
                # Insert remaining
                if batch:
                    Drug.objects.bulk_create(
                        batch.values(),
                        update_conflicts=True,
                        update_fields=['use_case', 'side_effects', 'substitutes', 'manufacturer', 'dosage_form'],
                        unique_fields=['name']
                    )
                    count += len(batch)
                    
                self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} drugs."))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"An error occurred during seeding: {str(e)}"))
