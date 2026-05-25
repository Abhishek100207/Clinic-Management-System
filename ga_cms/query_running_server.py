import requests

# We will try to fetch appointments by logging in first
session = requests.Session()

# 1. Try to login
login_data = {
    "email": "receptionist@gmail.com",
    "password": "admin"
}

print("Attempting login to request OTP...")
r1 = session.post("http://localhost:8000/auth/login/request-otp/", json=login_data)
print("Request OTP Response status:", r1.status_code)
print("Request OTP Response:", r1.text)

# Let's see if we can get a direct token or if we can bypass it by looking at what the API returns.
# Wait, can we login with standard JWT token endpoint if one exists?
# Let's try /api/token/ or standard JWT endpoints if any
r2 = session.post("http://localhost:8000/api/token/", json={"username": "receptionist", "password": "admin"})
print("JWT Token login response status:", r2.status_code)
print("JWT Token login response:", r2.text)

# Wait! Is there an active session in cookies we can use? Let's check what auth views exist in the backend urls.py
