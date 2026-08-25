
from django.db import models
from django.utils import timezone
import random
import string

def generate_owner_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

STAY_TYPE_CHOICES = [
    ('hostel', 'Hostel'),
    ('apartment', 'Apartment'),
    ('commercial', 'Commercial'),
]


class OwnerMaster(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.phone_number


class Owners(models.Model):
    owner_id = models.CharField(max_length=10, primary_key=True, default=generate_owner_id, editable=False)
    owner_master = models.ForeignKey(OwnerMaster, on_delete=models.CASCADE, related_name='accounts', null=True, blank=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    password = models.CharField(max_length=255)
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('suspend', 'Suspend'),
    ]
    status = models.CharField(choices=STATUS_CHOICES, max_length=20, default='pending')
 
     # ✅ ADD THIS LINE
    created_at = models.DateTimeField(default=timezone.now)
    suspension_reason = models.TextField(blank=True, null=True)
    push_token = models.CharField(max_length=255, blank=True, null=True)
    id_proof_type = models.CharField(max_length=20, blank=True, null=True)
    id_proof_number = models.CharField(max_length=50, blank=True, null=True)
    owner_img_field = models.ImageField(upload_to='owner_profiles/', null=True, blank=True)
 
    @property
    def id(self):
        return self.owner_id

    def __str__(self):
        return self.name
   
 
# ------------------ HOSTEL ------------------
class StayHostelDetails(models.Model):
    HOSTEL_TYPE_CHOICES = [
        ('boys', 'Boys'),
        ('girls', 'Girls'),
        ('coliving', 'Co-Living'),
    ]
 
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name="stay_details"
    )
 
    stayType = models.CharField(max_length=20, choices=STAY_TYPE_CHOICES)
    hostelName = models.CharField(max_length=150, null=True, blank=True)
    location = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    hostelType = models.CharField(max_length=20, choices=HOSTEL_TYPE_CHOICES, blank=True, null=True)
    facilities = models.JSONField(blank=True, null=True)
    gallery_images = models.JSONField(blank=True, null=True)
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cover_image = models.ImageField(upload_to='property_covers/', null=True, blank=True)
 
    def __str__(self):
        return self.hostelName or "Hostel"
 
 
# ------------------ APARTMENT ------------------
class ApartmentStayDetails(models.Model):
    BHK_CHOICES = [
        ('1', '1 BHK'),
        ('2', '2 BHK'),
        ('3', '3 BHK'),
    ]
 
    TENANT_TYPE_CHOICES = [
        ('family', 'Family'),
        ('bachelors', 'Bachelors'),
    ]
 
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='apartments'
    )
 
    stayType = models.CharField(max_length=20, choices=STAY_TYPE_CHOICES)
    apartmentName = models.CharField(max_length=150, null=True, blank=True)
    location = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    # bhk = models.CharField(max_length=10, choices=BHK_CHOICES)
    tenantType = models.CharField(max_length=20, choices=TENANT_TYPE_CHOICES, null=True, blank=True)
    facilities = models.JSONField(blank=True, null=True)
    gallery_images = models.JSONField(blank=True, null=True)
    
    FURNISHING_CHOICES = [
        ('Fully Furnished', 'Fully Furnished'),
        ('Semi Furnished', 'Semi Furnished'),
        ('Unfurnished', 'Unfurnished'),
    ]
    furnishing_type = models.CharField(max_length=20, choices=FURNISHING_CHOICES, null=True, blank=True)
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cover_image = models.ImageField(upload_to='property_covers/', null=True, blank=True)
 
    def __str__(self):
        return f"{self.apartmentName or 'Unnamed Apartment'}"
 
 
# ------------------ COMMERCIAL ------------------
class CommericialDetails(models.Model):
    USAGE_CHOICES = [
        ('lease', 'Lease'),
        ('rent', 'Rent'),
    ]
 
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='commercial'
    )
 
    stayType = models.CharField(max_length=20, choices=STAY_TYPE_CHOICES)
    commercialName = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    usage = models.CharField(max_length=20, choices=USAGE_CHOICES, blank=True, null=True)
    facilities = models.JSONField(blank=True, null=True)
    gallery_images = models.JSONField(blank=True, null=True)
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cover_image = models.ImageField(upload_to='property_covers/', null=True, blank=True)
 
 
    def __str__(self):
        return self.commercialName or "Commercial Property"


