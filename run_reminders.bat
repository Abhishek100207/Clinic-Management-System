@echo off
cd /d "c:\Users\Abhishek\Clinic-Management-System\ga_cms"
call ..\venv\Scripts\activate.bat
python manage.py send_appointment_reminders
