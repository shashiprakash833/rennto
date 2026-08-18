import uuid
import requests
from datetime import timedelta
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone

from HAC.models import Tenent, Owners, AdminPassword, SystemSettings
from HAC.serializers import TenentSerializer, TenantLoginSerializer, OwnerLoginSerializer
from HAC.jwt_utils import generate_jwt_token
from .common_service import CommonService

class AuthService:

    @staticmethod
    def register_tenant(data):
        data_copy = data.copy()
        phone = data_copy.get("phone") or data_copy.get("phone_number")
        if phone and len(phone) < 10:
            data_copy["phone"] = phone[-10:]
            
        serializer = TenentSerializer(data=data_copy)
        if not serializer.is_valid():
            raise ValueError(serializer.errors)
            
        tenant = serializer.save()
        
        push_token = data.get("push_token")
        if push_token:
            tenant.push_token = push_token
            tenant.save()
            
        token = generate_jwt_token(tenant.id, 'tenant')
        return {
            "message": "Tenent registered successfully",
            "token": token,
            "data": serializer.data
        }

    @staticmethod
    def save_push_token(data):
        phone = data.get("phone")
        role = data.get("role")
        token = data.get("push_token")

        if not phone or not token or not role:
            raise ValueError("Missing parameters")

        user = None
        if role == "owner":
            user = CommonService.get_owner(phone)
        elif role == "tenant":
            user = CommonService.get_tenant(phone)

        if not user:
            raise Exception("User not found")

        user.push_token = token
        user.save()
        return {"message": "Push token saved successfully"}

    @staticmethod
    def tenant_login(data):
        serializer = TenantLoginSerializer(data=data)
        if not serializer.is_valid():
            raise ValueError(serializer.errors)

        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']

        tenant = CommonService.get_tenant(phone)
        if not tenant:
            raise Exception("phone not registered")

        if tenant.password != password:
            raise ValueError("Invalid Password")

        token = generate_jwt_token(user_id=tenant.id, role='tenant', phone=tenant.phone)
        return {
            "message": "Login Successful",
            "tenant_id": tenant.id,
            "name": tenant.name,
            "phone": tenant.phone,
            "token": token
        }

    @staticmethod
    def owner_login(data):
        serializer = OwnerLoginSerializer(data=data)
        if not serializer.is_valid():
            raise ValueError(serializer.errors)

        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']

        owners = Owners.objects.filter(phone=phone)
        if not owners.exists():
            raise Exception("Owner not found")

        owner = None
        for o in owners:
            if o.password == password:
                owner = o
                break

        if not owner:
            raise ValueError("Invalid Password")

        if owner.status == "pending":
            return {"status": 401, "error": "Your account is pending approval", "owner_status": owner.status, "message": "Please wait for the admin to approval"}
            
        if owner.status == "suspend":
            return {"status": 403, "error": "Your account is Suspeded", "owner_status": owner.status, "message": "Please contact admin"}

        if owner.status == "active" and owner.password == password:
            token = generate_jwt_token(user_id=owner.pk, role='owner', phone=owner.phone)
            return {"status": 200, "message": "Login Successful", "token": token}

        raise ValueError("Invalid Password")

    @staticmethod
    def admin_login(data):
        phone = data.get('phone')
        password = data.get('password')
        if phone == "admin@stayefy.com" and password == "admin123":
            token = generate_jwt_token(user_id=1, role='admin', phone=phone)
            return {"message": "Login Successful", "token": token}
        raise ValueError("Invalid phone or password")


   

    @staticmethod
    def check_user(phone):
        if phone and len(phone) == 10:
            phone = phone[-10:]
            
        user = CommonService.get_tenant(phone)
        if user:
            token = generate_jwt_token(user_id=user.id, role='tenant', phone=user.phone)
            return {
                "exists": True,
                "token": token,
                "user": {"id": user.id, "name": user.name, "phone": user.phone}
            }
        return {"exists": False, "user": None}

    @staticmethod
    def check_owner(phone):
        if phone and len(phone) == 10:
            phone = phone[-10:]
            
        user = CommonService.get_owner(phone)
        if user:
            token = generate_jwt_token(user_id=user.pk, role='owner', phone=user.phone)
            user_data = {"id": user.pk, "name": user.name, "phone": user.phone}
            
            if user.status == 'pending':
                return {"exists": True, "status": "pending", "error": "Your account is pending approval by admin.", "token": token, "user": user_data}
            elif user.status == 'suspend':
                return {"exists": True, "status": "suspend", "error": "Your account has been suspended by admin.", "token": token, "user": user_data}

            return {"exists": True, "status": user.status, "token": token, "user": user_data}
        return {"exists": False, "user": None}

    @staticmethod
    def send_otp(phone):
 
        # Validate phone number
        if not phone or len(phone) != 10:
            raise ValueError("Invalid phone number")

        system_settings = SystemSettings.objects.first()

        print("Demo Mode:", system_settings.demo_mode_enabled)
        print("Demo Numbers:", system_settings.demo_mobile_numbers)
        print("Phone:", phone)

        if (
            system_settings
            and system_settings.demo_mode_enabled
            and phone in system_settings.demo_mobile_numbers
        ):
            return {
                "message": "Demo OTP enabled",
                "demo": True
            }
 
        # Check rate limiting
        attempts = cache.get(f"otp_attempts_{phone}", 0)
 
        if attempts >= 3:
            raise ValueError("Too many OTP requests. Try again later.")
 
        url = (
            f"https://2factor.in/API/V1/"
            f"{settings.TWO_FACTOR_API_KEY}/SMS/{phone}/AUTOGEN3/OTP1"
        )
 
        try:
            response = requests.get(url, timeout=15)
 
            data = response.json()
 
            if data.get("Status") != "Success":
                raise ValueError(
                    data.get("Details", "Failed to send OTP")
                )
 
            cache.set(
                f"otp_session_{phone}",
                data["Details"],
                timeout=300
            )
 
            cache.set(
                f"otp_attempts_{phone}",
                attempts + 1,
                timeout=600
            )
 
            return {
                "message": "OTP sent successfully"
            }
 
        except Exception as e:
            raise e
   
    @staticmethod
    def verify_otp(phone, otp, role):
 
        phone = str(phone)[-10:]
 
        if not phone or not otp:
            raise ValueError("Phone and OTP are required")
        system_settings = SystemSettings.objects.first()

        is_demo_number = (
            system_settings
            and system_settings.demo_mode_enabled
            and phone in system_settings.demo_mobile_numbers
        )
 

        if is_demo_number:
            if str(otp) != "2121":
                raise ValueError("Invalid OTP")
        else:
            session_id = cache.get(f"otp_session_{phone}")

            if not session_id:
                raise ValueError("OTP expired or not found")

            url = (
                f"https://2factor.in/API/V1/"
                f"{settings.TWO_FACTOR_API_KEY}/SMS/VERIFY/"
                f"{session_id}/{otp}"
            )

            response = requests.get(url, timeout=10)
            data = response.json()

            if data.get("Status") != "Success":
                raise ValueError("Invalid OTP")

            cache.delete(f"otp_session_{phone}")
            cache.delete(f"otp_attempts_{phone}")
 
        # OWNER LOGIN
        if role == "owner":
 
            owner = CommonService.get_owner(phone)
 
            if owner:
                token = generate_jwt_token(
                    user_id=owner.pk,
                    role="owner",
                    phone=owner.phone
                )
 
                return {
                    "verified": True,
                    "exists": True,
                    "role": "owner",
                    "status": owner.status,
                    "token": token,
                    "user": {
                        "id": owner.pk,
                        "name": owner.name,
                        "phone": owner.phone
                    }
                }
 
            return {
                "verified": True,
                "exists": False
            }
 
        # TENANT LOGIN
        elif role == "tenant":
 
            tenant = CommonService.get_tenant(phone)
 
            if tenant:
                token = generate_jwt_token(
                    user_id=tenant.id,
                    role="tenant",
                    phone=tenant.phone
                )
 
                return {
                    "verified": True,
                    "exists": True,
                    "role": "tenant",
                    "token": token,
                    "user": {
                        "id": tenant.id,
                        "name": tenant.name,
                        "phone": tenant.phone
                    }
                }
 
            return {
                "verified": True,
                "exists": False
            }
 
        raise ValueError("Invalid role")