# ------------------ BLOCKED TENANT ------------------
class BlockedTenant(models.Model):
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE, related_name="blocked_tenants")
    tenant = models.ForeignKey('Tenent', on_delete=models.CASCADE, related_name="blocked_by_owners")
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.tenant.name} blocked by {self.owner.name}"

# ------------------ BANK ------------------



# ------------------ HOSTEL FLOORS ------------------
class HostelFloorRoom(models.Model):
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='hostel_floors'
    )

    hostel = models.ForeignKey(
        StayHostelDetails,
        on_delete=models.CASCADE,
        related_name='floors'
    )

    floor = models.IntegerField()
    roomNo = models.PositiveIntegerField()
    sharing = models.PositiveIntegerField()

    class Meta:
        ordering = ['roomNo']
        unique_together = ('hostel', 'floor', 'roomNo')

    def __str__(self):
        return f"{self.hostel.hostelName} - Floor {self.floor} Room {self.roomNo} ({self.sharing} beds)"
    # floorNo = models.IntegerField()
    # roomNo = models.PositiveIntegerField()
    # beds = models.PositiveIntegerField()

    # class Meta:
    #     ordering = ['roomNo']
    #     unique_together = ('hostel', 'floorNo', 'roomNo')

    # def __str__(self):
    #     return f"{self.hostel.hostelName} - Floor {self.floorNo} Room {self.roomNo} ({self.beds} beds)"


# ------------------ APARTMENT FLOORS ------------------
class ApartmentFloorUnit(models.Model):
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='apartment_floors'
    )

    apartment = models.ForeignKey(
        ApartmentStayDetails,
        on_delete=models.CASCADE,
        related_name='floors'
    )

    floor = models.IntegerField()
    flatNo = models.PositiveIntegerField()
    bhk = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.apartment.apartmentName} - Floor {self.floor} Flat {self.flatNo} ({self.bhk} BHK)"


class CommercialFloor(models.Model):

    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='commercial_floors'
    )

    commercial_property = models.ForeignKey(
        CommericialDetails,
        on_delete=models.CASCADE,
        related_name='floors'
    )

    floorNo = models.PositiveIntegerField()

    sectionNo = models.PositiveIntegerField(null=True, blank=True)

    area_sqft = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["floorNo", "sectionNo"]

    def __str__(self):
        return f"{self.commercial_property.commercialName} - Floor {self.floorNo} Section {self.sectionNo}"


class Tenent(models.Model):
    owner = models.ForeignKey(Owners, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    push_token = models.CharField(max_length=255, blank=True, null=True)
    aadhar_id = models.CharField(max_length=12, unique=True, null=True, blank=True)
    aadhar_image = models.ImageField(upload_to='aadhar_proofs/', null=True, blank=True)
    aadhar_back_image = models.ImageField(upload_to='aadhar_proofs/', null=True, blank=True)
    payment_screenshot = models.ImageField(upload_to='payment_proofs/', null=True, blank=True)
    selfie = models.ImageField(upload_to='selfies/', null=True, blank=True)
    is_vacant = models.BooleanField(default=True)
 
 
    def __str__(self):
        return self.name

class TenantBeds(models.Model):
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE, related_name="hostel_tenants", null=True, blank=True)
    owner_phone = models.CharField(max_length=15, null=True, blank=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    bed = models.IntegerField()
    floor = models.IntegerField(null=True, blank=True)
    roomno = models.IntegerField(null=True, blank=True)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    checkIn = models.DateField()
    checkOut = models.DateField(null=True, blank=True)
    payment_screenshot = models.ImageField(
    upload_to='payment_screenshots/',
    null=True,
    blank=True
    )

    def __str__(self):
        return self.name


class ApartmentTenantBeds(models.Model):
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE, related_name="apartment_tenants", null=True, blank=True)
    owner_phone = models.CharField(max_length=15, null=True, blank=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    floor = models.IntegerField(null=True, blank=True)
    flatno = models.IntegerField(null=True, blank=True)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    checkIn = models.DateField()
    checkOut = models.DateField(null=True, blank=True)
    payment_screenshot = models.ImageField(
        upload_to='payment_screenshots/',
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name
    
class CommercialTenantBeds(models.Model):
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE, related_name="commercial_tenants", null=True, blank=True)
    owner_phone = models.CharField(max_length=15, null=True, blank=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    floor = models.IntegerField(null=True, blank=True)
    sectionNo = models.IntegerField(null=True, blank=True)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    checkIn = models.DateField()
    checkOut = models.DateField(null=True, blank=True)
    payment_screenshot = models.ImageField(
        upload_to='payment_screenshots/',
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name
    
    
class JoinRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('completed', 'Completed'),
        ('allotted', 'Allotted'),
        # New statuses for the two-phase activation flow
        ('pending_confirmation', 'Pending Tenant Confirmation'),
        ('joined', 'Joined / Active'),
    ]
 
    tenant = models.ForeignKey(Tenent, on_delete=models.CASCADE)
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE)
    property_name = models.CharField(max_length=200, null=True, blank=True)
    property_type = models.CharField(max_length=50, null=True, blank=True)
    check_in = models.CharField(max_length=50, null=True, blank=True)
    check_out = models.CharField(max_length=50, null=True, blank=True)
    sharing = models.CharField(max_length=50, null=True, blank=True)
    flat = models.CharField(max_length=50, null=True, blank=True)
    section = models.CharField(max_length=50, null=True, blank=True)

    # ── Allotment data stored when owner allots (before tenant confirms) ──
    allotted_bed = models.IntegerField(null=True, blank=True)
    allotted_floor = models.IntegerField(null=True, blank=True)
    allotted_roomno = models.IntegerField(null=True, blank=True)
    allotted_flatno = models.IntegerField(null=True, blank=True)
    allotted_sectionno = models.IntegerField(null=True, blank=True)
    allotted_rent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    allotted_check_in = models.DateField(null=True, blank=True)
    allotted_check_out = models.DateField(null=True, blank=True)
    allotted_owner_phone = models.CharField(max_length=15, null=True, blank=True)

    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='pending'
    )
 
    created_at = models.DateTimeField(auto_now_add=True)
 
    def __str__(self):
        return f"{self.tenant.name} → {self.owner.name} ({self.status})"






