from django.core.files.storage import default_storage
from django.conf import settings
from HAC.serializers import HostelSerializer, ApartmentSerializer, CommercialSerializer
from HAC.models import StayHostelDetails, ApartmentStayDetails, CommericialDetails, HostelFloorRoom, ApartmentFloorUnit, CommercialFloor
from .common_service import CommonService

class PropertyService:

    @staticmethod
    def upload_gallery(request):
        files = request.FILES.getlist("gallery_images")
        paths = []
        for file in files:
            path = default_storage.save(f"property_gallery/{file.name}", file)
            paths.append(path)
        return paths

    @staticmethod
    def create_property(request, owner, stay_type, facilities, gallery):
        property_data = request.data.dict()
        property_data.pop("facilities", None)
        property_data.pop("gallery_images", None)
        property_data.pop("building_layout", None)

        property_data["owner"] = owner.pk
        property_data["facilities"] = facilities
        property_data["gallery_images"] = gallery

        cover_image = request.FILES.get("cover_image")
        if cover_image:
            property_data["cover_image"] = cover_image

        serializer_map = {
            "hostel": HostelSerializer,
            "apartment": ApartmentSerializer,
            "commercial": CommercialSerializer
        }
        serializer = serializer_map[stay_type](data=property_data)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    @staticmethod
    def get_all_property_basic_details():
        property_list = []
        
        property_list.extend([
            {
                "phone": hostel.owner.phone if hostel.owner else "N/A",
                "owner_id": hostel.owner.owner_id if hostel.owner else None,
                "property_type": "hostel",
                "name": hostel.hostelName or "Unnamed Hostel",
                "location": hostel.location,
                "owner_name": hostel.owner.name if hostel.owner else "Unknown",
                "owner_status": hostel.owner.status if hostel.owner else "pending",
            }
            for hostel in StayHostelDetails.objects.select_related("owner")
        ])

        property_list.extend([
            {
                "phone": apartment.owner.phone if apartment.owner else "N/A",
                "owner_id": apartment.owner.owner_id if apartment.owner else None,
                "property_type": "apartment",
                "name": apartment.apartmentName or "Unnamed Apartment",
                "location": apartment.location,
                "owner_name": apartment.owner.name if apartment.owner else "Unknown",
                "owner_status": apartment.owner.status if apartment.owner else "pending",
            }
            for apartment in ApartmentStayDetails.objects.select_related("owner")
        ])

        property_list.extend([
            {
                "phone": commercial.owner.phone if commercial.owner else "N/A",
                "owner_id": commercial.owner.owner_id if commercial.owner else None,
                "property_type": "commercial",
                "name": commercial.commercialName or "Unnamed Commercial",
                "location": commercial.location,
                "owner_name": commercial.owner.name if commercial.owner else "Unknown",
                "owner_status": commercial.owner.status if commercial.owner else "pending",
            }
            for commercial in CommericialDetails.objects.select_related("owner")
        ])

        return property_list

    @staticmethod
    def get_payment_details(phone, request=None):
        from HAC.models import TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, BankDetails, Owners, StayHostelDetails, ApartmentStayDetails, CommericialDetails, Payment
        tenant_bed = None
        prop_type = None
        for table, p_type in [(TenantBeds, 'hostel'), (ApartmentTenantBeds, 'apartment'), (CommercialTenantBeds, 'commercial')]:
            tenant_bed = table.objects.filter(phone__iexact=phone).order_by('-id').first()
            if tenant_bed:
                prop_type = p_type
                break
                
        if not tenant_bed:
            return None
            
        owner = tenant_bed.owner if tenant_bed.owner else CommonService.get_owner(tenant_bed.owner_phone)
        bank = BankDetails.objects.filter(owner=owner).first() if owner else None
        
        prop_name = ""
        if owner:
            if prop_type == 'hostel':
                p = StayHostelDetails.objects.filter(owner=owner).first()
                if p: prop_name = p.hostelName
            elif prop_type == 'apartment':
                p = ApartmentStayDetails.objects.filter(owner=owner).first()
                if p: prop_name = p.apartmentName
            elif prop_type == 'commercial':
                p = CommericialDetails.objects.filter(owner=owner).first()
                if p: prop_name = p.commercialName
                
        last_payment = Payment.objects.filter(tenant_phone__iexact=phone).order_by('-created_at').first()
        success_count = Payment.objects.filter(tenant_phone__iexact=phone, status='SUCCESS').count()
        
        check_in_str = None
        due_date_str = None
        if tenant_bed.checkIn:
            try:
                import datetime, calendar
                if isinstance(tenant_bed.checkIn, str):
                    c_date = datetime.datetime.strptime(tenant_bed.checkIn, '%Y-%m-%d').date()
                else:
                    c_date = tenant_bed.checkIn
                    
                month = c_date.month - 1 + success_count
                year = c_date.year + month // 12
                month = month % 12 + 1
                day = min(c_date.day, calendar.monthrange(year, month)[1])
                n_date = datetime.date(year, month, day)
                
                check_in_str = c_date.strftime('%Y-%m-%d')
                due_date_str = n_date.strftime('%Y-%m-%d')
            except Exception:
                check_in_str = str(tenant_bed.checkIn)
                due_date_str = check_in_str
            
        qr_code_url = ""
        if bank and bank.qr_code:
            if request:
                qr_code_url = request.build_absolute_uri(bank.qr_code.url)
            else:
                qr_code_url = bank.qr_code.url
        # Fetch the latest unread reminder for the tenant
        payment_reminder = None
        try:
            from HAC.models import TenantNotification
            phone_variants = [phone, phone.lstrip('+')]
            if not phone.startswith('+'):
                phone_variants.extend(['+' + phone, '+91' + phone, '91' + phone])
            elif phone.startswith('+91'):
                phone_variants.append(phone.replace('+91', ''))
            elif phone.startswith('91'):
                phone_variants.append(phone[2:])
                
            from django.db.models import Q
            payment_keywords = ['payment', 'rent', 'partial', 'cash', 'due', 'balance']
            query = Q()
            for kw in payment_keywords:
                query |= Q(title__icontains=kw)

            latest_notification = TenantNotification.objects.filter(
                query,
                tenant_phone__in=phone_variants,
                is_read=False
            ).order_by('-created_at').first()
            
            if latest_notification:
                 # Determine type for frontend styling
                n_title = latest_notification.title.lower()
                n_type = "reminder"
                if "reject" in n_title or "fail" in n_title:
                    n_type = "rejection"
                elif "verif" in n_title or "accept" in n_title or "success" in n_title:
                    n_type = "success"
                    
                payment_reminder = {
                    "id": latest_notification.id,
                    "title": latest_notification.title,
                    "message": latest_notification.message,
                    "type": n_type,
                    "dueDate": due_date_str,
                    "pendingAmount": last_payment.amount if n_type == "rejection" and last_payment and last_payment.status == 'FAILED' else tenant_bed.rent
                }
        except Exception as e:
            print("Error fetching reminder:", e)    

        from django.utils import timezone
        approved_sum = sum([p.amount for p in Payment.objects.filter(
            tenant_phone__iexact=phone, 
            status='SUCCESS', 
            created_at__month=timezone.now().month,
            created_at__year=timezone.now().year
        )])
        calculated_remaining = float(tenant_bed.rent) - float(approved_sum)
        dynamic_remaining = calculated_remaining if calculated_remaining >= 0 else 0.0

        if payment_reminder and payment_reminder["type"] != "rejection":
            payment_reminder["pendingAmount"] = dynamic_remaining if dynamic_remaining > 0 else float(tenant_bed.rent)

        return {
            "tenantName": tenant_bed.name,
            "ownerPhone": owner.phone if owner else tenant_bed.owner_phone,
            "ownerId": owner.owner_id if owner else tenant_bed.owner_phone,
            "ownerName": owner.name if owner else "Owner",
            "propertyName": prop_name,
            "upiId": bank.upi_id if bank else "",
            "qrCode": qr_code_url,
            "rent": tenant_bed.rent,
            "checkIn": check_in_str,
            "dueDate": due_date_str,
            "status": last_payment.status if last_payment else "Pending",
            "lastPaymentStatus": last_payment.status if last_payment else "Pending",
            "lastPaymentRef": last_payment.txn_ref if last_payment else "",
            "remaining_balance": dynamic_remaining,
            "rejected_amount": last_payment.amount if last_payment and last_payment.status == 'FAILED' else None,
            "next_due_date": last_payment.next_due_date.strftime('%Y-%m-%d') if last_payment and hasattr(last_payment, 'next_due_date') and last_payment.next_due_date else due_date_str,
            "rejection_reason": last_payment.rejection_reason if last_payment and hasattr(last_payment, 'rejection_reason') else "",
            "paymentReminder": payment_reminder
        }

    @staticmethod
    def get_hostel_step3(phone):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Exception("Owner not found")

        hostel = StayHostelDetails.objects.filter(owner=owner).first()
        apartment = ApartmentStayDetails.objects.filter(owner=owner).first()
        commercial = CommericialDetails.objects.filter(owner=owner).first()

        response_data = {}

        if hostel:
            floors = HostelFloorRoom.objects.filter(hostel=hostel)
            layout = {}
            for room in floors:
                floor_no = room.floor
                if floor_no not in layout:
                    layout[floor_no] = []
                layout[floor_no].append({"roomNo": room.roomNo, "beds": room.sharing})

            result = [{"floorNo": fn, "rooms": rooms} for fn, rooms in layout.items()]
            response_data = {
                "property_type": "hostel",
                "name": hostel.hostelName,
                "address": hostel.location,
                "building_layout": result
            }
        elif apartment:
            floors = ApartmentFloorUnit.objects.filter(apartment=apartment)
            layout = {}
            for flat in floors:
                floor_no = flat.floor
                if floor_no not in layout:
                    layout[floor_no] = []
                layout[floor_no].append({"flatNo": flat.flatNo, "bhk": flat.bhk})

            result = [{"floorNo": fn, "flats": flats} for fn, flats in layout.items()]
            response_data = {
                "property_type": "apartment",
                "name": apartment.apartmentName,
                "address": apartment.location,
                "building_layout": result
            }
        elif commercial:
            floors = CommercialFloor.objects.filter(commercial_property=commercial).order_by('floorNo', 'sectionNo')
            layout_dict = {}
            for floor in floors:
                floor_no = floor.floorNo
                if floor_no not in layout_dict:
                    layout_dict[floor_no] = []
                layout_dict[floor_no].append({"sectionNo": floor.sectionNo, "area_sqft": floor.area_sqft})

            result = [{"floorNo": fn, "sections": secs} for fn, secs in layout_dict.items()]
            response_data = {
                "property_type": "commercial",
                "name": commercial.commercialName,
                "address": commercial.location,
                "building_layout": result
            }
        else:
            raise ValueError("No property found for this owner")

        response_data["owner"] = {"id": owner.pk, "name": owner.name, "phone": owner.phone}
        return response_data

    @staticmethod
    def get_properties_listing(request):
        property_list = []
        def build_gallery_urls(gallery_list):
            if not gallery_list:
                return []
            return [request.build_absolute_uri(settings.MEDIA_URL + path) for path in gallery_list]

        hostels = StayHostelDetails.objects.select_related('owner').filter(owner__status='active')
        for hostel in hostels:
            property_list.append({
                "id": str(hostel.id),
                "type": "Hostel",
                "hostelType": hostel.hostelType.capitalize() if hostel.hostelType else None,
                "name": hostel.hostelName,
                "address": hostel.location,
                "contact": hostel.owner.phone if hostel.owner else None,
                "owner_phone": hostel.owner.phone if hostel.owner else None,
                "owner_id": hostel.owner.owner_id if hostel.owner else None,
                "owner_name": hostel.owner.name if hostel.owner else None,
                "latitude": float(hostel.latitude) if hostel.latitude else None,
                "longitude": float(hostel.longitude) if hostel.longitude else None,
                "gallery": build_gallery_urls(hostel.gallery_images),
                "image": request.build_absolute_uri(hostel.cover_image.url) if hostel.cover_image else None,
                "rent": str(hostel.rent_amount) if hostel.rent_amount else None,
                "isAvailable": True,
                "rating": None,
                "facilities": hostel.facilities if hostel.facilities else [],
            })
            
        apartments = ApartmentStayDetails.objects.select_related('owner').filter(owner__status='active')
        for apartment in apartments:
            allowed_tenants = None
            if apartment.tenantType == "family":
                allowed_tenants = "FamilyOnly"
            elif apartment.tenantType == "bachelors":
                allowed_tenants = "BachelorsOnly"

            property_list.append({
                "id": str(apartment.id),
                "type": "Apartment",
                "name": apartment.apartmentName,
                "address": apartment.location,
                "contact": apartment.owner.phone if apartment.owner else None,
                "owner_phone": apartment.owner.phone if apartment.owner else None,
                "owner_id": apartment.owner.owner_id if apartment.owner else None,
                "owner_name": apartment.owner.name if apartment.owner else None,
                "latitude": float(apartment.latitude) if apartment.latitude else None,
                "longitude": float(apartment.longitude) if apartment.longitude else None,
                "gallery": build_gallery_urls(apartment.gallery_images),
                "image": request.build_absolute_uri(apartment.cover_image.url) if apartment.cover_image else None,
                "rent": str(apartment.rent_amount) if apartment.rent_amount else None,
                "isAvailable": True,
                "rating": None,
                "facilities": apartment.facilities if apartment.facilities else [],
                "allowedTenants": allowed_tenants,
            })

        commercials = CommericialDetails.objects.select_related('owner').filter(owner__status='active')
        for commercial in commercials:
            property_list.append({
                "id": str(commercial.id),
                "type": "Commercial",
                "name": commercial.commercialName,
                "address": commercial.location,
                "contact": commercial.owner.phone if commercial.owner else None,
                "owner_phone": commercial.owner.phone if commercial.owner else None,
                "owner_id": commercial.owner.owner_id if commercial.owner else None,
                "owner_name": commercial.owner.name if commercial.owner else None,
                "latitude": float(commercial.latitude) if commercial.latitude else None,
                "longitude": float(commercial.longitude) if commercial.longitude else None,
                "gallery": build_gallery_urls(commercial.gallery_images),
                "image": request.build_absolute_uri(commercial.cover_image.url) if commercial.cover_image else None,
                "rent": str(commercial.rent_amount) if commercial.rent_amount else None,
                "isAvailable": True,
                "rating": None,
                "facilities": commercial.facilities if commercial.facilities else [],
            })

        # Location based filtering
        import math
        lat = request.GET.get('latitude')
        lng = request.GET.get('longitude')
        radius = request.GET.get('radius')
        # Only apply a hard distance cutoff if the client explicitly asked for one
        # (e.g. the "Near By" filter chip). Plain browsing must never drop properties.
        apply_radius_filter = radius is not None
        try:
            lat = float(lat) if lat is not None else None
            lng = float(lng) if lng is not None else None
            radius = float(radius) if radius is not None else None
        except (ValueError, TypeError):
            lat = lng = None
            radius = None
            apply_radius_filter = False

        def haversine(lat1, lon1, lat2, lon2):
            R = 6371.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            d_phi = math.radians(lat2 - lat1)
            d_lambda = math.radians(lon2 - lon1)
            a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
            return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        if lat is not None and lng is not None:
            for item in property_list:
                if item.get('latitude') is not None and item.get('longitude') is not None:
                    dist = haversine(lat, lng, item['latitude'], item['longitude'])
                    item['distance_km'] = round(dist, 2)
                else:
                    item['distance_km'] = None

            # Only drop far-away properties when the user explicitly chose a
            # "Near By" distance filter. Otherwise keep every property visible.
            if apply_radius_filter and radius is not None:
                property_list = [
                    item for item in property_list
                    if item.get('distance_km') is None or item['distance_km'] <= radius
                ]

            # Nearest-first ordering: closest properties first, properties
            # without coordinates pushed to the end (still visible).
            property_list.sort(
                key=lambda x: x.get('distance_km') if x.get('distance_km') is not None else float('inf')
            )
        return {
            "count": len(property_list),
            "data": property_list
        }

    @staticmethod
    def manage_property_images(request, owner):
        from HAC.models import StayHostelDetails, ApartmentStayDetails, CommericialDetails
        if not owner:
            return {"success": False, "message": "Owner not found", "status": 404}
            
        property_obj = StayHostelDetails.objects.filter(owner=owner).first()
        if not property_obj:
            property_obj = ApartmentStayDetails.objects.filter(owner=owner).first()
        if not property_obj:
            property_obj = CommericialDetails.objects.filter(owner=owner).first()
            
        if not property_obj:
            return {"success": False, "message": "Property not found", "status": 404}

        def build_urls(gallery_list):
            if not gallery_list:
                return []
            return [{"uri": request.build_absolute_uri(settings.MEDIA_URL + path), "path": path} for path in gallery_list]

        if request.method == "GET":
            return {"success": True, "images": build_urls(property_obj.gallery_images), "status": 200}
            
        elif request.method == "POST":
            action = request.data.get("action")
            current_images = property_obj.gallery_images or []
            
            if action == "upload":
                files = request.FILES.getlist("images")
                paths = []
                for file in files:
                    path = default_storage.save(f"property_gallery/{file.name}", file)
                    paths.append(path)
                current_images.extend(paths)
                property_obj.gallery_images = current_images
                property_obj.save()
                return {"success": True, "images": build_urls(property_obj.gallery_images), "status": 200}
                
            elif action == "delete":
                image_path = request.data.get("image_path")
                if image_path in current_images:
                    current_images.remove(image_path)
                    property_obj.gallery_images = current_images
                    property_obj.save()
                    # Optionally delete from storage
                    # if default_storage.exists(image_path):
                    #     default_storage.delete(image_path)
                    return {"success": True, "images": build_urls(property_obj.gallery_images), "status": 200}
                return {"success": False, "message": "Image not found", "status": 404}
                
            elif action == "replace":
                old_image_path = request.data.get("old_image_path")
                file = request.FILES.get("image")
                if not file:
                    return {"success": False, "message": "No replacement image provided", "status": 400}
                    
                if old_image_path in current_images:
                    index = current_images.index(old_image_path)
                    new_path = default_storage.save(f"property_gallery/{file.name}", file)
                    current_images[index] = new_path
                    property_obj.gallery_images = current_images
                    property_obj.save()
                    return {"success": True, "images": build_urls(property_obj.gallery_images), "status": 200}
                return {"success": False, "message": "Original image not found", "status": 404}
                
            return {"success": False, "message": "Invalid action", "status": 400}

