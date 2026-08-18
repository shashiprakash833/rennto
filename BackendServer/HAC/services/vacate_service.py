import logging
from django.db import transaction
from django.utils import timezone

from HAC.models import (
    VacateRequest,
    Tenent,
    Owners,
    Property,
    Notification,
    TenantNotification,
    Issue,
    TenantBeds,
    ApartmentTenantBeds,
    CommercialTenantBeds,
)
from HAC.services.common_service import CommonService
from HAC.services.notification_service import NotificationService
from HAC.services.existing_tenant_service import ExistingTenantService

logger = logging.getLogger(__name__)


class VacateService:

    @staticmethod
    def create_request(data):
        """
        Creates a new VacateRequest, Notification for Owner, Issue for Owner,
        and TenantNotification for Tenant.
        """
        tenant_phone = (
            data.get("tenant_phone") or
            data.get("phone") or
            data.get("phoneNumber") or
            data.get("mobile") or
            data.get("contactNumber") or
            data.get("userPhone") or
            ""
        ).strip()
        owner_id = (
            data.get("owner_id") or
            data.get("owner_phone") or
            data.get("owner") or
            ""
        ).strip()
        property_name = (data.get("property_name") or "").strip()
        property_type = data.get("property_type") or "hostel"
        remarks = data.get("remarks") or data.get("reason") or ""

        if not tenant_phone:
            raise ValueError("Tenant phone is required.")

        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found.")

        owner = None
        if owner_id:
            owner = CommonService.get_owner(owner_id)
        if not owner and tenant.owner:
            owner = tenant.owner

        if not owner:
            raise Exception("Owner not found for this tenant.")

        # Check existing pending vacate request
        existing_pending = VacateRequest.objects.filter(
            tenant=tenant,
            status="Pending",
        ).first()

        if existing_pending:
            return {
                "message": "You already have a pending vacate request.",
                "existing": True,
                "request_id": existing_pending.id,
                "status": "Pending",
            }

        # Find tenant current allocation details
        requested_floor = None
        requested_room = None
        requested_bed = None
        requested_flat = None

        hostel_bed = TenantBeds.objects.filter(phone=tenant.phone).first()
        if hostel_bed:
            requested_floor = getattr(hostel_bed, "floor", None)
            requested_room = getattr(hostel_bed, "roomno", None)
            requested_bed = getattr(hostel_bed, "bed", None)

        apartment_bed = ApartmentTenantBeds.objects.filter(phone=tenant.phone).first()
        if apartment_bed:
            requested_floor = getattr(apartment_bed, "floor", None)
            requested_flat = getattr(apartment_bed, "flatno", None)

        comm_bed = CommercialTenantBeds.objects.filter(phone=tenant.phone).first()
        if comm_bed:
            requested_floor = getattr(comm_bed, "floor", None)
            requested_room = getattr(comm_bed, "sectionNo", None)

        vacate_req = VacateRequest.objects.create(
            tenant=tenant,
            owner=owner,
            property_name=property_name or getattr(tenant, "property_name", "Property"),
            property_type=property_type,
            requested_floor=requested_floor or "",
            requested_room=requested_room or "",
            requested_bed=requested_bed or "",
            requested_flat=requested_flat or "",
            status="Pending",
            remarks=remarks,
        )

        # 1. Create Notification for Owner
        Notification.objects.create(
            owner_account=owner,
            recipient_phone=owner.phone or owner.owner_id or "",
            title="Vacate Request",
            message=f"{tenant.name} has requested to vacate the property.",
            type="ISSUE",
            related_id=vacate_req.id,
            is_read=False,
        )

        # 2. Create Issue for Owner
        Issue.objects.create(
            tenant=tenant,
            owner=owner,
            property_type=vacate_req.property_type,
            title=f"Vacate Request - {tenant.name}",
            description=f"{tenant.name} has requested to vacate the property. Remarks: {remarks or 'None'}",
            severity="High",
            status="Pending",
        )

        # 3. Create TenantNotification for Tenant
        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Vacate Request Submitted",
            message=f"Your vacate request for {vacate_req.property_name} has been submitted.",
            is_read=False,
        )

        # Send push & WebSocket
        if owner.push_token:
            NotificationService.send_push_notification(
                owner.push_token,
                "Vacate Request 📩",
                f"{tenant.name} has requested to vacate {vacate_req.property_name}.",
            )

        sanitized_owner = ExistingTenantService._sanitize_phone(owner.owner_id or owner.phone)
        ExistingTenantService._send_ws_notification(
            [f"owner_status_{sanitized_owner}", f"user_notifications_{sanitized_owner}"],
            {
                "type": "incoming_vacate_request",
                "message": f"Vacate Request from {tenant.name}",
                "id": vacate_req.id,
                "status": "Pending",
            },
        )

        return {
            "message": "Vacate request submitted successfully.",
            "existing": False,
            "request_id": vacate_req.id,
            "status": "Pending",
        }

    @staticmethod
    def get_requests(owner_identifier=None, tenant_phone=None):
        """
        Returns list of formatted vacate requests.
        """
        qs = VacateRequest.objects.all().order_by("-created_at")

        if owner_identifier:
            owner = CommonService.get_owner(owner_identifier)
            if owner:
                qs = qs.filter(owner=owner)
            else:
                qs = qs.filter(owner__phone=owner_identifier)

        if tenant_phone:
            qs = qs.filter(tenant__phone=tenant_phone)

        results = []
        for r in qs:
            tenant_info = {
                "id": r.tenant.id,
                "name": r.tenant.name,
                "phone": r.tenant.phone,
                "email": getattr(r.tenant, "email", "") or "",
                "profile_picture": getattr(r.tenant, "profile_picture", None) or None,
            }

            property_info = {
                "name": r.property_name,
                "type": r.property_type,
                "floor": r.requested_floor,
                "room": r.requested_room,
                "bed": r.requested_bed,
                "flat": r.requested_flat,
            }

            results.append({
                "id": r.id,
                "tenant": tenant_info,
                "property": property_info,
                "propertyName": r.property_name,
                "propertyType": r.property_type,
                "status": r.status,
                "remarks": r.remarks or "",
                "created_at": r.created_at.isoformat() if r.created_at else "",
                "updated_at": r.updated_at.isoformat() if r.updated_at else "",
            })

        return results

    @staticmethod
    def get_detail(request_id):
        """
        Get details of single VacateRequest by ID.
        """
        try:
            r = VacateRequest.objects.get(id=request_id)
        except VacateRequest.DoesNotExist:
            raise Exception("Vacate request not found.")

        return {
            "id": r.id,
            "tenant": {
                "id": r.tenant.id,
                "name": r.tenant.name,
                "phone": r.tenant.phone,
                "email": getattr(r.tenant, "email", "") or "",
                "profile_picture": getattr(r.tenant, "profile_picture", None) or None,
            },
            "property": {
                "name": r.property_name,
                "type": r.property_type,
                "floor": r.requested_floor,
                "room": r.requested_room,
                "bed": r.requested_bed,
                "flat": r.requested_flat,
            },
            "propertyName": r.property_name,
            "propertyType": r.property_type,
            "status": r.status,
            "remarks": r.remarks or "",
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
        }

    @staticmethod
    @transaction.atomic
    def approve_request(request_id):
        """
        Atomically approves a vacate request:
        - Updates VacateRequest status = Approved
        - Vacates tenant allocations & updates Property layout/statistics
        - Marks tenant is_vacant=True, owner=None
        - Updates Issue status to completed
        - Creates TenantNotification
        - Sends WS & push notifications
        """
        try:
            vacate_req = VacateRequest.objects.get(id=request_id)
        except VacateRequest.DoesNotExist:
            raise Exception("Vacate request not found.")

        if vacate_req.status != "Pending":
            raise ValueError(f"Vacate request is already {vacate_req.status}.")

        tenant = vacate_req.tenant
        owner = vacate_req.owner

        # Locate property
        prop = ExistingTenantService.get_or_create_property(owner)
        building_layout = prop.building_layout if prop else []

        # Clear tenant allocations
        ExistingTenantService._vacate_existing_allocations(tenant, building_layout)

        if prop:
            prop.building_layout = building_layout
            prop.save()

        # Update tenant status
        tenant.is_vacant = True
        tenant.owner = None
        tenant.save()

        # Update request status
        vacate_req.status = "Approved"
        vacate_req.save()

        # Resolve open issue
        Issue.objects.filter(
            tenant=tenant,
            title__icontains="Vacate Request",
        ).update(status="Completed")

        # Create Tenant Notification
        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Vacate Request Approved",
            message="Your vacate request has been approved.",
            is_read=False,
        )

        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Vacate Request Approved ✅",
                "Your vacate request has been approved. You have been vacated from the property.",
            )

        sanitized_tenant = ExistingTenantService._sanitize_phone(tenant.phone)
        ExistingTenantService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}"],
            {
                "type": "tenant_removed",
                "message": "Your vacate request has been approved.",
                "status": "Approved",
            },
        )

        return {"message": "Vacate request approved and tenant removed from property."}

    @staticmethod
    def decline_request(request_id):
        """
        Declines a vacate request:
        - Updates VacateRequest status = Declined
        - Tenant remains in property
        - Updates Issue status to rejected
        - Creates TenantNotification
        - Sends WS & push notifications
        """
        try:
            vacate_req = VacateRequest.objects.get(id=request_id)
        except VacateRequest.DoesNotExist:
            raise Exception("Vacate request not found.")

        if vacate_req.status != "Pending":
            raise ValueError(f"Vacate request is already {vacate_req.status}.")

        tenant = vacate_req.tenant

        vacate_req.status = "Declined"
        vacate_req.save()

        Issue.objects.filter(
            tenant=tenant,
            title__icontains="Vacate Request",
        ).update(status="Completed")

        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Vacate Request Declined",
            message="Your vacate request has been declined.",
            is_read=False,
        )

        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Vacate Request Declined ❌",
                "Your vacate request has been declined. You remain active in the property.",
            )

        sanitized_tenant = ExistingTenantService._sanitize_phone(tenant.phone)
        ExistingTenantService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}"],
            {
                "type": "status_update",
                "message": "Your vacate request has been declined.",
                "status": "Declined",
            },
        )

        return {"message": "Vacate request declined successfully."}