class Issue(models.Model):
 
    SEVERITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
 
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    ]
 
    # 🔗 RELATIONS
    tenant = models.ForeignKey(Tenent, on_delete=models.CASCADE)
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE)
    property_id = models.IntegerField(null=True, blank=True)
    property_type = models.CharField(max_length=50, null=True, blank=True)
 
    # 🧾 ISSUE DETAILS (FROM YOUR FORM)
    title = models.CharField(max_length=255)  # SUBJECT
    description = models.TextField()
 
    severity = models.CharField(   # ✅ THIS MATCHES YOUR UI
        max_length=10,
        choices=SEVERITY_CHOICES,
        default='Medium'
    )
 
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Pending'
    )
 
    # 📷 IMAGE (Attach File)
    image = models.ImageField(
        upload_to='issue_images/',
        null=True,
        blank=True
    )
 
    # 💬 OWNER RESPONSE
    owner_comment = models.TextField(null=True, blank=True)
 
    # 📅 TIMESTAMP
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
 
    def __str__(self):
        return f"{self.title} - {self.severity}"
 
    def get_allocation_details(self):
        from HAC.models import TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, StayHostelDetails, ApartmentStayDetails, CommericialDetails, JoinRequest
        from django.db.models import Q
        tenant = self.tenant
        owner = self.owner
        floor_no = "N/A"
        room_no = "N/A"
        bed_no = "N/A"
        property_name = "N/A"
        property_id = self.property_id
        property_type = self.property_type
 
        if tenant and tenant.phone:
            phone_lc = tenant.phone.lower()
            record = None
            type_str = None
            prop_model = None
 
            for table, p_model, t_str in [
                (TenantBeds, StayHostelDetails, 'hostel'),
                (ApartmentTenantBeds, ApartmentStayDetails, 'apartment'),
                (CommercialTenantBeds, CommericialDetails, 'commercial')
            ]:
                q_filter = Q(phone__iexact=phone_lc)
                if owner:
                    q_filter &= (Q(owner=owner) | Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone))
 
                rec = table.objects.filter(q_filter).order_by('-id').first()
                if rec:
                    record = rec
                    type_str = t_str
                    prop_model = p_model
                    break
 
            if record:
                floor_no = record.floor
                if type_str == 'hostel':
                    room_no = record.roomno
                    bed_no = record.bed
                elif type_str == 'apartment':
                    room_no = record.flatno
                elif type_str == 'commercial':
                    room_no = record.sectionNo
 
                # Retrieve property name & ID
                record_owner = record.owner or owner
                if record_owner:
                    prop = prop_model.objects.filter(owner=record_owner).first()
                    if prop:
                        property_id = prop.id
                        property_type = type_str
                        if type_str == 'hostel':
                            property_name = prop.hostelName
                        elif type_str == 'apartment':
                            property_name = prop.apartmentName
                        elif type_str == 'commercial':
                            property_name = prop.commercialName
            else:
                # Fallback to the latest JoinRequest for this tenant if no active TenantBed allocation exists
                join_req = JoinRequest.objects.filter(
                    tenant=tenant,
                    status__in=['joined', 'completed', 'allotted', 'pending_confirmation']
                ).order_by('-created_at').first()
 
                if join_req:
                    floor_no = join_req.allotted_floor or "N/A"
                    property_type = join_req.property_type
                    prop_model = None
                    if property_type == 'hostel':
                        room_no = join_req.allotted_roomno or "N/A"
                        bed_no = join_req.allotted_bed or "N/A"
                        prop_model = StayHostelDetails
                    elif property_type == 'apartment':
                        room_no = join_req.allotted_flatno or "N/A"
                        prop_model = ApartmentStayDetails
                    elif property_type == 'commercial':
                        room_no = join_req.allotted_sectionno or "N/A"
                        prop_model = CommericialDetails
 
                    property_name = join_req.property_name or "N/A"
 
                    if join_req.owner and prop_model:
                        prop = prop_model.objects.filter(owner=join_req.owner).first()
                        if prop:
                            property_id = prop.id
 
        return {
            "floor_no": floor_no if floor_no is not None else "N/A",
            "room_no": room_no if room_no is not None else "N/A",
            "bed_no": bed_no if bed_no is not None else "N/A",
            "property_name": property_name if property_name is not None else "N/A",
            "property_id": property_id,
            "property_type": property_type
        }
 



