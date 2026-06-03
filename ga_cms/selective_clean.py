import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ga_cms.settings')
django.setup()

from apps.auth_module.models import CustomUser

print("--- Starting Selective Database Cleanup ---")

usernames_to_delete = [
    'doctor',
    'patient',
    'patient_1',
    'patient_2',
    'patient_3',
    'patient_4',
    'patient_5',
    'patient_6',
    'receptionist',
    'robert_chen',
    'sarah_johnson'
]

users_to_delete = CustomUser.objects.filter(username__in=usernames_to_delete)
user_count = users_to_delete.count()

if user_count > 0:
    for u in users_to_delete:
        print(f"Deleting user: {u.username} ({u.email})")
    users_to_delete.delete()
    print(f"Successfully deleted {user_count} users and all their associated data (appointments, invoices, etc.).")
else:
    print("No matching users found to delete.")

# Let's also print the remaining users to verify
remaining_users = CustomUser.objects.values_list('username', flat=True)
print(f"Remaining users in DB: {list(remaining_users)}")

print("--- Cleanup Complete! ---")
