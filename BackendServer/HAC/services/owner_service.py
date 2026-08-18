from django.core.mail import message
from django.db.migrations import serializer

from HAC.serializers import OwnerRegistrationSerializer
from .facility_service import FacilityService
from .property_service import PropertyService
from .layout_service import LayoutService
from .common_service import CommonService
from HAC.jwt_utils import generate_jwt_token
from django.db.models import Q
from HAC.models import Owners, Notification, BankDetails, StayHostelDetails, ApartmentStayDetails, CommericialDetails, HostelFloorRoom, ApartmentFloorUnit, CommercialFloor, SystemSettings
from datetime import timedelta
from django.utils.timezone import now
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .notification_service import NotificationService
from django.conf import settings

class OwnerRegistrationService:
    VALID_TYPES = {"hostel", "apartment", "commercial"}

    @classmethod
    def register(cls, request):
        stay_type = request.data.get("stayType")
        if stay_type not in cls.VALID_TYPES:
            raise ValueError("Invalid stayType")

        owner = cls.create_owner(request)
        facilities = FacilityService.get_facilities(request)
        gallery = PropertyService.upload_gallery(request)
        property_obj = PropertyService.create_property(request, owner, stay_type, facilities, gallery)
        LayoutService.create_layout(request, owner, property_obj, stay_type)

        token = generate_jwt_token(owner.pk, "owner", phone=owner.phone)
        if owner.status == "active":
            message = "Registration successful"
        else:
            message = "Registration successful. Wait for approval (2 days)"

        return {
            "message": message,
            "status": owner.status,
            "created_at": owner.created_at,
            "phone": owner.phone,
            "owner_id": owner.pk,
            "token": token
        }

    @staticmethod
    def create_owner(request):
        data = request.data.copy()
        phone = (data.get("phone") or data.get("phone_number"))
        if phone:
            data["phone"] = phone
            data.setdefault("name", f"Owner {phone}")
            data.setdefault("password", "nopassword")
        serializer = OwnerRegistrationSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        system_settings = SystemSettings.objects.first()

        status = "pending"

        if (
            system_settings
            and system_settings.demo_mode_enabled
            and phone in system_settings.demo_mobile_numbers
        ):
            status = "active"

        return serializer.save(status=status)

