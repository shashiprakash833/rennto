from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse, HttpResponse
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.cache import cache
import os
from BMS import settings
from HAC.jwt_utils import jwt_required

from HAC.services.auth_service import AuthService
from HAC.services.dashboard_service import DashboardService
from HAC.services.owner_service import OwnerService, OwnerRegistrationService
from HAC.services.property_service import PropertyService
from HAC.services.layout_service import LayoutService
from HAC.services.tenant_service import TenantService
from HAC.services.bed_service import BedService
from HAC.services.request_service import RequestService
from HAC.services.payment_service import PaymentService
from HAC.services.issue_service import IssueService
from HAC.services.notification_service import NotificationService
from HAC.services.expense_service import ExpenseService
from HAC.services.existing_tenant_service import ExistingTenantService
from HAC.services.vacate_service import VacateService

# =====================================================================
# DASHBOARD / HOME ENDPOINTS
# =====================================================================

@api_view(['GET'])
@jwt_required()
def admin_home(request):
    try:
        # Check if logged in user is owner
        role = request.jwt_payload.get('role')
        if role == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if owner_obj:
                data = DashboardService.get_owner_dashboard_summary(owner_obj)
                return Response({"data": data}, status=status.HTTP_200_OK)
        data = DashboardService.get_dashboard_summary()
        return Response({"data": data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_all_steps_data(request):
    try:
        result = DashboardService.get_all_steps_data()
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def owner_admin_list(request):
    try:
        data = DashboardService.get_owner_admin_list()
        return Response({"count": len(data), "data": data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_owner_accounts(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.phone != phone and owner_obj.owner_id != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = DashboardService.get_owner_accounts(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# AUTHENTICATION / SIGNUP / LOGIN ENDPOINTS
# =====================================================================

@api_view(["POST"])
@transaction.atomic
def register_owner(request):
    try:
        result = OwnerRegistrationService.register(request)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": "Something went wrong", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def register_tenent(request):
    try:
        result = AuthService.register_tenant(request.data)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response({"message": "Validation Error", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"message": "Validation Error", "errors": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def save_push_token(request):
    try:
        result = AuthService.save_push_token(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        if "User not found" in str(e):
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def tenant_login(request):
    try:
        result = AuthService.tenant_login(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        if isinstance(errors, dict):
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        if "phone not registered" in str(e):
            return Response({"error": "phone not registered"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def owner_login(request):
    try:
        result = AuthService.owner_login(request.data)
        if "error" in result:
            status_code = result.get("status", 400)
            return Response({
                "error": result["error"],
                "status": result.get("owner_status"),
                "message": result.get("message")
            }, status=status_code)
        return Response({
            "message": result["message"],
            "token": result["token"]
        }, status=status.HTTP_200_OK)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        if isinstance(errors, dict):
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        if "Owner not found" in str(e):
            return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def admin_login(request):
    try:
        result = AuthService.admin_login(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)









@api_view(['GET'])
def check_user(request, phone):
    try:
        result = AuthService.check_user(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def check_owner(request, phone):
    try:
        result = AuthService.check_owner(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# PROPERTY MANAGEMENT ENDPOINTS
# =====================================================================

@api_view(['GET'])
@jwt_required()
def get_all_property_basic_details(request):
    try:
        data = PropertyService.get_all_property_basic_details()
        return Response({"data": data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_payment_details(request, phone):
    try:
        data = PropertyService.get_payment_details(phone)
        if not data:
            return Response({"error": "No payment details found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_hostel_step3(request, phone):
    try:
        if hasattr(request, 'owner_account') and request.owner_account:
            phone = request.owner_account.owner_id
            
        result = PropertyService.get_hostel_step3(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_properties_listing(request):
    try:
        result = PropertyService.get_properties_listing(request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@jwt_required()
@parser_classes([MultiPartParser, FormParser])
def manage_property_images(request):
    try:
        if request.jwt_payload.get('role') != 'owner':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        owner_obj = getattr(request, 'owner_account', None) or request.custom_user
        if not owner_obj:
            return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
            
        result = PropertyService.manage_property_images(request, owner_obj)
        status_code = result.get('status', 200)
        return Response(result, status=status_code)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@jwt_required()
def update_building_layout(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = owner_obj.owner_id
        result = LayoutService.update_building_layout(phone, request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Owner not found" in str(e):
            return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# OWNER ENDPOINTS
# =====================================================================

@api_view(['POST'])
@jwt_required()
def suspension_reason(request):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            phone = request.data.get("phone")
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = OwnerService.save_suspension_reason(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        if "Owner not found" in str(e) or "DoesNotExist" in type(e).__name__:
            return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@jwt_required()
def get_suspension_reason(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = owner_obj.owner_id
        if request.method == "DELETE":
            result = OwnerService.clear_suspension_record(phone)
            return Response(result, status=status.HTTP_200_OK)
        result = OwnerService.get_suspension_reason(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Owner not found" in str(e) or "DoesNotExist" in type(e).__name__:
            return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'POST'])
@jwt_required()
@parser_classes([MultiPartParser, FormParser])
def owner_profile_update(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (str(getattr(owner_obj, 'owner_id', '')) != str(phone) and str(getattr(owner_obj, 'phone', '')) != str(phone)):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = str(getattr(owner_obj, 'owner_id', phone))
        result = OwnerService.owner_profile_update(phone, request.data, request.FILES, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Owner not found" in str(e):
            return Response({"message": f"Owner with ID/Phone {phone} not found", "error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
        if "Phone already exists" in str(e):
            return Response({"message": "This phone number is already registered with another account.", "error": "Phone already exists"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": f"Update failed: {str(e)}", "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
 
 
@api_view(['GET'])
@jwt_required()
def get_owner_full_details(request, pk):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (str(getattr(owner_obj, 'owner_id', '')) != str(pk) and str(getattr(owner_obj, 'phone', '')) != str(pk) and str(owner_obj.pk) != str(pk)):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_pk = pk
        else:
            # If not an owner, we need to resolve the pk if it was passed as phone
            target_pk = pk
            try:
                if not str(pk).isdigit() or len(str(pk)) >= 10:
                    from HAC.models import Owners
                    from django.db.models import Q
                    owner_record = Owners.objects.filter(Q(owner_id=pk) | Q(phone=pk)).first()
                    if owner_record:
                        target_pk = owner_record.pk
            except Exception:
                pass
        result = OwnerService.get_owner_full_details(target_pk, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
 
 
@api_view(['PATCH'])
@jwt_required()
def update_owner_status(request, pk):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or owner_obj.pk != pk:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_pk = owner_obj.pk
        else:
            target_pk = pk
        result = OwnerService.update_owner_status_by_pk(target_pk, request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Owner not found" in str(e):
            return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@jwt_required()
def check_owner_status(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = owner_obj.owner_id
        result = OwnerService.check_owner_status(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Owner not found"}, status=status.HTTP_404_NOT_FOUND)


# =====================================================================
# BEDS / TENANT ASSIGNMENT ENDPOINTS
# =====================================================================

@api_view(['POST'])
@jwt_required()
def registerbeds(request):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            phone = request.data.get('owner_phone')
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)

        result = BedService.register_beds(request.data, request.FILES)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@jwt_required()
def registerapartmentbeds(request):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            phone = request.data.get('owner_phone')
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)

        result = BedService.register_apartment_beds(request.data, request.FILES)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@jwt_required()
def registercommercialbeds(request):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            phone = request.data.get('owner_phone')
            if not owner_obj or owner_obj.owner_id != phone:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.register_commercial_beds(request.data, request.FILES)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@jwt_required()
def get_tenantsbeds(request, phone):
    try:
        if hasattr(request, 'owner_account') and request.owner_account:
            phone = request.owner_account.owner_id
            
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = owner_obj.owner_id
        data = BedService.get_tenants_beds(phone, request)
        return Response({
            "message": "Tenants fetched successfully",
            "data": data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@jwt_required()
def get_apartmentbeds(request, phone):
    try:
        if hasattr(request, 'owner_account') and request.owner_account:
            phone = request.owner_account.owner_id
            
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = owner_obj.owner_id
        data = BedService.get_apartment_beds(phone, request)
        return Response({
            "message": "Tenants fetched successfully",
            "data": data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@jwt_required()
def get_commercialbeds(request, phone):
    try:
        if hasattr(request, 'owner_account') and request.owner_account:
            phone = request.owner_account.owner_id
            
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            phone = owner_obj.owner_id
        data = BedService.get_commercial_beds(phone, request)
        return Response({
            "message": "Tenants fetched successfully",
            "data": data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@jwt_required()
def delete_hostel_tenant(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import TenantBeds
            tenant_bed = TenantBeds.objects.filter(id=id).first()
            if tenant_bed:
                if not owner_obj or (tenant_bed.owner != owner_obj and tenant_bed.owner_phone != owner_obj.owner_id):
                    return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.delete_hostel_tenant(id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@jwt_required()
def delete_apartment_tenant(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import ApartmentTenantBeds
            tenant_bed = ApartmentTenantBeds.objects.filter(id=id).first()
            if tenant_bed:
                if not owner_obj or (tenant_bed.owner != owner_obj and tenant_bed.owner_phone != owner_obj.owner_id):
                    return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.delete_apartment_tenant(id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@jwt_required()
def delete_commercial_tenant(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import CommercialTenantBeds
            tenant_bed = CommercialTenantBeds.objects.filter(id=id).first()
            if tenant_bed:
                if not owner_obj or (tenant_bed.owner != owner_obj and tenant_bed.owner_phone != owner_obj.owner_id):
                    return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.delete_commercial_tenant(id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@jwt_required()
def update_hostel_tenant(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import TenantBeds
            tenant_bed = TenantBeds.objects.filter(id=id).first()
            if tenant_bed:
                if not owner_obj or (tenant_bed.owner != owner_obj and tenant_bed.owner_phone != owner_obj.owner_id):
                    return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.update_hostel_tenant(id, request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@jwt_required()
def update_apartment_tenant(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import ApartmentTenantBeds
            tenant_bed = ApartmentTenantBeds.objects.filter(id=id).first()
            if tenant_bed:
                if not owner_obj or (tenant_bed.owner != owner_obj and tenant_bed.owner_phone != owner_obj.owner_id):
                    return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.update_apartment_tenant(id, request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@jwt_required()
def update_commercial_tenant(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import CommercialTenantBeds
            tenant_bed = CommercialTenantBeds.objects.filter(id=id).first()
            if tenant_bed:
                if not owner_obj or (tenant_bed.owner != owner_obj and tenant_bed.owner_phone != owner_obj.owner_id):
                    return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = BedService.update_commercial_tenant(id, request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        errors = e.args[0] if e.args else str(e)
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# TENANT MANAGEMENT ENDPOINTS
# =====================================================================

@api_view(['GET'])
@jwt_required()
def tenantdetails(request, phone):
    try:
        result = TenantService.get_tenant_details(phone, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'POST'])
@jwt_required()
@parser_classes([MultiPartParser, FormParser])
def tenant_profile_update(request, phone):
    try:
        result = TenantService.tenant_profile_update(phone, request.data, request.FILES)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Tenant not found" in str(e):
            return Response({"error": "Tenant not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@jwt_required()
def update_status(request):
    try:
        result = TenantService.update_status(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@jwt_required()
def tenant_by_phone(request, phone):
    try:
        result = TenantService.get_tenant_by_phone(phone, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Tenant not found" in str(e):
            return Response({"error": "Tenant not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@jwt_required()
def get_owner_tenants(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or owner_obj.owner_id != phone:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_phone = owner_obj.owner_id
        else:
            target_phone = phone
        data = TenantService.get_owner_tenants(target_phone)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_co_residents(request, phone):
    try:
        result = TenantService.get_co_residents(phone)
        return Response({"co_residents": result}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def tenant_submit_verification(request):
    try:
        result = TenantService.tenant_submit_verification(request.data, request.FILES)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def block_tenant(request):
    try:
        result = TenantService.block_tenant(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def unblock_tenant(request):
    try:
        result = TenantService.unblock_tenant(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# JOIN REQUESTS ENDPOINTS
# =====================================================================

@api_view(['POST'])
@jwt_required()
def send_join_request(request):
    try:
        result = RequestService.send_join_request(request.data)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def owner_requests(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (str(getattr(owner_obj, 'owner_id', '')) != str(phone) and str(getattr(owner_obj, 'phone', '')) != str(phone)):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_phone = str(getattr(owner_obj, 'owner_id', phone))
        else:
            target_phone = phone
        result = RequestService.owner_requests(target_phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        return Response({"error": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@jwt_required()
def clear_owner_request(request, request_id):
    """Delete a completed (accepted/rejected) request from the backend."""
    try:
        from HAC.models import JoinRequest, ExistingTenantRequest
        req_type = request.GET.get('type', 'join')
        owner_obj = getattr(request, 'owner_account', None) or request.custom_user

        if req_type == 'existing':
            obj = ExistingTenantRequest.objects.filter(id=request_id).first()
        else:
            obj = JoinRequest.objects.filter(id=request_id).first()

        if not obj:
            return Response({"message": "Request not found or already deleted."}, status=status.HTTP_200_OK)

        # Only delete completed requests
        if obj.status not in ['accepted', 'rejected']:
            return Response({"error": "Only accepted/rejected requests can be deleted."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            obj_owner = getattr(obj, 'owner', None)
            if obj_owner and owner_obj and str(obj_owner.owner_id) != str(getattr(owner_obj, 'owner_id', '')):
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        obj.delete()
        return Response({"message": "Request cleared."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def update_request_status(request):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            request_id = request.data.get("id")
            is_existing = request.data.get("is_existing_tenant", None)
 
            from HAC.models import JoinRequest, ExistingTenantRequest
 
            # Look up the ID in the correct model to avoid collision check problems
            join_req = None
            existing_req = None
 
            if is_existing is True:
                existing_req = ExistingTenantRequest.objects.filter(id=request_id).first()
            elif is_existing is False:
                join_req = JoinRequest.objects.filter(id=request_id).first()
            else:
                # Fallback if client doesn't send the flag
                join_req = JoinRequest.objects.filter(id=request_id).first()
                existing_req = ExistingTenantRequest.objects.filter(id=request_id).first()
 
            # Allow if the owner matches in at least one model
            owner_match = False
            owner_phone = getattr(owner_obj, 'phone', None)
            if existing_req and (existing_req.owner == owner_obj or (existing_req.owner and existing_req.owner.phone == owner_phone)):
                owner_match = True
            if join_req and (join_req.owner == owner_obj or (join_req.owner and join_req.owner.phone == owner_phone)):
                owner_match = True
            if str(request_id).startswith('hc_') or request.data.get('is_hostel_change'):
                owner_match = True

            # Deny only if ID was found but doesn't belong to this owner in any model
            if (join_req or existing_req) and not owner_match:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
 
        result = RequestService.update_request_status(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@jwt_required()
def tenant_notifications(request, identifier):
    try:
        result = RequestService.tenant_notifications(identifier)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def check_request_status(request, tenant_phone, owner_phone, property_name):
    try:
        result = RequestService.check_request_status(tenant_phone, owner_phone, property_name)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def withdraw_request(request):
    try:
        result = RequestService.withdraw_request(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def tenant_join_booking(request):
    """
    Called by the tenant to confirm their allotment.
    Transitions JoinRequest: pending_confirmation → joined
    Creates TenantBeds record and sets tenant.is_vacant = False.
    """
    try:
        result = BedService.tenant_join_booking(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# EXISTING TENANT REQUESTS ENDPOINT
# =====================================================================

@api_view(['POST'])
@jwt_required()
def existing_tenant_request(request):
    """
    POST /api/existing_tenant_request/
    Called when an existing tenant selects a specific room/bed/unit
    and sends a request to the owner.
    """
    try:
        result = ExistingTenantService.create_request(request.data)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_pending_allotment(request, phone):
    """
    Returns the pending allotment details for a tenant (status=pending_confirmation).
    Used by the tenant app to show room/bed/rent info before they click 'Join'.
    """
    try:
        from HAC.models import JoinRequest, Tenent
        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            return Response({"error": "Tenant not found"}, status=status.HTTP_404_NOT_FOUND)

        join_req = JoinRequest.objects.filter(
            tenant=tenant,
            status='pending_confirmation'
        ).order_by('-created_at').first()

        if not join_req:
            return Response({"pending_allotment": None}, status=status.HTTP_200_OK)

        return Response({
            "pending_allotment": {
                "request_id": join_req.id,
                "property_name": join_req.property_name,
                "property_type": join_req.property_type,
                "owner_name": join_req.owner.name if join_req.owner else None,
                "owner_phone": join_req.owner.phone if join_req.owner else None,
                "bed": join_req.allotted_bed,
                "floor": join_req.allotted_floor,
                "room_no": join_req.allotted_roomno,
                "flat_no": join_req.allotted_flatno,
                "section_no": join_req.allotted_sectionno,
                "rent": str(join_req.allotted_rent) if join_req.allotted_rent else None,
                "check_in": str(join_req.allotted_check_in) if join_req.allotted_check_in else None,
                "check_out": str(join_req.allotted_check_out) if join_req.allotted_check_out else None,
                "status": join_req.status,
                "created_at": join_req.created_at,
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@jwt_required()
def delete_tenent_request(request, phone):
    try:
        result = RequestService.delete_tenent_request(phone)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# PAYMENT ENDPOINTS
# =====================================================================

@api_view(['GET'])
@jwt_required()
def get_tenant_payment_details(request, phone):
    try:
        result = PropertyService.get_payment_details(phone, request)
        if not result:
            return Response({"error": "No payment details found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def create_payment(request):
    try:
        result = PaymentService.create_payment(request.data)
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def check_payment_status(request, txn_ref):
    try:
        result = PaymentService.check_payment_status(txn_ref)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@jwt_required()
def update_payment_status(request):
    try:
        result = PaymentService.update_payment_status(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_owner_payments(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_phone = owner_obj.owner_id
        else:
            target_phone = phone
        result = PaymentService.get_owner_payments(target_phone, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def upload_payment_screenshot(request):
    try:
        result = PaymentService.upload_payment_screenshot(request.data, request.FILES, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
# @jwt_required()
def cash_payment(request):
    try:
        result = PaymentService.cash_payment(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        with open('cash_error.log', 'w') as f:
            f.write(traceback.format_exc())
        return Response({"error": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_tenant_payment_history(request, phone):
    try:
        result = PaymentService.get_tenant_payment_history(phone, request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# NOTIFICATION ENDPOINTS
# =====================================================================

@api_view(['POST'])
@jwt_required()
def send_owner_notification(request):
    try:
        result = NotificationService.send_owner_notification(request.data)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def send_tenant_notification(request):
    # Extract possible input fields
    tenant_phone = request.data.get('tenantPhone') or request.data.get('tenant_phone') or request.data.get('phone') or getattr(request, 'jwt_payload', {}).get('phone')
    title = request.data.get('title')
    message = request.data.get('message') or request.data.get('body')

    # Create the notification record (nullable tenant_phone handled in model)
    from .models import TenantNotification
    notification = TenantNotification.objects.create(
        tenant_phone=tenant_phone,
        title=title,
        message=message or "",
    )
    print(f"BACKEND: CREATE NOTIFICATION: Tenant ({tenant_phone}) => '{title}'")

    # ---------- WebSocket broadcast ----------
    try:
        channel_layer = get_channel_layer()
        # Match the same sanitization used in TenantNotificationConsumer.connect()
        sanitized_phone = tenant_phone.replace("+", "").replace("@", "_").replace(".", "_") if tenant_phone else ""
        if channel_layer and sanitized_phone:
            ws_content = {
                "id": notification.id,
                "type": "MESSAGE",
                "title": title,
                "message": message,
                "created_at": notification.created_at.isoformat(),
                "is_read": notification.is_read,
            }
            # Broadcast to both consumer groups so the tenant receives it regardless of which WS path is connected
            for group_name in [
                f"tenant_notifications_{sanitized_phone}",
                f"user_notifications_{sanitized_phone}",
            ]:
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        "type": "send_notification",
                        "content": ws_content,
                    },
                )
    except Exception as ws_err:
        pass

    # ---------- Firebase / Expo push ----------
    try:
        from .push_notifications import send_push_notification
        if tenant_phone:
            send_push_notification(tenant_phone, title, message)
    except Exception as push_err:
        pass

    return Response({
        "success": True,
        "message": "Notification sent successfully.",
        "id": notification.id,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@jwt_required()
def get_unread_notification_count(request):
    try:
        role = request.query_params.get('role') or request.jwt_payload.get('role')
        phone = request.query_params.get('phone') or request.jwt_payload.get('phone')
        if role == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if owner_obj and getattr(owner_obj, 'owner_id', None):
                phone = owner_obj.owner_id
        result = NotificationService.get_unread_count(phone, role=role)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_notifications(request, phone):
    try:
        role = request.query_params.get('role') or request.jwt_payload.get('role')
        if role == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if owner_obj and getattr(owner_obj, 'owner_id', None):
                phone = owner_obj.owner_id
        result = NotificationService.get_notifications(phone, role=role)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()  # Note: The route in urls.py is path('notifications/<int:notification_id>/read/', views.mark_notification_read)
def mark_notification_read(request, notification_id):
    try:
        result = NotificationService.mark_notification_read(notification_id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def mark_all_notifications_read(request, phone):
    try:
        role = request.query_params.get('role') or (request.data.get('role') if hasattr(request.data, 'get') else None) or request.jwt_payload.get('role')
        if role == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if owner_obj and getattr(owner_obj, 'owner_id', None):
                phone = owner_obj.owner_id
        result = NotificationService.mark_all_notifications_read(phone, role=role)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# EXPENSE MANAGEMENT ENDPOINTS
# =====================================================================

@api_view(['GET'])
@jwt_required()
def get_owner_expenses(request, owner_id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != owner_id and owner_obj.phone != owner_id):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_owner_id = owner_obj.owner_id
        else:
            target_owner_id = owner_id
        result = ExpenseService.get_expenses(target_owner_id)
        return Response({"expenses": result, "data": result}, status=status.HTTP_200_OK)
    except Exception as e:
        if "Owner not found" in str(e):
            return Response({"error": "Owner not found"}, status=404)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def add_expense(request):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            owner_id = owner_obj.owner_id
        else:
            owner_id = request.data.get('owner_id') or request.data.get('owner_phone') or request.data.get('owner_email')
        result = ExpenseService.create_expense(owner_id, request.data, request.FILES)
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        if "Owner not found" in str(e):
            return Response({"error": f"Owner not found for owner_id: {owner_id}"}, status=404)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@jwt_required()
def update_expense(request, expense_id):
    try:
        owner_id = None
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            owner_id = owner_obj.owner_id
        result = ExpenseService.update_expense(expense_id, owner_id, request.data, request.FILES)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Expense not found" in str(e):
            return Response({"error": "Expense not found"}, status=status.HTTP_404_NOT_FOUND)
        if "permission" in str(e).lower():
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
 
@api_view(['DELETE'])
@jwt_required()
def delete_expense(request, expense_id):
    try:
        owner_id = None
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            owner_id = owner_obj.owner_id
        result = ExpenseService.delete_expense(expense_id, owner_id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Expense not found" in str(e):
            return Response({"error": "Expense not found"}, status=status.HTTP_404_NOT_FOUND)
        if "permission" in str(e).lower():
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =====================================================================
# ISSUE / COMPLAINTS ENDPOINTS
# =====================================================================

@api_view(['POST'])
@jwt_required()
def create_issue(request):
    try:
        result = IssueService.create_issue(request.data, request.FILES)
        return Response(result, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        if "Tenant not found" in str(e) or "Owner not found" in str(e):
            return Response({"error": str(e)}, status=404)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def tenant_issues(request, identifier):
    try:
        result = IssueService.tenant_issues(identifier)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def owner_issues(request, phone):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            if not owner_obj or (owner_obj.owner_id != phone and owner_obj.phone != phone):
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
            target_phone = owner_obj.owner_id
        else:
            target_phone = phone
        search_query = request.GET.get('search')
        result = IssueService.owner_issues(target_phone, search_query=search_query, request=request)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@jwt_required()
def update_issue_status(request, issue_id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import Issue
            issue = Issue.objects.filter(id=issue_id).first()
            if issue and issue.owner != owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = IssueService.update_issue_status(issue_id, request.data.get('status'))
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@jwt_required()
def update_issue_comment(request, issue_id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import Issue
            issue = Issue.objects.filter(id=issue_id).first()
            if issue and issue.owner != owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        comment = request.data.get('owner_comment') or request.data.get('comment')
        result = IssueService.update_issue_comment(issue_id, comment)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def test_create_issue(request):
    try:
        result = IssueService.test_create_issue(request.data)
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@jwt_required()
def delete_issue(request, issue_id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import Issue
            issue = Issue.objects.filter(id=issue_id).first()
            if issue and issue.owner != owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = IssueService.delete_issue(issue_id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Issue not found" in str(e):
            return Response({"error": "Issue not found"}, status=404)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@jwt_required()
def update_issue(request, id):
    try:
        # Enforce owner isolation
        if request.jwt_payload.get('role') == 'owner':
            owner_obj = getattr(request, 'owner_account', None) or request.custom_user
            from HAC.models import Issue
            issue = Issue.objects.filter(id=id).first()
            if issue and issue.owner != owner_obj:
                return Response({"error": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        result = IssueService.update_issue(id, request.data, request.FILES)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        if "Issue not found" in str(e):
            return Response({"error": "Issue not found"}, status=404)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def send_otp(request):
    try:
        phone = request.data.get("phone")
 
        result = AuthService.send_otp(phone)
 
        return Response(result, status=status.HTTP_200_OK)
 
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['POST'])
def verify_otp(request):
    try:
        phone = request.data.get("phone")
        otp = request.data.get("otp")
        role = request.data.get("role")
 
        result = AuthService.verify_otp(phone, otp, role)
 
        return Response(
            result,
            status=status.HTTP_200_OK
        )
 
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services.auth_service import AuthService

@api_view(["POST"])
def send_admin_otp(request):
    try:
        data = AuthService.send_admin_otp(request.data.get("phone"))
        return Response(data, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST"])
def verify_admin_otp(request):
    try:
        data = AuthService.verify_admin_otp(
            request.data.get("phone"),
            request.data.get("otp")
        )
        return Response(data, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST"])
def admin_password_login(request):
    try:
        data = AuthService.admin_password_login(
            request.data.get("phone"),
            request.data.get("password"),
            request.data.get("action")
        )
        return Response(data, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST"])
def check_admin_password_status(request):
    try:
        data = AuthService.check_admin_password_status(
            request.data.get("phone")
        )
        return Response(data, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)


@api_view(["POST"])
def forgot_admin_password(request):
    try:
        data = AuthService.forgot_admin_password(
            request.data.get("phone")
        )
        return Response(data, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
# =====================================================================
# BUILDING LAYOUT MANAGEMENT ENDPOINTS
# =====================================================================

from HAC.models import Property, Owners, StayHostelDetails, ApartmentStayDetails, CommericialDetails, HostelFloorRoom, ApartmentFloorUnit, CommercialFloor
from HAC.serializers import PropertySerializer

def get_or_create_property_for_account(owner):
    """
    Helper function to find a property by owner_account. If not found,
    checks for any legacy stay details records to determine property type and
    build layout, creating a new Property record linked to the owner.
    """
    if not owner:
        return None

    # Try finding the Property
    prop = Property.objects.filter(owner_account=owner).first()
    if prop:
        return prop

    # Determine property type and build layout from legacy tables if they exist
    property_type = None
    layout = []

    hostel = StayHostelDetails.objects.filter(owner=owner).first()
    apartment = ApartmentStayDetails.objects.filter(owner=owner).first()
    commercial = CommericialDetails.objects.filter(owner=owner).first()

    if hostel:
        property_type = 'hostel'
        floors = HostelFloorRoom.objects.filter(hostel=hostel).order_by('floor', 'roomNo')
        layout_dict = {}
        for room in floors:
            floor_no = room.floor
            if floor_no not in layout_dict:
                layout_dict[floor_no] = []
            layout_dict[floor_no].append({"roomNo": room.roomNo, "beds": room.sharing})
        layout = [{"floorNo": fn, "rooms": rooms} for fn, rooms in layout_dict.items()]

    elif apartment:
        property_type = 'apartment'
        floors = ApartmentFloorUnit.objects.filter(apartment=apartment).order_by('floor', 'flatNo')
        layout_dict = {}
        for flat in floors:
            floor_no = flat.floor
            if floor_no not in layout_dict:
                layout_dict[floor_no] = []
            layout_dict[floor_no].append({"flatNo": flat.flatNo, "bhk": flat.bhk})
        layout = [{"floorNo": fn, "flats": flats} for fn, flats in layout_dict.items()]

    elif commercial:
        property_type = 'commercial'
        floors = CommercialFloor.objects.filter(commercial_property=commercial).order_by('floorNo', 'sectionNo')
        layout_dict = {}
        for floor in floors:
            floor_no = floor.floorNo
            if floor_no not in layout_dict:
                layout_dict[floor_no] = []
            layout_dict[floor_no].append({"sectionNo": floor.sectionNo, "area_sqft": floor.area_sqft})
        layout = [{"floorNo": fn, "sections": secs} for fn, secs in layout_dict.items()]

    if not property_type:
        return None

    # Create the Property record with imported layout
    prop = Property.objects.create(
        owner_phone=owner.owner_id,
        owner_account=owner,
        property_type=property_type,
        building_layout=layout
    )
    return prop


@api_view(["POST"])
def add_floor(request):
    """
    POST /api/building/add-floor/
    Request: {"owner_phone": "9876543210"}
    """
    if not getattr(request, 'owner_account', None):
        return Response({"status": False, "message": "Unauthorized or missing owner account"}, status=status.HTTP_401_UNAUTHORIZED)

    with transaction.atomic():
        prop = get_or_create_property_for_account(request.owner_account)
        if not prop:
            return Response({"status": False, "message": "Property not found for this owner phone"}, status=status.HTTP_404_NOT_FOUND)

        layout = list(prop.building_layout or [])
        
        # Calculate next floorNo
        floor_numbers = [floor.get("floorNo", 0) for floor in layout if isinstance(floor, dict)]
        next_floor = max(floor_numbers) + 1 if floor_numbers else 1

        # Determine default layout for new floor based on property type
        if prop.property_type == "hostel":
            new_floor = {
                "floorNo": next_floor,
                "rooms": [{"roomNo": 1, "beds": 1}]
            }
        elif prop.property_type == "apartment":
            new_floor = {
                "floorNo": next_floor,
                "flats": [{"flatNo": "101", "bhk": 1}]
            }
        elif prop.property_type == "commercial":
            new_floor = {
                "floorNo": next_floor,
                "sections": [{"sectionNo": 1, "area_sqft": 500}]
            }
        else:
            return Response({"status": False, "message": f"Unsupported property type: {prop.property_type}"}, status=status.HTTP_400_BAD_REQUEST)

        layout.append(new_floor)

        # Validate & Save
        serializer = PropertySerializer(prop, data={"building_layout": layout}, partial=True)
        if not serializer.is_valid():
            return Response({"status": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response({
            "status": True,
            "message": "Building layout updated successfully",
            "building_layout": serializer.data["building_layout"]
        }, status=status.HTTP_200_OK)


@api_view(["DELETE"])
def delete_floor(request, owner_phone, floor_no):
    """
    DELETE /api/building/delete-floor/<owner_phone>/<floor_no>/
    """
    if not owner_phone or floor_no is None:
        return Response({"status": False, "message": "owner_phone and floor_no are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        floor_no_val = int(floor_no)
    except (ValueError, TypeError):
        return Response({"status": False, "message": "floor_no must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prop = get_or_create_property_for_account(request.owner_account)
        if not prop:
            return Response({"status": False, "message": "Property not found for this owner phone"}, status=status.HTTP_404_NOT_FOUND)

        layout = list(prop.building_layout or [])
        
        # Check if floor exists
        floor_exists = False
        new_layout = []
        for floor in layout:
            if isinstance(floor, dict) and int(floor.get("floorNo", 0)) == floor_no_val:
                floor_exists = True
            else:
                new_layout.append(floor)

        if not floor_exists:
            return Response({"status": False, "message": f"Floor {floor_no_val} not found"}, status=status.HTTP_404_NOT_FOUND)

        # Save and return
        prop.building_layout = new_layout
        prop.save()

        return Response({
            "status": True,
            "message": "Building layout updated successfully",
            "building_layout": prop.building_layout
        }, status=status.HTTP_200_OK)


@api_view(["POST"])
def add_unit(request):
    """
    POST /api/building/add-unit/
    Request: {"owner_phone": "9876543210", "floor_no": 1}
    """
    owner_phone = request.data.get("owner_phone")
    floor_no = request.data.get("floor_no")

    if not owner_phone or floor_no is None:
        return Response({"status": False, "message": "owner_phone and floor_no are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        floor_no_val = int(floor_no)
    except (ValueError, TypeError):
        return Response({"status": False, "message": "floor_no must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prop = get_or_create_property_for_account(request.owner_account)
        if not prop:
            return Response({"status": False, "message": "Property not found for this owner phone"}, status=status.HTTP_404_NOT_FOUND)

        layout = list(prop.building_layout or [])
        
        # Find the floor
        target_floor = None
        for floor in layout:
            if isinstance(floor, dict) and int(floor.get("floorNo", 0)) == floor_no_val:
                target_floor = floor
                break

        if not target_floor:
            return Response({"status": False, "message": f"Floor {floor_no_val} not found"}, status=status.HTTP_404_NOT_FOUND)

        # Add unit based on property type
        if prop.property_type == "hostel":
            rooms = list(target_floor.get("rooms", []))
            room_numbers = []
            for r in rooms:
                try:
                    room_numbers.append(int(r.get("roomNo", 0)))
                except (ValueError, TypeError):
                    pass
            next_room_no = max(room_numbers) + 1 if room_numbers else 1
            rooms.append({"roomNo": next_room_no, "beds": 1})
            target_floor["rooms"] = rooms

        elif prop.property_type == "apartment":
            flats = list(target_floor.get("flats", []))
            flat_numbers = []
            for f in flats:
                try:
                    flat_numbers.append(int(f.get("flatNo", 0)))
                except (ValueError, TypeError):
                    pass
            next_flat_no = max(flat_numbers) + 1 if flat_numbers else 101
            flats.append({"flatNo": str(next_flat_no), "bhk": 1})
            target_floor["flats"] = flats

        elif prop.property_type == "commercial":
            sections = list(target_floor.get("sections", []))
            section_numbers = []
            for s in sections:
                try:
                    section_numbers.append(int(s.get("sectionNo", 0)))
                except (ValueError, TypeError):
                    pass
            next_sec_no = max(section_numbers) + 1 if section_numbers else 1
            sections.append({"sectionNo": next_sec_no, "area_sqft": 500})
            target_floor["sections"] = sections
        else:
            return Response({"status": False, "message": f"Unsupported property type: {prop.property_type}"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate & Save
        serializer = PropertySerializer(prop, data={"building_layout": layout}, partial=True)
        if not serializer.is_valid():
            return Response({"status": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response({
            "status": True,
            "message": "Building layout updated successfully",
            "building_layout": serializer.data["building_layout"]
        }, status=status.HTTP_200_OK)


@api_view(["PATCH"])
def update_beds(request):
    """
    PATCH /api/building/update-beds/
    Request: {"owner_phone": "9876543210", "floor_no": 1, "room_no": 101, "action": "increment"|"decrement"}
    """
    owner_phone = request.data.get("owner_phone")
    floor_no = request.data.get("floor_no")
    room_no = request.data.get("room_no")
    action = request.data.get("action")

    if not owner_phone or floor_no is None or room_no is None or not action:
        return Response({"status": False, "message": "owner_phone, floor_no, room_no, and action are required"}, status=status.HTTP_400_BAD_REQUEST)

    if action not in ["increment", "decrement"]:
        return Response({"status": False, "message": "action must be 'increment' or 'decrement'"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        floor_no_val = int(floor_no)
    except (ValueError, TypeError):
        return Response({"status": False, "message": "floor_no must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prop = get_or_create_property_for_account(request.owner_account)
        if not prop:
            return Response({"status": False, "message": "Property not found for this owner phone"}, status=status.HTTP_404_NOT_FOUND)

        if prop.property_type != "hostel":
            return Response({"status": False, "message": "Beds update is only supported for hostels"}, status=status.HTTP_400_BAD_REQUEST)

        layout = list(prop.building_layout or [])
        
        # Find the floor
        target_floor = None
        for floor in layout:
            if isinstance(floor, dict) and int(floor.get("floorNo", 0)) == floor_no_val:
                target_floor = floor
                break

        if not target_floor:
            return Response({"status": False, "message": f"Floor {floor_no_val} not found"}, status=status.HTTP_404_NOT_FOUND)

        # Find the room
        rooms = list(target_floor.get("rooms", []))
        target_room = None
        for room in rooms:
            if isinstance(room, dict) and str(room.get("roomNo", "")).strip() == str(room_no).strip():
                target_room = room
                break

        if not target_room:
            return Response({"status": False, "message": f"Room {room_no} not found on Floor {floor_no_val}"}, status=status.HTTP_404_NOT_FOUND)

        # Update beds count
        try:
            current_beds = int(target_room.get("beds", 1))
        except (ValueError, TypeError):
            current_beds = 1

        if action == "increment":
            new_beds = current_beds + 1
        else:
            new_beds = current_beds - 1

        if new_beds < 1:
            return Response({"status": False, "message": "beds cannot be less than 1"}, status=status.HTTP_400_BAD_REQUEST)

        target_room["beds"] = new_beds
        target_floor["rooms"] = rooms

        # Validate & Save
        serializer = PropertySerializer(prop, data={"building_layout": layout}, partial=True)
        if not serializer.is_valid():
            return Response({"status": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response({
            "status": True,
            "message": "Building layout updated successfully",
            "building_layout": serializer.data["building_layout"]
        }, status=status.HTTP_200_OK)


@api_view(["DELETE"])
def delete_unit(request):
    """
    DELETE /api/building/delete-unit/
    Request: {"owner_phone": "9876543210", "floor_no": 1, "unit_no": "101"}
    """
    owner_phone = request.data.get("owner_phone")
    floor_no = request.data.get("floor_no")
    unit_no = request.data.get("unit_no")

    if not owner_phone or floor_no is None or unit_no is None:
        return Response({"status": False, "message": "owner_phone, floor_no, and unit_no are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        floor_no_val = int(floor_no)
    except (ValueError, TypeError):
        return Response({"status": False, "message": "floor_no must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prop = get_or_create_property_for_account(request.owner_account)
        if not prop:
            return Response({"status": False, "message": "Property not found for this owner phone"}, status=status.HTTP_404_NOT_FOUND)

        layout = list(prop.building_layout or [])
        
        # Find the floor
        target_floor = None
        for floor in layout:
            if isinstance(floor, dict) and int(floor.get("floorNo", 0)) == floor_no_val:
                target_floor = floor
                break

        if not target_floor:
            return Response({"status": False, "message": f"Floor {floor_no_val} not found"}, status=status.HTTP_404_NOT_FOUND)

        unit_exists = False
        unit_no_str = str(unit_no).strip()

        # Remove unit based on property type
        if prop.property_type == "hostel":
            rooms = list(target_floor.get("rooms", []))
            new_rooms = []
            for r in rooms:
                if isinstance(r, dict) and str(r.get("roomNo", "")).strip() == unit_no_str:
                    unit_exists = True
                else:
                    new_rooms.append(r)
            target_floor["rooms"] = new_rooms

        elif prop.property_type == "apartment":
            flats = list(target_floor.get("flats", []))
            new_flats = []
            for f in flats:
                if isinstance(f, dict) and str(f.get("flatNo", "")).strip() == unit_no_str:
                    unit_exists = True
                else:
                    new_flats.append(f)
            target_floor["flats"] = new_flats

        elif prop.property_type == "commercial":
            sections = list(target_floor.get("sections", []))
            new_sections = []
            for s in sections:
                if isinstance(s, dict) and str(s.get("sectionNo", "")).strip() == unit_no_str:
                    unit_exists = True
                else:
                    new_sections.append(s)
            target_floor["sections"] = new_sections
        else:
            return Response({"status": False, "message": f"Unsupported property type: {prop.property_type}"}, status=status.HTTP_400_BAD_REQUEST)

        if not unit_exists:
            return Response({"status": False, "message": f"Unit {unit_no_str} not found on Floor {floor_no_val}"}, status=status.HTTP_404_NOT_FOUND)

        # Validate & Save
        serializer = PropertySerializer(prop, data={"building_layout": layout}, partial=True)
        if not serializer.is_valid():
            return Response({"status": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response({
            "status": True,
            "message": "Building layout updated successfully",
            "building_layout": serializer.data["building_layout"]
        }, status=status.HTTP_200_OK)


@api_view(["PUT"])
def save_layout(request):
    """
    PUT /api/building/save-layout/
    Request: {"owner_phone": "9876543210", "building_layout": [...]}
    """
    building_layout = request.data.get("building_layout")

    if not getattr(request, 'owner_account', None) or building_layout is None:
        return Response({"status": False, "message": "owner account and building_layout are required"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prop = get_or_create_property_for_account(request.owner_account)
        if not prop:
            return Response({"status": False, "message": "Property not found for this owner phone"}, status=status.HTTP_404_NOT_FOUND)

        # Validate & Save
        serializer = PropertySerializer(prop, data={"building_layout": building_layout}, partial=True)
        if not serializer.is_valid():
            return Response({"status": False, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        return Response({
            "status": True,
            "message": "Building layout updated successfully",
            "building_layout": serializer.data["building_layout"]
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@jwt_required(allowed_roles=['owner'])
def get_owner_accounts_list(request):
    phone = request.jwt_payload.get('phone')
    accounts = Owners.objects.filter(phone=phone).order_by('-created_at')
    
    data = []
    for acc in accounts:
        property_name = "Unnamed Property"
        building = "N/A"
        property_image = None
        
        hostel = StayHostelDetails.objects.filter(owner=acc).first()
        if hostel:
            property_name = hostel.hostelName or property_name
            building = hostel.location or building
            property_image = hostel.cover_image.url if hostel.cover_image else None
        else:
            apartment = ApartmentStayDetails.objects.filter(owner=acc).first()
            if apartment:
                property_name = apartment.apartmentName or property_name
                building = apartment.location or building
                property_image = apartment.cover_image.url if apartment.cover_image else None
            else:
                commercial = CommericialDetails.objects.filter(owner=acc).first()
                if commercial:
                    property_name = commercial.commercialName or property_name
                    building = commercial.location or building
                    property_image = commercial.cover_image.url if commercial.cover_image else None
                    
        data.append({
            "id": acc.owner_id,
            "owner_name": acc.name,
            "phone": acc.phone,
            "property_name": property_name,
            "building": building,
            "property_image": property_image,
            "status": acc.status
        })
        
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@jwt_required(allowed_roles=['owner'])
@transaction.atomic
def add_owner_account(request):
    action = request.data.get('action') # 'existing' or 'register'
    phone = request.jwt_payload.get('phone')
    
    if action == 'existing':
        accounts = Owners.objects.filter(phone=phone)
        return Response({
            "message": "Account attached successfully",
            "accounts_count": accounts.count()
        }, status=status.HTTP_200_OK)
        
    elif action == 'register':
        if hasattr(request.data, '_mutable'):
            request.data._mutable = True
            request.data['phone'] = phone
            request.data._mutable = False
        else:
            request.data['phone'] = phone
        try:
            result = OwnerRegistrationService.register(request)
            return Response({
                "message": "New property registered successfully under current account",
                "details": result
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    return Response({"error": "Invalid action. Choose 'existing' or 'register'"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@jwt_required(allowed_roles=['owner'])
def switch_owner_account(request):
    account_id = request.data.get('account_id')
    phone = request.jwt_payload.get('phone')
    
    if not account_id:
        return Response({"error": "account_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    account = Owners.objects.filter(pk=account_id, phone=phone).first()
    if not account:
        return Response({"error": "Account not found or unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
    return Response({
        "message": f"Successfully switched to {account.name}",
        "selectedAccount": {
            "id": account.owner_id,
            "owner_name": account.name,
            "phone": account.phone,
            "status": account.status
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@jwt_required(allowed_roles=['owner'])
def get_current_owner_account(request):
    account = getattr(request, 'owner_account', None)
    if not account:
        return Response({"error": "No active account found"}, status=status.HTTP_404_NOT_FOUND)
        
    property_name = "Unnamed Property"
    building = "N/A"
    property_image = None
    
    hostel = StayHostelDetails.objects.filter(owner=account).first()
    if hostel:
        property_name = hostel.hostelName or property_name
        building = hostel.location or building
        property_image = hostel.cover_image.url if hostel.cover_image else None
    else:
        apartment = ApartmentStayDetails.objects.filter(owner=account).first()
        if apartment:
            property_name = apartment.apartmentName or property_name
            building = apartment.location or building
            property_image = apartment.cover_image.url if apartment.cover_image else None
        else:
            commercial = CommericialDetails.objects.filter(owner=account).first()
            if commercial:
                property_name = commercial.commercialName or property_name
                building = commercial.location or building
                property_image = commercial.cover_image.url if commercial.cover_image else None

    return Response({
        "id": account.owner_id,
        "owner_name": account.name,
        "phone": account.phone,
        "property_name": property_name,
        "building": building,
        "property_image": property_image,
        "status": account.status
    }, status=status.HTTP_200_OK)



from django.http import JsonResponse
from .models import SystemSettings


def system_status(request):
    try:
        settings = SystemSettings.objects.first()

        if not settings:
            return JsonResponse({
                "success": True,
                "maintenance_mode": "NORMAL",
                "message": "",
                "estimated_completion": None
            })

        return JsonResponse({
            "success": True,
            "maintenance_mode": settings.maintenance_mode,
            "message": settings.maintenance_message,
            "estimated_completion": settings.estimated_completion,
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)





from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import SystemSettings
import json


@csrf_exempt
@require_http_methods(["GET", "PUT"])
def admin_system_settings(request):
    """
    GET  -> Return current system settings
    PUT  -> Update maintenance settings
    """

    settings, created = SystemSettings.objects.get_or_create(
        id=1,
        defaults={
            "maintenance_mode": SystemSettings.NORMAL
        }
    )

    if request.method == "GET":
        return JsonResponse({
            "success": True,
            "maintenance_mode": settings.maintenance_mode,
            "maintenance_message": settings.maintenance_message,
            "estimated_completion": settings.estimated_completion,
            "allow_admin_override": settings.allow_admin_override,
            "demo_mode_enabled": settings.demo_mode_enabled,
            "demo_mobile_numbers": settings.demo_mobile_numbers,
        })

    try:
        body = json.loads(request.body)

        settings.maintenance_mode = body.get(
            "maintenance_mode",
            settings.maintenance_mode
        )

        settings.maintenance_message = body.get(
            "maintenance_message",
            settings.maintenance_message
        )

        settings.estimated_completion = body.get(
            "estimated_completion",
            settings.estimated_completion
        )

        settings.allow_admin_override = body.get(
            "allow_admin_override",
            settings.allow_admin_override
        )

        settings.demo_mode_enabled = body.get(
        "demo_mode_enabled",
        settings.demo_mode_enabled
        )

        settings.demo_mobile_numbers = body.get(
        "demo_mobile_numbers",
        settings.demo_mobile_numbers
        )

        settings.save()

        return JsonResponse({
            "success": True,
            "message": "System settings updated successfully."
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=400)

 
from django.views.decorators.csrf import csrf_exempt
import json
import traceback
 
@csrf_exempt
def submit_account_deletion(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            from HAC.services.mail_service import send_account_deletion_email
            send_account_deletion_email(data)
            return JsonResponse({'success': True, 'message': 'Account deletion request submitted successfully.'})
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)


@api_view(['GET'])
@jwt_required()
def admin_tenants(request):
    """Return all registered tenants (Tenent model) for the admin panel."""
    try:
        from HAC.models import Tenent, StayHostelDetails, ApartmentStayDetails, CommericialDetails
        data = []
 
        for t in Tenent.objects.select_related('owner').all():
            property_name = "N/A"
            property_type = "N/A"
 
            if t.owner:
                hostel = StayHostelDetails.objects.filter(owner=t.owner).first()
                if hostel:
                    property_name = hostel.hostelName or "Hostel"
                    property_type = "Hostel"
                else:
                    apt = ApartmentStayDetails.objects.filter(owner=t.owner).first()
                    if apt:
                        property_name = apt.apartmentName or "Apartment"
                        property_type = "Apartment"
                    else:
                        comm = CommericialDetails.objects.filter(owner=t.owner).first()
                        if comm:
                            property_name = comm.commercialName or "Commercial"
                            property_type = "Commercial"
 
            data.append({
                "name": t.name,
                "phone": t.phone,
                "property": property_name,
                "property_type": property_type,
                "status": "Active" if not t.is_vacant else "Pending",
            })
 
        return Response({"count": len(data), "data": data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# VACATE REQUEST ENDPOINTS
# =====================================================================

@api_view(['POST'])
@jwt_required()
def vacate_request_create(request):
    """
    POST /api/vacate/request/
    Tenant creates a vacate request.
    """
    try:
        role = request.jwt_payload.get('role')
        if role != 'tenant':
            return Response({"error": "Only tenants can submit vacate requests"}, status=status.HTTP_403_FORBIDDEN)
        payload = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        payload["tenant_phone"] = request.jwt_payload.get("phone") or payload.get("tenant_phone")
        result = VacateService.create_request(payload)
        return Response(result, status=status.HTTP_201_CREATED if not result.get("existing") else status.HTTP_200_OK)
    except ValueError as ve:
        return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def vacate_request_list(request):
    """
    GET /api/vacate/requests/
    Query params: owner_phone / owner_id or tenant_phone
    """
    try:
        owner_identifier = request.query_params.get("owner_phone") or request.query_params.get("owner_id")
        tenant_phone = request.query_params.get("tenant_phone")
        role = request.jwt_payload.get('role')
        if role == 'tenant':
            tenant_phone = request.jwt_payload.get('phone') or tenant_phone
            owner_identifier = None
        elif role == 'owner' and not owner_identifier:
            owner_identifier = request.jwt_payload.get('phone')
        results = VacateService.get_requests(owner_identifier=owner_identifier, tenant_phone=tenant_phone)
        return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def vacate_request_detail(request, pk):
    """
    GET /api/vacate/request/<pk>/
    Returns single vacate request detail.
    """
    try:
        result = VacateService.get_detail(pk)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@jwt_required()
def vacate_request_approve(request, pk):
    """
    POST /api/vacate/request/<pk>/approve/
    Owner approves vacate request.
    """
    try:
        role = request.jwt_payload.get('role')
        if role != 'owner':
            return Response({"error": "Only owners can approve vacate requests"}, status=status.HTTP_403_FORBIDDEN)
        acting_owner = getattr(request, 'owner_account', None) or getattr(request, 'custom_user', None)
        if acting_owner is None or not getattr(acting_owner, 'owner_id', getattr(acting_owner, 'id', getattr(acting_owner, 'pk', None))):
            from HAC.services.common_service import CommonService
            acting_owner = CommonService.get_owner(request.jwt_payload.get('phone') or request.jwt_payload.get('user_id'))
        result = VacateService.approve_request(pk, acting_owner=acting_owner)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as ve:
        return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def vacate_request_decline(request, pk):
    """
    POST /api/vacate/request/<pk>/decline/
    Owner declines vacate request.
    """
    try:
        role = request.jwt_payload.get('role')
        if role != 'owner':
            return Response({"error": "Only owners can decline vacate requests"}, status=status.HTTP_403_FORBIDDEN)
        acting_owner = getattr(request, 'owner_account', None) or getattr(request, 'custom_user', None)
        if acting_owner is None or not getattr(acting_owner, 'owner_id', getattr(acting_owner, 'id', getattr(acting_owner, 'pk', None))):
            from HAC.services.common_service import CommonService
            acting_owner = CommonService.get_owner(request.jwt_payload.get('phone') or request.jwt_payload.get('user_id'))
        result = VacateService.decline_request(pk, acting_owner=acting_owner)
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as ve:
        return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================================================================
# HOSTEL CHANGE REQUEST ENDPOINTS
# =====================================================================
from HAC.services.hostel_change_service import HostelChangeService

@api_view(['POST'])
@jwt_required()
def create_hostel_change_request(request):
    """Tenant submits a request to change/book another hostel"""
    try:
        role = request.jwt_payload.get('role')
        if role != 'tenant':
            return Response({"error": "Only tenants can submit hostel change requests"}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        payload["tenant_phone"] = request.jwt_payload.get("phone") or payload.get("tenant_phone")
        result = HostelChangeService.create_change_request(payload)
        if result.get('success'):
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def check_hostel_booking_status(request, tenant_phone, target_hostel_id):
    """Check if tenant can book or switch to target hostel"""
    try:
        result = HostelChangeService.check_can_book_hostel(tenant_phone, target_hostel_id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_pending_hostel_change_requests(request, owner_id):
    """Get all pending hostel change requests for an owner"""
    try:
        role = request.jwt_payload.get('role')
        if role != 'owner':
            return Response({"error": "Only owners can view pending change requests"}, status=status.HTTP_403_FORBIDDEN)
        
        requests_list = HostelChangeService.get_pending_requests_for_owner(owner_id)
        from HAC.serializers import HostelChangeRequestSerializer
        serializer = HostelChangeRequestSerializer(requests_list, many=True)
        return Response({"requests": serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def approve_hostel_change_request(request, request_id):
    """Owner approves a hostel change request"""
    try:
        role = request.jwt_payload.get('role')
        if role != 'owner':
            return Response({"error": "Only owners can approve requests"}, status=status.HTTP_403_FORBIDDEN)
        
        acting_owner = getattr(request, 'owner_account', None) or getattr(request, 'custom_user', None)
        if acting_owner is None or not getattr(acting_owner, 'owner_id', getattr(acting_owner, 'id', getattr(acting_owner, 'pk', None))):
            from HAC.services.common_service import CommonService
            acting_owner = CommonService.get_owner(request.jwt_payload.get('phone') or request.jwt_payload.get('user_id'))
        result = HostelChangeService.approve_change_request(
            request_id, acting_owner=acting_owner
        )
        if result.get('success'):
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@jwt_required()
def reject_hostel_change_request(request, request_id):
    """Owner rejects a hostel change request"""
    try:
        role = request.jwt_payload.get('role')
        if role != 'owner':
            return Response({"error": "Only owners can reject requests"}, status=status.HTTP_403_FORBIDDEN)
        
        rejection_reason = request.data.get('rejection_reason', '')
        acting_owner = getattr(request, 'owner_account', None) or getattr(request, 'custom_user', None)
        if acting_owner is None or not getattr(acting_owner, 'owner_id', getattr(acting_owner, 'id', getattr(acting_owner, 'pk', None))):
            from HAC.services.common_service import CommonService
            acting_owner = CommonService.get_owner(request.jwt_payload.get('phone') or request.jwt_payload.get('user_id'))
        result = HostelChangeService.reject_change_request(
            request_id, rejection_reason, acting_owner=acting_owner
        )
        if result.get('success'):
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@jwt_required()
def get_tenant_hostel_change_requests(request, tenant_phone):
    """Get all hostel change requests for a tenant"""
    try:
        role = request.jwt_payload.get('role')
        if role != 'tenant':
            return Response({"error": "Only tenants can view their requests"}, status=status.HTTP_403_FORBIDDEN)
        
        requests_list = HostelChangeService.get_tenant_change_requests(tenant_phone)
        from HAC.serializers import HostelChangeRequestSerializer
        serializer = HostelChangeRequestSerializer(requests_list, many=True)
        return Response({"requests": serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)