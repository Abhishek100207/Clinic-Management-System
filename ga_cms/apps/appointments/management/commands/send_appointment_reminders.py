import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.appointments.models import Appointment
from apps.appointments.utils.email_service import send_appointment_reminder_email

class Command(BaseCommand):
    help = 'Send email reminders to patients with appointments scheduled for tomorrow.'

    def handle(self, *args, **options):
        # Tomorrow is today + 1 day
        tomorrow = timezone.localdate() + datetime.timedelta(days=1)
        self.stdout.write(f"Querying appointments scheduled for {tomorrow}...")
        
        # Get confirmed or rescheduled appointments for tomorrow
        appointments = Appointment.objects.filter(
            date=tomorrow,
            status__in=['confirmed', 'rescheduled']
        ).select_related('patient', 'patient__user', 'doctor', 'doctor__user')
        
        count = 0
        for appt in appointments:
            try:
                send_appointment_reminder_email(appt)
                count += 1
            except Exception as e:
                self.stderr.write(f"Failed to send reminder for appointment {appt.id}: {e}")
                
        self.stdout.write(self.style.SUCCESS(f"Successfully sent {count} appointment reminder emails for {tomorrow}."))