class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    tenant_phone = models.CharField(max_length=15, null=True, blank=True)

    tenant_name = models.CharField(max_length=255, blank=True, null=True)
    owner_phone = models.CharField(max_length=15)
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE, null=True, blank=True)
    property_id = models.IntegerField(null=True, blank=True)
    property_type = models.CharField(max_length=50, null=True, blank=True)

    owner_name = models.CharField(max_length=255)

    property_name = models.CharField(max_length=255)

    upi_id = models.CharField(max_length=255)

    total_rent = models.FloatField(default=0.0)
    amount = models.FloatField()

    txn_ref = models.CharField(max_length=100, unique=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    payment_screenshot = models.ImageField(
        upload_to='payment_screenshots/',
        null=True,
        blank=True
    )

    rejection_reason = models.TextField(null=True, blank=True)
    remaining_balance = models.FloatField(default=0.0)
    next_due_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant_phone} - {self.amount} - {self.status}"

class BankDetails(models.Model):
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name="bank_details"
    )
 
    bankName = models.CharField(max_length=150, null=True, blank=True)
    ifsc = models.CharField(max_length=20, null=True, blank=True)
    accountNo = models.CharField(max_length=30, null=True, blank=True)
    upi_id = models.CharField(max_length=150, null=True, blank=True)
    qr_code = models.ImageField(upload_to='bank_qr_codes/', null=True, blank=True)
 
    def __str__(self):
        return f"{self.bankName} - {self.accountNo}"
 
class Expense(models.Model):
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name="expenses",
        null=True,
        blank=True
    )
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - {self.amount} ({self.owner.name})"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('ISSUE', 'Issue'),
        ('PAYMENT', 'Payment'),
        ('JOIN_REQUEST', 'Join Request'),
    ]

    owner_account = models.ForeignKey(Owners, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    recipient_phone = models.CharField(max_length=15)
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='ISSUE')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.recipient_phone}"

class AdminPassword(models.Model):

    phone = models.CharField(max_length=15, unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now=True)
 
    def __str__(self):
        return self.phone
 

class Property(models.Model):
    owner_phone = models.CharField(max_length=15, db_index=True)
    owner_account = models.ForeignKey(Owners, on_delete=models.CASCADE, null=True, blank=True, related_name='properties')
    property_type = models.CharField(
        max_length=20,
        choices=[
            ('hostel', 'Hostel'),
            ('apartment', 'Apartment'),
            ('commercial', 'Commercial'),
        ]
    )
    building_layout = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Property"
        verbose_name_plural = "Properties"

    def __str__(self):
        return f"{self.owner_phone} - {self.property_type}"


