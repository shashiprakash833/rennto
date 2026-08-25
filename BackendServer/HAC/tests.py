from django.test import TestCase
from HAC.models import Owners, Property, TenantBeds
from HAC.services.common_service import CommonService
from HAC.services.existing_tenant_service import ExistingTenantService
from HAC.services.bed_service import BedService

class OwnerIsolationTestCase(TestCase):
    def setUp(self):
        # Create two owners with the SAME phone number but different owner_ids
        self.owner1 = Owners.objects.create(
            owner_id="AAAAAAA001",
            phone="6304192151",
            name="Owner Raghuv",
            status="approved"
        )
        self.owner2 = Owners.objects.create(
            owner_id="BBBBBBB002",
            phone="6304192151",
            name="Owner Vasavi",
            status="approved"
        )

        # Create properties for each owner using Property.objects.create
        self.prop1 = Property.objects.create(
            owner_phone=self.owner1.owner_id,
            owner_account=self.owner1,
            property_type="hostel",
            building_layout=[{"floorNo": 1, "rooms": [{"roomNo": "101", "beds": [{"bedNumber": "1", "isOccupied": False}]}]}]
        )
        self.prop2 = Property.objects.create(
            owner_phone=self.owner2.owner_id,
            owner_account=self.owner2,
            property_type="hostel",
            building_layout=[{"floorNo": 1, "rooms": [{"roomNo": "101", "beds": [{"bedNumber": "1", "isOccupied": False}, {"bedNumber": "2", "isOccupied": False}]}]}]
        )

        # Create bed allocations for each owner
        self.bed1 = TenantBeds.objects.create(
            owner=self.owner1,
            owner_phone=self.owner1.owner_id,
            name="Tenant A",
            phone="9999999991",
            floor=1,
            roomno=101,
            bed=1,
            rent=5000,
            checkIn="2026-07-02"
        )
        self.bed2 = TenantBeds.objects.create(
            owner=self.owner2,
            owner_phone=self.owner2.owner_id,
            name="Tenant B",
            phone="9999999992",
            floor=1,
            roomno=101,
            bed=2,
            rent=6000,
            checkIn="2026-07-02"
        )

    def test_common_service_get_owner(self):
        # Retrieve by owner_id should return correct owner
        o1 = CommonService.get_owner("AAAAAAA001")
        self.assertEqual(o1, self.owner1)

        o2 = CommonService.get_owner("BBBBBBB002")
        self.assertEqual(o2, self.owner2)

        # Retrieve by phone number (since it's a fallback) returns the latest created
        latest = CommonService.get_owner("6304192151")
        self.assertEqual(latest, self.owner2)

    def test_property_layout_isolation(self):
        # Fetching property for owner1 should return prop1
        p1 = ExistingTenantService.get_or_create_property(self.owner1)
        self.assertEqual(p1.owner_account, self.owner1)

        # Fetching property for owner2 should return prop2
        p2 = ExistingTenantService.get_or_create_property(self.owner2)
        self.assertEqual(p2.owner_account, self.owner2)

    def test_bed_retrieval_isolation(self):
        # Fetching beds for owner1 should only return bed1
        beds1 = BedService.get_tenants_beds("AAAAAAA001")
        self.assertEqual(len(beds1), 1)
        self.assertEqual(beds1[0]['phone'], "9999999991")

        # Fetching beds for owner2 should only return bed2
        beds2 = BedService.get_tenants_beds("BBBBBBB002")
        self.assertEqual(len(beds2), 1)
        self.assertEqual(beds2[0]['phone'], "9999999992")

    def test_update_request_status_switched_account(self):
        from HAC.views import update_request_status
        from HAC.models import JoinRequest, Tenent
        from django.test import RequestFactory

        tenant = Tenent.objects.create(name="Tenant Test", phone="9999999993")
        join_req = JoinRequest.objects.create(
            tenant=tenant,
            owner=self.owner2,
            property_name="Vasavi",
            status="pending"
        )

        from HAC.jwt_utils import generate_jwt_token
        token = generate_jwt_token(user_id=self.owner1.owner_id, role="owner", phone=self.owner1.phone)

        factory = RequestFactory()
        request = factory.post('/api/update_request_status/', {
            "id": join_req.id,
            "status": "accepted",
            "is_existing_tenant": False
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')

        request.jwt_payload = {"role": "owner", "user_id": self.owner1.owner_id}
        request.custom_user = self.owner1
        request.owner_account = self.owner2

        response = update_request_status(request)
        self.assertEqual(response.status_code, 200)

    def test_vacate_request_multi_account_owner_approval(self):
        from HAC.views import vacate_request_approve
        from HAC.models import VacateRequest, Tenent
        from django.test import RequestFactory
        from HAC.jwt_utils import generate_jwt_token

        tenant = Tenent.objects.create(name="Tenant Vacate", phone="9999999994", owner=self.owner2, is_vacant=False)
        vacate_req = VacateRequest.objects.create(
            tenant=tenant,
            owner=self.owner2,
            property_name="Vasavi",
            status="Pending"
        )

        # Logged in with owner1 token (same phone 6304192151, different owner_id)
        token = generate_jwt_token(user_id=self.owner1.owner_id, role="owner", phone=self.owner1.phone)
        factory = RequestFactory()
        request = factory.post(f'/api/vacate/request/{vacate_req.id}/approve/', {}, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
        request.jwt_payload = {"role": "owner", "user_id": self.owner1.owner_id, "phone": self.owner1.phone}
        request.custom_user = self.owner1

        response = vacate_request_approve(request, pk=vacate_req.id)
        self.assertEqual(response.status_code, 200)

        vacate_req.refresh_from_db()
        self.assertEqual(vacate_req.status, "Approved")
        tenant.refresh_from_db()
        self.assertTrue(tenant.is_vacant)
        self.assertIsNone(tenant.owner)

    def test_owner_id_property_access(self):
        # Ensure owner.id, owner.owner_id, and owner.pk are always identical and never throw AttributeError
        self.assertEqual(self.owner1.id, self.owner1.owner_id)
        self.assertEqual(self.owner1.id, self.owner1.pk)
        self.assertEqual(self.owner2.id, self.owner2.owner_id)

    def test_send_join_request_booking_workflow(self):
        from HAC.models import Tenent, StayHostelDetails, HostelChangeRequest, JoinRequest
        from HAC.services.request_service import RequestService

        hostel1 = StayHostelDetails.objects.create(
            owner=self.owner1,
            hostelName="Alpha Hostel",
            stayType="Hostel",
            location="Madhapur"
        )
        hostel2 = StayHostelDetails.objects.create(
            owner=self.owner2,
            hostelName="Beta Hostel",
            stayType="Hostel",
            location="Gachibowli"
        )

        tenant = Tenent.objects.create(
            name="Ravi Kumar",
            phone="9876543210",
            owner=self.owner1,
            is_vacant=False
        )

        # 1. Tenant requests change to Beta Hostel and it is approved
        hc = HostelChangeRequest.objects.create(
            tenant=tenant,
            current_hostel=hostel1,
            target_hostel=hostel2,
            target_owner=self.owner2,
            expected_joining_date="2026-09-01",
            days_remaining_in_current_hostel=5,
            status="approved"
        )

        # 2. Tenant clicks "Book Now" on Beta Hostel
        book_data = {
            "tenant_phone": "9876543210",
            "owner_id": self.owner2.owner_id,
            "property_name": "Beta Hostel",
            "property_type": "Hostel",
            "check_in": "2026-09-01"
        }

        # This should execute smoothly without any 'Owners' object has no attribute 'id'
        res = RequestService.send_join_request(book_data)
        self.assertEqual(res.get("message"), "Request sent successfully")
        
        # Verify JoinRequest was created for owner2
        req = JoinRequest.objects.filter(tenant=tenant, owner=self.owner2, property_name="Beta Hostel").first()
        self.assertIsNotNone(req)
        self.assertEqual(req.status, "pending")

