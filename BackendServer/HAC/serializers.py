from HAC.models import TenantNotification
from rest_framework import serializers
from .models import (
    Owners,
    StayHostelDetails,
    ApartmentStayDetails,
    CommericialDetails,
    BankDetails,
    HostelFloorRoom,
    ApartmentFloorUnit,
    CommercialFloor,
    Tenent,
    TenantBeds,ApartmentTenantBeds,CommercialTenantBeds,JoinRequest,Issue,Payment,
    Expense,
    BlockedTenant,
    Property,
    ExistingTenantRequest,
)

# ----------------------------
# 1️⃣ Owner Registration
# ----------------------------
class OwnerRegistrationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='owner_id', read_only=True)
    class Meta:
        model = Owners
        fields = [
            'id',
            'name',
            'phone',
            'password',
            'status',
            'id_proof_type',
            'id_proof_number'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }


# ----------------------------
# 2️⃣ Bank Serializer
# ----------------------------
class BankSerializer(serializers.ModelSerializer):
    # ✅ map frontend field → model field
    upiId = serializers.CharField(
        source='upi_id',
        required=False,
        allow_null=True,
        allow_blank=True
    )
 
    class Meta:
        model = BankDetails
        fields = [
            'id',
            'owner',
            'bankName',
            'ifsc',
            'accountNo',
            'upiId',
            'qr_code'   # 👈 keep frontend name
        ]

# ----------------------------
# 3️⃣ Hostel Serializer
class HostelSerializer(serializers.ModelSerializer):
    class Meta:
        model = StayHostelDetails
        fields = [
            'id',
            'owner',
            'stayType',
            'hostelName',
            'location',
            'hostelType',
            'facilities',
            'latitude',
            'longitude',
            'gallery_images',
            'rent_amount',
            'cover_image'
        ]


# ----------------------------
# 4️⃣ Hostel Floor/Room Serializer
# ----------------------------
class HostelRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelFloorRoom
        fields = [
            'id',
            'owner',
            'hostel',
            'floorNo',
            'roomNo',
            'beds'
        ]
        extra_kwargs = {
            'owner': {'write_only': True},
            'hostel': {'write_only': True}
        }


# ----------------------------
# 5️⃣ Apartment Serializer
# ----------------------------
class ApartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApartmentStayDetails
        fields = [
            'id',
            'owner',
            'stayType',
            'apartmentName',
            'location',
            # 'bhk',
            'tenantType',
            'facilities',
            'latitude',
            'longitude',
            'gallery_images',
            'furnishing_type',
            'rent_amount',
            'cover_image'
        ]
        extra_kwargs = {
            'owner': {'write_only': True}
        }


# ----------------------------
# 6️⃣ Apartment Floor/Unit Serializer
# ----------------------------
class ApartmentRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApartmentFloorUnit
        fields = [
            'id',
            'owner',
            'apartment',
            'floorNo',
            'roomNo',
            'bhkType'
        ]
        extra_kwargs = {
            'owner': {'write_only': True},
            'apartment': {'write_only': True}
        }


# ----------------------------
# 7️⃣ Commercial Serializer
# ----------------------------
class CommercialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommericialDetails
        fields = [
            'id',
            'owner',
            'stayType',
            'commercialName',    # ✅ Correct field name
            'location',
            'usage',
            'facilities',
            'latitude',
            'longitude',
            'gallery_images',
            'rent_amount',
            'cover_image'
        ]
        extra_kwargs = {'owner': {'write_only': True}}
# ----------------------------
# 8️⃣ Commercial Floor Serializer
# ----------------------------
class CommercialSqftSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommercialFloor
        fields = [
            'id',
            'owner',
            'commercial_property',
            'floorNo',
            'sectionNo',
            'area_sqft'
            # 'squareFeet'
        ]
        extra_kwargs = {
            'owner': {'write_only': True},
            'commercial_property': {'write_only': True}
        }

class TenentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenent
        fields = [
            'id',
            'name',
            'phone',
           
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
class TenantLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    password = serializers.CharField()

class OwnerLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    password = serializers.CharField()




class TenantBedSerializer(serializers.ModelSerializer):
    aadhar_id = serializers.SerializerMethodField()
    aadhar_image = serializers.SerializerMethodField()
    aadhar_back_image = serializers.SerializerMethodField()

    class Meta:
        model = TenantBeds
        fields = '__all__'

        extra_kwargs = {
            'phone': {
                'required': False,
                'allow_null': True,
                'allow_blank': True
            }
        }

    def get_aadhar_id(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        return t.aadhar_id if t else None

    def get_aadhar_image(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        request = self.context.get('request')
        if t and t.aadhar_image and request:
            return request.build_absolute_uri(t.aadhar_image.url)
        return None

    def get_aadhar_back_image(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        request = self.context.get('request')
        if t and t.aadhar_back_image and request:
            return request.build_absolute_uri(t.aadhar_back_image.url)
        return None


class ApartmentBedSerializer(serializers.ModelSerializer):
    aadhar_id = serializers.SerializerMethodField()
    aadhar_image = serializers.SerializerMethodField()
    aadhar_back_image = serializers.SerializerMethodField()

    class Meta:
        model = ApartmentTenantBeds
        fields = '__all__'

    def get_aadhar_id(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        return t.aadhar_id if t else None

    def get_aadhar_image(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        request = self.context.get('request')
        if t and t.aadhar_image and request:
            return request.build_absolute_uri(t.aadhar_image.url)
        return None

    def get_aadhar_back_image(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        request = self.context.get('request')
        if t and t.aadhar_back_image and request:
            return request.build_absolute_uri(t.aadhar_back_image.url)
        return None


class CommercialBedSerializer(serializers.ModelSerializer):
    aadhar_id = serializers.SerializerMethodField()
    aadhar_image = serializers.SerializerMethodField()
    aadhar_back_image = serializers.SerializerMethodField()

    class Meta:
        model = CommercialTenantBeds
        fields = '__all__'

    def get_aadhar_id(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        return t.aadhar_id if t else None

    def get_aadhar_image(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        request = self.context.get('request')
        if t and t.aadhar_image and request:
            return request.build_absolute_uri(t.aadhar_image.url)
        return None

    def get_aadhar_back_image(self, obj):
        t = Tenent.objects.filter(phone__iexact=obj.phone).first()
        request = self.context.get('request')
        if t and t.aadhar_back_image and request:
            return request.build_absolute_uri(t.aadhar_back_image.url)
        return None

class TenantRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinRequest
        fields = '__all__'


class JoinRequestSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='tenant.name')
    phone = serializers.ReadOnlyField(source='tenant.phone')
    phone = serializers.ReadOnlyField(source='tenant.phone')
    id_proof = serializers.ImageField(source='tenant.identityImage', read_only=True)
    
    class Meta:
        model = JoinRequest
        fields = '__all__'


class ExistingTenantRequestSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='tenant.name')
    phone = serializers.ReadOnlyField(source='tenant.phone')

    class Meta:
        model = ExistingTenantRequest
        fields = '__all__'


class IssueSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_phone = serializers.CharField(source='tenant.phone', read_only=True)
    floor_no = serializers.SerializerMethodField()
    room_no = serializers.SerializerMethodField()
    bed_no = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()
    property_type = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = '__all__'

    def get_floor_no(self, obj):
        return obj.get_allocation_details().get("floor_no")

    def get_room_no(self, obj):
        return obj.get_allocation_details().get("room_no")

    def get_bed_no(self, obj):
        return obj.get_allocation_details().get("bed_no")

    def get_property_name(self, obj):
        return obj.get_allocation_details().get("property_name")

    def get_property_type(self, obj):
        return obj.get_allocation_details().get("property_type")


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class BlockedTenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedTenant
        fields = '__all__'


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'owner_phone', 'property_type', 'building_layout']

    def validate_owner_phone(self, value):
        if not value:
            raise serializers.ValidationError("owner_phone is required")
        return value

    def validate(self, data):
        property_type = data.get('property_type')
        if not property_type and self.instance:
            property_type = self.instance.property_type
            
        building_layout = data.get('building_layout')
        if building_layout is not None:
            if property_type is None:
                raise serializers.ValidationError("property_type is required to validate building_layout")
            
            if not isinstance(building_layout, list):
                raise serializers.ValidationError({"building_layout": "building_layout must be a list"})
            
            seen_floors = set()
            for floor_idx, floor in enumerate(building_layout):
                if not isinstance(floor, dict):
                    raise serializers.ValidationError({"building_layout": f"Floor at index {floor_idx} must be a dictionary"})
                
                floor_no = floor.get("floorNo")
                if floor_no is None:
                    raise serializers.ValidationError({"building_layout": f"Floor at index {floor_idx} is missing 'floorNo'"})
                
                try:
                    floor_no_val = int(floor_no)
                except (ValueError, TypeError):
                    raise serializers.ValidationError({"building_layout": f"Floor number '{floor_no}' must be an integer"})
                    
                if floor_no_val in seen_floors:
                    raise serializers.ValidationError({"building_layout": f"Duplicate floor number: {floor_no_val}"})
                seen_floors.add(floor_no_val)
                
                if property_type == "hostel":
                    rooms = floor.get("rooms")
                    if rooms is None:
                        raise serializers.ValidationError({"building_layout": f"Floor {floor_no_val} is missing 'rooms' list"})
                    if not isinstance(rooms, list):
                        raise serializers.ValidationError({"building_layout": f"Floor {floor_no_val} 'rooms' must be a list"})
                    seen_rooms = set()
                    for room_idx, room in enumerate(rooms):
                        if not isinstance(room, dict):
                            raise serializers.ValidationError({"building_layout": f"Room at index {room_idx} on Floor {floor_no_val} must be a dictionary"})
                        
                        room_no = room.get("roomNo")
                        if room_no is None:
                            raise serializers.ValidationError({"building_layout": f"Room at index {room_idx} on Floor {floor_no_val} is missing 'roomNo'"})
                        
                        room_no_str = str(room_no).strip()
                        if not room_no_str:
                            raise serializers.ValidationError({"building_layout": f"Room number cannot be empty on Floor {floor_no_val}"})
                        if room_no_str in seen_rooms:
                            raise serializers.ValidationError({"building_layout": f"Duplicate room number '{room_no}' on Floor {floor_no_val}"})
                        seen_rooms.add(room_no_str)
                        
                        beds = room.get("beds")
                        if beds is None:
                            raise serializers.ValidationError({"building_layout": f"Room '{room_no}' on Floor {floor_no_val} is missing 'beds'"})
                        try:
                            beds_val = int(beds)
                        except (ValueError, TypeError):
                            raise serializers.ValidationError({"building_layout": f"Beds count '{beds}' in room '{room_no}' on Floor {floor_no_val} must be an integer"})
                        if beds_val < 1:
                            raise serializers.ValidationError({"building_layout": f"Beds count in room '{room_no}' on Floor {floor_no_val} cannot be less than 1"})
                            
                elif property_type == "apartment":
                    flats = floor.get("flats")
                    if flats is None:
                        raise serializers.ValidationError({"building_layout": f"Floor {floor_no_val} is missing 'flats' list"})
                    if not isinstance(flats, list):
                        raise serializers.ValidationError({"building_layout": f"Floor {floor_no_val} 'flats' must be a list"})
                    seen_flats = set()
                    for flat_idx, flat in enumerate(flats):
                        if not isinstance(flat, dict):
                            raise serializers.ValidationError({"building_layout": f"Flat at index {flat_idx} on Floor {floor_no_val} must be a dictionary"})
                        
                        flat_no = flat.get("flatNo")
                        if flat_no is None:
                            raise serializers.ValidationError({"building_layout": f"Flat at index {flat_idx} on Floor {floor_no_val} is missing 'flatNo'"})
                        
                        flat_no_str = str(flat_no).strip()
                        if not flat_no_str:
                            raise serializers.ValidationError({"building_layout": f"Flat number cannot be empty on Floor {floor_no_val}"})
                        if flat_no_str in seen_flats:
                            raise serializers.ValidationError({"building_layout": f"Duplicate flat number '{flat_no}' on Floor {floor_no_val}"})
                        seen_flats.add(flat_no_str)
                        
                        bhk = flat.get("bhk")
                        if bhk is None:
                            raise serializers.ValidationError({"building_layout": f"Flat '{flat_no}' on Floor {floor_no_val} is missing 'bhk'"})
                        try:
                            bhk_val = int(bhk)
                        except (ValueError, TypeError):
                            raise serializers.ValidationError({"building_layout": f"Bhk count '{bhk}' in flat '{flat_no}' on Floor {floor_no_val} must be an integer"})
                        if bhk_val < 1:
                            raise serializers.ValidationError({"building_layout": f"Bhk count in flat '{flat_no}' on Floor {floor_no_val} cannot be less than 1"})
                            
                elif property_type == "commercial":
                    sections = floor.get("sections")
                    if sections is None:
                        raise serializers.ValidationError({"building_layout": f"Floor {floor_no_val} is missing 'sections' list"})
                    if not isinstance(sections, list):
                        raise serializers.ValidationError({"building_layout": f"Floor {floor_no_val} 'sections' must be a list"})
                    seen_sections = set()
                    for sec_idx, section in enumerate(sections):
                        if not isinstance(section, dict):
                            raise serializers.ValidationError({"building_layout": f"Section at index {sec_idx} on Floor {floor_no_val} must be a dictionary"})
                        
                        section_no = section.get("sectionNo")
                        if section_no is None:
                            raise serializers.ValidationError({"building_layout": f"Section at index {sec_idx} on Floor {floor_no_val} is missing 'sectionNo'"})
                        
                        section_no_str = str(section_no).strip()
                        if not section_no_str:
                            raise serializers.ValidationError({"building_layout": f"Section number cannot be empty on Floor {floor_no_val}"})
                        if section_no_str in seen_sections:
                            raise serializers.ValidationError({"building_layout": f"Duplicate section number '{section_no}' on Floor {floor_no_val}"})
                        seen_sections.add(section_no_str)
                        
                        area_sqft = section.get("area_sqft")
                        if area_sqft is None:
                            raise serializers.ValidationError({"building_layout": f"Section '{section_no}' on Floor {floor_no_val} is missing 'area_sqft'"})
                        try:
                            area_val = float(area_sqft)
                        except (ValueError, TypeError):
                            raise serializers.ValidationError({"building_layout": f"area_sqft '{area_sqft}' in section '{section_no}' on Floor {floor_no_val} must be a number"})
                        if area_val <= 0:
                            raise serializers.ValidationError({"building_layout": f"area_sqft in section '{section_no}' on Floor {floor_no_val} must be greater than 0"})
                else:
                    raise serializers.ValidationError({"property_type": "Invalid property type"})
        
        return data


class TenantNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantNotification
        fields = "__all__"
        read_only_fields = ("created_at", "is_read")