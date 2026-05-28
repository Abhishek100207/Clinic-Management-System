import requests

session = requests.Session()
# Login first
login_data = {
    "email": "sawdrftofc@gmail.com",
    "password": "password123" # assuming test password, or we can use another patient
}
res = session.post("http://127.0.0.1:8000/auth/login/", json=login_data)
print("Login status:", res.status_code)

if res.status_code == 200:
    url = "http://127.0.0.1:8000/api/appointments/appointments/"
    payload = {
        "patient": 1,
        "doctor": 1,
        "date": "2026-05-25",
        "time": "10:00",
        "appointment_type": "virtual",
        "location": "",
        "patient_location": "",
        "reason": "Test"
    }
    
    response = session.post(url, json=payload)
    print("Appt Status:", response.status_code)
    print("Appt Response:", response.text)
