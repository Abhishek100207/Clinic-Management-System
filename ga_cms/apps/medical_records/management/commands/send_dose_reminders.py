from django.core.management.base import BaseCommand
from apps.medical_records.models import PrescribedMedication

class Command(BaseCommand):
    help = 'Simulates sending dose reminders to patients'

    def handle(self, *args, **kwargs):
        medications = PrescribedMedication.objects.all()
        count = 0
        for med in medications:
            patient_name = med.prescription.patient.full_name
            drug_name = med.drug.name
            dosage = med.dosage
            
            self.stdout.write(
                self.style.SUCCESS(f"Simulated sending reminder to {patient_name} for {drug_name} ({dosage})")
            )
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Finished sending {count} dose reminders."))
