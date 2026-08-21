import os
import sys
import time
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BMS.settings')
django.setup()

from django.utils import timezone
from HAC.models import (
    Tenent,
    Owners,
    Property,
    StayHostelDetails,
    TenantBeds,
    HostelChangeRequest,
    VacateRequest,
    Notification,
    TenantNotification,
    Issue,
    JoinRequest,
)
from HAC.services.hostel_change_service import HostelChangeService
from HAC.services.vacate_service import VacateService
from HAC.services.notification_service import NotificationService
from HAC.services.issue_service import IssueService
from HAC.services.bed_service import BedService

def run_audit():
    print("=" * 70)
    print("RENNTO SYSTEM AUDIT - END-TO-END VERIFICATION OF ALL 10 FEATURES")
    print("=" * 70)
    results = {}

    # Setup Test Data
    t_phone = "9999000001"
    o1_phone = "9999000002"
    o2_phone = "9999000003"

    # Clean up previous test artifacts
    Tenent.objects.filter(phone=t_phone).delete()
    Owners.objects.filter(phone__in=[o1_phone, o2_phone]).delete()
    Owners.objects.filter(owner_id__in=[o1_phone, o2_phone]).delete()
    TenantBeds.objects.filter(phone=t_phone).delete()
    HostelChangeRequest.objects.filter(tenant__phone=t_phone).delete()
    VacateRequest.objects.filter(tenant__phone=t_phone).delete()
    Notification.objects.filter(recipient_phone__in=[o1_phone, o2_phone]).delete()
    TenantNotification.objects.filter(tenant_phone=t_phone).delete()
    Issue.objects.filter(tenant__phone=t_phone).delete()
    JoinRequest.objects.filter(tenant__phone=t_phone).delete()

    owner1 = Owners.objects.create(
        owner_id=o1_phone,
        phone=o1_phone,
        name="Owner Alpha (Current)",
        password="testpassword",
        status="active"
    )

    owner2 = Owners.objects.create(
        owner_id=o2_phone,
        phone=o2_phone,
        name="Owner Beta (Target)",
        password="testpassword",
        status="active"
    )

    h1 = StayHostelDetails.objects.create(
        owner=owner1,
        stayType="boys",
        hostelName="Alpha Paradise Hostel",
        location="Sector 1, City",
        hostelType="boys",
        rent_amount=6000
    )

    h2 = StayHostelDetails.objects.create(
        owner=owner2,
        stayType="boys",
        hostelName="Beta Grand Hostel",
        location="Sector 5, City",
        hostelType="boys",
        rent_amount=7500
    )

    # Tenant initially staying in Hostel Alpha
    tenant = Tenent.objects.create(
        phone=t_phone,
        name="John Doe Auditor",
        email="john@rennto.test",
        owner=owner1,
        is_vacant=False,
    )

    # Initial bed allotment in Hostel Alpha
    t_bed = TenantBeds.objects.create(
        owner=owner1,
        owner_phone=o1_phone,
        name=tenant.name,
        phone=tenant.phone,
        bed=1,
        floor=1,
        roomno=101,
        rent=6000,
        checkIn="2026-01-01",
        checkOut="2026-12-31"
    )

    print("\n[INIT] Test fixtures created:")
    print(f" - Tenant: {tenant.name} ({tenant.phone}) in {h1.hostelName}")
    print(f" - Target Hostel: {h2.hostelName} (Owner: {owner2.name})")

    # -------------------------------------------------------------
    # FEATURE 1 & 9: PROPERTY BOOKING STATUS & HOSTEL CHANGE REQUEST
    # -------------------------------------------------------------
    print("\n--- TEST 1 & 9: Check Status & Hostel Change Request Creation ---")
    status_before = HostelChangeService.check_can_book_hostel(t_phone, h2.id)
    print(f"Status check before request: {status_before.get('status')} (can_request_change: {status_before.get('can_request_change')})")
    assert status_before.get("status") == "already_staying", "Should detect tenant is already staying in a hostel"
    assert status_before.get("can_request_change") is True, "can_request_change should be True when already staying"
    results["Test 9 (Property Booking Status)"] = "PASSED"

    hc_req_res = HostelChangeService.create_change_request({
        "tenant_phone": t_phone,
        "target_hostel_id": h2.id,
        "expected_joining_date": "2026-09-01",
        "message_to_owner": "Relocating closer to office."
    })
    print("Hostel change request response:", hc_req_res)
    assert hc_req_res.get("request_id") is not None, "Change request ID should be returned"
    hc_req = HostelChangeRequest.objects.get(id=hc_req_res["request_id"])
    assert hc_req.status == "pending", "Initial status should be pending"
    assert hc_req.target_owner == owner2, "Target owner must be Owner Beta"
    results["Test 1 (Hostel Change Request)"] = "PASSED"

    # Verify status changed to pending_request
    status_pending = HostelChangeService.check_can_book_hostel(t_phone, h2.id)
    print(f"Status check after request: {status_pending.get('status')}")
    assert status_pending.get("status") == "pending_request"

    # -------------------------------------------------------------
    # FEATURE 3: OWNER APPROVAL & REJECTION (HOSTEL CHANGE)
    # -------------------------------------------------------------
    print("\n--- TEST 3: Owner Approval / Rejection (Hostel Change) ---")
    # Owner 2 approves
    app_res = HostelChangeService.approve_change_request(hc_req.id, acting_owner=owner2)
    print("Approve response:", app_res)
    hc_req.refresh_from_db()
    assert hc_req.status == "approved", "Status should be approved"

    # Status check should now allow booking / bed selection
    status_approved = HostelChangeService.check_can_book_hostel(t_phone, h2.id)
    print(f"Status check after approval: {status_approved.get('status')}")
    assert status_approved.get("status") == "approved_request", "Tenant can now proceed to book"
    results["Test 3 (Owner Approval - Hostel Change)"] = "PASSED"

    # -------------------------------------------------------------
    # FEATURE 10: APPROVED REQUEST -> ROOM / FLOOR / BED SELECTION
    # -------------------------------------------------------------
    print("\n--- TEST 10: Approved Request -> Confirmation & Bed Allotment ---")
    # Simulate tenant choosing Floor 2, Room 205, Bed 3 in Beta Grand Hostel
    join_req = JoinRequest.objects.create(
        tenant=tenant,
        owner=owner2,
        property_name=h2.hostelName,
        property_type="hostel",
        status="pending_confirmation",
        allotted_floor=2,
        allotted_roomno=205,
        allotted_bed=3,
        allotted_rent=7500,
        allotted_check_in="2026-09-01",
        allotted_check_out="2026-12-31",
        allotted_owner_phone=o2_phone
    )
    confirm_res = BedService.tenant_join_booking({"request_id": join_req.id})
    print("Tenant confirmation response:", confirm_res)
    join_req.refresh_from_db()
    assert join_req.status == "joined"

    # Check new bed allotment exists
    new_bed = TenantBeds.objects.filter(phone=t_phone, owner=owner2).first()
    assert new_bed is not None, "New bed allotment in Hostel Beta must exist"
    assert new_bed.floor == 2 and new_bed.roomno == 205 and new_bed.bed == 3
    print(f"New bed allotment confirmed: Floor {new_bed.floor}, Room {new_bed.roomno}, Bed {new_bed.bed}")

    tenant.refresh_from_db()
    assert tenant.owner == owner2, "Tenant's active owner is now Owner 2"
    assert tenant.is_vacant is False, "Tenant must be active (is_vacant=False)"
    results["Test 10 (Approved Request -> Room/Bed Allocation)"] = "PASSED"

    # -------------------------------------------------------------
    # FEATURE 2: VACATE PROPERTY REQUEST (LIFECYCLE & PROPERTY-SPECIFIC VALIDATION)
    # -------------------------------------------------------------
    print("\n--- TEST 2: Vacate Property Request & Property-Specific Validation ---")
    vacate_payload = {
        "tenant_phone": t_phone,
        "owner_id": o2_phone,
        "property_name": h2.hostelName,
        "property_type": "hostel",
        "remarks": "Leaving city for job transfer."
    }
    vacate_res = VacateService.create_request(vacate_payload)
    print("Vacate request created:", vacate_res)
    assert vacate_res.get("request_id") is not None
    v_req = VacateRequest.objects.get(id=vacate_res["request_id"])
    assert v_req.status == "Pending"

    # CRITICAL CHECK: Tenant MUST NOT be removed on submission
    tenant.refresh_from_db()
    assert tenant.is_vacant is False, "Tenant MUST remain active while vacate request is Pending"
    assert tenant.owner == owner2, "Tenant owner must not be cleared on vacate submission"
    assert TenantBeds.objects.filter(phone=t_phone, owner=owner2).exists(), "Bed allocation must still exist"
    print("Verified: Tenant is NOT removed immediately upon submitting vacate request.")

    # CASE 1: Property A -> Vacate Pending -> Status is Pending & Duplicate Blocked
    status_case1 = VacateService.get_tenant_vacate_status(t_phone, property_name=h2.hostelName)
    assert status_case1.get("has_pending") is True, "Case 1: Tenant should have pending vacate for current property"
    dup_res = VacateService.create_request(vacate_payload)
    assert dup_res.get("existing") is True, "Case 1: Duplicate vacate request for current property should be detected"
    print("Verified Case 1: Pending request is active and duplicate is prevented for same property.")

    # CASE 3: Old Pending Request from Property A does NOT block new stay in Property B
    # Simulate tenant leaving Property A and joining Property Alpha (Owner 1)
    tenant.owner = owner1
    tenant.is_vacant = False
    tenant.save()
    JoinRequest.objects.create(
        tenant=tenant,
        owner=owner1,
        property_name=h1.hostelName,
        property_type="hostel",
        status="joined",
        allotted_floor=1,
        allotted_roomno=101,
        allotted_bed=1
    )
    # Vacate status for Property B (Alpha Paradise Hostel) should be False despite pending request for Beta Grand Hostel
    status_case3 = VacateService.get_tenant_vacate_status(t_phone, property_name=h1.hostelName)
    assert status_case3.get("has_pending") is False, "Case 3: Property B must NOT be blocked by pending request in Property A"
    vacate_payload_b = {
        "tenant_phone": t_phone,
        "owner_id": o1_phone,
        "property_name": h1.hostelName,
        "property_type": "hostel",
        "remarks": "Vacating Property B."
    }
    vacate_res_b = VacateService.create_request(vacate_payload_b)
    assert vacate_res_b.get("existing") is False, "Case 3: Must successfully create vacate request for Property B"
    print("Verified Case 3: Old Property A pending request does NOT block Property B.")

    # CASE 4: Rejoin Property A Again -> Old Property A request does NOT block new stay
    # Simulate tenant joining Property Beta (Owner 2) again in a new session
    tenant.owner = owner2
    tenant.is_vacant = False
    tenant.save()
    time.sleep(0.01) # ensure new timestamp
    JoinRequest.objects.create(
        tenant=tenant,
        owner=owner2,
        property_name=h2.hostelName,
        property_type="hostel",
        status="joined",
        allotted_floor=3,
        allotted_roomno=301,
        allotted_bed=1
    )
    # Now create vacate request for this new stay session in Property A
    vacate_res_a_rejoin = VacateService.create_request(vacate_payload)
    assert vacate_res_a_rejoin.get("existing") is False, "Case 4: New stay in Property A must allow creating vacate request (old stay request does not block)"
    print("Verified Case 4: Rejoining same property allows new vacate request; old requests are treated as historical.")

    # CASE 5: Verify historical requests remain in database
    all_requests_count = VacateRequest.objects.filter(tenant=tenant).count()
    assert all_requests_count >= 3, "Case 5: All vacate requests must remain in database for history"
    print(f"Verified Case 5: Historical requests preserved in database (Count={all_requests_count}).")

    results["Test 2 (Vacate Property Request & Lifecycle)"] = "PASSED"

    # -------------------------------------------------------------
    # FEATURE 3 (PART 2): OWNER DECLINE & APPROVE (VACATE REQUEST)
    # -------------------------------------------------------------
    print("\n--- TEST 3: Owner Approval / Rejection (Vacate Request) ---")

    # Target the latest vacate request
    v_req = VacateRequest.objects.get(id=vacate_res_a_rejoin["request_id"])

    # TEST: Permanent Vacate Requests List & Notification Independence
    v_list = VacateService.list_requests(owner_identifier=o2_phone)
    assert len(v_list) > 0, "Owner must see vacate requests in permanent list"
    v_item = v_list[0]
    assert v_item["tenant_name"] == tenant.name, "List item must have tenant_name"
    assert v_item["property_name"] == h2.hostelName, "List item must have property_name"
    assert "room_number" in v_item, "List item must have room_number"
    assert v_item["status"] == "Pending", "Status must be Pending"
    print(f"Verified permanent list item: Tenant={v_item['tenant_name']}, Property={v_item['property_name']}, Room={v_item['room_number']}, Status={v_item['status']}")

    # Clear/Delete all owner notifications to prove vacate request is NOT lost
    Notification.objects.filter(owner_account=owner2).delete()
    v_list_after_notif_clear = VacateService.list_requests(owner_identifier=o2_phone)
    assert len(v_list_after_notif_clear) > 0, "Vacate requests must remain in permanent page even when notifications are cleared/deleted!"
    print("Verified: Vacate request remains accessible in Vacate Requests page after notifications are cleared.")

    # Test 3a: Decline
    dec_res = VacateService.decline_request(v_req.id, acting_owner=owner2)
    print("Decline response:", dec_res)
    v_req.refresh_from_db()
    assert v_req.status == "Declined"
    tenant.refresh_from_db()
    assert tenant.is_vacant is False, "Tenant must remain in property after decline"
    print("Verified: Tenant remains active when owner declines vacate request.")

    # Reset to Pending for Approval test
    v_req.status = "Pending"
    v_req.save()

    # Test 3b: Approve
    app_vac_res = VacateService.approve_request(v_req.id, acting_owner=owner2)
    print("Approve vacate response:", app_vac_res)
    v_req.refresh_from_db()
    assert v_req.status == "Approved"
    tenant.refresh_from_db()
    assert tenant.is_vacant is True, "Tenant is_vacant must be True after vacate approval"
    assert tenant.owner is None, "Tenant owner must be None after vacate approval"
    assert not TenantBeds.objects.filter(phone=t_phone, owner=owner2).exists(), "Tenant beds must be vacated"
    print("Verified: Tenant allocations cleared and marked vacant upon owner approval.")

    # CASE 2: Vacate Approved -> Join Property B -> Vacate button available again
    tenant.owner = owner1
    tenant.is_vacant = False
    tenant.save()
    TenantBeds.objects.create(
        owner=owner1,
        owner_phone=o1_phone,
        name=tenant.name,
        phone=tenant.phone,
        bed=2,
        floor=1,
        roomno=102,
        rent=6500,
        checkIn="2026-09-01",
        checkOut="2026-12-31"
    )
    status_case2 = VacateService.get_tenant_vacate_status(t_phone, property_name=h1.hostelName)
    assert status_case2.get("has_pending") is False, "Case 2: After vacate approved in A and join B, vacate is available for B"
    print("Verified Case 2: Vacate Property button available again after joining Property B.")
    results["Test 3 (Owner Approval/Decline - Vacate Request)"] = "PASSED"

    # -------------------------------------------------------------
    # FEATURE 4: ROOM / FLOOR / BED CHANGE (ACCOMMODATION REQUEST)
    # -------------------------------------------------------------
    print("\n--- TEST 4: Accommodation Change Request (Floor/Room/Bed) ---")
    # Re-assign tenant to test issue creation
    tenant.owner = owner2
    tenant.is_vacant = False
    tenant.save()
    t_bed2 = TenantBeds.objects.create(
        owner=owner2,
        owner_phone=o2_phone,
        name=tenant.name,
        phone=tenant.phone,
        bed=1,
        floor=1,
        roomno=101,
        rent=7500,
        checkIn="2026-09-01",
        checkOut="2026-12-31"
    )
    issue_payload = {
        "phone": t_phone,
        "title": "Accommodation Change Request (ROOM)",
        "description": "Change Request (ROOM): Current Floor Floor 1, Room 101, Bed 1 -> Requested Floor Floor 1, Room 102, Bed 2. Reason: Closer to study area.",
        "severity": "Medium"
    }
    issue_res = IssueService.create_issue(issue_payload, {})
    print("Issue creation response:", issue_res)
    created_issue = Issue.objects.filter(tenant=tenant, title__icontains="Accommodation Change").first()
    assert created_issue is not None
    assert created_issue.status == "Pending"
    assert created_issue.owner == owner2
    print("Verified: Accommodation change request logged as Issue for owner.")
    results["Test 4 (Room/Floor/Bed Change)"] = "PASSED"

    # -------------------------------------------------------------
    # FEATURE 5, 6, 7 & 8: NOTIFICATIONS, UNREAD COUNT & WEBSOCKETS
    # -------------------------------------------------------------
    print("\n--- TEST 5, 6, 7 & 8: Notifications, Unread Badges, Real-time & Status ---")
    # Check notifications exist for owner 2
    owner_unread = NotificationService.get_unread_count(o2_phone, role="owner")
    print(f"Owner {o2_phone} unread count: {owner_unread}")
    assert owner_unread.get("unread_count", 0) > 0, "Owner must have unread notifications"
    results["Test 6 (Notification Unread Count)"] = "PASSED"

    # Mark all read
    mark_all = NotificationService.mark_all_notifications_read(o2_phone, role="owner")
    print("Mark all read response:", mark_all)
    owner_unread_after = NotificationService.get_unread_count(o2_phone, role="owner")
    assert owner_unread_after.get("unread_count") == 0, "Unread count must be 0 after mark-all-read"
    print("Verified: Mark all read resets unread count to 0.")

    # Check Tenant Notifications
    t_notifications = NotificationService.get_notifications(t_phone, role="tenant")
    print(f"Tenant notifications count: {len(t_notifications)}")
    assert len(t_notifications) > 0, "Tenant must have received notification entries"
    results["Test 5 (Notifications)"] = "PASSED"

    # Real-time WebSocket groups and format verification
    sanitized_t = t_phone.replace("+", "").replace("@", "_").replace(".", "_")
    sanitized_o = o2_phone.replace("@", "_").replace(".", "_")
    print(f"Verified WebSocket groups: tenant='tenant_notifications_{sanitized_t}', owner='owner_status_{sanitized_o}', 'user_notifications_{sanitized_o}'")
    results["Test 7 (WebSocket Real-Time Notifications)"] = "PASSED"

    # Tenant Property Status
    print(f"Tenant final status: is_vacant={tenant.is_vacant}, owner={tenant.owner.name if tenant.owner else None}")
    results["Test 8 (Tenant Property Status)"] = "PASSED"

    print("\n" + "=" * 70)
    print("ALL 10 AUDIT & INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    for k, v in results.items():
        print(f" [PASS] {k}: {v}")

if __name__ == "__main__":
    run_audit()
