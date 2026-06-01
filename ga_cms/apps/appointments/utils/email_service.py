from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_appointment_confirmation_email(appointment, is_virtual=False, meet_link=None):
    patient_email = appointment.patient.user.email
    doctor_email = appointment.doctor.user.email
    
    patient_subject = f"Appointment Confirmed: GA Clinic - {appointment.date}"
    doctor_subject = f"New Appointment Scheduled: {appointment.patient.full_name} - {appointment.date}"
    
    context = {
        'patient_name': appointment.patient.full_name,
        'patient_phone': appointment.patient.mobile_number,
        'patient_location': appointment.patient_location or appointment.patient.city or 'Clinic / N/A',
        'doctor_name': f"Dr. {appointment.doctor.user.get_full_name()}",
        'date': appointment.date,
        'time': appointment.time,
        'is_virtual': is_virtual,
        'meet_link': meet_link,
        'appointment_id': appointment.id
    }

    # 1. Patient Email Content
    patient_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">GA Clinic Appointment Confirmation</h2>
        <p>Dear {context['patient_name']},</p>
        <p>Your appointment has been successfully confirmed.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Doctor:</strong> {context['doctor_name']}</p>
            <p><strong>Date:</strong> {context['date']}</p>
            <p><strong>Time:</strong> {context['time']}</p>
            <p><strong>Type:</strong> {'Virtual Consultation' if context['is_virtual'] else 'In-Person Visit'}</p>
        </div>
    """
    
    # 2. Doctor Email Content
    doctor_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">New Appointment Scheduled</h2>
        <p>Dear {context['doctor_name']},</p>
        <p>A new appointment has been scheduled with you. Here are the details:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Patient Name:</strong> {context['patient_name']}</p>
            <p><strong>Patient Phone:</strong> {context['patient_phone']}</p>
            <p><strong>Patient Location:</strong> {context['patient_location']}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <p><strong>Date:</strong> {context['date']}</p>
            <p><strong>Time:</strong> {context['time']}</p>
            <p><strong>Type:</strong> {'Virtual Consultation' if context['is_virtual'] else 'In-Person Visit'}</p>
        </div>
    """
    
    if is_virtual and meet_link:
        meet_block = f"""
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #34d399;">
            <h3 style="color: #065f46; margin-top: 0;">Virtual Consultation Details</h3>
            <p>Please join the meeting at the scheduled time using the Google Meet link below:</p>
            <a href="{meet_link}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a>
            <p style="font-size: 12px; margin-top: 10px; color: #666;">Link: {meet_link}</p>
        </div>
        """
        patient_html += meet_block
        doctor_html += meet_block
        
    footer_block = """
        <p>If you have any questions, please contact the clinic.</p>
        <p>Best regards,<br><strong>GA Clinic Team</strong></p>
      </body>
    </html>
    """
    patient_html += footer_block
    doctor_html += footer_block

    import datetime
    from django.utils.timezone import make_aware, get_current_timezone
    
    start_dt_naive = datetime.datetime.combine(appointment.date, appointment.time)
    start_dt_aware = make_aware(start_dt_naive, get_current_timezone())
    start_utc = start_dt_aware.astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    
    end_dt_aware = start_dt_aware + datetime.timedelta(minutes=30)
    end_utc = end_dt_aware.astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    
    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    location = meet_link if meet_link else "GA Clinic"
    
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GA Clinic//EN
BEGIN:VEVENT
UID:appt_{appointment.id}@gaclinic.com
DTSTAMP:{now_utc}
DTSTART:{start_utc}
DTEND:{end_utc}
SUMMARY:Appointment: {context['patient_name']} & {context['doctor_name']}
DESCRIPTION:Appointment ID: {appointment.id}\\nPatient: {context['patient_name']}\\nDoctor: {context['doctor_name']}\\nMeet Link: {location}
LOCATION:{location}
END:VEVENT
END:VCALENDAR"""

    # Send Patient Email
    try:
        msg_patient = EmailMultiAlternatives(patient_subject, strip_tags(patient_html), settings.DEFAULT_FROM_EMAIL, [patient_email])
        msg_patient.attach_alternative(patient_html, "text/html")
        msg_patient.attach('invite.ics', ics_content, 'text/calendar')
        msg_patient.send()
    except Exception as e:
        print(f"Failed to send patient confirmation email: {e}")

    # Send Doctor Email
    try:
        msg_doctor = EmailMultiAlternatives(doctor_subject, strip_tags(doctor_html), settings.DEFAULT_FROM_EMAIL, [doctor_email])
        msg_doctor.attach_alternative(doctor_html, "text/html")
        msg_doctor.attach('invite.ics', ics_content, 'text/calendar')
        msg_doctor.send()
    except Exception as e:
        print(f"Failed to send doctor confirmation email: {e}")

def send_invoice_email(invoice):
    patient_email = invoice.patient.user.email
    
    subject = f"Invoice #{invoice.invoice_id} from GA Clinic"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">GA Clinic Invoice</h2>
        <p>Dear {invoice.patient.user.get_full_name()},</p>
        <p>Thank you for visiting GA Clinic. Please find the details of your payment below.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f1f5f9;">
                <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Invoice ID:</strong></td>
                <td style="padding: 10px; border: 1px solid #cbd5e1;">{invoice.invoice_id}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Doctor:</strong></td>
                <td style="padding: 10px; border: 1px solid #cbd5e1;">Dr. {invoice.doctor.user.get_full_name()}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
                <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Date:</strong></td>
                <td style="padding: 10px; border: 1px solid #cbd5e1;">{invoice.date_generated.strftime('%Y-%m-%d %H:%M') if invoice.date_generated else 'N/A'}</td>
            </tr>
        </table>
        
        <h3 style="color: #334155; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">Billing Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            <tr>
                <td style="padding: 8px 0;">Consultation Fee</td>
                <td style="padding: 8px 0; text-align: right;">Rs. {invoice.consultation_fee}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #cbd5e1;">Tax (GST)</td>
                <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #cbd5e1;">Rs. {invoice.tax}</td>
            </tr>
            <tr>
                <td style="padding: 15px 0; font-size: 18px;"><strong>Total Amount</strong></td>
                <td style="padding: 15px 0; text-align: right; font-size: 18px; color: #059669;"><strong>Rs. {invoice.total_amount}</strong></td>
            </tr>
        </table>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #34d399; margin-top: 20px;">
            <p style="margin: 0;"><strong>Payment Status:</strong> {invoice.payment_status}</p>
            <p style="margin: 5px 0 0 0;"><strong>Payment Mode:</strong> {invoice.payment_mode or 'N/A'}</p>
            <p style="margin: 5px 0 0 0;"><strong>Transaction ID:</strong> {invoice.transaction_id or 'N/A'}</p>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">This is an automatically generated email from GA Clinic Management System.</p>
      </body>
    </html>
    """

    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [patient_email])
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send()
    except Exception as e:
        print(f"Failed to send invoice email: {e}")

