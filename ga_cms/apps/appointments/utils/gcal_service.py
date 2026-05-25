import os
import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.conf import settings

SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def get_calendar_service():
    """Authenticates and returns the Google Calendar API service."""
    from google.auth.transport.requests import Request
    
    token_path = os.path.join(settings.BASE_DIR, 'token.json')
    if not os.path.exists(token_path):
        return None
        
    creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(token_path, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                print(f"Failed to refresh token: {e}")
                return None
        else:
            return None
        
    service = build('calendar', 'v3', credentials=creds)
    return service

def create_virtual_meet_event(appointment):
    """
    Creates a Google Calendar event with a Google Meet link for the given appointment.
    Returns the Google Meet link, or None if failed.
    """
    service = get_calendar_service()
    if not service:
        print("Calendar service unavailable. token.json might be missing.")
        return None

    # Calculate start and end times in RFC3339 format
    from django.utils.timezone import get_current_timezone, make_aware
    
    start_dt_naive = datetime.datetime.combine(appointment.date, appointment.time)
    start_dt = make_aware(start_dt_naive, get_current_timezone())
    
    # Default duration 30 minutes
    end_dt = start_dt + datetime.timedelta(minutes=30)
    
    event = {
      'summary': f'Virtual Consultation: {appointment.patient.user.get_full_name()} & Dr. {appointment.doctor.user.get_full_name()}',
      'description': f'Appointment ID: {appointment.id}\nPatient: {appointment.patient.user.get_full_name()}\nDoctor: Dr. {appointment.doctor.user.get_full_name()}',
      'start': {
        'dateTime': start_dt.isoformat(),
        'timeZone': str(get_current_timezone()),
      },
      'end': {
        'dateTime': end_dt.isoformat(),
        'timeZone': str(get_current_timezone()),
      },
      'attendees': [
        {'email': appointment.patient.user.email},
        {'email': appointment.doctor.user.email},
      ],
      'conferenceData': {
        'createRequest': {
            'requestId': f"ga_cms_meet_{appointment.id}_{int(datetime.datetime.now().timestamp())}",
            'conferenceSolutionKey': {'type': 'hangoutsMeet'}
        }
      },
    }

    try:
        # Create event with conferenceDataVersion=1 to generate Meet link
        # sendUpdates='all' ensures it is added to attendees' personal calendars
        event = service.events().insert(
            calendarId='primary', 
            body=event, 
            conferenceDataVersion=1,
            sendUpdates='all'
        ).execute()
        
        meet_link = event.get('hangoutLink')
        return meet_link
    except HttpError as error:
        print(f"An error occurred: {error}")
        return None
