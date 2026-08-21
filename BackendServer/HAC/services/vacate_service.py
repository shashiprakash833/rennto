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
    JoinRequest,
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
            # Fallback 1: check TenantBeds / ApartmentTenantBeds / CommercialTenantBeds
            bed = TenantBeds.objects.filter(phone=tenant.phone).first() or \
                  ApartmentTenantBeds.objects.filter(phone=tenant.phone).first() or \
                  CommercialTenantBeds.objects.filter(phone=tenant.phone).first()
            if bed and bed.owner:
                owner = bed.owner
            elif bed and bed.owner_phone:
                owner = CommonService.get_owner(bed.owner_phone)

        if not owner:
            # Fallback 2: check latest JoinRequest
            from HAC.models import JoinRequest
            jr = JoinRequest.objects.filter(tenant=tenant, status__in=['completed', 'joined', 'active', 'accepted', 'allotted']).order_by('-created_at').first()
            if jr and jr.owner:
                owner = jr.owner

        if not owner:
            raise Exception("Owner not found for this tenant.")

        if not tenant.owner:
            tenant.owner = owner
            tenant.save(update_fields=['owner'])

        target_property_name = property_name or getattr(tenant, "property_name", None) or "Property"

        # Determine when the current stay session started
        current_stay_joined_at = None
        last_join = JoinRequest.objects.filter(
            tenant=tenant,
            owner=owner,
            status__in=['completed', 'joined']
        ).order_by('-created_at').first()
        if last_join:
            current_stay_joined_at = last_join.created_at

        # Check existing pending vacate request ONLY for CURRENT PROPERTY and CURRENT STAY
        existing_pending = VacateRequest.objects.filter(
            tenant=tenant,
            owner=owner,
            property_name__iexact=target_property_name,
            status="Pending",
        ).order_by("-created_at").first()

        if existing_pending:
            if not current_stay_joined_at or existing_pending.created_at >= current_stay_joined_at:
                return {
                    "message": "You already have a pending vacate request for this property.",
                    "existing": True,
                    "request_id": existing_pending.id,
                    "status": "Pending",
                }
            else:
                # Old request from a previous stay in the same property
                existing_pending.status = "Historical"
                existing_pending.save()

        # Any pending requests from OTHER properties or previous stays are converted to Historical
        VacateRequest.objects.filter(
            tenant=tenant,
            status="Pending"
        ).exclude(
            owner=owner,
            property_name__iexact=target_property_name
        ).update(status="Historical")

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

        if not requested_room and not requested_flat:
            jr = JoinRequest.objects.filter(tenant=tenant, status__in=['completed', 'joined']).order_by('-created_at').first()
            if jr:
                requested_room = jr.sharing or jr.flat or jr.section or ""
                requested_floor = getattr(jr, "floor", "") or "1"

        vacate_req = VacateRequest.objects.create(
            tenant=tenant,
            owner=owner,
            property_name=target_property_name,
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
            message=f"{tenant.name} has requested to vacate {vacate_req.property_name}.",
            type="VACATE_REQUEST",
            related_id=vacate_req.id,
            is_read=False,
        )

        # 2. Create TenantNotification for Tenant
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

    @classmethod
    def get_requests(cls, owner_identifier=None, tenant_phone=None):
        return cls.list_requests(owner_identifier=owner_identifier, tenant_phone=tenant_phone)

    @staticmethod
    def get_tenant_vacate_status(tenant_phone, property_name=None):
        """
        Check if the tenant has a pending vacate request for their current stay/property.
        """
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant or tenant.is_vacant or not tenant.owner:
            return {"has_pending": False, "request_id": None, "status": None}

        target_prop = property_name or getattr(tenant, "property_name", None)

        current_stay_joined_at = None
        last_join = JoinRequest.objects.filter(
            tenant=tenant,
            owner=tenant.owner,
            status__in=['completed', 'joined']
        ).order_by('-created_at').first()
        if last_join:
            current_stay_joined_at = last_join.created_at

        qs = VacateRequest.objects.filter(
            tenant=tenant,
            owner=tenant.owner,
            status="Pending"
        )
        if target_prop:
            qs = qs.filter(property_name__iexact=target_prop)

        pending_req = qs.order_by('-created_at').first()
        if pending_req:
            if not current_stay_joined_at or pending_req.created_at >= current_stay_joined_at:
                return {
                    "has_pending": True,
                    "request_id": pending_req.id,
                    "status": "Pending",
                    "property_name": pending_req.property_name,
                    "created_at": pending_req.created_at.isoformat() if pending_req.created_at else None,
                }

        return {"has_pending": False, "request_id": None, "status": None}

    @staticmethod
    def list_requests(owner_identifier=None, tenant_phone=None):
        """
        List VacateRequests for an owner or tenant.
        """
        qs = VacateRequest.objects.select_related("tenant", "owner").all().order_by("-created_at")

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

            room_display = r.requested_room or r.requested_flat or (f"Bed {r.requested_bed}" if r.requested_bed else "N/A")

            results.append({
                "id": r.id,
                "tenant": tenant_info,
                "property": property_info,
                "tenant_name": r.tenant.name,
                "tenant_phone": r.tenant.phone,
                "propertyName": r.property_name,
                "property_name": r.property_name,
                "propertyType": r.property_type,
                "property_type": r.property_type,
                "room_number": room_display,
                "floor_number": r.requested_floor or "N/A",
                "bed_number": r.requested_bed or "N/A",
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
            r = VacateRequest.objects.select_related("tenant", "owner").get(id=request_id)
        except VacateRequest.DoesNotExist:
            raise Exception("Vacate request not found.")

        room_display = r.requested_room or r.requested_flat or (f"Bed {r.requested_bed}" if r.requested_bed else "N/A")

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
            "tenant_name": r.tenant.name,
            "tenant_phone": r.tenant.phone,
            "propertyName": r.property_name,
            "property_name": r.property_name,
            "propertyType": r.property_type,
            "property_type": r.property_type,
            "room_number": room_display,
            "floor_number": r.requested_floor or "N/A",
            "bed_number": r.requested_bed or "N/A",
            "status": r.status,
            "remarks": r.remarks or "",
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "updated_at": r.updated_at.isoformat() if r.updated_at else "",
        }

    @staticmethod
    @transaction.atomic
    def approve_request(request_id, acting_owner=None):
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

        acting_owner_pk = getattr(acting_owner, 'owner_id', getattr(acting_owner, 'pk', None))
        owner_pk = getattr(owner, 'owner_id', getattr(owner, 'pk', None))
        if acting_owner and owner and acting_owner_pk != owner_pk:
            raise ValueError("You are not authorized to approve this vacate request.")

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

        # Resolve open issue & mark owner notifications as read
        Issue.objects.filter(
            tenant=tenant,
            title__icontains="Vacate Request",
        ).update(status="Completed")
        Notification.objects.filter(
            related_id=request_id,
            type__in=["VACATE_REQUEST", "ISSUE"]
        ).update(is_read=True)

        # Create Tenant Notification
        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Vacate Request Approved",
            message=f"Your vacate request for {vacate_req.property_name} has been approved. You have been vacated from the property.",
            is_read=False,
        )

        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Vacate Request Approved ✅",
                f"Your vacate request for {vacate_req.property_name} has been approved. You have been vacated from the property.",
            )

        sanitized_tenant = ExistingTenantService._sanitize_phone(tenant.phone)
        ExistingTenantService._send_ws_notification(
            [f"tenant_notifications_{sanitized_tenant}", f"user_notifications_{sanitized_tenant}"],
            {
                "type": "vacate_request_approved",
                "message": f"Your vacate request for {vacate_req.property_name} has been approved. You have been removed from the property.",
                "status": "Approved",
            },
        )

        return {"message": "Vacate request approved and tenant removed from property."}

    @staticmethod
    def decline_request(request_id, acting_owner=None):
        """
        Declines a vacate request:
        - Updates VacateRequest status = Declined
        - Tenant remains in property
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
        acting_owner_pk = getattr(acting_owner, 'owner_id', getattr(acting_owner, 'pk', None))
        if acting_owner and vacate_req.owner_id and acting_owner_pk != vacate_req.owner_id:
            raise ValueError("You are not authorized to decline this vacate request.")

        vacate_req.status = "Declined"
        vacate_req.save()

        Issue.objects.filter(
            tenant=tenant,
            title__icontains="Vacate Request",
        ).update(status="Completed")
        Notification.objects.filter(
            related_id=request_id,
            type__in=["VACATE_REQUEST", "ISSUE"]
        ).update(is_read=True)

        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Vacate Request Declined",
            message=f"Your vacate request for {vacate_req.property_name} has been declined. You remain in the property.",
            is_read=False,
        )

        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Vacate Request Declined ❌",
                f"Your vacate request for {vacate_req.property_name} has been declined. You remain active in the property.",
            )

        sanitized_tenant = ExistingTenantService._sanitize_phone(tenant.phone)
        ExistingTenantService._send_ws_notification(
            [f"tenant_notifications_{sanitized_tenant}", f"user_notifications_{sanitized_tenant}"],
            {
                "type": "vacate_request_declined",
                "message": "Your vacate request has been declined. You remain in the property.",
                "status": "Declined",
            },
        )

        return {"message": "Vacate request declined successfully."}
