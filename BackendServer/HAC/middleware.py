from httpx import request
import jwt
from django.conf import settings
from django.http import JsonResponse
from HAC.models import Owners

class OwnerAccountMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get('Authorization')
        account_id = request.headers.get('X-Owner-Account-ID')
        
        request.owner_account = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                # We decode using django secret key, without verification (letting jwt_required decorator do validation)
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                role = payload.get('role')
                phone = payload.get('phone')

                if role == 'owner' and phone:
                    if account_id:
                        account_id = account_id.strip()
                        if account_id and account_id != 'null' and account_id != 'undefined':
                            account = Owners.objects.filter(pk=account_id).first()
                            if account:
                                if account.phone == phone:
                                    request.owner_account = account
                                else:
                                    return JsonResponse(
                                        {'error': 'Unauthorized account access. Account does not match authenticated phone.'},
                                        status=403
                                    )
                    
                    if not request.owner_account:
                        user_id = payload.get('user_id')
                        if user_id:
                            request.owner_account = Owners.objects.filter(pk=user_id).first()
                        if not request.owner_account:
                            default_account = Owners.objects.filter(phone=phone).order_by('created_at').first()
                            request.owner_account = default_account
            except Exception:
                pass

        response = self.get_response(request)
        return response




from django.http import JsonResponse
from .models import SystemSettings


class MaintenanceMiddleware:
    """
    Middleware to enforce application maintenance modes.

    Modes:
        NORMAL             -> Allow all requests.
        READ_ONLY          -> Allow only GET, HEAD, OPTIONS requests.
        FULL_MAINTENANCE   -> Block all requests except admin.
    """

    ALLOWED_METHODS = ["GET", "HEAD", "OPTIONS"]
    EXCLUDED_PATHS = {
    "/admin/",
    "/api/system/status/",

    # Admin Authentication
    "/api/send-admin-otp/",
    "/api/verify-admin-otp/",
    "/api/admin-password/",
    "/api/check-admin-password-status/",
    "/api/admin-login/",

    # Tenant Login
    "/api/login/",
    "/api/send-otp/",
    "/api/verify-otp/",
    "/api/check-user/",

    # Owner Login
    "/api/verify/",
    "/api/check-owner/",
    "/api/check-owner-status/",

    # JWT
    "/api/token/",
    "/api/token/refresh/",

    # Push Notifications
    "/api/save-push-token/",
    "/api/admin/system-settings/",

    # Admin Panel
    "/api/admin_home/",
    "/api/owner-profile-update/",
    "/api/owner-admin/",
    "/api/all-owners-data/",
    "/api/update_status/",
    "/api/suspension_reason/",
    "/api/get_suspension_reason/",
    "/api/owner-status/",
    "/api/owner_data/",
    "/api/get_all_property_basic_details/",
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        try:
            # Allow Django Admin
            if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
                return self.get_response(request)

            # Fetch system settings
            system_settings = SystemSettings.objects.first()

            # If settings are not configured, allow all requests
            if not system_settings:
                return self.get_response(request)

            maintenance_mode = system_settings.maintenance_mode

            # ---------------- NORMAL ----------------
            if maintenance_mode == SystemSettings.NORMAL:
                return self.get_response(request)

            # ---------------- REGISTRATION BLOCKING ----------------
            if request.path in ["/api/tenent/", "/api/owner/"] and request.method == "POST":
                if maintenance_mode in [SystemSettings.READ_ONLY, SystemSettings.FULL_MAINTENANCE]:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "New registrations are currently disabled due to system maintenance. Please try again later."
                        },
                        status=403
                    )

            # ---------------- READ ONLY ----------------
            if maintenance_mode == SystemSettings.READ_ONLY:

                if request.method in self.ALLOWED_METHODS:
                    return self.get_response(request)

                return JsonResponse(
                    {
                        "success": False,
                        "maintenance_mode": maintenance_mode,
                        "message": (
                            system_settings.maintenance_message
                            or "The system is currently in read-only maintenance mode."
                        ),
                        "estimated_completion": system_settings.estimated_completion,
                    },
                    status=503,
                )

            # ---------------- FULL MAINTENANCE ----------------
            if maintenance_mode == SystemSettings.FULL_MAINTENANCE:
                return JsonResponse(
                    {
                        "success": False,
                        "maintenance_mode": maintenance_mode,
                        "message": (
                            system_settings.maintenance_message
                            or "The system is currently under maintenance."
                        ),
                        "estimated_completion": system_settings.estimated_completion,
                    },
                    status=503,
                )

            # Unknown mode - allow request
            return self.get_response(request)

        except Exception as e:
            print(f"MaintenanceMiddleware Error: {e}")

            # Never block the application because of middleware failure.
            return self.get_response(request)