<<<<<<< Updated upstream
    ADMIN_PHONES = ["6281808454", "9347074726"]
    ADMIN_PHONE = "9347074726"

    @classmethod
    def is_admin_phone(cls, phone):
        if not phone:
            return False
        clean_phone = str(phone).strip()
        if clean_phone in cls.ADMIN_PHONES:
            return True
        return AdminPassword.objects.filter(phone=clean_phone).exists()
=======
    ADMIN_PHONE = "8919326265"
>>>>>>> Stashed changes

    # ⏰ PASSWORD EXPIRY DURATION
    # For TESTING: timedelta(minutes=2)
    # For PRODUCTION (1 month): timedelta(days=30)
    PASSWORD_EXPIRY_DURATION = timedelta(days=30)

    @staticmethod
    def send_admin_otp(phone):

        if not AuthService.is_admin_phone(phone):
            raise ValueError(
                "Please enter a valid number to access the admin panel"
            )

        url = (
            f"https://2factor.in/API/V1/"
            f"{settings.TWO_FACTOR_API_KEY}/SMS/"
            f"{phone}/AUTOGEN/AdminOTP"
        )

        response = requests.get(url, timeout=15)
        data = response.json()

        if data.get("Status") != "Success":
            raise ValueError("Failed to send OTP")

        cache.set(
            f"admin_session_{phone}",
            data["Details"],
            timeout=300
        )

        return {
            "message": "OTP sent successfully"
        }

    @staticmethod
    def verify_admin_otp(phone, otp):

        if not AuthService.is_admin_phone(phone):
            raise ValueError("Unauthorized access")

        session_id = cache.get(f"admin_session_{phone}")

        if not session_id:
            raise ValueError("OTP expired")

        url = (
            f"https://2factor.in/API/V1/"
            f"{settings.TWO_FACTOR_API_KEY}/SMS/VERIFY/"
            f"{session_id}/{otp}"
        )

        response = requests.get(url, timeout=15)
        data = response.json()

        if data.get("Status") != "Success":
            raise ValueError("Invalid OTP")

        cache.delete(f"admin_session_{phone}")

        admin_password = AdminPassword.objects.filter(
            phone=phone
        ).first()

        if admin_password:

            expiry_time = (
                admin_password.created_at +
                # timedelta(days=30)
                AuthService.PASSWORD_EXPIRY_DURATION
            )

            if timezone.now() < expiry_time:
                return {
                    "status": "existing_password",
                    "message": "Enter existing password"
                }

            admin_password.delete()

        return {
            "status": "create_password",
            "message": "Create a new password"
        }

    def forgot_admin_password(phone):
        if not AuthService.is_admin_phone(phone):
            raise ValueError("Unauthorized access")
 
        AdminPassword.objects.filter(
            phone=phone
        ).delete()
 
        return AuthService.send_admin_otp(phone)
    @staticmethod
    def admin_password_login(phone, password, action):

        if not AuthService.is_admin_phone(phone):
            raise ValueError("Unauthorized access")

        if action == "create":

            AdminPassword.objects.filter(
                phone=phone
            ).delete()

            AdminPassword.objects.create(
                phone=phone,
                password=password
            )

            token = generate_jwt_token(
                user_id=1,
                role="admin",
                phone=phone
            )

            return {
                "message": "Password created successfully",
                "token": token
            }

        elif action == "login":

            admin = AdminPassword.objects.filter(
                phone=phone,
                password=password
            ).first()

            if not admin:
                raise ValueError("Invalid password")

            expiry_time = (
                admin.created_at +
                # timedelta(days=30)
                AuthService.PASSWORD_EXPIRY_DURATION
            )

            if timezone.now() > expiry_time:
                admin.delete()
                raise ValueError(
                    "Password expired. Create a new password."
                )

            token = generate_jwt_token(
                user_id=1,
                role="admin",
                phone=phone
            )

            return {
                "message": "Login successful",
                "token": token
            }

        raise ValueError("Invalid action")

    @staticmethod
    def check_admin_password_status(phone):

        if not AuthService.is_admin_phone(phone):
            raise ValueError("Unauthorized access")

        admin = AdminPassword.objects.filter(
            phone=phone
        ).first()

        if not admin:
            return {
                "status": "expired"
            }

        expiry_time = (
            admin.created_at +
            # timedelta(days=30)
            AuthService.PASSWORD_EXPIRY_DURATION
        )

        if timezone.now() > expiry_time:
            admin.delete()
            return {
                "status": "expired"
            }

        return {
            "status": "valid"
        }
   
