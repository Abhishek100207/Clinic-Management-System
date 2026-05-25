import os
from google_auth_oauthlib.flow import InstalledAppFlow

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

def main():
    """Shows basic usage of the Google Calendar API.
    Prints the start and name of the next 10 events on the user's calendar.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        print("token.json already exists! Delete it if you want to re-authenticate.")
        return

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        print("Starting OAuth flow. Check your browser...")
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            # Use local server on a fixed port so Google knows exactly where to redirect
            creds = flow.run_local_server(port=8080)
            
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
            print("Successfully authenticated and created token.json!")
        except Exception as e:
            print(f"Error during authentication: {e}")
            print("\nMake sure your credentials.json has the correct client_id and client_secret.")
            print("Also make sure the app type in Google Cloud Console is 'Desktop App' (or if it's Web, it allows localhost redirects).")

if __name__ == '__main__':
    main()
