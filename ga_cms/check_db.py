import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.appointments.views import AppointmentViewSet, InvoiceViewSet
from apps.auth_module.models import CustomUser
from rest_framework.test import APIRequestFactory, force_authenticate

# 1. Get Receptionist user
user = CustomUser.objects.filter(role='receptionist').first()
print("Receptionist user found:", user.email if user else "None")

factory = APIRequestFactory()

# 2. Query Appointments list view
request = factory.get('/api/appointments/appointments/')
if user:
    force_authenticate(request, user=user)

view = AppointmentViewSet.as_view({'get': 'list'})
response = view(request)
print("Appointments API response status:", response.status_code)
print("Appointments API response data count:", len(response.data) if isinstance(response.data, list) else "Not a list")
if isinstance(response.data, list):
    for item in response.data:
        print(f"Appt: ID={item.get('id')}, Patient={item.get('patient_name')}, Date={item.get('date')}, Status={item.get('status')}, Token={item.get('queue_token')}")

print("---")

# 3. Query Invoices list view
request_inv = factory.get('/api/appointments/invoices/')
if user:
    force_authenticate(request_inv, user=user)

view_inv = InvoiceViewSet.as_view({'get': 'list'})
response_inv = view_inv(request_inv)
print("Invoices API response status:", response_inv.status_code)
print("Invoices API response data count:", len(response_inv.data) if isinstance(response_inv.data, list) else "Not a list")
if isinstance(response_inv.data, list):
    for item in response_inv.data:
        print(f"Invoice: ID={item.get('id')}, InvID={item.get('invoice_id')}, Patient={item.get('patient_name')}, Total={item.get('total_amount')}, Status={item.get('payment_status')}, Date={item.get('date_generated')}")
