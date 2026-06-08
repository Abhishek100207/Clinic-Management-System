import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.medical_records.models import ScanResult
from apps.users.models import Patient
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

class Command(BaseCommand):
    help = 'Seeds sample MRI scan reports'

    def handle(self, *args, **kwargs):
        # Ensure directory exists
        reports_dir = os.path.join(settings.MEDIA_ROOT, 'scan_reports')
        os.makedirs(reports_dir, exist_ok=True)

        patients = Patient.objects.all()[:5]
        if not patients.exists():
            self.stdout.write(self.style.ERROR("No patients found in database. Please seed patients first."))
            return

        # Sample data based on Kaggle LGG MRI dataset reference
        samples = [
            {
                'scan_type': 'MRI - Brain LGG',
                'findings': ['Right frontal lobe low-grade glioma.', 'No mass effect or midline shift.'],
            },
            {
                'scan_type': 'MRI - Brain LGG',
                'findings': ['Left temporal lobe lesion consistent with low-grade glioma.', 'Minimal surrounding edema.'],
            },
            {
                'scan_type': 'MRI - Brain LGG',
                'findings': ['Bilateral frontal lobe changes.', 'Further imaging recommended.'],
            },
        ]

        count = 0
        # We need 8-10 records.
        for i, patient in enumerate(patients):
            for j, sample in enumerate(samples):
                if count >= 10:
                    break
                    
                scan_date = datetime.now().date() - timedelta(days=30 * (i + j + 1))
                
                # Check for existing record (Idempotent)
                if ScanResult.objects.filter(patient=patient, scan_date=scan_date, scan_type=sample['scan_type']).exists():
                    self.stdout.write(f"Record already exists for {patient.full_name} on {scan_date}")
                    continue

                filename = f"scan_report_{patient.id}_{scan_date}.pdf"
                file_path = os.path.join(reports_dir, filename)
                
                # Create PDF
                c = canvas.Canvas(file_path, pagesize=letter)
                c.drawString(100, 750, f"Patient Name: {patient.full_name}")
                c.drawString(100, 730, f"Scan Date: {scan_date}")
                c.drawString(100, 710, f"Scan Type: {sample['scan_type']}")
                c.drawString(100, 690, "Findings:")
                y = 670
                for line in sample['findings']:
                    c.drawString(100, y, line)
                    y -= 20
                c.save()

                # Create record
                ScanResult.objects.create(
                    patient=patient,
                    scan_type=sample['scan_type'],
                    scan_date=scan_date,
                    findings=sample['findings'],
                    file=f"scan_reports/{filename}",
                    reported_by='Dr. Radiologist',
                    status='completed'
                )
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Seeded scan report for {patient.full_name}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} scan reports."))
