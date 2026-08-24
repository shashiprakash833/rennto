from django.db import transaction
from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from HAC.models import (
    VacateRequest,
    Tenent,
    Owners,
    TenantBeds,
    ApartmentTenantBeds,
    CommercialTenantBeds,
    BlockedTenant,
    JoinRequest,
    ExistingTenantRequest,
    TenantNotification,
    StayHostelDetails,
    ApartmentStayDetails,
    CommericialDetails,
)
from HAC.serializers import TenentSerializer
from .common_service import CommonService
from .notification_service import NotificationService

class TenantService:

    @staticmethod
    def get_tenant_details(phone, request=None):
        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            raise Exception("Tenant not found")
 
        # PROFILE IMAGE
        image_url = None
        if getattr(tenant, 'selfie', None):
            if request:
                image_url = request.build_absolute_uri(tenant.selfie.url)
            else:
                image_url = tenant.selfie.url
 
        # ── ACTIVE ALLOCATION SYNC ──
        owner_vars = [tenant.owner.phone, tenant.owner.owner_id] if (tenant.owner and getattr(tenant.owner, 'owner_id', None)) else ([tenant.owner.phone] if tenant.owner else [])
        hostel_bed = TenantBeds.objects.filter(Q(phone__iexact=tenant.phone) & (Q(owner=tenant.owner) | Q(owner_phone__in=owner_vars))).first() if tenant.owner else None
        apt_bed = ApartmentTenantBeds.objects.filter(Q(phone__iexact=tenant.phone) & (Q(owner=tenant.owner) | Q(owner_phone__in=owner_vars))).first() if tenant.owner else None
        comm_bed = CommercialTenantBeds.objects.filter(Q(phone__iexact=tenant.phone) & (Q(owner=tenant.owner) | Q(owner_phone__in=owner_vars))).first() if tenant.owner else None
        active_bed = hostel_bed or apt_bed or comm_bed

        jr_active = None
        if tenant.owner and not tenant.is_vacant:
            jr_active = JoinRequest.objects.filter(
                tenant=tenant,
                owner=tenant.owner,
                status__in=['completed', 'joined', 'active']
            ).order_by('-created_at').first()

        if not active_bed and not jr_active:
            tenant.is_vacant = True
            tenant.owner = None
            tenant.save(update_fields=['is_vacant', 'owner'])

        # PROPERTY DETAILS
        property_name = "N/A"
        property_type = "N/A"
        location = "N/A"
        property_image = None
 
        if tenant.owner and not tenant.is_vacant:
            jr = JoinRequest.objects.filter(
                tenant=tenant,
                status__in=['completed', 'joined', 'active']
            ).order_by('-created_at').first()
            
            property_found = False
            if jr and jr.property_name:
                # Search Hostel
                hostel = StayHostelDetails.objects.filter(owner=tenant.owner, hostelName__iexact=jr.property_name.strip()).first()
                if not hostel:
                    hostel = StayHostelDetails.objects.filter(hostelName__iexact=jr.property_name.strip()).first()
                if hostel:
                    property_name = hostel.hostelName
                    property_type = hostel.stayType or "Hostel"
                    location = hostel.location
                    if hostel.cover_image:
                        property_image = request.build_absolute_uri(hostel.cover_image.url) if request else hostel.cover_image.url
                    property_found = True
                else:
                    # Search Apartment
                    apt = ApartmentStayDetails.objects.filter(owner=tenant.owner, apartmentName__iexact=jr.property_name.strip()).first()
                    if not apt:
                        apt = ApartmentStayDetails.objects.filter(apartmentName__iexact=jr.property_name.strip()).first()
                    if apt:
                        property_name = apt.apartmentName
                        property_type = apt.stayType or "Apartment"
                        location = apt.location
                        if apt.cover_image:
                            property_image = request.build_absolute_uri(apt.cover_image.url) if request else apt.cover_image.url
                        property_found = True
                    else:
                        # Search Commercial
                        comm = CommericialDetails.objects.filter(owner=tenant.owner, commercialName__iexact=jr.property_name.strip()).first()
                        if not comm:
                            comm = CommericialDetails.objects.filter(commercialName__iexact=jr.property_name.strip()).first()
                        if comm:
                            property_name = comm.commercialName
                            property_type = comm.stayType or "Commercial"
                            location = comm.location
                            if comm.cover_image:
                                property_image = request.build_absolute_uri(comm.cover_image.url) if request else comm.cover_image.url
                            property_found = True

            if not property_found:
                hostel = StayHostelDetails.objects.filter(owner=tenant.owner).first()
                if hostel:
                    property_name = hostel.hostelName
                    property_type = hostel.stayType or "Hostel"
                    location = hostel.location
                    if hostel.cover_image:
                        property_image = request.build_absolute_uri(hostel.cover_image.url) if request else hostel.cover_image.url
                else:
                    apartment = ApartmentStayDetails.objects.filter(owner=tenant.owner).first()
                    if apartment:
                        property_name = apartment.apartmentName
                        property_type = apartment.stayType or "Apartment"
                        location = apartment.location
                        if apartment.cover_image:
                            property_image = request.build_absolute_uri(apartment.cover_image.url) if request else apartment.cover_image.url
                    else:
                        commercial = CommericialDetails.objects.filter(owner=tenant.owner).first()
                        if commercial:
                            property_name = commercial.commercialName
                            property_type = commercial.stayType or "Commercial"
                            location = commercial.location
                            if commercial.cover_image:
                                property_image = request.build_absolute_uri(commercial.cover_image.url) if request else commercial.cover_image.url
 
        # ROOM / FLOOR / BED DETAILS
        room_no = "N/A"
        floor_no = "N/A"
        bed_no = "N/A"
        check_in = "N/A"
        rent = "N/A"
 
        if hostel_bed:
            room_no = str(hostel_bed.roomno) if hostel_bed.roomno is not None else "N/A"
            floor_no = str(hostel_bed.floor) if hostel_bed.floor is not None else "N/A"
            bed_no = str(hostel_bed.bed) if hostel_bed.bed is not None else "N/A"
            check_in = str(hostel_bed.checkIn) if hostel_bed.checkIn else "N/A"
            rent = str(hostel_bed.rent)
        elif apt_bed:
            room_no = str(apt_bed.flatno) if apt_bed.flatno is not None else "N/A"
            floor_no = str(apt_bed.floor) if apt_bed.floor is not None else "N/A"
            bed_no = "N/A"
            check_in = str(apt_bed.checkIn) if apt_bed.checkIn else "N/A"
            rent = str(apt_bed.rent)
        elif comm_bed:
            room_no = str(comm_bed.sectionNo) if comm_bed.sectionNo is not None else "N/A"
            floor_no = str(comm_bed.floor) if comm_bed.floor is not None else "N/A"
            bed_no = "N/A"
            check_in = str(comm_bed.checkIn) if comm_bed.checkIn else "N/A"
            rent = str(comm_bed.rent)
        
        if room_no == "N/A" and not tenant.is_vacant:
            jr = JoinRequest.objects.filter(
                tenant=tenant,
                status__in=['completed', 'joined', 'active']
            ).order_by('-created_at').first()
            if jr:
                room_no = str(jr.allotted_roomno or jr.allotted_flatno or jr.allotted_sectionno or jr.sharing or jr.flat or jr.section or "N/A")
                floor_no = str(jr.allotted_floor or "1")
                bed_no = str(jr.allotted_bed or "N/A")
                check_in = str(jr.allotted_check_in or (jr.created_at.date() if jr.created_at else "N/A"))
                rent = str(jr.allotted_rent or "N/A")

        aadhar_back_url = None
        payment_screenshot_url = None
        selfie_url = None

        if getattr(tenant, 'aadhar_back_image', None):
            if request:
                aadhar_back_url = request.build_absolute_uri(tenant.aadhar_back_image.url)
            else:
                aadhar_back_url = tenant.aadhar_back_image.url
        if getattr(tenant, 'payment_screenshot', None):
            if request:
                payment_screenshot_url = request.build_absolute_uri(tenant.payment_screenshot.url)
            else:
                payment_screenshot_url = tenant.payment_screenshot.url
        if getattr(tenant, 'selfie', None):
            if request:
                selfie_url = request.build_absolute_uri(tenant.selfie.url)
            else:
                selfie_url = tenant.selfie.url
 
        # ── STATUS ENFORCEMENT ──
        if (tenant.is_vacant or not tenant.owner) and not active_bed:
            property_name = "N/A"
            property_type = "N/A"
            location = "N/A"
            property_image = None
            room_no = "N/A"
            floor_no = "N/A"
            bed_no = "N/A"
            check_in = "N/A"
            rent = "N/A"
            final_status = "Vacated"
        else:
            final_status = "Active"
            if tenant.is_vacant:
                tenant.is_vacant = False
                tenant.save()

        # ── PROPERTY-SPECIFIC VACATE STATUS ──
        has_pending_vacate = False
        vacate_request_id = None
        vacate_status = None
        if not tenant.is_vacant and tenant.owner and property_name and property_name != "N/A":
            current_stay_joined_at = None
            last_join = JoinRequest.objects.filter(
                tenant=tenant,
                owner=tenant.owner,
                status__in=['completed', 'joined']
            ).order_by('-created_at').first()
            if last_join:
                current_stay_joined_at = last_join.created_at

            pending_vacate = VacateRequest.objects.filter(
                tenant=tenant,
                owner=tenant.owner,
                property_name__iexact=property_name,
                status="Pending"
            ).order_by('-created_at').first()

            if pending_vacate:
                if not current_stay_joined_at or pending_vacate.created_at >= current_stay_joined_at:
                    has_pending_vacate = True
                    vacate_request_id = pending_vacate.id
                    vacate_status = "Pending"

        return {
            "id": tenant.id,
            "name": tenant.name,
            "phone": tenant.phone,
            "gender": getattr(tenant, "gender", "N/A"),
            "identityType": getattr(tenant, "identityType", "N/A"),
            "identityImage": image_url,
            "aadhar_id": getattr(tenant, "aadhar_id", "N/A"),
            "aadhar_image": image_url,
            "aadhar_back_image": aadhar_back_url,
            "payment_screenshot": payment_screenshot_url,
            "selfie": selfie_url,
 
            # PROPERTY
            "property_name": property_name,
            "property_type": property_type,
            "location": location,
            "property_image": property_image,
 
            # ROOM & ALLOCATION
            "room": room_no,
            "room_number": room_no,
            "floor": floor_no,
            "floor_number": floor_no,
            "bed": bed_no,
            "bed_number": bed_no,
            "check_in": check_in,
            "checkIn": check_in,
            "rent": rent,
 
            "status": final_status,
            "is_vacant": bool(tenant.is_vacant or not tenant.owner),
            "owner_id": tenant.owner.owner_id if tenant.owner else None,
            "owner_phone": tenant.owner.phone if tenant.owner else None,

            # VACATE
            "has_pending_vacate": has_pending_vacate,
            "vacate_request_id": vacate_request_id,
            "vacate_status": vacate_status,
        }

    @staticmethod
    def tenant_profile_update(phone, data, files=None):
        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            raise Exception("Tenant not found")
 
        tenant.name = data.get('name', tenant.name)
        tenant.phone = data.get('phone', tenant.phone)
        
        img_file = data.get('tenant_img_field') or (files and files.get('tenant_img_field'))
        if img_file:
            tenant.selfie = img_file
            
        tenant.save()
        return {"message": "Profile updated successfully"}

    @staticmethod
    def get_tenant_by_phone(phone, request=None):
        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            raise Exception("Tenant not found")
 
        image_url = None
        if getattr(tenant, 'selfie', None):
            if request:
                image_url = request.build_absolute_uri(tenant.selfie.url)
            else:
                image_url = tenant.selfie.url
 
        return {
            "id": tenant.id,
            "name": tenant.name,
            "phone": tenant.phone,
            "gender": getattr(tenant, "gender", "N/A"),
            "identityType": getattr(tenant, "identityType", "N/A"),
            "identityImage": image_url,
        }

    @staticmethod
    def update_status(data):
        tenant_phone = data.get("tenant_phone")
        owner_phone = data.get("owner_phone")
        status_value = data.get("status")

        tenant = Tenent.objects.filter(
            phone=tenant_phone,
            owner__owner_id=owner_phone
        ).first()
        
        if not tenant:
            # Try alternate key check if matching models exactly
            tenant = Tenent.objects.filter(
                phone=tenant_phone
            ).first()
            
        if not tenant:
            raise Exception("Request not found")
            
        tenant.status = status_value
        tenant.save()
        return {"message": "Status updated"}

    @staticmethod
    def get_owner_tenants(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Exception("Owner not found")
 
        tenants_list = []
       
        # 1. Hostel Tenants
        hostel_tenants = TenantBeds.objects.filter(Q(owner=owner) | Q(owner_phone=owner.owner_id))
        for t in hostel_tenants:
            tenants_list.append({
                "id": t.id,
                "name": t.name,
                "phone": t.phone,
                "room": f"Room {t.roomno}",
                "property_type": "Hostel",
                "rent": t.rent,
                "checkIn": t.checkIn
            })
           
        # 2. Apartment Tenants
        apartment_tenants = ApartmentTenantBeds.objects.filter(Q(owner=owner) | Q(owner_phone=owner.owner_id))
        for t in apartment_tenants:
            tenants_list.append({
                "id": t.id,
                "name": t.name,
                "phone": t.phone,
                "room": f"Flat {t.flatno}",
                "property_type": "Apartment",
                "rent": t.rent,
                "checkIn": t.checkIn
            })
           
        # 3. Commercial Tenants
        commercial_tenants = CommercialTenantBeds.objects.filter(Q(owner=owner) | Q(owner_phone=owner.owner_id))
        for t in commercial_tenants:
            tenants_list.append({
                "id": t.id,
                "name": t.name,
                "phone": t.phone,
                "room": f"Section {t.sectionNo}",
                "property_type": "Commercial",
                "rent": t.rent,
                "checkIn": t.checkIn
            })
           
        return tenants_list
 
    @staticmethod
    def get_co_residents(phone):
        tenant = CommonService.get_tenant(phone)
        if not tenant or not tenant.owner:
            return []
           
        owner = tenant.owner
        co_residents = []
       
        hostel_beds = TenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in hostel_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Room {t.roomno}",
                "property_type": "Hostel", "rent": t.rent, "checkIn": t.checkIn
            })
           
        apt_beds = ApartmentTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in apt_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Flat {t.flatno}",
                "property_type": "Apartment", "rent": t.rent, "checkIn": t.checkIn
            })
           
        comm_beds = CommercialTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in comm_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Section {t.sectionNo}",
                "property_type": "Commercial", "rent": t.rent, "checkIn": t.checkIn
            })
           
        return co_residents

    @staticmethod
    def get_co_residents(phone):
        tenant = CommonService.get_tenant(phone)
        if not tenant or not tenant.owner:
            return []
            
        owner = tenant.owner
        co_residents = []
        
        hostel_beds = TenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in hostel_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Room {t.roomno}",
                "property_type": "Hostel", "rent": t.rent, "checkIn": t.checkIn
            })
            
        apt_beds = ApartmentTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in apt_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Flat {t.flatno}",
                "property_type": "Apartment", "rent": t.rent, "checkIn": t.checkIn
            })
            
        comm_beds = CommercialTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in comm_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Section {t.sectionNo}",
                "property_type": "Commercial", "rent": t.rent, "checkIn": t.checkIn
            })
            
        return co_residents

    @staticmethod
    @transaction.atomic
    def tenant_submit_verification(data, files):
        phone = data.get("phone")
        aadhar_id = data.get("aadhar_id")
        aadhar_image = files.get("aadhar_image")
        aadhar_back_image = files.get("aadhar_back_image")
        payment_screenshot = files.get("payment_screenshot")
        selfie = files.get("selfie")

        if not phone or not aadhar_id or not aadhar_image:
            raise ValueError("Aadhaar ID and Aadhaar Front image are required.")

        aadhar_id = aadhar_id.strip()
        if not aadhar_id.isdigit() or len(aadhar_id) != 12:
            raise ValueError("Aadhar ID must be exactly 12 numeric digits.")

        existing_tenant = Tenent.objects.filter(aadhar_id=aadhar_id).exclude(phone=phone).first()
        if existing_tenant:
            raise ValueError("This Aadhar ID is already registered to another user.")

        tenant = CommonService.get_tenant(phone)
        if not tenant:
            raise Exception("Tenant not found.")

        # ── Save documents on tenant ──
        tenant.aadhar_id = aadhar_id
        tenant.aadhar_image = aadhar_image
        if aadhar_back_image:
            tenant.aadhar_back_image = aadhar_back_image
        if payment_screenshot:
            tenant.payment_screenshot = payment_screenshot
        if selfie:
            tenant.selfie = selfie

        # ── Find the pending_confirmation JoinRequest (or fall back to allotted/accepted) ──
        join_req = JoinRequest.objects.filter(
            tenant=tenant,
            status__in=['pending_confirmation', 'allotted', 'accepted']
        ).order_by('-created_at').first()

        # ── Create TenantBeds from allotment data stored on JoinRequest ──
        if join_req and join_req.allotted_rent is not None:
            property_type = (join_req.property_type or '').lower()
            owner_phone = join_req.allotted_owner_phone or (
                join_req.owner.owner_id if join_req.owner else ''
            )
            check_in = join_req.allotted_check_in
            check_out = join_req.allotted_check_out
            rent = join_req.allotted_rent or 0

            if property_type == 'hostel':
                if not TenantBeds.objects.filter(phone=phone).exists():
                    TenantBeds.objects.create(
                        owner=join_req.owner,
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
                if not ApartmentTenantBeds.objects.filter(phone=phone).exists():
                    ApartmentTenantBeds.objects.create(
                        owner=join_req.owner,
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
                if not CommercialTenantBeds.objects.filter(phone=phone).exists():
                    CommercialTenantBeds.objects.create(
                        owner=join_req.owner,
                        owner_phone=owner_phone,
                        name=tenant.name,
                        phone=tenant.phone,
                        floor=join_req.allotted_floor,
                        sectionNo=join_req.allotted_sectionno,
                        rent=rent,
                        checkIn=check_in,
                        checkOut=check_out,
                    )

        # ── Activate tenant ONLY when there is a valid allotted/accepted request ──
        # A plain 'pending' request means the owner has not yet reviewed it —
        # do NOT mark the tenant as active until the owner has explicitly accepted.
        if join_req:
            tenant.is_vacant = False
            if join_req.owner:
                tenant.owner = join_req.owner
            tenant.save()

            # ── Transition JoinRequest to 'joined' ──
            join_req.status = 'joined'
            join_req.save()
        else:
            # No accepted/allotted request — still save document fields but don't activate
            tenant.save()

        return {"message": "Verification submitted successfully!"}

    @staticmethod
    @transaction.atomic
    def block_tenant(data):
        tenant_phone = data.get('tenant_phone')
        owner_phone = data.get('owner_phone')
        reason = data.get('reason', 'Blocked by owner')

        if not tenant_phone or not owner_phone:
            raise ValueError("tenant_phone and owner_phone are required")

        owner = CommonService.get_owner(owner_phone)
        if not owner:
            raise Exception("Owner not found")

        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        blocked_tenant, created = BlockedTenant.objects.get_or_create(
            owner=owner, tenant=tenant, defaults={'reason': reason, 'is_active': True}
        )
        if not created:
            blocked_tenant.is_active = True
            blocked_tenant.reason = reason
            blocked_tenant.save()

        tenant.is_vacant = True
        tenant.owner = None
        tenant.save()

        TenantBeds.objects.filter(owner_phone=owner_phone, phone=tenant_phone).delete()
        ApartmentTenantBeds.objects.filter(owner_phone=owner_phone, phone=tenant_phone).delete()
        CommercialTenantBeds.objects.filter(owner_phone=owner_phone, phone=tenant_phone).delete()
        JoinRequest.objects.filter(owner=owner, tenant=tenant).delete()

        # ── Persist a visible notification in the DB ──
        try:
            TenantNotification.objects.create(
                tenant_phone=tenant.phone,
                title="Removed from Property ⚠️",
                message="The owner has removed you from the property. Please contact the owner for more information.",
            )
        except Exception:
            pass

        # ── Notify the tenant via push + WebSocket ──
        try:
            if getattr(tenant, 'push_token', None):
                NotificationService.send_push_notification(
                    tenant.push_token,
                    "Removed from Property ⚠️",
                    "The owner has removed you from the property. Please contact the owner for more information.",
                )
        except Exception:
            pass

        try:
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

        return {'message': 'Tenant blocked successfully'}

    @staticmethod
    def unblock_tenant(data):
        tenant_phone = data.get('tenant_phone')
        owner_phone = data.get('owner_phone')

        if not tenant_phone or not owner_phone:
            raise ValueError("tenant_phone and owner_phone are required")

        owner = CommonService.get_owner(owner_phone)
        if not owner:
            raise Exception("Owner not found")

        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        blocked_tenant = BlockedTenant.objects.filter(owner=owner, tenant=tenant).first()
        if blocked_tenant:
            blocked_tenant.is_active = False
            blocked_tenant.save()
            return {'message': 'Tenant unblocked successfully'}
        
        raise Exception("Block record not found")

        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            raise Exception("Tenant not found")
 
        # PROFILE IMAGE
        image_url = None
        if getattr(tenant, 'selfie', None):
            if request:
                image_url = request.build_absolute_uri(tenant.selfie.url)
            else:
                image_url = tenant.selfie.url
 
        # PROPERTY DETAILS
        property_name = "N/A"
        property_type = "N/A"
        location = "N/A"
        property_image = None
 
        if tenant.owner and not tenant.is_vacant:
            jr = JoinRequest.objects.filter(
                tenant=tenant,
                status__in=['completed', 'joined']
            ).order_by('-created_at').first()

            existing_jr = ExistingTenantRequest.objects.filter(
                tenant=tenant,
                status__in=['completed', 'joined']
            ).order_by('-created_at').first()

            latest_req = None
            if jr and existing_jr:
                latest_req = jr if jr.created_at > existing_jr.created_at else existing_jr
            else:
                latest_req = jr or existing_jr
            
            if not latest_req:
                any_jr = JoinRequest.objects.filter(tenant=tenant).order_by('-created_at').first()
                any_existing = ExistingTenantRequest.objects.filter(tenant=tenant).order_by('-created_at').first()
                if any_jr and any_existing:
                    latest_req = any_jr if any_jr.created_at > any_existing.created_at else any_existing
                else:
                    latest_req = any_jr or any_existing

            jr = latest_req
            
            property_found = False
            if jr and jr.property_name:
                # Search Hostel
                hostel = StayHostelDetails.objects.filter(owner=tenant.owner, hostelName__iexact=jr.property_name.strip()).first()
                if hostel:
                    property_name = hostel.hostelName
                    property_type = hostel.stayType
                    location = hostel.location
                    if hostel.cover_image:
                        if request:
                            property_image = request.build_absolute_uri(hostel.cover_image.url)
                        else:
                            property_image = hostel.cover_image.url
                    property_found = True
                else:
                    # Search Apartment
                    apt = ApartmentStayDetails.objects.filter(owner=tenant.owner, apartmentName__iexact=jr.property_name.strip()).first()
                    if apt:
                        property_name = apt.apartmentName
                        property_type = apt.stayType
                        location = apt.location
                        if apt.cover_image:
                            if request:
                                property_image = request.build_absolute_uri(apt.cover_image.url)
                            else:
                                property_image = apt.cover_image.url
                        property_found = True
                    else:
                        # Search Commercial
                        comm = CommericialDetails.objects.filter(owner=tenant.owner, commercialName__iexact=jr.property_name.strip()).first()
                        if comm:
                            property_name = comm.commercialName
                            property_type = comm.stayType
                            location = comm.location
                            if comm.cover_image:
                                if request:
                                    property_image = request.build_absolute_uri(comm.cover_image.url)
                                else:
                                    property_image = comm.cover_image.url
                            property_found = True

            if not property_found:
                hostel = StayHostelDetails.objects.filter(owner=tenant.owner).first()
                if hostel:
                    property_name = hostel.hostelName
                    property_type = hostel.stayType
                    location = hostel.location
                    if hostel.cover_image:
                        if request:
                            property_image = request.build_absolute_uri(hostel.cover_image.url)
                        else:
                            property_image = hostel.cover_image.url
                else:
                    apartment = ApartmentStayDetails.objects.filter(owner=tenant.owner).first()
                    if apartment:
                        property_name = apartment.apartmentName
                        property_type = apartment.stayType
                        location = apartment.location
                        if apartment.cover_image:
                            if request:
                                property_image = request.build_absolute_uri(apartment.cover_image.url)
                            else:
                                property_image = apartment.cover_image.url
                    else:
                        commercial = CommericialDetails.objects.filter(owner=tenant.owner).first()
                        if commercial:
                            property_name = commercial.commercialName
                            property_type = commercial.stayType
                            location = commercial.location
                            if commercial.cover_image:
                                if request:
                                    property_image = request.build_absolute_uri(commercial.cover_image.url)
                                else:
                                    property_image = commercial.cover_image.url
 
        # ROOM / FLOOR DETAILS
        room_no = "N/A"
        floor_no = "N/A"
        check_in = "N/A"
        rent = "N/A"
 
        hostel_bed = TenantBeds.objects.filter(phone__iexact=tenant.phone).first()
        if hostel_bed:
            room_no = hostel_bed.roomno
            floor_no = hostel_bed.floor
            check_in = str(hostel_bed.checkIn) if hostel_bed.checkIn else "N/A"
            rent = str(hostel_bed.rent)
        else:
            apt_bed = ApartmentTenantBeds.objects.filter(phone__iexact=tenant.phone).first()
            if apt_bed:
                room_no = apt_bed.flatno
                floor_no = apt_bed.floor
                check_in = str(apt_bed.checkIn) if apt_bed.checkIn else "N/A"
                rent = str(apt_bed.rent)
            else:
                comm_bed = CommercialTenantBeds.objects.filter(phone__iexact=tenant.phone).first()
                if comm_bed:
                    room_no = comm_bed.sectionNo
                    floor_no = comm_bed.floor
                    check_in = str(comm_bed.checkIn) if comm_bed.checkIn else "N/A"
                    rent = str(comm_bed.rent)
        
        if room_no == "N/A" and not tenant.is_vacant:
            jr = JoinRequest.objects.filter(
                tenant=tenant,
                status__in=['completed', 'joined']
            ).order_by('-created_at').first()
            if jr:
                room_no = jr.sharing or jr.flat or jr.section or "N/A"
                floor_no = "1"
                check_in = str(jr.created_at.date()) if jr.created_at else "N/A"

        aadhar_back_url = None
        payment_screenshot_url = None
        selfie_url = None

        if getattr(tenant, 'aadhar_back_image', None):
            if request:
                aadhar_back_url = request.build_absolute_uri(tenant.aadhar_back_image.url)
            else:
                aadhar_back_url = tenant.aadhar_back_image.url
        if getattr(tenant, 'payment_screenshot', None):
            if request:
                payment_screenshot_url = request.build_absolute_uri(tenant.payment_screenshot.url)
            else:
                payment_screenshot_url = tenant.payment_screenshot.url
        if getattr(tenant, 'selfie', None):
            if request:
                selfie_url = request.build_absolute_uri(tenant.selfie.url)
            else:
                selfie_url = tenant.selfie.url
 
        # ── STATUS ENFORCEMENT ──
        # If tenant is vacant, or their latest JoinRequest is still in a pre-join state,
        # they are in 'Pending Join' state. We must strictly hide all property/bed details.
        is_pending = tenant.is_vacant
        
        latest_jr = JoinRequest.objects.filter(tenant=tenant).order_by('-created_at').first()
        if latest_jr and latest_jr.status in ['pending', 'accepted', 'allotted', 'pending_confirmation']:
            is_pending = True

        if is_pending:
            property_name = "N/A"
            property_type = "N/A"
            location = "N/A"
            property_image = None
            room_no = "N/A"
            floor_no = "N/A"
            check_in = "N/A"
            rent = "N/A"
            final_status = "Vacated" if tenant.is_vacant else "Pending Join"
        else:
            final_status = "Active"

        return {
            "id": tenant.id,
            "name": tenant.name,
            "phone": tenant.phone,
            "gender": getattr(tenant, "gender", "N/A"),
            "identityType": getattr(tenant, "identityType", "N/A"),
            "identityImage": image_url,
            "aadhar_id": getattr(tenant, "aadhar_id", "N/A"),
            "aadhar_image": image_url,
            "aadhar_back_image": aadhar_back_url,
            "payment_screenshot": payment_screenshot_url,
            "selfie": selfie_url,
 
            # PROPERTY
            "property_name": property_name,
            "property_type": property_type,
            "location": location,
            "property_image": property_image,
 
            # ROOM
            "room_number": room_no,
            "floor_number": floor_no,
            "check_in": check_in,
            "rent": rent,
 
            "status": final_status,
        }

    @staticmethod
    def tenant_profile_update(phone, data, files=None):
        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            raise Exception("Tenant not found")
 
        tenant.name = data.get('name', tenant.name)
        tenant.phone = data.get('phone', tenant.phone)
        
        img_file = data.get('tenant_img_field') or (files and files.get('tenant_img_field'))
        if img_file:
            tenant.selfie = img_file
            
        tenant.save()
        return {"message": "Profile updated successfully"}

    @staticmethod
    def get_tenant_by_phone(phone, request=None):
        tenant = Tenent.objects.filter(phone=phone).first()
        if not tenant:
            raise Exception("Tenant not found")
 
        image_url = None
        if getattr(tenant, 'selfie', None):
            if request:
                image_url = request.build_absolute_uri(tenant.selfie.url)
            else:
                image_url = tenant.selfie.url
 
        return {
            "id": tenant.id,
            "name": tenant.name,
            "phone": tenant.phone,
            "gender": getattr(tenant, "gender", "N/A"),
            "identityType": getattr(tenant, "identityType", "N/A"),
            "identityImage": image_url,
        }

    @staticmethod
    def update_status(data):
        tenant_phone = data.get("tenant_phone")
        owner_phone = data.get("owner_phone")
        status_value = data.get("status")

        tenant = Tenent.objects.filter(
            phone=tenant_phone,
            owner__owner_id=owner_phone
        ).first()
        
        if not tenant:
            # Try alternate key check if matching models exactly
            tenant = Tenent.objects.filter(
                phone=tenant_phone
            ).first()
            
        if not tenant:
            raise Exception("Request not found")
            
        tenant.status = status_value
        tenant.save()
        return {"message": "Status updated"}

    @staticmethod
    def get_owner_tenants(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Exception("Owner not found")
 
        tenants_list = []
       
        # 1. Hostel Tenants
        hostel_tenants = TenantBeds.objects.filter(Q(owner=owner) | Q(owner_phone=owner.owner_id))
        for t in hostel_tenants:
            tenants_list.append({
                "id": t.id,
                "name": t.name,
                "phone": t.phone,
                "room": f"Room {t.roomno}",
                "property_type": "Hostel",
                "rent": t.rent,
                "checkIn": t.checkIn
            })
           
        # 2. Apartment Tenants
        apartment_tenants = ApartmentTenantBeds.objects.filter(Q(owner=owner) | Q(owner_phone=owner.owner_id))
        for t in apartment_tenants:
            tenants_list.append({
                "id": t.id,
                "name": t.name,
                "phone": t.phone,
                "room": f"Flat {t.flatno}",
                "property_type": "Apartment",
                "rent": t.rent,
                "checkIn": t.checkIn
            })
           
        # 3. Commercial Tenants
        commercial_tenants = CommercialTenantBeds.objects.filter(Q(owner=owner) | Q(owner_phone=owner.owner_id))
        for t in commercial_tenants:
            tenants_list.append({
                "id": t.id,
                "name": t.name,
                "phone": t.phone,
                "room": f"Section {t.sectionNo}",
                "property_type": "Commercial",
                "rent": t.rent,
                "checkIn": t.checkIn
            })
           
        return tenants_list
 
    @staticmethod
    def get_co_residents(phone):
        tenant = CommonService.get_tenant(phone)
        if not tenant or not tenant.owner:
            return []
           
        owner = tenant.owner
        co_residents = []
       
        hostel_beds = TenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in hostel_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Room {t.roomno}",
                "property_type": "Hostel", "rent": t.rent, "checkIn": t.checkIn
            })
           
        apt_beds = ApartmentTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in apt_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Flat {t.flatno}",
                "property_type": "Apartment", "rent": t.rent, "checkIn": t.checkIn
            })
           
        comm_beds = CommercialTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in comm_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Section {t.sectionNo}",
                "property_type": "Commercial", "rent": t.rent, "checkIn": t.checkIn
            })
           
        return co_residents

    @staticmethod
    def get_co_residents(phone):
        tenant = CommonService.get_tenant(phone)
        if not tenant or not tenant.owner:
            return []
            
        owner = tenant.owner
        co_residents = []
        
        hostel_beds = TenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in hostel_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Room {t.roomno}",
                "property_type": "Hostel", "rent": t.rent, "checkIn": t.checkIn
            })
            
        apt_beds = ApartmentTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in apt_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Flat {t.flatno}",
                "property_type": "Apartment", "rent": t.rent, "checkIn": t.checkIn
            })
            
        comm_beds = CommercialTenantBeds.objects.filter(Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone)).exclude(phone__iexact=phone)
        for t in comm_beds:
            co_residents.append({
                "id": t.id, "name": t.name, "phone": t.phone, "room": f"Section {t.sectionNo}",
                "property_type": "Commercial", "rent": t.rent, "checkIn": t.checkIn
            })
            
        return co_residents

    @staticmethod
    @transaction.atomic
    def tenant_submit_verification(data, files):
        phone = data.get("phone")
        aadhar_id = data.get("aadhar_id")
        aadhar_image = files.get("aadhar_image")
        aadhar_back_image = files.get("aadhar_back_image")
        payment_screenshot = files.get("payment_screenshot")
        selfie = files.get("selfie")

        if not phone or not aadhar_id or not aadhar_image:
            raise ValueError("Aadhaar ID and Aadhaar Front image are required.")

        aadhar_id = aadhar_id.strip()
        if not aadhar_id.isdigit() or len(aadhar_id) != 12:
            raise ValueError("Aadhar ID must be exactly 12 numeric digits.")

        existing_tenant = Tenent.objects.filter(aadhar_id=aadhar_id).exclude(phone=phone).first()
        if existing_tenant:
            raise ValueError("This Aadhar ID is already registered to another user.")

        tenant = CommonService.get_tenant(phone)
        if not tenant:
            raise Exception("Tenant not found.")

        # ── Save documents on tenant ──
        tenant.aadhar_id = aadhar_id
        tenant.aadhar_image = aadhar_image
        if aadhar_back_image:
            tenant.aadhar_back_image = aadhar_back_image
        if payment_screenshot:
            tenant.payment_screenshot = payment_screenshot
        if selfie:
            tenant.selfie = selfie

        # ── Find the pending_confirmation JoinRequest (or fall back to allotted/accepted) ──
        join_req = JoinRequest.objects.filter(
            tenant=tenant,
            status__in=['pending_confirmation', 'allotted', 'accepted']
        ).order_by('-created_at').first()

        # ── Create TenantBeds from allotment data stored on JoinRequest ──
        if join_req and join_req.allotted_rent is not None:
            property_type = (join_req.property_type or '').lower()
            owner_phone = join_req.allotted_owner_phone or (
                join_req.owner.owner_id if join_req.owner else ''
            )
            check_in = join_req.allotted_check_in
            check_out = join_req.allotted_check_out
            rent = join_req.allotted_rent or 0

            if property_type == 'hostel':
                if not TenantBeds.objects.filter(phone=phone).exists():
                    TenantBeds.objects.create(
                        owner=join_req.owner,
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
                if not ApartmentTenantBeds.objects.filter(phone=phone).exists():
                    ApartmentTenantBeds.objects.create(
                        owner=join_req.owner,
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
                if not CommercialTenantBeds.objects.filter(phone=phone).exists():
                    CommercialTenantBeds.objects.create(
                        owner=join_req.owner,
                        owner_phone=owner_phone,
                        name=tenant.name,
                        phone=tenant.phone,
                        floor=join_req.allotted_floor,
                        sectionNo=join_req.allotted_sectionno,
                        rent=rent,
                        checkIn=check_in,
                        checkOut=check_out,
                    )

        # ── Activate tenant ──
        tenant.is_vacant = False
        if join_req and join_req.owner:
            tenant.owner = join_req.owner
        tenant.save()

        # ── Transition JoinRequest to 'joined' ──
        if join_req:
            join_req.status = 'joined'
            join_req.save()

        return {"message": "Verification submitted successfully!"}

    @staticmethod
    @transaction.atomic
    def block_tenant(data):
        tenant_phone = data.get('tenant_phone')
        owner_phone = data.get('owner_phone')
        reason = data.get('reason', 'Blocked by owner')

        if not tenant_phone or not owner_phone:
            raise ValueError("tenant_phone and owner_phone are required")

        owner = CommonService.get_owner(owner_phone)
        if not owner:
            raise Exception("Owner not found")

        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        blocked_tenant, created = BlockedTenant.objects.get_or_create(
            owner=owner, tenant=tenant, defaults={'reason': reason, 'is_active': True}
        )
        if not created:
            blocked_tenant.is_active = True
            blocked_tenant.reason = reason
            blocked_tenant.save()

        tenant.is_vacant = True
        tenant.owner = None
        tenant.save()

        TenantBeds.objects.filter(owner_phone=owner_phone, phone=tenant_phone).delete()
        ApartmentTenantBeds.objects.filter(owner_phone=owner_phone, phone=tenant_phone).delete()
        CommercialTenantBeds.objects.filter(owner_phone=owner_phone, phone=tenant_phone).delete()
        JoinRequest.objects.filter(owner=owner, tenant=tenant).delete()

        return {'message': 'Tenant blocked successfully'}

    @staticmethod
    def unblock_tenant(data):
        tenant_phone = data.get('tenant_phone')
        owner_phone = data.get('owner_phone')

        if not tenant_phone or not owner_phone:
            raise ValueError("tenant_phone and owner_phone are required")

        owner = CommonService.get_owner(owner_phone)
        if not owner:
            raise Exception("Owner not found")

        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        blocked_tenant = BlockedTenant.objects.filter(owner=owner, tenant=tenant).first()
        if blocked_tenant:
            blocked_tenant.is_active = False
            blocked_tenant.save()
            return {'message': 'Tenant unblocked successfully'}
        
        raise Exception("Block record not found")
