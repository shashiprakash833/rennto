from django.db.models import Q
from HAC.models import (
    Owners,
    StayHostelDetails,
    ApartmentStayDetails,
    CommericialDetails,
    Tenent,
    HostelFloorRoom,
    ApartmentFloorUnit,
    CommercialFloor,
    BankDetails,
)
from .common_service import CommonService

class DashboardService:

    @staticmethod
    def get_owner_dashboard_summary(owner):
        from HAC.models import TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, Issue, Payment
        owner_id = owner.owner_id
        
        # Total & Active Tenants (since they are assigned to a bed/room in the property)
        hostel_t = TenantBeds.objects.filter(owner=owner).values_list('phone', flat=True)
        apt_t = ApartmentTenantBeds.objects.filter(owner=owner).values_list('phone', flat=True)
        comm_t = CommercialTenantBeds.objects.filter(owner=owner).values_list('phone', flat=True)
        
        all_tenants_phones = set(hostel_t).union(set(apt_t)).union(set(comm_t))
        total_tenants = len(all_tenants_phones)
        active_tenants = total_tenants

        # Pending Payments
        pending_payments = Payment.objects.filter(
            owner=owner,
            status__iexact='PENDING'
        ).count()

        # Issues
        issues_count = Issue.objects.filter(owner=owner).count()

        # Properties
        properties_count = (
            StayHostelDetails.objects.filter(owner=owner).count()
            + ApartmentStayDetails.objects.filter(owner=owner).count()
            + CommericialDetails.objects.filter(owner=owner).count()
        )

        return {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "pending_payments": pending_payments,
            "issues": issues_count,
            "properties": properties_count
        }

    @staticmethod
    def get_dashboard_summary():
        total_properties = (
            StayHostelDetails.objects.count()
            + ApartmentStayDetails.objects.count()
            + CommericialDetails.objects.count()
        )

        return {
            "total_owners": Owners.objects.filter(status="active").count(),
            "pending_owners": Owners.objects.filter(status="pending").count(),
            "suspended_owners": Owners.objects.filter(status="suspend").count(),
            "total_properties": total_properties,
            "total_tenants": Tenent.objects.count(),
        }

    @staticmethod
    def get_owner_accounts(phone):
        owner = CommonService.get_owner(phone)
        actual_phone = owner.phone if owner else phone
        
        owners = Owners.objects.filter(phone=actual_phone).order_by('created_at')
        data = []
        for o in owners:
            p_type = "N/A"
            p_name = "N/A"
            hostel = StayHostelDetails.objects.filter(owner=o).first()
            if hostel:
                p_type = "Hostel"
                p_name = hostel.hostelName
            else:
                apartment = ApartmentStayDetails.objects.filter(owner=o).first()
                if apartment:
                    p_type = "Apartment"
                    p_name = apartment.apartmentName
                else:
                    commercial = CommericialDetails.objects.filter(owner=o).first()
                    if commercial:
                        p_type = "Commercial"
                        p_name = commercial.commercialName
            
            data.append({
                "id": o.pk,
                "name": o.name,
                "owner_name": o.name,
                "phone": o.phone,
                "property_type": p_type,
                "property_name": p_name,
                "status": o.status,
                "suspension_reason": o.suspension_reason or ""
            })
        return {"accounts": data}

    @staticmethod
    def get_all_steps_data():
        owners = Owners.objects.all()
        all_data = []
        
        for owner in owners:
            owner_data = {}
            
            # STEP 1: OWNER
            owner_data["owner"] = {
                "id": owner.pk,
                "name": owner.name,
                "phone": owner.phone,
                "image": str(getattr(owner, 'owner_img_field', None)) if getattr(owner, 'owner_img_field', None) else None
            }
            
            # STEP 2: PROPERTY & LAYOUT
            hostel = StayHostelDetails.objects.filter(owner=owner).first()
            apartment = ApartmentStayDetails.objects.filter(owner=owner).first()
            commercial = CommericialDetails.objects.filter(owner=owner).first()
            
            property_data = {}
            layout_data = []
            
            if hostel:
                property_data = {
                    "type": "hostel",
                    "name": hostel.hostelName,
                    "location": hostel.location,
                    "hostelType": hostel.hostelType,
                    "facilities": hostel.facilities
                }
                floors = HostelFloorRoom.objects.filter(hostel=hostel)
                layout = {}
                for room in floors:
                    if room.floor not in layout:
                        layout[room.floor] = []
                    layout[room.floor].append({
                        "roomNo": room.roomNo,
                        "beds": room.sharing
                    })
                layout_data = [{"floorNo": k, "rooms": v} for k, v in layout.items()]
                
            elif apartment:
                property_data = {
                    "type": "apartment",
                    "name": apartment.apartmentName,
                    "location": apartment.location,
                    "tenantType": apartment.tenantType,
                    "facilities": apartment.facilities
                }
                floors = ApartmentFloorUnit.objects.filter(apartment=apartment)
                layout = {}
                for flat in floors:
                    if flat.floor not in layout:
                        layout[flat.floor] = []
                    layout[flat.floor].append({
                        "flatNo": flat.flatNo,
                        "bhk": flat.bhk
                    })
                layout_data = [{"floorNo": k, "flats": v} for k, v in layout.items()]
                
            elif commercial:
                property_data = {
                    "type": "commercial",
                    "name": commercial.commercialName,
                    "location": commercial.location,
                    "usage": commercial.usage,
                    "facilities": commercial.facilities
                }
                floors = CommercialFloor.objects.filter(commercial_property=commercial)
                layout_data = [
                    {
                        "floorNo": f.floorNo,
                        "sectionNo": f.sectionNo,
                        "area_sqft": f.area_sqft
                    }
                    for f in floors
                ]
            else:
                property_data = {"type": None}
                layout_data = []
                
            owner_data["property"] = property_data
            owner_data["building_layout"] = layout_data
            
            # BANK DETAILS
            bank = BankDetails.objects.filter(owner=owner).first()
            if bank:
                owner_data["bank"] = {
                    "bankName": bank.bankName,
                    "ifsc": bank.ifsc,
                    "accountNo": bank.accountNo
                }
            else:
                owner_data["bank"] = None
                
            all_data.append(owner_data)
            
        return all_data

    @staticmethod
    def get_owner_admin_list():
        owners = Owners.objects.all().order_by('-created_at')
        
        owners_prefetch = owners.prefetch_related(
            'stay_details',
            'apartments',
            'commercial'
        )
        
        data = []
        for o in owners_prefetch:
            p_type = "N/A"
            p_name = "N/A"
            
            hostel = o.stay_details.first()
            apartment = o.apartments.first()
            commercial = o.commercial.first()
            
            if hostel:
                p_type = "Hostel"
                p_name = hostel.hostelName
            elif apartment:
                p_type = "Apartment"
                p_name = apartment.apartmentName
            elif commercial:
                p_type = "Commercial"
                p_name = commercial.commercialName
                
            data.append({
                "id": o.pk,  # originally o.id / o.pk, let's keep pk
                "name": o.name,
                "owner_name": o.name,
                "phone": o.phone,
                "status": o.status,
                "suspension_reason": o.suspension_reason,
                "property_type": p_type,
                "property_name": p_name,
                "created_at": o.created_at,
            })
            
        return data