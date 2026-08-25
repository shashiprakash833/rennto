"""
Service for handling hostel change requests.
Allows tenants currently staying in one hostel to request moving to another hostel.
"""
from datetime import date
from django.db import transaction
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from HAC.models import (
    HostelChangeRequest,
    Tenent,
    Owners,
    StayHostelDetails,
    TenantBeds,
    BlockedTenant,
    Notification,
    TenantNotification,
    Issue,
    JoinRequest,
)
from .common_service import CommonService
from .notification_service import NotificationService


class HostelChangeService:
    """
    Service for managing hostel change requests.
    Handles creation, approval, and rejection of requests.
    """

    @staticmethod
    def _sanitize_phone(phone):
        """Strip characters that are invalid in channel-group names."""
        if not phone:
            return ""
        return phone.replace("+", "").replace("@", "_").replace(".", "_").replace(" ", "")

    @staticmethod
    def _send_ws_notification(groups, content):
        """Best-effort WebSocket broadcast to one or more channel groups."""
        try:
            channel_layer = get_channel_layer()
            for group in groups:
                msg_type = "status_update" if "owner_status" in group else "send_notification"
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": msg_type,
                        "content": content,
                    },
                )
        except Exception:
            pass

    @staticmethod
    def create_change_request(data):
        """
        Create a new hostel change request.
        
        Expected data fields:
        - tenant_phone: str
        - target_hostel_id: int (ID of new hostel to move to)
        - expected_joining_date: str (YYYY-MM-DD format)
        - message_to_owner: str (optional)
        """
        tenant_phone = (data.get("tenant_phone") or "").strip()
        target_hostel_id = data.get("target_hostel_id")
        expected_joining_date = data.get("expected_joining_date")
        message_to_owner = (data.get("message_to_owner") or "").strip()

        if not tenant_phone or not target_hostel_id or not expected_joining_date:
            raise ValueError("Missing required fields: tenant_phone, target_hostel_id, expected_joining_date")

        # Parse the expected joining date
        try:
            joining_date = date.fromisoformat(expected_joining_date)
        except ValueError:
            raise ValueError("Invalid date format for expected_joining_date. Use YYYY-MM-DD")

        if joining_date < date.today():
            raise ValueError("Expected joining date cannot be in the past.")

        # Get the tenant
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        tenant_name = (data.get("tenant_name") or tenant.name or "").strip()
        tenant_email = (data.get("tenant_email") or "").strip()
        requested_room_preference = (data.get("requested_room_preference") or data.get("room_preference") or "").strip()
        additional_details = (data.get("additional_details") or "").strip()

        # Check if tenant is blocked
        is_blocked = BlockedTenant.objects.filter(
            tenant=tenant, is_active=True
        ).exists()
        if is_blocked:
            raise ValueError(
                "You are blocked by an owner and cannot send requests until unblocked."
            )

        # Get the target hostel
        try:
            target_hostel = StayHostelDetails.objects.get(id=target_hostel_id)
        except StayHostelDetails.DoesNotExist:
            raise Exception("Target hostel not found")

        # Get the current hostel (where tenant is currently staying)
        current_hostel = None
        current_hostel_id = data.get("current_hostel_id")
        if current_hostel_id:
            current_hostel = StayHostelDetails.objects.filter(id=current_hostel_id).first()

        if not current_hostel:
            current_hostel_bed = TenantBeds.objects.filter(phone=tenant.phone).first()
            if current_hostel_bed:
                current_owner = current_hostel_bed.owner or CommonService.get_owner(current_hostel_bed.owner_phone)
                if current_owner:
                    current_hostel = StayHostelDetails.objects.filter(owner=current_owner).first()

        if not current_hostel and tenant.owner:
            current_hostel = StayHostelDetails.objects.filter(owner=tenant.owner).first()

        if not current_hostel:
            last_jr = JoinRequest.objects.filter(tenant=tenant).order_by('-created_at').first()
            if last_jr and last_jr.owner:
                current_hostel = StayHostelDetails.objects.filter(owner=last_jr.owner).first()

        if not current_hostel:
            raise ValueError("Tenant is not currently staying in any hostel")

        if current_hostel.id == target_hostel_id:
            raise ValueError("You cannot request to move to the same hostel you are currently in")

        # Check for duplicate pending requests
        existing = HostelChangeRequest.objects.filter(
            tenant=tenant,
            target_hostel=target_hostel,
            status='pending'
        ).first()

        today = date.today()
        days_remaining = (joining_date - today).days

        if existing:
            # Update existing pending request with new date and details
            existing.current_hostel = current_hostel
            existing.target_owner = target_hostel.owner
            existing.expected_joining_date = joining_date
            existing.days_remaining_in_current_hostel = days_remaining
            existing.message_to_owner = message_to_owner
            existing.requested_room_preference = requested_room_preference
            existing.additional_details = additional_details or message_to_owner
            existing.save()
            change_request = existing
        else:
            approved_req = HostelChangeRequest.objects.filter(
                tenant=tenant,
                target_hostel=target_hostel,
                status='approved'
            ).first()
            if approved_req:
                return {
                    "success": False,
                    "message": "Your request for this hostel is already approved.",
                    "existing": True
                }

            # Create the request
            change_request = HostelChangeRequest.objects.create(
                tenant=tenant,
                current_hostel=current_hostel,
                target_hostel=target_hostel,
                target_owner=target_hostel.owner,
                expected_joining_date=joining_date,
                days_remaining_in_current_hostel=days_remaining,
                tenant_email=tenant_email or getattr(tenant, 'email', '') or '',
                requested_room_preference=requested_room_preference,
                additional_details=additional_details or message_to_owner,
                message_to_owner=message_to_owner,
                status='pending'
            )

        # Send notifications to owner
        owner = target_hostel.owner
        notification_message = (
            f"{tenant.name} has requested to move to {target_hostel.hostelName}"
            f" for {joining_date.isoformat()}"
        )

        Notification.objects.create(
            owner_account=owner,
            recipient_phone=owner.phone,
            title="Hostel Change Request 📩",
            message=notification_message,
            type='HOSTEL_CHANGE',
            related_id=change_request.id,
        )

        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Hostel Change Request Submitted",
            message=f"Your request to move to {target_hostel.hostelName} has been sent to the owner.",
            is_read=False,
        )

        if owner.push_token:
            NotificationService.send_push_notification(
                owner.push_token,
                "Hostel Change Request 📩",
                notification_message
            )

        sanitized_owner = HostelChangeService._sanitize_phone(
            owner.owner_id if owner.owner_id else owner.phone
        )
        sanitized_tenant = HostelChangeService._sanitize_phone(tenant.phone)
        HostelChangeService._send_ws_notification(
            [
                f"owner_status_{sanitized_owner}",
                f"user_notifications_{sanitized_owner}",
            ],
            {
                "type": "hostel_change_request",
                "message": notification_message,
                "request_id": change_request.id,
                "status": "pending"
            }
        )

        return {
            "success": True,
            "message": "Your hostel change request has been sent successfully",
            "request_id": change_request.id,
            "existing": False
        }

    @staticmethod
    @transaction.atomic
    def approve_change_request(request_id, acting_owner=None):
        """
        Approve a hostel change request.
        This allows the tenant to proceed with booking the new hostel.
        Does not move the tenant automatically.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Hostel change request not found")

        if acting_owner and change_request.target_owner and not CommonService.is_same_or_authorized_owner(acting_owner, change_request.target_owner):
            raise ValueError("You are not authorized to approve this request.")

        if change_request.status != 'pending':
            raise ValueError(f"Can only approve pending requests. Current status: {change_request.status}")

        change_request.status = 'approved'
        change_request.save()

        tenant = change_request.tenant
        tenant_message = (
            f"Owner has accepted your request to move to {change_request.target_hostel.hostelName}. "
            "To join that hostel, first you need to vacate your current hostel."
        )
        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Hostel Change Request Accepted ✅",
            message=tenant_message,
            is_read=False,
        )
        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Request Accepted ✅",
                tenant_message
            )

        sanitized_tenant = HostelChangeService._sanitize_phone(tenant.phone)
        HostelChangeService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}", f"tenant_notifications_{sanitized_tenant}"],
            {
                "type": "hostel_change_approved",
                "message": tenant_message,
                "request_id": change_request.id,
                "target_hostel_id": change_request.target_hostel.id
            }
        )

        return {"success": True, "message": "Request approved successfully"}

    @staticmethod
    @transaction.atomic
    def reject_change_request(request_id, rejection_reason="", acting_owner=None):
        """
        Reject a hostel change request. Tenant remains in the current hostel.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Hostel change request not found")

        if acting_owner and change_request.target_owner and not CommonService.is_same_or_authorized_owner(acting_owner, change_request.target_owner):
            raise ValueError("You are not authorized to reject this request.")

        if change_request.status != 'pending':
            raise ValueError(f"Can only reject pending requests. Current status: {change_request.status}")

        change_request.status = 'rejected'
        change_request.rejection_reason = rejection_reason or ""
        change_request.save()

        tenant = change_request.tenant
        reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
        tenant_message = (
            f"Your hostel change request for {change_request.target_hostel.hostelName} "
            f"has been rejected by the owner.{reason_text} You remain in your current hostel."
        )
        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Hostel Change Request Rejected ❌",
            message=tenant_message,
            is_read=False,
        )
        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Request Rejected ❌",
                tenant_message
            )

        sanitized_tenant = HostelChangeService._sanitize_phone(tenant.phone)
        HostelChangeService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}", f"tenant_notifications_{sanitized_tenant}"],
            {
                "type": "hostel_change_rejected",
                "message": tenant_message,
                "request_id": change_request.id
            }
        )

        return {"success": True, "message": "Request rejected successfully"}

    @staticmethod
    def get_pending_requests_for_owner(owner_id):
        """
        Get all pending hostel change requests for an owner.
        """
        owner = CommonService.get_owner(owner_id)
        if not owner:
            raise Exception("Owner not found")

        phone_variants = [owner.phone]
        if hasattr(owner, 'phone') and owner.phone:
            cleaned = CommonService._clean_phone(owner.phone)
            phone_variants.extend([cleaned, f"+91{cleaned}", f"91{cleaned}"])

        q = (
            Q(target_owner=owner) |
            Q(target_owner__phone__in=phone_variants) |
            Q(target_hostel__owner=owner) |
            Q(target_hostel__owner__phone__in=phone_variants)
        )
        if getattr(owner, 'owner_master_id', None):
            q |= Q(target_owner__owner_master_id=owner.owner_master_id) | Q(target_hostel__owner__owner_master_id=owner.owner_master_id)

        requests = HostelChangeRequest.objects.filter(
            q,
            status='pending'
        ).select_related('tenant', 'current_hostel', 'target_hostel')

        return requests

    @staticmethod
    def get_request_details(request_id):
        """
        Get detailed information about a specific hostel change request.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'current_hostel', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Hostel change request not found")

        return change_request

    @staticmethod
    def get_tenant_change_requests(tenant_phone):
        """
        Get all hostel change requests for a specific tenant.
        """
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        requests = HostelChangeRequest.objects.filter(
            tenant=tenant
        ).select_related('current_hostel', 'target_hostel', 'target_owner').order_by('-created_at')

        return requests

    @staticmethod
    def check_can_book_hostel(tenant_phone, target_hostel_id):
        """
        Check if a tenant can book a hostel.
        Returns:
        - status: 'can_book' | 'already_staying' | 'pending_request' | 'error'
        - message: Description of the status
        - request_id: (optional) ID of pending/approved request
        - current_hostel: (optional) Details of current hostel
        """
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            return {
                "status": "error",
                "message": "Tenant not found"
            }

        # 1. Check if tenant is ACTUALLY staying in a property (not vacant and has an owner with active bed/stay)
        is_staying = False
        current_hostel = None

        if not tenant.is_vacant and tenant.owner:
            owner_vars = [tenant.owner.phone, tenant.owner.owner_id] if getattr(tenant.owner, 'owner_id', None) else [tenant.owner.phone]
            current_bed = TenantBeds.objects.filter(
                Q(phone__iexact=tenant.phone) & (Q(owner=tenant.owner) | Q(owner_phone__in=owner_vars))
            ).first()
            
            active_jr = JoinRequest.objects.filter(
                tenant=tenant,
                owner=tenant.owner,
                status__in=['completed', 'joined', 'active']
            ).order_by('-created_at').first()

            if current_bed or active_jr:
                current_hostel = StayHostelDetails.objects.filter(owner=tenant.owner).first()
                if current_hostel:
                    is_staying = True

        # 2. Check pending or approved hostel change requests for this target hostel
        approved_request = HostelChangeRequest.objects.filter(
            tenant=tenant,
            target_hostel_id=target_hostel_id,
            status='approved'
        ).first()

        if approved_request:
            return {
                "status": "approved_request",
                "message": "Your request has been approved. You can now select your room and bed.",
                "request_id": approved_request.id
            }

        pending_request = HostelChangeRequest.objects.filter(
            tenant=tenant,
            target_hostel_id=target_hostel_id,
            status='pending'
        ).first()

        if pending_request:
            return {
                "status": "pending_request",
                "message": "You have a pending request for this hostel. Please wait for the owner to respond.",
                "request_id": pending_request.id
            }

        # Check pending JoinRequest for this target hostel
        target_hostel = StayHostelDetails.objects.filter(id=target_hostel_id).first()
        if target_hostel:
            pending_join = JoinRequest.objects.filter(
                tenant=tenant,
                property_name__iexact=target_hostel.hostelName,
                status__in=['pending', 'pending_confirmation']
            ).first()
            if pending_join:
                return {
                    "status": "pending_request",
                    "message": "You have a pending request for this property.",
                    "request_id": pending_join.id
                }

        # 3. If tenant is actually staying in another property -> Already Staying
        if is_staying and current_hostel:
            if str(current_hostel.id) == str(target_hostel_id):
                return {
                    "status": "already_staying",
                    "message": f"You are already staying in {current_hostel.hostelName}.",
                    "current_hostel": {
                        "id": current_hostel.id,
                        "name": current_hostel.hostelName,
                        "location": current_hostel.location
                    },
                    "can_request_change": False
                }
            return {
                "status": "already_staying",
                "message": "You are currently registered in a property. You can request a hostel change to this property below.",
                "current_hostel": {
                    "id": current_hostel.id,
                    "name": current_hostel.hostelName,
                    "location": current_hostel.location
                },
                "can_request_change": True
            }

        # 4. Otherwise tenant is not in any property (vacant) -> Can book directly
        return {
            "status": "can_book",
            "message": "You can book this hostel"
        }