class OwnerService:

    @staticmethod
    def save_suspension_reason(data):
        phone = data.get("phone")
        reason = data.get("reason")
        if not phone:
            raise ValueError("phone is required")

        owner = CommonService.get_owner(phone)
        if not owner:
            raise Owners.DoesNotExist

        owner.suspension_reason = reason
        owner.save(update_fields=["suspension_reason"])
        return {"message": "Suspension reason saved successfully"}
    
    @staticmethod
    def get_suspension_reason(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Owners.DoesNotExist
        return {"phone": owner.phone, "reason": owner.suspension_reason or "No reason provided"}
    
    @staticmethod
    def clear_suspension_record(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Owners.DoesNotExist
        owner.delete()
        return {"message": "Account record cleared for re-registration"}

    @staticmethod
    def owner_profile_update(phone, data, files, request=None):
        identifier = phone.strip()
        owner = Owners.objects.filter(Q(owner_id=identifier) | Q(phone__iexact=identifier)).first()
        if not owner:
            raise Owners.DoesNotExist

        # Update owner basic info
        owner.name = data.get('name', owner.name)
        
        new_phone = data.get('phone') or data.get('phoneNumber')
        if new_phone and new_phone.strip():
            stripped_new_phone = new_phone.strip()
            if stripped_new_phone != owner.phone:
                existing = Owners.objects.filter(phone__iexact=stripped_new_phone).exclude(pk=owner.pk).first()
                if existing:
                    raise ValueError("Phone already exists")
                owner.phone = stripped_new_phone
        
        img_file = data.get('owner_img_field') or (files and files.get('owner_img_field'))
        if img_file:
            owner.owner_img_field = img_file
        
        owner.save()

        # Update Property Details based on owner's property
        property_name = data.get('property_name')
        area = data.get('area')

        if property_name or area:
            # Check Hostel
            hostel = StayHostelDetails.objects.filter(owner=owner).first()
            if hostel:
                if property_name: hostel.hostelName = property_name.strip()
                if area: hostel.location = area.strip()
                hostel.save()

            # Check Apartment
            apartment = ApartmentStayDetails.objects.filter(owner=owner).first()
            if apartment:
                if property_name: apartment.apartmentName = property_name.strip()
                if area: apartment.location = area.strip()
                apartment.save()

            # Check Commercial
            commercial = CommericialDetails.objects.filter(owner=owner).first()
            if commercial:
                if property_name: commercial.commercialName = property_name.strip()
                if area: commercial.location = area.strip()
                commercial.save()

        # Handle Bank/UPI Details
        bank = BankDetails.objects.filter(owner=owner).first()
        if not bank:
            bank = BankDetails.objects.create(owner=owner)
        
        upi_id = data.get('upiId')
        if upi_id:
            bank.upi_id = upi_id.strip()
            
        if files:
            if 'qrCode' in files:
                bank.qr_code = files['qrCode']
            elif 'qr_code' in files:
                bank.qr_code = files['qr_code']
            
        bank.save()

        qr_code_url = None
        if bank.qr_code and request:
            qr_code_url = request.build_absolute_uri(bank.qr_code.url)
        elif bank.qr_code:
            qr_code_url = bank.qr_code.url

        return {
            "message": "Profile and payment details updated successfully",
            "upiId": bank.upi_id,
            "phoneNumber": owner.phone,
            "qrCode": qr_code_url
        }

    @staticmethod
    def get_owner_full_details_by_pk(pk, request=None):
        """Fetch owner full details by primary key (used by admin panel)."""
        owner = Owners.objects.filter(pk=pk).first()
        if not owner:
            raise Owners.DoesNotExist
        return OwnerService._build_owner_details(owner, request)

    @staticmethod
    def get_owner_full_details(phone, request=None):
        """Fetch owner full details by phone (used by mobile app)."""
        owner = Owners.objects.filter(owner_id=phone).first()
        if not owner:
            owner = Owners.objects.filter(phone=phone).order_by('-created_at').first()
            if not owner:
                raise Owners.DoesNotExist
        return OwnerService._build_owner_details(owner, request)

    @staticmethod
    def _build_owner_details(owner, request=None):
        def build_file_url(file_field):
            if file_field and hasattr(file_field, 'url'):
                if request:
                    return request.build_absolute_uri(file_field.url)
                return file_field.url
            return None

        def build_gallery_urls(gallery_list):
            if not gallery_list:
                return []
            urls = []
            for img in gallery_list:
                try:
                    if request:
                        urls.append(request.build_absolute_uri(settings.MEDIA_URL + str(img)))
                    else:
                        urls.append(settings.MEDIA_URL + str(img))
                except Exception:
                    pass
            return urls

        bank = BankDetails.objects.filter(owner=owner).first()
        
        step1 = {
            "id": owner.pk,
            "name": owner.name if owner.name else "",
            "phone": owner.phone if owner.phone else "",
            "status": owner.status if owner.status else "",
            "owner_img_field": build_file_url(getattr(owner, 'owner_img_field', None)),
            "upiId": bank.upi_id if bank and bank.upi_id else "",
            "phoneNumber": owner.phone if owner.phone else "",
            "qrCode": build_file_url(bank.qr_code) if bank and hasattr(bank, 'qr_code') else None,
            "id_proof_type": owner.id_proof_type if hasattr(owner, 'id_proof_type') and owner.id_proof_type else "",
            "id_proof_number": owner.id_proof_number if hasattr(owner, 'id_proof_number') and owner.id_proof_number else "",
        }

        property_type = None
        property_data = None
        building_layout = []

        hostel = StayHostelDetails.objects.filter(owner=owner).first()
        if hostel:
            property_type = "hostel"
            property_data = {
                "id": hostel.id,
                "stayType": hostel.stayType,
                "property_name": hostel.hostelName,
                "location": hostel.location,
                "hostelType": hostel.hostelType,
                "facilities": hostel.facilities if hostel.facilities else [],
                "gallery_images": build_gallery_urls(hostel.gallery_images),
            }
            floors = HostelFloorRoom.objects.filter(hostel=hostel).order_by("floor", "roomNo")
            floor_map = {}
            for room in floors:
                if room.floor not in floor_map:
                    floor_map[room.floor] = []
                floor_map[room.floor].append({"roomNo": room.roomNo, "beds": room.sharing})
            for floor_no, rooms in floor_map.items():
                building_layout.append({"floorNo": floor_no, "rooms": rooms})

        apartment = ApartmentStayDetails.objects.filter(owner=owner).first()
        if apartment and not property_type:
            property_type = "apartment"
            property_data = {
                "id": apartment.id,
                "stayType": apartment.stayType,
                "property_name": apartment.apartmentName,
                "location": apartment.location,
                "tenantType": apartment.tenantType,
                "facilities": apartment.facilities if apartment.facilities else [],
                "gallery_images": build_gallery_urls(apartment.gallery_images),
            }
            floors = ApartmentFloorUnit.objects.filter(apartment=apartment).order_by("floor", "flatNo")
            floor_map = {}
            for flat in floors:
                if flat.floor not in floor_map:
                    floor_map[flat.floor] = []
                floor_map[flat.floor].append({"flatNo": flat.flatNo, "bhk": flat.bhk})
            for floor_no, flats in floor_map.items():
                building_layout.append({"floorNo": floor_no, "flats": flats})

        commercial = CommericialDetails.objects.filter(owner=owner).first()
        if commercial and not property_type:
            property_type = "commercial"
            property_data = {
                "id": commercial.id,
                "stayType": commercial.stayType,
                "property_name": commercial.commercialName,
                "location": commercial.location,
                "usage": commercial.usage,
                "facilities": commercial.facilities if commercial.facilities else [],
                "gallery_images": build_gallery_urls(commercial.gallery_images),
            }
            floors = CommercialFloor.objects.filter(commercial_property=commercial).order_by("floorNo", "sectionNo")
            floor_map = {}
            for section in floors:
                if section.floorNo not in floor_map:
                    floor_map[section.floorNo] = []
                floor_map[section.floorNo].append({"sectionNo": section.sectionNo, "area_sqft": section.area_sqft})
            for floor_no, sections in floor_map.items():
                building_layout.append({"floorNo": floor_no, "sections": sections})

        if not property_type:
            raise ValueError("No property found")

        return {
            "message": "Owner full details fetched successfully",
            "property_type": property_type,
            "step1": step1,
            "step2": {"property_details": property_data},
            "step3": {"building_layout": building_layout}
        }

    @staticmethod
    def _apply_status_update(owner, data, phone_for_ws=None):
        new_status = data.get('status')
        suspension_reason = data.get('suspension_reason')

        if not new_status:
            raise ValueError("Status required")

        allowed_statuses = ["active", "pending", "suspend"]
        if new_status not in allowed_statuses:
            raise ValueError(f"Invalid status. Allowed: {allowed_statuses}")

        owner.status = new_status
        if suspension_reason:
            owner.suspension_reason = suspension_reason
        elif new_status == "active":
            owner.suspension_reason = None
        owner.save()

        # Push notification
        if owner.push_token:
            title = "Account Status Updated"
            body = f"Your account status changed to {new_status}"
            if new_status == "active":
                title = "Account Approved ✅"
                body = "Your account has been approved successfully."
            elif new_status == "suspend":
                title = "Account Suspended ❌"
                body = f"Reason: {suspension_reason}"
            elif new_status == "pending":
                title = "Account Pending ⏳"
                body = "Your account is under verification."
            
            try:
                NotificationService.send_push_notification(owner.push_token, title, body)
            except Exception:
                pass

        # Create Notification in DB
        notification_msg = f"Your account has been {owner.status} by admin."
        if new_status == 'suspend' and suspension_reason:
            notification_msg += f" Reason: {suspension_reason}"

        Notification.objects.create(
            recipient_phone=owner.owner_id,
            title="Account Status Updated",
            message=notification_msg,
            type="ISSUE"
        )

        # WebSocket
        try:
            channel_layer = get_channel_layer()
            ws_phone = phone_for_ws or owner.phone
            target_groups = {
                f"owner_status_{ws_phone.replace('@', '_').replace('.', '_')}",
                f"owner_status_{owner.owner_id}",
                f"owner_status_{owner.phone}"
            }
            for group in target_groups:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": "status_update",
                        "content": {
                            "type": "account_status",
                            "status": owner.status,
                            "message": notification_msg,
                            "reason": suspension_reason
                        }
                    }
                )
        except Exception:
            pass

        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "public_updates",
                {
                    "type": "send_notification",
                    "content": {"type": "property_update", "message": "Property list updated"}
                }
            )
        except Exception:
            pass

        return {
            "message": "Status updated",
            "phone": owner.phone,
            "status": owner.status
        }

    @staticmethod
    def update_owner_status_by_pk(pk, data):
        owner = Owners.objects.filter(pk=pk).first()
        if not owner:
            raise Owners.DoesNotExist
        return OwnerService._apply_status_update(owner, data)

    @staticmethod
    def update_owner_status(phone, data):
        owner = Owners.objects.filter(Q(owner_id=phone) | Q(phone=phone)).order_by('-created_at').first()
        if not owner:
            raise Owners.DoesNotExist
        return OwnerService._apply_status_update(owner, data, phone_for_ws=phone)



    @staticmethod
    def check_owner_status(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Owners.DoesNotExist

        remaining_time = (owner.created_at + timedelta(days=2)) - now()
        remaining_seconds = int(remaining_time.total_seconds())
        if remaining_seconds < 0:
            remaining_seconds = 0

        response_data = {
            "status": owner.status,
            "time_left_seconds": remaining_seconds,
            "reason": owner.suspension_reason or ""
        }
        
        if owner.status == "active":
            response_data["token"] = generate_jwt_token(user_id=owner.id, role="owner", phone=owner.phone)
            response_data["owner_id"] = owner.owner_id
            response_data["owner_name"] = owner.name
            response_data["owner_phone"] = owner.phone
            
        return response_data