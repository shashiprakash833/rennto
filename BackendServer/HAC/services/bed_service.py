from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_date
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from HAC.models import Tenent, Owners, TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, JoinRequest, TenantNotification
from HAC.serializers import TenantBedSerializer, ApartmentBedSerializer, CommercialBedSerializer
from .common_service import CommonService
from .notification_service import NotificationService


class BedService:

    # ─────────────────────────────────────────────────────────────────────
    # OFFLINE TENANT HELPER  (unchanged – used only for offline/walk-in tenants)
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def handle_offline_tenant(data, files, owner):
        is_offline = data.get('is_offline') == 'true' or data.get('has_app') == 'false'
        if is_offline:
            aadhar_id = data.get('aadhar_id')
            if not aadhar_id:
                raise ValueError("Aadhaar ID is required for offline tenant.")
            if not aadhar_id.isdigit() or len(aadhar_id) != 12:
                raise ValueError("Aadhaar ID must be exactly 12 numeric digits.")

            tenant_phone = data.get('phone')
            if not tenant_phone:
                raise ValueError("Tenant contact number is required.")

            existing_with_aadhar = Tenent.objects.filter(aadhar_id=aadhar_id).first()
            if existing_with_aadhar and existing_with_aadhar.phone != tenant_phone:
                raise ValueError("This Aadhaar ID is already registered to another user.")

            t_obj = Tenent.objects.filter(phone=tenant_phone).first()
            if t_obj:
                t_obj.name = data.get('name', t_obj.name)
                t_obj.aadhar_id = aadhar_id
                if files and 'aadhar_image' in files:
                    t_obj.aadhar_image = files['aadhar_image']
                t_obj.owner = owner
                t_obj.is_vacant = False
                t_obj.save()
            else:
                t_obj = Tenent.objects.create(
                    name=data.get('name'),
                    phone=tenant_phone,
                    aadhar_id=aadhar_id,
                    aadhar_image=files.get('aadhar_image') if files else None,
                    owner=owner,
                    is_vacant=False
                )
            return t_obj
        return None

    # ─────────────────────────────────────────────────────────────────────
    # HOSTEL BED  –  owner allots → store on JoinRequest (pending_confirmation)
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def register_beds(data, files):
        if hasattr(data, 'copy'):
            data = data.copy()

        owner_phone = data.get('owner_phone')
        owner = CommonService.get_owner(owner_phone) if owner_phone else None
        if owner:
            data['owner_phone'] = owner.owner_id

        # Offline tenants are created/updated here
        tenant_obj = BedService.handle_offline_tenant(data, files, owner)
        if not tenant_obj:
            tenant_phone = data.get('phone', '').strip()
            tenant_obj = Tenent.objects.filter(phone=tenant_phone).first()
            if not tenant_obj:
                raise ValueError("Tenant not found. Cannot allot bed.")

        # Immediately save the bed allocation for both online and offline tenants
        serializer = TenantBedSerializer(data=data)
        if serializer.is_valid():
            serializer.save(owner=owner)
            tenant_obj.is_vacant = False
            tenant_obj.owner = owner
            tenant_obj.save()
        else:
            raise ValueError(serializer.errors)

        # Update the active JoinRequest for this tenant+owner to 'joined'
        join_req = JoinRequest.objects.filter(
            tenant=tenant_obj,
            owner=owner,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation']
        ).order_by('-created_at').first()

        # Parse values
        bed = data.get('bed')
        floor = data.get('floor')
        roomno = data.get('roomno')
        rent = data.get('rent')
        check_in_raw = data.get('checkIn') or data.get('check_in')
        check_out_raw = data.get('checkOut') or data.get('check_out')
        check_in = parse_date(str(check_in_raw)) if check_in_raw else None
        check_out = parse_date(str(check_out_raw)) if check_out_raw else None

        if join_req:
            join_req.status = 'joined'
            join_req.allotted_bed = bed
            join_req.allotted_floor = floor
            join_req.allotted_roomno = roomno
            join_req.allotted_rent = rent
            join_req.allotted_check_in = check_in
            join_req.allotted_check_out = check_out
            join_req.allotted_owner_phone = owner.owner_id if owner else owner_phone
            join_req.property_type = 'hostel'
            join_req.save()
        elif data.get('is_offline') != 'true' and data.get('has_app') != 'false':
            # No prior request – create one in joined state for online tenant tracking
            JoinRequest.objects.create(
                tenant=tenant_obj,
                owner=owner,
                property_name=data.get('property_name', ''),
                property_type='hostel',
                status='joined',
                allotted_bed=bed,
                allotted_floor=floor,
                allotted_roomno=roomno,
                allotted_rent=rent,
                allotted_check_in=check_in,
                allotted_check_out=check_out,
                allotted_owner_phone=owner.owner_id if owner else owner_phone,
            )

        return {
            "message": "Tenant Added Successfully",
            "data": serializer.data
        }

    # ─────────────────────────────────────────────────────────────────────
    # APARTMENT BED  –  owner allots → store on JoinRequest
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def register_apartment_beds(data, files):
        if hasattr(data, 'copy'):
            data = data.copy()

        owner_phone = data.get('owner_phone')
        owner = CommonService.get_owner(owner_phone) if owner_phone else None
        if owner:
            data['owner_phone'] = owner.owner_id

        tenant_obj = BedService.handle_offline_tenant(data, files, owner)
        if not tenant_obj:
            tenant_phone = data.get('phone', '').strip()
            tenant_obj = Tenent.objects.filter(phone=tenant_phone).first()
            if not tenant_obj:
                raise ValueError("Tenant not found. Cannot allot flat.")

        serializer = ApartmentBedSerializer(data=data)
        if serializer.is_valid():
            serializer.save(owner=owner)
            tenant_obj.is_vacant = False
            tenant_obj.owner = owner
            tenant_obj.save()
        else:
            raise ValueError(serializer.errors)

        join_req = JoinRequest.objects.filter(
            tenant=tenant_obj,
            owner=owner,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation']
        ).order_by('-created_at').first()

        floor = data.get('floor')
        flatno = data.get('flatno')
        rent = data.get('rent')
        check_in_raw = data.get('checkIn') or data.get('check_in')
        check_out_raw = data.get('checkOut') or data.get('check_out')
        check_in = parse_date(str(check_in_raw)) if check_in_raw else None
        check_out = parse_date(str(check_out_raw)) if check_out_raw else None

        if join_req:
            join_req.status = 'joined'
            join_req.allotted_floor = floor
            join_req.allotted_flatno = flatno
            join_req.allotted_rent = rent
            join_req.allotted_check_in = check_in
            join_req.allotted_check_out = check_out
            join_req.allotted_owner_phone = owner.owner_id if owner else owner_phone
            join_req.property_type = 'apartment'
            join_req.save()
        elif data.get('is_offline') != 'true' and data.get('has_app') != 'false':
            JoinRequest.objects.create(
                tenant=tenant_obj,
                owner=owner,
                property_name=data.get('property_name', ''),
                property_type='apartment',
                status='joined',
                allotted_floor=floor,
                allotted_flatno=flatno,
                allotted_rent=rent,
                allotted_check_in=check_in,
                allotted_check_out=check_out,
                allotted_owner_phone=owner.owner_id if owner else owner_phone,
            )

        return {
            "message": "Tenant Added Successfully",
            "data": serializer.data
        }

    # ─────────────────────────────────────────────────────────────────────
    # COMMERCIAL BED  –  owner allots → store on JoinRequest
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def register_commercial_beds(data, files):
        if hasattr(data, 'copy'):
            data = data.copy()

        owner_phone = data.get('owner_phone')
        owner = CommonService.get_owner(owner_phone) if owner_phone else None
        if owner:
            data['owner_phone'] = owner.owner_id

        tenant_obj = BedService.handle_offline_tenant(data, files, owner)
        if not tenant_obj:
            tenant_phone = data.get('phone', '').strip()
            tenant_obj = Tenent.objects.filter(phone=tenant_phone).first()
            if not tenant_obj:
                raise ValueError("Tenant not found. Cannot allot section.")

        serializer = CommercialBedSerializer(data=data)
        if serializer.is_valid():
            serializer.save(owner=owner)
            tenant_obj.is_vacant = False
            tenant_obj.owner = owner
            tenant_obj.save()
        else:
            raise ValueError(serializer.errors)

        join_req = JoinRequest.objects.filter(
            tenant=tenant_obj,
            owner=owner,
            status__in=['pending', 'accepted', 'allotted', 'pending_confirmation']
        ).order_by('-created_at').first()

        floor = data.get('floor')
        sectionno = data.get('sectionNo')
        rent = data.get('rent')
        check_in_raw = data.get('checkIn') or data.get('check_in')
        check_out_raw = data.get('checkOut') or data.get('check_out')
        check_in = parse_date(str(check_in_raw)) if check_in_raw else None
        check_out = parse_date(str(check_out_raw)) if check_out_raw else None

        if join_req:
            join_req.status = 'joined'
            join_req.allotted_floor = floor
            join_req.allotted_sectionno = sectionno
            join_req.allotted_rent = rent
            join_req.allotted_check_in = check_in
            join_req.allotted_check_out = check_out
            join_req.allotted_owner_phone = owner.owner_id if owner else owner_phone
            join_req.property_type = 'commercial'
            join_req.save()
        elif data.get('is_offline') != 'true' and data.get('has_app') != 'false':
            JoinRequest.objects.create(
                tenant=tenant_obj,
                owner=owner,
                property_name=data.get('property_name', ''),
                property_type='commercial',
                status='joined',
                allotted_floor=floor,
                allotted_sectionno=sectionno,
                allotted_rent=rent,
                allotted_check_in=check_in,
                allotted_check_out=check_out,
                allotted_owner_phone=owner.owner_id if owner else owner_phone,
            )

        return {
            "message": "Tenant Added Successfully",
            "data": serializer.data
        }

    # ─────────────────────────────────────────────────────────────────────
    # TENANT CONFIRMS JOIN  –  creates TenantBeds and activates tenant
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    @transaction.atomic
    def tenant_join_booking(data):
        """
        Called when the tenant clicks 'Join' / 'Confirm'.
        Finds the pending_confirmation JoinRequest, creates the TenantBeds record,
        sets tenant.is_vacant=False, and transitions JoinRequest → 'joined'.
        """
        tenant_phone = (data.get('tenant_phone') or '').strip()
        request_id = data.get('request_id')  # optional – target a specific JoinRequest

        if not tenant_phone and not request_id:
            raise ValueError("tenant_phone or request_id is required.")

        if request_id:
            join_req = JoinRequest.objects.filter(
                id=request_id,
                status='pending_confirmation'
            ).first()
        else:
            tenant = Tenent.objects.filter(phone=tenant_phone).first()
            if not tenant:
                raise Exception("Tenant not found.")
            join_req = JoinRequest.objects.filter(
                tenant=tenant,
                status='pending_confirmation'
            ).order_by('-created_at').first()

        if not join_req:
            raise Exception("No pending confirmation found for this tenant.")

        tenant = join_req.tenant
        owner = join_req.owner
        property_type = (join_req.property_type or '').lower()
        owner_phone = join_req.allotted_owner_phone or (owner.owner_id if owner else '')
        check_in = join_req.allotted_check_in
        check_out = join_req.allotted_check_out
        rent = join_req.allotted_rent or 0

        if property_type == 'hostel':
            TenantBeds.objects.create(
                owner=owner,
                owner_phone=owner_phone,
                name=tenant.name,
                phone=tenant.phone,
                bed=join_req.allotted_bed or 1,
                floor=join_req.allotted_floor,
                roomno=join_req.allotted_roomno,
                rent=rent,
                checkIn=check_in,
                checkOut=check_out,
            )
        elif property_type == 'apartment':
            ApartmentTenantBeds.objects.create(
                owner=owner,
                owner_phone=owner_phone,
                name=tenant.name,
                phone=tenant.phone,
                floor=join_req.allotted_floor,
                flatno=join_req.allotted_flatno,
                rent=rent,
                checkIn=check_in,
                checkOut=check_out,
            )
        elif property_type == 'commercial':
            CommercialTenantBeds.objects.create(
                owner=owner,
                owner_phone=owner_phone,
                name=tenant.name,
                phone=tenant.phone,
                floor=join_req.allotted_floor,
                sectionNo=join_req.allotted_sectionno,
                rent=rent,
                checkIn=check_in,
                checkOut=check_out,
            )
        else:
            raise ValueError(f"Unknown property_type '{property_type}' on JoinRequest.")

        # Activate the tenant
        tenant.is_vacant = False
        tenant.owner = owner
        tenant.save()

        # Transition the request
        join_req.status = 'joined'
        join_req.save()

        return {
            "message": "Booking confirmed. You are now an active tenant.",
            "status": "joined",
            "property_type": property_type,
        }

    # ─────────────────────────────────────────────────────────────────────
    # READ / LIST
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def get_tenants_beds(phone, request=None):
        owner = CommonService.get_owner(phone)
        if not owner:
            return []
        beds = TenantBeds.objects.filter(
            Q(owner=owner) | Q(owner_phone=owner.owner_id)
        )
        return TenantBedSerializer(beds, many=True, context={'request': request}).data

    @staticmethod
    def get_apartment_beds(phone, request=None):
        owner = CommonService.get_owner(phone)
        if not owner:
            return []
        beds = ApartmentTenantBeds.objects.filter(
            Q(owner=owner) | Q(owner_phone=owner.owner_id)
        )
        return ApartmentBedSerializer(beds, many=True, context={'request': request}).data

    @staticmethod
    def get_commercial_beds(phone, request=None):
        owner = CommonService.get_owner(phone)
        if not owner:
            return []
        beds = CommercialTenantBeds.objects.filter(
            Q(owner=owner) | Q(owner_phone=owner.owner_id)
        )
        return CommercialBedSerializer(beds, many=True, context={'request': request}).data

    # ─────────────────────────────────────────────────────────────────────
    # DELETE
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _hard_delete_tenant_data(t_obj, owner, property_type):
        from HAC.models import Issue, Payment, ExistingTenantRequest, Notification, JoinRequest, StayHostelDetails, ApartmentStayDetails, CommericialDetails
        if not owner or not t_obj:
            return

        phone = t_obj.phone

        issue_ids = list(Issue.objects.filter(tenant__phone=phone, owner=owner).values_list('id', flat=True))
        payment_ids = list(Payment.objects.filter(tenant_phone=phone, owner=owner).values_list('id', flat=True))

        # Delete Issues
        Issue.objects.filter(tenant__phone=phone, owner=owner).delete()

        # Mark Join Requests as removed instead of deleting to preserve history
        JoinRequest.objects.filter(tenant__phone=phone, owner=owner).update(status='removed')

        # Mark Existing Tenant Requests as removed
        ExistingTenantRequest.objects.filter(tenant__phone=phone, owner=owner).update(status='removed')

        # Delete Payments
        Payment.objects.filter(tenant_phone=phone, owner=owner).delete()

        # Safely Delete Owner Notifications linked by exact ID
        if issue_ids:
            Notification.objects.filter(owner_account=owner, type__iexact='ISSUE', related_id__in=issue_ids).delete()
        if payment_ids:
            Notification.objects.filter(owner_account=owner, type__iexact='PAYMENT', related_id__in=payment_ids).delete()

        # Delete Tenant Notifications
        from HAC.models import TenantNotification
        TenantNotification.objects.filter(tenant_phone=phone).delete()

    @staticmethod
    @transaction.atomic
    def delete_hostel_tenant(id):
        tenant_bed = TenantBeds.objects.filter(id=id).first()
        if not tenant_bed:
            raise Exception("Tenant not found")

        t_obj = Tenent.objects.filter(phone=tenant_bed.phone).first()
        if t_obj:
            t_obj.is_vacant = True
            t_obj.owner = None
            t_obj.save()

            # ── Notify the tenant immediately ──
            BedService._notify_tenant_removed(t_obj, tenant_bed.owner_phone)

            # ── Hard delete related records ──
            BedService._hard_delete_tenant_data(t_obj, tenant_bed.owner, 'hostel')

        tenant_bed.delete()
        return {"message": "Tenant Deleted Successfully"}

    @staticmethod
    @transaction.atomic
    def delete_apartment_tenant(id):
        tenant_bed = ApartmentTenantBeds.objects.filter(id=id).first()
        if not tenant_bed:
            raise Exception("Tenant not found")

        t_obj = Tenent.objects.filter(phone=tenant_bed.phone).first()
        if t_obj:
            t_obj.is_vacant = True
            t_obj.owner = None
            t_obj.save()

            # ── Notify the tenant immediately ──
            BedService._notify_tenant_removed(t_obj, tenant_bed.owner_phone)

            # ── Hard delete related records ──
            BedService._hard_delete_tenant_data(t_obj, tenant_bed.owner, 'apartment')

        tenant_bed.delete()
        return {"message": "Tenant Deleted Successfully"}

    @staticmethod
    @transaction.atomic
    def delete_commercial_tenant(id):
        tenant_bed = CommercialTenantBeds.objects.filter(id=id).first()
        if not tenant_bed:
            raise Exception("Tenant not found")

        t_obj = Tenent.objects.filter(phone=tenant_bed.phone).first()
        if t_obj:
            t_obj.is_vacant = True
            t_obj.owner = None
            t_obj.save()

            # ── Notify the tenant immediately ──
            BedService._notify_tenant_removed(t_obj, tenant_bed.owner_phone)

            # ── Hard delete related records ──
            BedService._hard_delete_tenant_data(t_obj, tenant_bed.owner, 'commercial')

        tenant_bed.delete()
        return {"message": "Tenant Deleted Successfully"}

    @staticmethod
    def _notify_tenant_removed(tenant, owner_phone):
        """
        Send a WebSocket push + FCM push notification to a tenant
        who has just been removed/evicted by the owner.
        Also creates a persistent TenantNotification record so the
        tenant can see it in the notification list after refresh.
        """
        # ── Persist a visible notification in the DB ──
        try:
            TenantNotification.objects.create(
                tenant_phone=tenant.phone,
                title="Removed from Property ⚠️",
                message="The owner has removed you from the property. Please contact the owner for more information.",
            )
        except Exception:
            pass

        try:
            # Push notification
            if getattr(tenant, 'push_token', None):
                NotificationService.send_push_notification(
                    tenant.push_token,
                    "Removed from Property ⚠️",
                    "The owner has removed you from the property. Please contact the owner for more information.",
                )
        except Exception:
            pass

        try:
            # WebSocket notification to tenant
            sanitized = (
                (tenant.phone or "")
                .replace("+", "")
                .replace("@", "_")
                .replace(".", "_")
                .replace(" ", "")
            )
            channel_layer = get_channel_layer()
            for group in [f"tenant_notifications_{sanitized}", f"user_notifications_{sanitized}"]:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": "send_notification",
                        "content": {
                            "type": "tenant_removed",
                            "message": "You have been removed from the property by the owner.",
                            "status": "vacated",
                        },
                    },
                )
        except Exception:
            pass

    # ─────────────────────────────────────────────────────────────────────
    # UPDATE
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def update_hostel_tenant(id, data):
        tenant_bed = TenantBeds.objects.filter(id=id).first()
        if not tenant_bed:
            raise Exception("Tenant not found")

        serializer = TenantBedSerializer(tenant_bed, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return {"message": "Tenant Details Updated"}
        raise ValueError(serializer.errors)

    @staticmethod
    def update_apartment_tenant(id, data):
        tenant_bed = ApartmentTenantBeds.objects.filter(id=id).first()
        if not tenant_bed:
            raise Exception("Tenant not found")

        serializer = ApartmentBedSerializer(tenant_bed, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return {"message": "Tenant Details Updated"}
        raise ValueError(serializer.errors)

    @staticmethod
    def update_commercial_tenant(id, data):
        tenant_bed = CommercialTenantBeds.objects.filter(id=id).first()
        if not tenant_bed:
            raise Exception("Tenant not found")

        serializer = CommercialBedSerializer(tenant_bed, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return {"message": "Tenant Details Updated"}
        raise ValueError(serializer.errors)
