import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BMS.settings')
django.setup()

from django.utils import timezone
from HAC.models import AdminPassword
from HAC.services.auth_service import AuthService

def list_admins():
    print("\n--- System Configured Admin Phone Numbers ---")
    for p in AuthService.ADMIN_PHONES:
        print(f"  • {p}")

    print("\n--- Registered Admin Passwords in Database ---")
    admins = AdminPassword.objects.all()
    if not admins.exists():
        print("  No admin passwords currently set in database.")
    for a in admins:
        expiry = a.created_at + AuthService.PASSWORD_EXPIRY_DURATION
        status = "Active" if timezone.now() < expiry else "Expired"
        print(f"  Phone: {a.phone} | Password: {a.password} | Status: {status} | Created: {a.created_at.strftime('%Y-%m-%d %H:%M')}")
    print()

def set_admin_password(phone, password):
    phone = str(phone).strip()
    AdminPassword.objects.filter(phone=phone).delete()
    AdminPassword.objects.create(
        phone=phone,
        password=password,
        created_at=timezone.now()
    )
    print(f"\n[SUCCESS] Admin password set for {phone} -> {password}\n")

def delete_admin(phone):
    phone = str(phone).strip()
    deleted, _ = AdminPassword.objects.filter(phone=phone).delete()
    if deleted:
        print(f"\n[SUCCESS] Deleted admin password for {phone}\n")
    else:
        print(f"\n[INFO] No record found for {phone}\n")

if __name__ == "__main__":
    if len(sys.argv) == 1 or sys.argv[1] == "list":
        list_admins()
    elif sys.argv[1] == "set" and len(sys.argv) >= 4:
        set_admin_password(sys.argv[2], sys.argv[3])
        list_admins()
    elif sys.argv[1] == "delete" and len(sys.argv) >= 3:
        delete_admin(sys.argv[2])
        list_admins()
    else:
        print("Usage:")
        print("  python manage_admin.py list")
        print("  python manage_admin.py set <phone> <password>")
        print("  python manage_admin.py delete <phone>")
