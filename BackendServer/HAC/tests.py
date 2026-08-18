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