def send_review_request_email(appointment):
    patient_email = appointment.patient.user.email
    
    subject = f"How was your consultation with Dr. {appointment.doctor.user.get_full_name()}?"
    
    # We construct a URL to the frontend.
    # In a real setup, frontend URL would be in settings. For now we use the typical local dev URL.
    from django.conf import settings
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    review_link = f"{frontend_url}/review/APT-{appointment.id}"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">GA Clinic Feedback Request</h2>
        <p>Dear {appointment.patient.user.get_full_name()},</p>
        <p>We hope your recent consultation with Dr. {appointment.doctor.user.get_full_name()} went well.</p>
        <p>We are constantly striving to improve our services and your feedback is invaluable to us.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{review_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Share Your Experience
            </a>
        </div>
        
        <p>Or copy this link into your browser: <br><a href="{review_link}" style="color: #2563eb;">{review_link}</a></p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">GA Clinic Management System</p>
      </body>
    </html>
    """

    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [patient_email])
    msg.attach_alternative(html_content, "text/html")
    
    try:
        msg.send()
    except Exception as e:
        print(f"Failed to send review request email: {e}")


def send_appointment_reminder_email(appointment):
    patient_email = appointment.patient.user.email
    subject = f"GA Clinic: Reminder - Appointment scheduled for tomorrow"
    
    # Check if virtual
    is_virtual = appointment.appointment_type == 'virtual'
    meet_link = appointment.meeting_link
    
    context = {
        'patient_name': appointment.patient.full_name,
        'doctor_name': f"Dr. {appointment.doctor.user.get_full_name()}",
        'date': appointment.date,
        'time': appointment.time,
        'is_virtual': is_virtual,
        'meet_link': meet_link,
        'appointment_id': appointment.id
    }
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1e3a8a;">GA Clinic: Appointment Reminder</h2>
        <p>Dear {context['patient_name']},</p>
        <p>This is a friendly reminder that you have an appointment scheduled for tomorrow.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0;"><strong>Doctor:</strong> {context['doctor_name']}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {context['date']}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {context['time']}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> {'Virtual Consultation' if context['is_virtual'] else 'In-Person Visit'}</p>
        </div>
    """
    
    if is_virtual and meet_link:
        html_content += f"""
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #34d399;">
            <h3 style="color: #065f46; margin-top: 0;">Virtual Consultation Details</h3>
            <p>Please join the meeting using the Google Meet link below:</p>
            <a href="{meet_link}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Google Meet</a>
        </div>
        """
    else:
        html_content += """
        <p style="color: #dc2626; font-weight: bold;">Please arrive at the clinic 15 minutes before your scheduled slot.</p>
        """
        
    html_content += """
        <p>If you need to reschedule or cancel, please do so via the Patient Dashboard or call the clinic.</p>
        <p>Best regards,<br><strong>GA Clinic Team</strong></p>
      </body>
    </html>
    """
    
    text_content = strip_tags(html_content)
    
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [patient_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        print(f"Successfully sent reminder email to {patient_email} for Appointment ID {appointment.id}")
    except Exception as e:
        print(f"Failed to send reminder email to {patient_email}: {e}")


