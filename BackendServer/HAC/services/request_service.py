from django.db import transaction
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from HAC.models import JoinRequest, Tenent, Owners, BlockedTenant, TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, ExistingTenantRequest, TenantNotification, VacateRequest, HostelChangeRequest
from .common_service import CommonService
from .notification_service import NotificationService

class RequestService:

    @staticmethod
    def update_request_status(data):
        request_id = data.get("id")
        status_value = data.get("status")
        is_existing = data.get("is_existing_tenant", None)

        # ── Delegate to ExistingTenantService if this is an existing tenant request ──
        if is_existing is True:
            from .existing_tenant_service import ExistingTenantService
            return ExistingTenantService.update_request_status(data)

        if is_existing is False:
            # Skip checking ExistingTenantRequest to avoid collision
            pass
        else:
            # Fallback if the client didn't send the flag
            existing_req = ExistingTenantRequest.objects.filter(id=request_id).first()
            join_req = JoinRequest.objects.filter(id=request_id).first()
            if existing_req and not join_req:
                from .existing_tenant_service import ExistingTenantService
                return ExistingTenantService.update_request_status(data)

        try:
            req = JoinRequest.objects.get(id=request_id)
            req.status = status_value
            req.save()

            if status_value in ['accepted', 'rejected', 'allotted', 'pending_confirmation']:
                sanitized_phone = req.tenant.phone.replace("+", "").replace("@", "_").replace(".", "_")
                message = f"Your request for {req.property_name} has been {status_value}."

                tenant = req.tenant
                


                if tenant.push_token:
                    if status_value == "accepted":
                        NotificationService.send_push_notification(tenant.push_token, "Upload Aadhaar to Join 📄", f"Your booking for {req.property_name} has been approved! Please upload Aadhaar verification to finalize your stay.")
                    elif status_value == "allotted":
                        NotificationService.send_push_notification(tenant.push_token, "Room Allotted – Upload Aadhaar 🏠", f"Your room has been allotted in {req.property_name}. Please upload Aadhaar verification to finalize your stay.")
                    elif status_value == "pending_confirmation":
                        NotificationService.send_push_notification(tenant.push_token, "Room Allotted – Action Required 🏠", f"Your room/bed has been allotted in {req.property_name}. Please open the app and confirm to activate your stay.")
                    elif status_value == "rejected":
                        NotificationService.send_push_notification(tenant.push_token, "Booking Rejected ❌", f"Your booking request for {req.property_name} has been rejected by the owner.")

                if status_value in ["accepted", "allotted", "pending_confirmation"]:
                    try:
                        from HAC.models import TenantNotification
                        TenantNotification.objects.create(
                            tenant_phone=tenant.phone,
                            title="Upload Aadhaar to Join 📄",
                            message=f"Your booking for {req.property_name} has been approved! Please upload your Aadhaar document to complete verification and join.",
                            is_read=False
                        )
                    except Exception as ex:
                        print("Error creating TenantNotification record:", ex)

                try:
                    channel_layer = get_channel_layer()
                    for group_name in [f"user_notifications_{sanitized_phone}", f"tenant_notifications_{sanitized_phone}"]:
                        async_to_sync(channel_layer.group_send)(
                            group_name,
                            {
                                "type": "send_notification",
                                "content": {
                                    "type": "status_update",
                                    "message": message,
                                    "status": status_value
                                }
                            }
                        )
                except Exception:
                    pass

            return {"message": "Status updated"}
        except JoinRequest.DoesNotExist:
            raise Exception("Request not found")

    @staticmethod
    def send_join_request(data):
        tenant_phone = data.get("tenant_phone", "").strip()
        owner_id = data.get("owner_id", "").strip()
        owner_phone = data.get("owner_phone", "").strip()
        property_name = data.get("property_name", "").strip()
        
        lookup_id = owner_id if owner_id else owner_phone
        property_type = data.get("property_type")
        check_in = data.get("check_in")
        sharing = data.get("sharing")
        flat = data.get("flat")
        section = data.get("section")

        if not tenant_phone or not lookup_id:
            raise ValueError("Missing phone fields")

        if check_in and check_in != "N/A":
            from datetime import datetime, date
            parsed_date = None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S.%fZ"):
                try:
                    parsed_date = datetime.strptime(check_in, fmt).date()
                    break
                except ValueError:
                    continue
            
            if parsed_date and parsed_date < date.today():
                raise ValueError("Check-in date cannot be in the past.")

        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        is_blocked = BlockedTenant.objects.filter(tenant=tenant, is_active=True).exists()
        if is_blocked:
            raise ValueError("You are blocked by an owner and cannot book new properties until unblocked.")

        owner = CommonService.get_owner(lookup_id)
        if not owner:
            raise Exception("Owner not found")

        # A tenant is truly active only after they've clicked Join (is_vacant=False
        # AND have a joined/completed request). A pending_confirmation tenant has not
        # yet joined so they are NOT considered active.
        if not tenant.is_vacant:
            from HAC.models import HostelChangeRequest
            approved_change = HostelChangeRequest.objects.filter(
                tenant=tenant,
                status='approved',
            ).select_related('target_hostel', 'target_owner').first()

            has_approved_switch = False
            if approved_change:
                target_name = (approved_change.target_hostel.hostelName or "").strip().lower()
                has_approved_switch = (
                    approved_change.target_owner_id == owner.id
                    or (property_name or "").strip().lower() == target_name
                )

            has_active_join = JoinRequest.objects.filter(
                tenant=tenant,
                status__in=['joined', 'completed']
            ).exists()
            if has_active_join and not has_approved_switch:
                raise ValueError("You already have an active stay. You must vacate your current property before booking another one.")
        else:
            has_approved_switch = False

        existing = JoinRequest.objects.filter(
            tenant=tenant,
            property_name__iexact=property_name,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation']
        ).first()

        if existing:
            return {"message": "You already have an active request for this property", "existing": True}

        JoinRequest.objects.create(
            tenant=tenant,
            owner=owner,
            property_name=property_name,
            property_type=property_type,
            check_in=check_in,
            sharing=sharing,
            flat=flat,
            section=section,
            status="pending"
        )

        # Keep current owner until the tenant actually joins the new hostel.
        if not has_approved_switch:
            tenant.owner = owner
            tenant.save()

        if owner.push_token:
            NotificationService.send_push_notification(owner.push_token, "New Join Request 📩", f"{tenant.name} requested to join your property")

        try:
            channel_layer = get_channel_layer()
            sanitized_phone = owner.owner_id if owner.owner_id else (owner.phone.replace("+", "") if owner else "")
            


            for group in [f"owner_status_{sanitized_phone}", f"user_notifications_{sanitized_phone}"]:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": "status_update" if "owner_status" in group else "send_notification",
                        "content": {
                            "type": "incoming_request",
                            "message": f"New join request from {tenant.name}",
                            "id": tenant.id,
                            "status": "pending"
                        }
                    }
                )
        except Exception:
            pass

        return {"message": "Request sent successfully", "existing": False}

    @staticmethod
    def owner_requests(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Exception("Owner not found")

        data = []

        # ── Regular JoinRequests ──
        requests = JoinRequest.objects.filter(owner=owner).order_by('-created_at')
        for r in requests:
            data.append({
                "id": r.id,
                "db_id": r.id,
                "name": r.tenant.name,
                "phone": r.tenant.phone,
                "status": r.status,
                "propertyName": r.property_name,
                "propertyType": r.property_type,
                "checkIn": r.check_in,
                "sharing": r.sharing,
                "flat": r.flat,
                "section": r.section,
                "created_at": r.created_at,
                "is_existing_tenant": False,
            })

        # ── Existing Tenant Requests ──
        existing_requests = ExistingTenantRequest.objects.filter(owner=owner).order_by('-created_at')
        for r in existing_requests:
            data.append({
                "id": r.id,
                "db_id": r.id,
                "name": r.tenant.name,
                "phone": r.tenant.phone,
                "status": r.status,
                "propertyName": r.property_name,
                "propertyType": r.property_type,
                "requested_floor": r.requested_floor,
                "requested_room": r.requested_room,
                "requested_bed": r.requested_bed,
                "floor": r.requested_floor,
                "room": r.requested_room,
                "bed": r.requested_bed,
                "flat": r.requested_flat or r.requested_room,
                "sharing": r.requested_sharing,
                "section": r.requested_section,
                "checkIn": None,
                "created_at": r.created_at,
                "is_existing_tenant": True,
            })

        # Sort combined list by created_at descending
        data.sort(key=lambda x: x['created_at'], reverse=True)
        return data

    @staticmethod
    def tenant_notifications(identifier):
        tenant = Tenent.objects.filter(Q(phone__iexact=identifier.strip()) | Q(name__iexact=identifier.strip())).first()
        if not tenant:
            raise Exception("Tenant not found")

        join_requests = JoinRequest.objects.filter(tenant=tenant).order_by('-created_at')
        existing_requests = ExistingTenantRequest.objects.filter(tenant=tenant).order_by('-created_at')
        data = []
        
        for r in join_requests:
            status_val = r.status
            if tenant.owner and tenant.owner != r.owner:
                if status_val in ['completed', 'accepted', 'allotted', 'joined', 'active']:
                    status_val = 'withdrawn'
            elif tenant.is_vacant:
                if status_val in ['completed', 'joined', 'active']:
                    status_val = 'withdrawn'

            data.append({
                "id": f"req_{r.id}",
                "type": "JOIN_REQUEST",
                "propertyName": r.property_name,
                "status": status_val,
                "owner_phone": r.owner.phone if r.owner else None,
                "owner_id": r.owner.owner_id if r.owner and r.owner.owner_id else None,
                "ownerPhone": r.owner.phone if r.owner else None,
                "created_at": r.created_at,
            })
            
        for r in existing_requests:
            data.append({
                "id": f"exreq_{r.id}",
                "type": "JOIN_REQUEST",
                "propertyName": r.property_name,
                "status": r.status,
                "owner_phone": r.owner.phone if r.owner else None,
                "owner_id": r.owner.owner_id if r.owner and r.owner.owner_id else None,
                "ownerPhone": r.owner.phone if r.owner else None,
                "created_at": r.created_at,
            })

        # Also include owner-sent TenantNotification records (reminders, messages, etc.)
        tenant_phone_variants = [tenant.phone, tenant.phone.lstrip('+')]
        if not tenant.phone.startswith('+'):
            tenant_phone_variants.append('+' + tenant.phone)
            tenant_phone_variants.append('+91' + tenant.phone)
            tenant_phone_variants.append('91' + tenant.phone)
        elif tenant.phone.startswith('+91'):
            tenant_phone_variants.append(tenant.phone.replace('+91', ''))
        elif tenant.phone.startswith('91'):
            tenant_phone_variants.append(tenant.phone[2:])
        msg_notifications = TenantNotification.objects.filter(
            tenant_phone__in=tenant_phone_variants
        ).order_by('-created_at')
        for n in msg_notifications:
            title_l = (n.title or "").lower()
            if "vacate" in title_l or "hostel change" in title_l:
                continue
            data.append({
                "id": f"notif_{n.id}",
                "type": "MESSAGE",
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at,
            })

        vacate_requests = VacateRequest.objects.filter(tenant=tenant).order_by('-created_at')
        for v in vacate_requests:
            data.append({
                "id": f"vacate_{v.id}",
                "type": "vacate_request",
                "title": "Vacate Request",
                "message": (
                    "Your vacate request has been approved. You have been removed from the property."
                    if (v.status or "").lower() == "approved"
                    else "Your vacate request has been declined. You remain in the property."
                    if (v.status or "").lower() == "declined"
                    else f"Your vacate request for {v.property_name} is waiting for owner approval."
                ),
                "status": (v.status or "Pending").lower(),
                "propertyName": v.property_name,
                "created_at": v.created_at,
            })

        hostel_changes = HostelChangeRequest.objects.filter(tenant=tenant).select_related(
            'current_hostel', 'target_hostel'
        ).order_by('-created_at')
        for h in hostel_changes:
            target_name = h.target_hostel.hostelName if h.target_hostel else "hostel"
            if h.status == "approved":
                message = f"Your hostel change request for {target_name} was approved. Select floor, room, and bed to complete the move."
            elif h.status == "rejected":
                message = f"Your hostel change request for {target_name} was rejected. You remain in your current hostel."
            else:
                message = f"Your hostel change request for {target_name} is pending owner approval."
            data.append({
                "id": f"hc_{h.id}",
                "type": "hostel_change_request",
                "title": "Hostel Change Request",
                "message": message,
                "status": h.status,
                "propertyName": target_name,
                "rejection_reason": h.rejection_reason,
                "created_at": h.created_at,
            })

        data.sort(key=lambda x: x['created_at'], reverse=True)
        return data

    @staticmethod
    def check_request_status(tenant_phone, owner_phone, property_name):
        tenant = CommonService.get_tenant(tenant_phone.strip())
        if not tenant:
            return {"status": "none", "error": "Tenant not found"}

        owner = CommonService.get_owner(owner_phone.strip())
        if not owner:
            return {"status": "none", "error": "Owner not found"}

        stripped_name = property_name.strip()
        join_req = JoinRequest.objects.filter(
            tenant=tenant,
            owner=owner
        ).filter(
            Q(property_name__iexact=stripped_name) | Q(property_name__icontains=stripped_name)
        ).order_by('-created_at').first()

        existing_req = ExistingTenantRequest.objects.filter(
            tenant=tenant,
            owner=owner
        ).filter(
            Q(property_name__iexact=stripped_name) | Q(property_name__icontains=stripped_name)
        ).order_by('-created_at').first()

        latest_req = None
        if join_req and existing_req:
            latest_req = join_req if join_req.created_at > existing_req.created_at else existing_req
        else:
            latest_req = join_req or existing_req

        if latest_req:
            status_val = latest_req.status
            if tenant.owner and tenant.owner != owner:
                if status_val in ['completed', 'accepted', 'allotted', 'joined', 'active']:
                    status_val = 'none'
            elif tenant.is_vacant:
                if status_val in ['completed', 'joined', 'active']:
                    status_val = 'none'
            return {"status": status_val}

        return {"status": "none"}

    @staticmethod
    @transaction.atomic
    def withdraw_request(data):
        tenant_phone = (data.get("tenant_phone") or data.get("tenantPhone") or "").strip()
        owner_id = (data.get("owner_id") or "").strip()
        owner_phone = (data.get("owner_phone") or data.get("ownerPhone") or "").strip()
        property_name = (data.get("property_name") or data.get("propertyName") or "").strip()
 
        lookup_id = owner_id if owner_id else owner_phone
 
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")
 
        owner = CommonService.get_owner(lookup_id)
        if not owner:
            raise Exception("Owner not found")
 
        query = JoinRequest.objects.filter(
            tenant=tenant,
            owner=owner,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation', 'completed']
        )
        existing_query = ExistingTenantRequest.objects.filter(
            tenant=tenant,
            owner=owner,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation', 'completed']
        )
 
        if property_name:
            stripped_name = property_name.strip()
            query = query.filter(
                Q(property_name__iexact=stripped_name) |
                Q(property_name__icontains=stripped_name)
            )
            existing_query = existing_query.filter(
                Q(property_name__iexact=stripped_name) |
                Q(property_name__icontains=stripped_name)
            )
 
        updated_count = query.update(status='withdrawn')
        updated_count += existing_query.update(status='withdrawn')
 
        deleted_allotments = 0
        deleted_allotments += TenantBeds.objects.filter(phone=tenant_phone, owner=owner).delete()[0]
        deleted_allotments += ApartmentTenantBeds.objects.filter(phone=tenant_phone, owner=owner).delete()[0]
        deleted_allotments += CommercialTenantBeds.objects.filter(phone=tenant_phone, owner=owner).delete()[0]
 
        has_active_join = JoinRequest.objects.filter(
            tenant=tenant,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation', 'completed']
        ).exists()
        has_active_existing = ExistingTenantRequest.objects.filter(
            tenant=tenant,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation', 'completed']
        ).exists()
        has_active = has_active_join or has_active_existing
 
        if not has_active:
            tenant.owner = None
            tenant.is_vacant = True
            tenant.save()
 
        if updated_count > 0:
            try:
                channel_layer = get_channel_layer()
                sanitized_phone = owner_phone.replace("@", "_").replace(".", "_")
                for group in [f"owner_status_{sanitized_phone}", f"user_notifications_{sanitized_phone}"]:
                    async_to_sync(channel_layer.group_send)(
                        group,
                        {
                            "type": "status_update" if "owner_status" in group else "send_notification",
                            "content": {
                                "type": "request_withdrawn",
                                "message": f"{tenant.name} has withdrawn their request",
                                "tenant_phone": tenant_phone,
                                "id": None,
                                "status": "withdrawn"
                            }
                        }
                    )
            except Exception:
                pass
            return {"message": "Request withdrawn successfully", "updated_count": updated_count}
       
        return {"message": "No active request found to withdraw", "updated_count": 0}
    @staticmethod
    @transaction.atomic
    def delete_tenent_request(phone):
        tenantsreq = JoinRequest.objects.filter(tenant__phone=phone)
        tenantsbed = TenantBeds.objects.filter(phone=phone)
        
        if not tenantsreq.exists() and not tenantsbed.exists():
            raise Exception("Tenant not found")
            
        deleted_req_count = tenantsreq.count()
        deleted_bed_count = tenantsbed.count()

        tenantsreq.update(status='withdrawn')
        tenantsbed.delete()

        return {
            "message": "Tenant request(s) withdrawn/deleted successfully",
            "join_requests_withdrawn": deleted_req_count,
            "beds_deleted": deleted_bed_count
        }
