import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

try:
    from apps.medical_records.models import Prescription
    p = Prescription.objects.get(id=7)
    import io
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, 750, "GA Clinic")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, 735, "123 Medical Center Blvd, Healthcare City")
    
    # Prescription Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 680, f"Prescription #{p.id}")
    
    # Details
    c.setFont("Helvetica", 12)
    c.drawString(50, 650, f"Date: {p.created_at.strftime('%d %B %Y')}")
    c.drawString(50, 630, f"Doctor: {p.doctor.get_full_name() if hasattr(p.doctor, 'get_full_name') else p.doctor.username}")
    c.drawString(50, 610, f"Patient: {p.patient.full_name} ({p.patient.patient_id})")
    
    y_pos = 530
    c.setFont("Helvetica", 11)
    for med in p.medications.all():
        drug_name = med.drug.name if med.drug else med.drug_id
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, y_pos, f"• {drug_name}")
        c.setFont("Helvetica", 10)
        c.drawString(70, y_pos - 15, f"Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}")
        y_pos -= 50
    
    c.save()
    print('SUCCESS')
except Exception as e:
    import traceback
    traceback.print_exc()
