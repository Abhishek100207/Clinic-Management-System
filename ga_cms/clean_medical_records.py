import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.medical_records.models import (
    ConsultationNote, 
    LabResult, 
    ScanResult, 
    ScanOrder, 
    Prescription, 
    PrescribedMedication
)

print("--- Starting Medical Records Cleanup ---")

p_med_count = PrescribedMedication.objects.all().count()
PrescribedMedication.objects.all().delete()

p_count = Prescription.objects.all().count()
Prescription.objects.all().delete()

sr_count = ScanResult.objects.all().count()
ScanResult.objects.all().delete()

so_count = ScanOrder.objects.all().count()
ScanOrder.objects.all().delete()

lr_count = LabResult.objects.all().count()
LabResult.objects.all().delete()

cn_count = ConsultationNote.objects.all().count()
ConsultationNote.objects.all().delete()

print(f"Deleted {p_med_count} Prescribed Medications")
print(f"Deleted {p_count} Prescriptions")
print(f"Deleted {sr_count} Scan Results")
print(f"Deleted {so_count} Scan Orders")
print(f"Deleted {lr_count} Lab Results")
print(f"Deleted {cn_count} Consultation Notes")

print("--- Cleanup Complete! ---")