class TenantNotification(models.Model):
    tenant_phone = models.CharField(max_length=15, null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.tenant_phone} - {self.title}"


class ExistingTenantRequest(models.Model):
    """
    Stores requests from existing tenants who want to move to a specific
    room/bed/unit. The owner can Accept or Decline from the notification screen.
    Kept separate from JoinRequest which follows a different allotment lifecycle.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    tenant = models.ForeignKey(
        Tenent,
        on_delete=models.CASCADE,
        related_name='existing_tenant_requests'
    )
    owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='existing_tenant_requests'
    )
    property_name = models.CharField(max_length=200)
    property_type = models.CharField(max_length=50)  # hostel / apartment / commercial

    # Requested location fields
    requested_floor = models.CharField(max_length=50, blank=True, null=True)
    requested_room = models.CharField(max_length=50, blank=True, null=True)
    requested_bed = models.CharField(max_length=50, blank=True, null=True)
    requested_flat = models.CharField(max_length=50, blank=True, null=True)
    requested_section = models.CharField(max_length=50, blank=True, null=True)
    requested_sharing = models.CharField(max_length=50, blank=True, null=True)

    is_existing_tenant = models.BooleanField(default=True)
    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[Existing] {self.tenant.name} → {self.owner.name} ({self.status})"


OwnerAccount = Owners


class VacateRequest(models.Model):
    tenant = models.ForeignKey(Tenent, on_delete=models.CASCADE, related_name='vacate_requests')
    owner = models.ForeignKey(Owners, on_delete=models.CASCADE, related_name='vacate_requests')
    property_name = models.CharField(max_length=255)
    property_type = models.CharField(max_length=50, blank=True, null=True)
    requested_floor = models.CharField(max_length=50, blank=True, null=True)
    requested_room = models.CharField(max_length=50, blank=True, null=True)
    requested_bed = models.CharField(max_length=50, blank=True, null=True)
    requested_flat = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending')  # Pending, Approved, Declined
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vacate_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"[Vacate] {self.tenant.name} → {self.owner.name} ({self.status})"


class SystemSettings(models.Model):

    NORMAL = "NORMAL"
    READ_ONLY = "READ_ONLY"
    FULL_MAINTENANCE = "FULL_MAINTENANCE"

    MODE_CHOICES = [
        (NORMAL, "Normal"),
        (READ_ONLY, "Read Only"),
        (FULL_MAINTENANCE, "Full Maintenance"),
    ]

    maintenance_mode = models.CharField(
        max_length=30,
        choices=MODE_CHOICES,
        default=NORMAL
    )

    maintenance_message = models.TextField(
        blank=True,
        null=True
    )

    estimated_completion = models.DateTimeField(
        blank=True,
        null=True
    )

    allow_admin_override = models.BooleanField(
        default=True
    )


    demo_mode_enabled = models.BooleanField(
    default=False
    )

    demo_mobile_numbers = models.JSONField(
    default=list,
    blank=True
    )

    def __str__(self):
        return self.maintenance_mode


# ─────────────────────────────────────────────────────────────────────
# HOSTEL CHANGE REQUEST MODEL
# ─────────────────────────────────────────────────────────────────────
class HostelChangeRequest(models.Model):
    """
    Stores requests from existing hostel tenants who want to move to another hostel.
    Allows users currently staying in Hostel A to request booking Hostel B.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    tenant = models.ForeignKey(
        Tenent,
        on_delete=models.CASCADE,
        related_name='hostel_change_requests'
    )
    
    current_hostel = models.ForeignKey(
        StayHostelDetails,
        on_delete=models.CASCADE,
        related_name='current_hostel_requests'
    )
    
    target_hostel = models.ForeignKey(
        StayHostelDetails,
        on_delete=models.CASCADE,
        related_name='target_hostel_requests'
    )
    
    target_owner = models.ForeignKey(
        Owners,
        on_delete=models.CASCADE,
        related_name='hostel_change_requests'
    )
    
    # Request details
    expected_joining_date = models.DateField()
    days_remaining_in_current_hostel = models.IntegerField()
    tenant_email = models.EmailField(blank=True, null=True)
    requested_room_preference = models.CharField(max_length=120, blank=True, null=True)
    additional_details = models.TextField(blank=True, null=True)
    message_to_owner = models.TextField(blank=True, null=True)
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.tenant.name}: {self.current_hostel.hostelName} → {self.target_hostel.hostelName} ({self.status})"