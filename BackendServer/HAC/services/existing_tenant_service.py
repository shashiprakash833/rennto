import logging

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from HAC.models import (
    Tenent,
    Owners,
    Property,
    ExistingTenantRequest,
    BlockedTenant,
    TenantBeds,
    ApartmentTenantBeds,
    CommercialTenantBeds,
    StayHostelDetails,
    ApartmentStayDetails,
    CommericialDetails,
    HostelFloorRoom,
    ApartmentFloorUnit,
    CommercialFloor,
)
from .common_service import CommonService
from .notification_service import NotificationService

logger = logging.getLogger(__name__)


class ExistingTenantService:
    """
    Handles requests from existing tenants who want to move to a specific
    room / bed / flat / section.  The owner can Accept or Decline.
    """

    # ─────────────────────────────────────────────────────────────────────
    #  HELPERS (private)
    # ─────────────────────────────────────────────────────────────────────

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
            # WebSocket delivery is best-effort; never block the request.
            pass

    @staticmethod
    def get_or_create_property(owner):
        """
        Locate, build/create, and sync the Property record for the owner.
        """
        prop = Property.objects.filter(owner_account=owner).first()
        if not prop:
            prop = Property.objects.filter(owner_phone=owner.owner_id).first()
        
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
                
                # Check occupancy for each bed in this room
                sharing = room.sharing or 1
                beds_list = []
                for i in range(sharing):
                    bed_num = str(i + 1)
                    # Check if this bed is occupied by an active tenant
                    is_occupied = TenantBeds.objects.filter(
                        Q(owner=owner) | Q(owner_phone=owner.owner_id),
                        floor=floor_no,
                        roomno=room.roomNo,
                        bed=int(bed_num)
                    ).exclude(phone__in=Tenent.objects.filter(is_vacant=True).values_list('phone', flat=True)).exists()
                    
                    beds_list.append({"bedNumber": bed_num, "isOccupied": is_occupied})
                
                layout_dict[floor_no].append({"roomNo": room.roomNo, "beds": beds_list})
            layout = [{"floorNo": fn, "rooms": rooms} for fn, rooms in sorted(layout_dict.items())]

        elif apartment:
            property_type = 'apartment'
            floors = ApartmentFloorUnit.objects.filter(apartment=apartment).order_by('floor', 'flatNo')
            layout_dict = {}
            for flat in floors:
                floor_no = flat.floor
                if floor_no not in layout_dict:
                    layout_dict[floor_no] = []
                
                # Check occupancy for this flat
                is_occupied = ApartmentTenantBeds.objects.filter(
                    Q(owner=owner) | Q(owner_phone=owner.owner_id),
                    floor=floor_no,
                    flatno=flat.flatNo
                ).exclude(phone__in=Tenent.objects.filter(is_vacant=True).values_list('phone', flat=True)).exists()
                
                layout_dict[floor_no].append({"flatNo": flat.flatNo, "bhk": flat.bhk, "isOccupied": is_occupied})
            layout = [{"floorNo": fn, "flats": flats} for fn, flats in sorted(layout_dict.items())]

        elif commercial:
            property_type = 'commercial'
            floors = CommercialFloor.objects.filter(commercial_property=commercial).order_by('floorNo', 'sectionNo')
            layout_dict = {}
            for floor in floors:
                floor_no = floor.floorNo
                if floor_no not in layout_dict:
                    layout_dict[floor_no] = []
                
                # Check occupancy for this section
                is_occupied = CommercialTenantBeds.objects.filter(
                    Q(owner=owner) | Q(owner_phone=owner.owner_id),
                    floor=floor_no,
                    sectionNo=floor.sectionNo
                ).exclude(phone__in=Tenent.objects.filter(is_vacant=True).values_list('phone', flat=True)).exists()
                
                layout_dict[floor_no].append({"sectionNo": floor.sectionNo, "area_sqft": floor.area_sqft, "isOccupied": is_occupied})
            layout = [{"floorNo": fn, "sections": secs} for fn, secs in sorted(layout_dict.items())]

        if not property_type:
            return prop

        if prop:
            prop.property_type = property_type
            prop.building_layout = layout
            prop.save()
        else:
            prop = Property.objects.create(
                owner_phone=owner.owner_id,
                owner_account=owner,
                property_type=property_type,
                building_layout=layout
            )
        return prop

    @staticmethod
    def _vacate_existing_allocations(tenant, building_layout):
        """
        Locates the tenant's current allocations across Hostel, Apartment, and Commercial
        beds tables, marks those units as vacant (isOccupied=False) in building_layout,
        and deletes the old allocation records.
        """
        # 1. Hostel Bed allocations
        hostel_beds = TenantBeds.objects.filter(phone=tenant.phone)
        for hostel_bed in hostel_beds:
            floor_str = str(hostel_bed.floor)
            room_str = str(hostel_bed.roomno)
            bed_str = str(hostel_bed.bed)

            for floor in building_layout:
                if str(floor.get("floorNo")) == floor_str:
                    for room in floor.get("rooms", []):
                        if str(room.get("roomNo")) == room_str:
                            beds = room.get("beds", [])
                            if isinstance(beds, list):
                                for bed in beds:
                                    if str(bed.get("bedNumber")) == bed_str:
                                        bed["isOccupied"] = False
                                        break
        hostel_beds.delete()

        # 2. Apartment allocations
        apt_beds = ApartmentTenantBeds.objects.filter(phone=tenant.phone)
        for apt_bed in apt_beds:
            floor_str = str(apt_bed.floor)
            flat_str = str(apt_bed.flatno)

            for floor in building_layout:
                if str(floor.get("floorNo")) == floor_str:
                    for flat in floor.get("flats", []):
                        if str(flat.get("flatNo")) == flat_str:
                            flat["isOccupied"] = False
                            break
        apt_beds.delete()

        # 3. Commercial allocations
        comm_beds = CommercialTenantBeds.objects.filter(phone=tenant.phone)
        for comm_bed in comm_beds:
            floor_str = str(comm_bed.floor)
            sec_str = str(comm_bed.sectionNo)

            for floor in building_layout:
                if str(floor.get("floorNo")) == floor_str:
                    for sec in floor.get("sections", []):
                        if str(sec.get("sectionNo")) == sec_str:
                            sec["isOccupied"] = False
                            break
        comm_beds.delete()

    # ─────────────────────────────────────────────────────────────────────
    #  CREATE REQUEST
    # ─────────────────────────────────────────────────────────────────────

    @staticmethod
    def create_request(data):
        """
        Create a new ExistingTenantRequest after validating tenant, owner,
        block-list, and duplicate-pending checks.
        """
        tenant_phone = (data.get("tenant_phone") or "").strip()
        owner_id = (data.get("owner_id") or "").strip()
        owner_phone = (data.get("owner_phone") or "").strip()
        property_name = (data.get("property_name") or "").strip()
        property_type = data.get("property_type")
        check_in = data.get("check_in")
        requested_floor = data.get("requested_floor")
        requested_room = data.get("requested_room")
        requested_bed = data.get("requested_bed")
        sharing = data.get("sharing")
        flat = data.get("flat")
        section = data.get("section")
        is_existing_tenant = data.get("is_existing_tenant", True)

        lookup_id = owner_id if owner_id else owner_phone

        if not tenant_phone or not lookup_id:
            raise ValueError("Missing required phone fields (tenant_phone and owner identifier).")

        # --- Validate tenant ---
        tenant = CommonService.get_tenant(tenant_phone)
        if not tenant:
            raise Exception("Tenant not found")

        # --- Validate owner ---
        owner = CommonService.get_owner(lookup_id)
        if not owner:
            raise Exception("Owner not found")

        # --- Check block-list ---
        is_blocked = BlockedTenant.objects.filter(
            tenant=tenant, is_active=True
        ).exists()
        if is_blocked:
            raise ValueError(
                "You are blocked by an owner and cannot send requests until unblocked."
            )

        # --- Duplicate-pending check ---
        existing = ExistingTenantRequest.objects.filter(
            tenant=tenant,
            property_name__iexact=property_name,
            status="pending",
        ).first()
        if existing:
            return {
                "message": "You already have a pending request for this property",
                "existing": True,
            }

        # --- Create the request ---
        req = ExistingTenantRequest.objects.create(
            tenant=tenant,
            owner=owner,
            property_name=property_name,
            property_type=property_type,
            requested_floor=requested_floor,
            requested_room=requested_room,
            requested_bed=requested_bed,
            requested_flat=flat,
            requested_section=section,
            requested_sharing=sharing,
            is_existing_tenant=is_existing_tenant,
            status="pending",
        )

        # --- Push notification to owner ---
        if owner.push_token:
            NotificationService.send_push_notification(
                owner.push_token,
                "Existing Tenant Request 📩",
                f"{tenant.name} has requested to move to a specific unit in {property_name}",
            )

        # --- WebSocket notification to owner ---
        sanitized = ExistingTenantService._sanitize_phone(
            owner.owner_id if owner.owner_id else owner.phone
        )
        ExistingTenantService._send_ws_notification(
            [f"owner_status_{sanitized}", f"user_notifications_{sanitized}"],
            {
                "type": "incoming_existing_tenant_request",
                "message": f"Existing tenant request from {tenant.name}",
                "id": req.id,
                "status": "pending",
            },
        )

        return {"message": "Request sent successfully", "existing": False}

    # ─────────────────────────────────────────────────────────────────────
    #  UPDATE REQUEST STATUS  (accept / reject)
    # ─────────────────────────────────────────────────────────────────────

    @staticmethod
    def update_request_status(data):
        """
        Accept or reject an ExistingTenantRequest.

        Payload: {"id": int, "status": "accepted"|"rejected", "is_existing_tenant": True}

        On accept the service atomically:
          1. Marks the requested bed/flat/section as occupied in the
             Property building_layout JSON.
          2. Creates the corresponding TenantBeds / ApartmentTenantBeds /
             CommercialTenantBeds record.
          3. Activates the tenant (is_vacant=False, owner=…).
          4. Sends push + WebSocket notifications.
        """
        request_id = data.get("id")
        status_value = data.get("status")

        if status_value not in ("accepted", "rejected"):
            raise ValueError("Status must be 'accepted' or 'rejected'.")

        try:
            req = ExistingTenantRequest.objects.get(id=request_id)
        except ExistingTenantRequest.DoesNotExist:
            raise Exception("Existing tenant request not found")

        # ── REJECTED ─────────────────────────────────────────────────────
        if status_value == "rejected":
            req.status = "rejected"
            req.save()

            tenant = req.tenant
            if tenant.push_token:
                NotificationService.send_push_notification(
                    tenant.push_token,
                    "Request Rejected ❌",
                    f"Your request for {req.property_name} was rejected by the owner.",
                )

            sanitized = ExistingTenantService._sanitize_phone(tenant.phone)
            ExistingTenantService._send_ws_notification(
                [f"user_notifications_{sanitized}"],
                {
                    "type": "status_update",
                    "message": f"Your request for {req.property_name} has been rejected.",
                    "status": "rejected",
                },
            )
            return {"message": "Request rejected successfully"}

        # ── ACCEPTED (atomic) ────────────────────────────────────────────
        return ExistingTenantService._accept_request(req)

    # ------------------------------------------------------------------
    #  Private: accept workflow wrapped in a DB transaction
    # ------------------------------------------------------------------
    @staticmethod
    @transaction.atomic
    def _accept_request(req):
        """
        Atomically processes an acceptance:
          • Updates building_layout in Property
          • Creates TenantBeds / ApartmentTenantBeds / CommercialTenantBeds
          • Activates the tenant
          • Sends notifications
        """
        tenant = req.tenant
        owner = req.owner
        property_type = (req.property_type or "").lower().strip()
        today = timezone.now().date()

        # --- Locate or build/create the Property record ---
        prop = ExistingTenantService.get_or_create_property(owner)
        if not prop:
            raise Exception(
                "Property layout not found or could not be generated for this owner. Cannot process acceptance."
            )

        building_layout = prop.building_layout or []

        # --- Vacate tenant's current/old unit before allocating the new one ---
        ExistingTenantService._vacate_existing_allocations(tenant, building_layout)

        # ── HOSTEL ───────────────────────────────────────────────────────
        if property_type == "hostel":
            ExistingTenantService._accept_hostel(
                req, building_layout, owner, tenant, today
            )

        # ── APARTMENT ────────────────────────────────────────────────────
        elif property_type == "apartment":
            ExistingTenantService._accept_apartment(
                req, building_layout, owner, tenant, today
            )

        # ── COMMERCIAL ───────────────────────────────────────────────────
        elif property_type == "commercial":
            ExistingTenantService._accept_commercial(
                req, building_layout, owner, tenant, today
            )

        else:
            raise ValueError(f"Unknown property type: '{property_type}'")

        # --- Persist updated layout ---
        prop.building_layout = building_layout
        prop.save()

        # --- Activate tenant ---
        tenant.is_vacant = False
        tenant.owner = owner
        tenant.save()

        # --- Update request status ---
        req.status = "completed"
        req.save()

        # --- Notifications ---
        if tenant.push_token:
            NotificationService.send_push_notification(
                tenant.push_token,
                "Request Accepted ✅",
                f"Your request for {req.property_name} has been accepted!",
            )

        tenant_sanitized = ExistingTenantService._sanitize_phone(tenant.phone)
        owner_sanitized = ExistingTenantService._sanitize_phone(
            owner.owner_id if owner.owner_id else owner.phone
        )
        ExistingTenantService._send_ws_notification(
            [
                f"user_notifications_{tenant_sanitized}",
                f"owner_status_{owner_sanitized}",
                f"user_notifications_{owner_sanitized}",
            ],
            {
                "type": "status_update",
                "message": f"Existing tenant request for {req.property_name} has been accepted.",
                "status": "completed",
            },
        )

        return {"message": "Request accepted successfully"}

    # ------------------------------------------------------------------
    #  Hostel acceptance
    # ------------------------------------------------------------------
    @staticmethod
    def _accept_hostel(req, building_layout, owner, tenant, today):
        requested_floor = str(req.requested_floor)
        requested_room = str(req.requested_room)
        requested_bed = str(req.requested_bed)

        # Find the matching floor
        target_floor = None
        for floor in building_layout:
            if str(floor.get("floorNo")) == requested_floor:
                target_floor = floor
                break
        if target_floor is None:
            raise Exception(
                f"Floor {requested_floor} not found in the building layout."
            )

        # Find the matching room (robust matching)
        rooms = target_floor.get("rooms", [])
        target_room = None
        for room in rooms:
            db_room = str(room.get("roomNo"))
            # Match directly
            if db_room == requested_room:
                target_room = room
                break
            # Match if requested_room has hyphen (e.g. "1-01" matches "1")
            if "-" in requested_room:
                parts = requested_room.split("-")
                last_part = parts[-1]
                if last_part.isdigit() and db_room.isdigit() and int(last_part) == int(db_room):
                    target_room = room
                    break
                elif last_part.lower().strip() == db_room.lower().strip():
                    target_room = room
                    break
        if target_room is None:
            raise Exception(
                f"Room {requested_room} not found on floor {requested_floor}."
            )

        # Handle beds – expand integer count to individual bed objects if needed
        beds = target_room.get("beds", [])
        if isinstance(beds, int):
            beds = [
                {"bedNumber": str(i + 1), "isOccupied": False}
                for i in range(beds)
            ]
            target_room["beds"] = beds

        # Find and occupy the requested bed
        target_bed = None
        for bed in beds:
            if str(bed.get("bedNumber")) == requested_bed:
                target_bed = bed
                break
        if target_bed is None:
            raise Exception(
                f"Bed {requested_bed} not found in room {requested_room} "
                f"on floor {requested_floor}."
            )
        # Check database for active occupant to resolve conflicts/inconsistencies
        occupant_bed = TenantBeds.objects.filter(
            Q(owner=owner) | Q(owner_phone=owner.owner_id),
            floor=int(requested_floor),
            roomno=int(target_room.get("roomNo")),
            bed=int(requested_bed)
        ).first()

        if occupant_bed:
            if occupant_bed.phone != tenant.phone:
                occupant_tenant = Tenent.objects.filter(phone=occupant_bed.phone).first()
                if occupant_tenant and occupant_tenant.is_vacant:
                    # Inconsistent state: occupant is vacant, delete the bed record
                    occupant_bed.delete()
                    target_bed["isOccupied"] = False
                else:
                    raise ValueError(
                        f"Bed {requested_bed} in room {requested_room} is already occupied by {occupant_bed.name}."
                    )
        else:
            # Database says it is vacant, so layout must match
            target_bed["isOccupied"] = False

        target_bed["isOccupied"] = True

        # Fetch rent from hostel stay details
        rent = 0
        hostel_details = StayHostelDetails.objects.filter(owner=owner).first()
        if hostel_details and hostel_details.rent_amount is not None:
            rent = hostel_details.rent_amount

        # Format as floorNo + roomNo padded to 2 digits if it's not already formatted (e.g., 1 -> 101)
        db_room_no = target_room.get("roomNo")
        if len(str(db_room_no)) < 3:
            display_room_no = int(f"{requested_floor}{str(db_room_no).zfill(2)}")
        else:
            display_room_no = int(db_room_no)

        # Create TenantBeds record
        TenantBeds.objects.create(
            owner=owner,
            owner_phone=owner.owner_id,
            name=tenant.name,
            phone=tenant.phone,
            bed=int(requested_bed),
            floor=int(requested_floor),
            roomno=display_room_no,
            rent=rent,
            checkIn=today,
        )

    # ------------------------------------------------------------------
    #  Apartment acceptance
    # ------------------------------------------------------------------
    @staticmethod
    def _accept_apartment(req, building_layout, owner, tenant, today):
        requested_floor = str(req.requested_floor)
        # Frontend sends flat number via requested_room for apartments
        requested_flat = str(req.requested_room)

        # Find the matching floor
        target_floor = None
        for floor in building_layout:
            if str(floor.get("floorNo")) == requested_floor:
                target_floor = floor
                break
        if target_floor is None:
            raise Exception(
                f"Floor {requested_floor} not found in the building layout."
            )

        # Find the matching flat (robust matching)
        flats = target_floor.get("flats", [])
        target_flat = None
        for flat in flats:
            db_flat = str(flat.get("flatNo"))
            # Match directly
            if db_flat == requested_flat:
                target_flat = flat
                break
            # Match if requested_flat starts with floorNo prefix (e.g. floor "1", flat "101" matches db flat "101" or "1")
            if requested_flat.startswith(requested_floor):
                remainder = requested_flat[len(requested_floor):]
                if remainder.isdigit() and db_flat.isdigit() and int(remainder) == int(db_flat):
                    target_flat = flat
                    break
        if target_flat is None:
            raise Exception(
                f"Flat {requested_flat} not found on floor {requested_floor}."
            )

        # Check database for active occupant to resolve conflicts/inconsistencies
        occupant_flat = ApartmentTenantBeds.objects.filter(
            Q(owner=owner) | Q(owner_phone=owner.owner_id),
            floor=int(requested_floor),
            flatno=int(target_flat.get("flatNo"))
        ).first()

        if occupant_flat:
            if occupant_flat.phone != tenant.phone:
                occupant_tenant = Tenent.objects.filter(phone=occupant_flat.phone).first()
                if occupant_tenant and occupant_tenant.is_vacant:
                    # Inconsistent state: occupant is vacant, delete the flat record
                    occupant_flat.delete()
                    target_flat["isOccupied"] = False
                else:
                    raise ValueError(
                        f"Flat {requested_flat} on floor {requested_floor} is already occupied by {occupant_flat.name}."
                    )
        else:
            # Database says it is vacant, so layout must match
            target_flat["isOccupied"] = False

        target_flat["isOccupied"] = True

        # Fetch rent from apartment stay details
        rent = 0
        apt_details = ApartmentStayDetails.objects.filter(owner=owner).first()
        if apt_details and apt_details.rent_amount is not None:
            rent = apt_details.rent_amount

        # Create ApartmentTenantBeds record
        ApartmentTenantBeds.objects.create(
            owner=owner,
            owner_phone=owner.owner_id,
            name=tenant.name,
            phone=tenant.phone,
            floor=int(requested_floor),
            flatno=int(target_flat.get("flatNo")),
            rent=rent,
            checkIn=today,
        )

    # ------------------------------------------------------------------
    #  Commercial acceptance
    # ------------------------------------------------------------------
    @staticmethod
    def _accept_commercial(req, building_layout, owner, tenant, today):
        requested_floor = str(req.requested_floor)
        # Frontend sends section number via requested_room for commercial
        requested_section = str(req.requested_room)

        # Find the matching floor
        target_floor = None
        for floor in building_layout:
            if str(floor.get("floorNo")) == requested_floor:
                target_floor = floor
                break
        if target_floor is None:
            raise Exception(
                f"Floor {requested_floor} not found in the building layout."
            )

        # Find the matching section (robust matching)
        sections = target_floor.get("sections", [])
        target_section = None
        for sec in sections:
            db_sec = str(sec.get("sectionNo"))
            # Strip C- or C prefix from requested_section
            stripped_req = requested_section
            if stripped_req.startswith("C-"):
                stripped_req = stripped_req[2:]
            elif stripped_req.startswith("C"):
                stripped_req = stripped_req[1:]

            # Match directly
            if db_sec == stripped_req:
                target_section = sec
                break

            # Match if requested_section starts with floorNo (e.g. floor "1", unit "C-101" -> stripped "101" matches db section "1")
            if stripped_req.startswith(requested_floor):
                remainder = stripped_req[len(requested_floor):]
                if remainder.isdigit() and db_sec.isdigit() and int(remainder) == int(db_sec):
                    target_section = sec
                    break
        if target_section is None:
            raise Exception(
                f"Section {requested_section} not found on floor {requested_floor}."
            )

        # Check database for active occupant to resolve conflicts/inconsistencies
        occupant_sec = CommercialTenantBeds.objects.filter(
            Q(owner=owner) | Q(owner_phone=owner.owner_id),
            floor=int(requested_floor),
            sectionNo=int(target_section.get("sectionNo"))
        ).first()

        if occupant_sec:
            if occupant_sec.phone != tenant.phone:
                occupant_tenant = Tenent.objects.filter(phone=occupant_sec.phone).first()
                if occupant_tenant and occupant_tenant.is_vacant:
                    # Inconsistent state: occupant is vacant, delete the section record
                    occupant_sec.delete()
                    target_section["isOccupied"] = False
                else:
                    raise ValueError(
                        f"Section {requested_section} on floor {requested_floor} is already occupied by {occupant_sec.name}."
                    )
        else:
            # Database says it is vacant, so layout must match
            target_section["isOccupied"] = False

        target_section["isOccupied"] = True

        # Fetch rent from commercial details
        rent = 0
        comm_details = CommericialDetails.objects.filter(owner=owner).first()
        if comm_details and comm_details.rent_amount is not None:
            rent = comm_details.rent_amount

        # Create CommercialTenantBeds record
        CommercialTenantBeds.objects.create(
            owner=owner,
            owner_phone=owner.owner_id,
            name=tenant.name,
            phone=tenant.phone,
            floor=int(requested_floor),
            sectionNo=int(target_section.get("sectionNo")),
            rent=rent,
            checkIn=today,
        )
