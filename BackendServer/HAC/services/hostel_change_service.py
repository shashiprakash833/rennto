"""
Service for handling advance booking and hostel change requests.
Enforces single active advance booking rules, status transitions, notifications, and real-time WebSocket updates.
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
)
from .common_service import CommonService
from .notification_service import NotificationService


class HostelChangeService:
    """
    Service for managing Advance Booking and Hostel Change requests.
    Handles creation, approval (accept), rejection (decline), cancellation, and status checks.
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
            if not channel_layer:
                return
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
        Create a new Advance Booking / Hostel Change request.
        
        Expected data fields:
        - tenant_phone: str
        - target_hostel_id: int
        - expected_joining_date: str (YYYY-MM-DD format)
        - message_to_owner: str (optional)
        """
        tenant_phone = (data.get("tenant_phone") or "").strip()
        target_hostel_id = data.get("target_hostel_id") or data.get("target_property_id")
        expected_joining_date = data.get("expected_joining_date")
        message_to_owner = (data.get("message_to_owner") or data.get("message") or "").strip()

        if not tenant_phone or not target_hostel_id or not expected_joining_date:
            raise ValueError("Missing required fields: tenant_phone, target_hostel_id, expected_joining_date")

        # Parse and validate the expected joining date
        try:
            joining_date = date.fromisoformat(str(expected_joining_date).split('T')[0])
        except ValueError:
            raise ValueError("Invalid date format for expected_joining_date. Use YYYY-MM-DD")

        if joining_date < date.today():
            raise ValueError("Expected joining date cannot be in the past.")

        # Get the tenant
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        tenant_name = (data.get("tenant_name") or tenant.name or "").strip()
        tenant_email = (data.get("tenant_email") or getattr(tenant, "email", "") or "").strip()
        requested_room_preference = (data.get("requested_room_preference") or data.get("room_preference") or "").strip()
        additional_details = (data.get("additional_details") or message_to_owner or "").strip()

        # Check if tenant is blocked
        is_blocked = BlockedTenant.objects.filter(
            tenant=tenant, is_active=True
        ).exists()
        if is_blocked:
            raise ValueError("You are blocked by an owner and cannot send requests until unblocked.")

        # Get the target hostel / property
        try:
            target_hostel = StayHostelDetails.objects.select_related('owner').get(id=target_hostel_id)
        except StayHostelDetails.DoesNotExist:
            raise Exception("Target property not found")

        if not target_hostel.owner:
            raise Exception("Target property owner not found")

        # -------------------------------------------------------------
        # SINGLE ACTIVE ADVANCE BOOKING RULE ENFORCEMENT
        # -------------------------------------------------------------
        pending_existing = HostelChangeRequest.objects.filter(
            tenant=tenant,
            status='pending'
        ).first()

        if pending_existing:
            raise ValueError("You already have a pending advance booking request.")

        accepted_existing = HostelChangeRequest.objects.filter(
            tenant=tenant,
            status__in=['accepted', 'approved']
        ).first()

        if accepted_existing:
            raise ValueError("You have already secured an advance booking for another property.")

        # Determine current hostel (if staying somewhere)
        current_hostel = None
        current_hostel_bed = TenantBeds.objects.filter(phone=tenant.phone).first()
        if current_hostel_bed:
            current_owner = current_hostel_bed.owner or CommonService.get_owner(current_hostel_bed.owner_phone)
            if current_owner:
                current_hostel = StayHostelDetails.objects.filter(owner=current_owner).first()

        if current_hostel and current_hostel.id == target_hostel.id:
            raise ValueError("You cannot request an advance booking for the property you are currently staying in.")

        # Calculate days remaining
        today = date.today()
        days_remaining = max(0, (joining_date - today).days)

        # Create the request
        change_request = HostelChangeRequest.objects.create(
            tenant=tenant,
            current_hostel=current_hostel,
            target_hostel=target_hostel,
            target_owner=target_hostel.owner,
            expected_joining_date=joining_date,
            days_remaining_in_current_hostel=days_remaining,
            tenant_email=tenant_email,
            requested_room_preference=requested_room_preference,
            additional_details=additional_details,
            message_to_owner=message_to_owner,
            status='pending'
        )

        # Create Notification for Owner in DB
        owner = target_hostel.owner
        curr_desc = current_hostel.hostelName if current_hostel else "New Tenant"
        notification_message = (
            f"{tenant.name} has requested an advance booking for {target_hostel.hostelName} "
            f"(Joining Date: {joining_date.isoformat()})."
        )

        Notification.objects.create(
            owner_account=owner,
            recipient_phone=owner.phone,
            title="Advance Booking Request 📩",
            message=notification_message,
            type='ADVANCE_BOOKING',
            related_id=change_request.id,
        )

        Issue.objects.create(
            tenant=tenant,
            owner=owner,
            property_type="hostel",
            title=f"Advance Booking Request - {tenant.name}",
            description=(
                f"{tenant.name} requested advance booking for {target_hostel.hostelName} "
                f"from {curr_desc} on {joining_date.isoformat()}. "
                f"Message: {message_to_owner or 'None'}"
            ),
            severity="Medium",
            status="Pending",
        )

        # Create Notification for Tenant in DB
        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Advance Booking Request Submitted",
            message=f"Your advance booking request for {target_hostel.hostelName} has been submitted to the property owner.",
            is_read=False,
        )

        # Push Notification to Owner
        if owner.push_token:
            NotificationService.send_push_notification(
                owner.push_token,
                "Advance Booking Request 📩",
                notification_message
            )

        # Real-time WebSocket to Owner & Tenant
        sanitized_owner = HostelChangeService._sanitize_phone(owner.owner_id if owner.owner_id else owner.phone)
        sanitized_tenant = HostelChangeService._sanitize_phone(tenant.phone)

        ws_payload = {
            "type": "hostel_change_request",
            "title": "Advance Booking Request 📩",
            "message": notification_message,
            "request_id": change_request.id,
            "status": "pending",
            "target_hostel_name": target_hostel.hostelName,
            "tenant_name": tenant.name,
            "tenant_phone": tenant.phone,
            "expected_joining_date": joining_date.isoformat(),
        }

        HostelChangeService._send_ws_notification(
            [
                f"owner_status_{sanitized_owner}",
                f"user_notifications_{sanitized_owner}",
            ],
            ws_payload
        )
        HostelChangeService._send_ws_notification(
            [
                f"user_notifications_{sanitized_tenant}",
                f"tenant_notifications_{sanitized_tenant}",
            ],
            {
                "type": "tenant_advance_booking_created",
                "message": f"Your advance booking request for {target_hostel.hostelName} has been sent.",
                "request_id": change_request.id,
                "status": "pending"
            }
        )

        return {
            "success": True,
            "message": "Your advance booking request has been submitted successfully",
            "request_id": change_request.id,
            "existing": False,
            "status": "pending"
        }

    @staticmethod
    @transaction.atomic
    def approve_change_request(request_id, acting_owner=None):
        """
        Accept / Approve an advance booking request (Owner Action).
        1. Update request status to Accepted.
        2. Send notification to tenant: 'Your advance booking request for <Property Name> has been accepted.'
        3. Broadcast real-time WS events to update badges and refresh views instantly.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Advance booking request not found")

        if acting_owner and change_request.target_owner and not CommonService.is_same_or_authorized_owner(acting_owner, change_request.target_owner):
            raise ValueError("You are not authorized to accept this request.")

        if change_request.status != 'pending':
            raise ValueError(f"Can only accept pending requests. Current status: {change_request.status}")

        change_request.status = 'accepted'
        change_request.save()

        Issue.objects.filter(
            tenant=change_request.tenant,
            title__icontains="Advance Booking Request",
            owner=change_request.target_owner,
            status="Pending",
        ).update(status="Completed")

        Issue.objects.filter(
            tenant=change_request.tenant,
            title__icontains="Hostel Change Request",
            owner=change_request.target_owner,
            status="Pending",
        ).update(status="Completed")

        tenant = change_request.tenant
        prop_name = change_request.target_hostel.hostelName
        tenant_message = f"Your advance booking request for {prop_name} has been accepted."

        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Advance Booking Accepted 🎉",
            message=tenant_message,
            is_read=False,
        )

        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Advance Booking Accepted 🎉",
                tenant_message
            )

        sanitized_tenant = HostelChangeService._sanitize_phone(tenant.phone)
        sanitized_owner = HostelChangeService._sanitize_phone(
            change_request.target_owner.owner_id if change_request.target_owner.owner_id else change_request.target_owner.phone
        )

        # Notify tenant
        HostelChangeService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}", f"tenant_notifications_{sanitized_tenant}"],
            {
                "type": "hostel_change_approved",
                "message": tenant_message,
                "request_id": change_request.id,
                "status": "accepted",
                "target_hostel_id": change_request.target_hostel.id,
                "target_hostel_name": prop_name
            }
        )

        # Notify owner
        HostelChangeService._send_ws_notification(
            [f"owner_status_{sanitized_owner}", f"user_notifications_{sanitized_owner}"],
            {
                "type": "hostel_change_status_updated",
                "message": f"Advance booking request for {tenant.name} accepted.",
                "request_id": change_request.id,
                "status": "accepted"
            }
        )

        return {"success": True, "message": "Request accepted successfully", "status": "accepted"}

    @staticmethod
    @transaction.atomic
    def reject_change_request(request_id, rejection_reason="", acting_owner=None):
        """
        Decline / Reject an advance booking request (Owner Action).
        1. Update status to Declined.
        2. Send notification: 'Your advance booking request for <Property Name> has been declined.'
        3. Broadcast real-time WS events to update badges and refresh views instantly.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Advance booking request not found")

        if acting_owner and change_request.target_owner and not CommonService.is_same_or_authorized_owner(acting_owner, change_request.target_owner):
            raise ValueError("You are not authorized to decline this request.")

        if change_request.status != 'pending':
            raise ValueError(f"Can only decline pending requests. Current status: {change_request.status}")

        change_request.status = 'declined'
        change_request.rejection_reason = rejection_reason or ""
        change_request.save()

        Issue.objects.filter(
            tenant=change_request.tenant,
            title__icontains="Advance Booking Request",
            owner=change_request.target_owner,
            status="Pending",
        ).update(status="Completed")

        Issue.objects.filter(
            tenant=change_request.tenant,
            title__icontains="Hostel Change Request",
            owner=change_request.target_owner,
            status="Pending",
        ).update(status="Completed")

        tenant = change_request.tenant
        prop_name = change_request.target_hostel.hostelName
        tenant_message = f"Your advance booking request for {prop_name} has been declined."

        TenantNotification.objects.create(
            tenant_phone=tenant.phone,
            title="Advance Booking Declined",
            message=tenant_message,
            is_read=False,
        )

        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Advance Booking Declined",
                tenant_message
            )

        sanitized_tenant = HostelChangeService._sanitize_phone(tenant.phone)
        sanitized_owner = HostelChangeService._sanitize_phone(
            change_request.target_owner.owner_id if change_request.target_owner.owner_id else change_request.target_owner.phone
        )

        # Notify tenant
        HostelChangeService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}", f"tenant_notifications_{sanitized_tenant}"],
            {
                "type": "hostel_change_rejected",
                "message": tenant_message,
                "request_id": change_request.id,
                "status": "declined"
            }
        )

        # Notify owner
        HostelChangeService._send_ws_notification(
            [f"owner_status_{sanitized_owner}", f"user_notifications_{sanitized_owner}"],
            {
                "type": "hostel_change_status_updated",
                "message": f"Advance booking request for {tenant.name} declined.",
                "request_id": change_request.id,
                "status": "declined"
            }
        )

        return {"success": True, "message": "Request declined successfully", "status": "declined"}

    @staticmethod
    @transaction.atomic
    def cancel_change_request(request_id, tenant_phone=None):
        """
        Cancel / Withdraw an advance booking request (Tenant Action).
        Resets tenant state so they can make another booking request.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Advance booking request not found")

        if tenant_phone and change_request.tenant.phone != tenant_phone:
            raise ValueError("You are not authorized to cancel this request.")

        if change_request.status != 'pending':
            raise ValueError(f"Can only cancel pending requests. Current status: {change_request.status}")

        change_request.status = 'cancelled'
        change_request.save()

        Issue.objects.filter(
            tenant=change_request.tenant,
            title__icontains="Advance Booking Request",
            owner=change_request.target_owner,
            status="Pending",
        ).update(status="Completed")

        sanitized_tenant = HostelChangeService._sanitize_phone(change_request.tenant.phone)
        sanitized_owner = HostelChangeService._sanitize_phone(
            change_request.target_owner.owner_id if change_request.target_owner.owner_id else change_request.target_owner.phone
        )

        # Notify owner
        HostelChangeService._send_ws_notification(
            [f"owner_status_{sanitized_owner}", f"user_notifications_{sanitized_owner}"],
            {
                "type": "hostel_change_status_updated",
                "message": f"Advance booking request from {change_request.tenant.name} was cancelled by tenant.",
                "request_id": change_request.id,
                "status": "cancelled"
            }
        )

        # Notify tenant
        HostelChangeService._send_ws_notification(
            [f"user_notifications_{sanitized_tenant}", f"tenant_notifications_{sanitized_tenant}"],
            {
                "type": "hostel_change_status_updated",
                "message": "Your advance booking request has been cancelled.",
                "request_id": change_request.id,
                "status": "cancelled"
            }
        )

        return {"success": True, "message": "Advance booking request cancelled successfully", "status": "cancelled"}

    @staticmethod
    def get_pending_requests_for_owner(owner_id):
        """
        Get all pending advance booking requests for an owner.
        """
        owner = CommonService.get_owner(owner_id)
        if not owner:
            raise Exception("Owner not found")

        requests = HostelChangeRequest.objects.filter(
            target_owner=owner,
            status='pending'
        ).select_related('tenant', 'current_hostel', 'target_hostel', 'target_owner').order_by('-created_at')

        return requests

    @staticmethod
    def get_all_requests_for_owner(owner_id, status_filter=None):
        """
        Get all advance booking requests for an owner (with optional status filter).
        """
        owner = CommonService.get_owner(owner_id)
        if not owner:
            raise Exception("Owner not found")

        query = HostelChangeRequest.objects.filter(target_owner=owner)
        if status_filter and status_filter.lower() != 'all':
            if status_filter.lower() in ['accepted', 'approved']:
                query = query.filter(status__in=['accepted', 'approved'])
            elif status_filter.lower() in ['declined', 'rejected']:
                query = query.filter(status__in=['declined', 'rejected'])
            else:
                query = query.filter(status=status_filter.lower())

        return query.select_related('tenant', 'current_hostel', 'target_hostel', 'target_owner').order_by('-created_at')

    @staticmethod
    def get_request_details(request_id):
        """
        Get detailed information about a specific advance booking request.
        """
        try:
            change_request = HostelChangeRequest.objects.select_related(
                'tenant', 'current_hostel', 'target_hostel', 'target_owner'
            ).get(id=request_id)
        except HostelChangeRequest.DoesNotExist:
            raise Exception("Advance booking request not found")

        return change_request

    @staticmethod
    def get_tenant_change_requests(tenant_phone):
        """
        Get all advance booking requests for a specific tenant.
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
        Check if a tenant can book a hostel or property.
        Returns:
        - status:
            'can_book' |
            'pending_request' (for this property) |
            'pending_other_property' (for another property) |
            'approved_request' (for this property) |
            'accepted_other_property' (for another property) |
            'already_staying' |
            'error'
        - message: Description of the status
        - request_id: (optional) ID of pending/approved request
        - target_property_name: (optional) Name of requested property
        - current_hostel: (optional) Details of current hostel
        """
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            return {
                "status": "error",
                "message": "Tenant not found"
            }

        # Check ANY active pending advance bookings for this tenant
        pending_req = HostelChangeRequest.objects.filter(
            tenant=tenant,
            status='pending'
        ).select_related('target_hostel').first()

        if pending_req:
            if str(pending_req.target_hostel_id) == str(target_hostel_id):
                return {
                    "status": "pending_request",
                    "message": "Your advance booking request is pending owner response.",
                    "request_id": pending_req.id,
                    "target_property_name": pending_req.target_hostel.hostelName if pending_req.target_hostel else ""
                }
            else:
                return {
                    "status": "pending_other_property",
                    "message": "You already have a pending advance booking request.",
                    "request_id": pending_req.id,
                    "target_property_name": pending_req.target_hostel.hostelName if pending_req.target_hostel else ""
                }

        # Check ANY active accepted/approved advance bookings for this tenant
        approved_req = HostelChangeRequest.objects.filter(
            tenant=tenant,
            status__in=['accepted', 'approved']
        ).select_related('target_hostel').first()

        if approved_req:
            if str(approved_req.target_hostel_id) == str(target_hostel_id):
                return {
                    "status": "approved_request",
                    "message": "Your advance booking request has been accepted.",
                    "request_id": approved_req.id,
                    "target_property_name": approved_req.target_hostel.hostelName if approved_req.target_hostel else ""
                }
            else:
                return {
                    "status": "accepted_other_property",
                    "message": "You have already secured an advance booking for another property.",
                    "request_id": approved_req.id,
                    "target_property_name": approved_req.target_hostel.hostelName if approved_req.target_hostel else ""
                }

        # Check if tenant has any active stay
        if not tenant.is_vacant:
            current_bed = TenantBeds.objects.filter(phone=tenant.phone).first()
            if current_bed:
                current_hostel = StayHostelDetails.objects.filter(
                    owner=current_bed.owner or CommonService.get_owner(current_bed.owner_phone)
                ).first()

                return {
                    "status": "already_staying",
                    "message": "You are currently staying in a property.",
                    "current_hostel": {
                        "id": current_hostel.id,
                        "name": current_hostel.hostelName,
                        "location": current_hostel.location
                    } if current_hostel else None,
                    "can_request_change": True
                }

        return {
            "status": "can_book",
            "message": "You can book this hostel",
            "can_request_change": True
        }
