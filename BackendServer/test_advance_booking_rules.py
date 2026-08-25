import os
import sys
import django
from datetime import date, timedelta

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BMS.settings')
django.setup()

from HAC.models import Tenent, Owners, StayHostelDetails, HostelChangeRequest, TenantNotification, Notification
from HAC.services.hostel_change_service import HostelChangeService

def test_advance_booking_workflow():
    print("=== Testing Advance Booking Workflow & Rules ===")
    
    # 1. Setup test data
    t_phone = "8888000001"
    o1_phone = "8888000002"
    o2_phone = "8888000003"
    
    Tenent.objects.filter(phone=t_phone).delete()
    Owners.objects.filter(phone__in=[o1_phone, o2_phone]).delete()
    
    owner1 = Owners.objects.create(name="Owner One", phone=o1_phone, password="pass", status="active")
    owner2 = Owners.objects.create(name="Owner Two", phone=o2_phone, password="pass", status="active")
    
    prop1 = StayHostelDetails.objects.create(
        owner=owner1,
        hostelName="Sunshine Luxury Hostel",
        location="Madhapur, Hyderabad",
        rent_amount=5000.00,
        stayType="hostel"
    )
    
    prop2 = StayHostelDetails.objects.create(
        owner=owner2,
        hostelName="Blue Horizon Stay",
        location="Gachibowli, Hyderabad",
        rent_amount=6000.00,
        stayType="hostel"
    )
    
    tenant = Tenent.objects.create(
        name="Alex Traveler",
        phone=t_phone,
        email="alex@example.com",
        is_vacant=True
    )
    
    # Clear any past requests & notifications
    HostelChangeRequest.objects.filter(tenant=tenant).delete()
    TenantNotification.objects.filter(tenant_phone=t_phone).delete()
    Notification.objects.filter(owner_account__in=[owner1, owner2]).delete()
    
    # Rule 1: Past date validation
    past_date = (date.today() - timedelta(days=2)).isoformat()
    try:
        HostelChangeService.create_change_request({
            "tenant_phone": t_phone,
            "target_hostel_id": prop1.id,
            "expected_joining_date": past_date,
            "message_to_owner": "Hello"
        })
        assert False, "Should reject past expected joining date"
    except ValueError as e:
        assert "past" in str(e).lower(), f"Expected past date error, got: {e}"
        print("[PASS] Rule Passed: Past expected joining date is blocked.")
        
    # Rule 2: Create valid pending advance booking
    future_date = (date.today() + timedelta(days=10)).isoformat()
    res1 = HostelChangeService.create_change_request({
        "tenant_phone": t_phone,
        "target_hostel_id": prop1.id,
        "expected_joining_date": future_date,
        "message_to_owner": "Looking forward to moving in!"
    })
    assert res1.get("success") is True
    req1_id = res1.get("request_id")
    req1 = HostelChangeRequest.objects.get(id=req1_id)
    assert req1.status == "pending"
    assert req1.target_hostel == prop1
    assert req1.target_owner == owner1
    print(f"[PASS] Request Created: ID={req1_id}, Target={prop1.hostelName}, Status={req1.status}")
    
    # Verify owner notification created
    owner_notif = Notification.objects.filter(owner_account=owner1, related_id=req1_id).first()
    assert owner_notif is not None, "Owner notification must exist in DB"
    assert "Advance Booking Request" in owner_notif.title
    print(f"[PASS] Owner Notification Created: {owner_notif.title} -> {owner_notif.message}")
    
    # Rule 3: Single Active Advance Booking Rule (Pending on Prop 1 blocks Prop 2)
    try:
        HostelChangeService.create_change_request({
            "tenant_phone": t_phone,
            "target_hostel_id": prop2.id,
            "expected_joining_date": future_date,
            "message_to_owner": "Trying to book another property"
        })
        assert False, "Should prevent creating second pending booking"
    except ValueError as e:
        assert "already have a pending advance booking" in str(e), f"Expected pending error, got: {e}"
        print("[PASS] Rule Passed: Second pending request blocked across all properties.")
        
    # Check status endpoint for Prop 1 vs Prop 2
    status_p1 = HostelChangeService.check_can_book_hostel(t_phone, prop1.id)
    assert status_p1["status"] == "pending_request"
    print(f"[PASS] Status for target Prop 1: {status_p1['status']}")
    
    status_p2 = HostelChangeService.check_can_book_hostel(t_phone, prop2.id)
    assert status_p2["status"] == "pending_other_property"
    print(f"[PASS] Status for other Prop 2: {status_p2['status']} (Message: {status_p2['message']})")
    
    # Rule 4: Reset Condition - Tenant cancels pending request
    cancel_res = HostelChangeService.cancel_change_request(req1_id, tenant_phone=t_phone)
    assert cancel_res["status"] == "cancelled"
    req1.refresh_from_db()
    assert req1.status == "cancelled"
    print("[PASS] Reset Condition Passed: Tenant cancelled pending request.")
    
    # Check status allows booking now
    status_p2_after_cancel = HostelChangeService.check_can_book_hostel(t_phone, prop2.id)
    assert status_p2_after_cancel["status"] == "can_book"
    print(f"[PASS] Booking allowed again after cancellation: {status_p2_after_cancel['status']}")
    
    # Rule 5: Tenant creates new booking for Prop 2
    res2 = HostelChangeService.create_change_request({
        "tenant_phone": t_phone,
        "target_hostel_id": prop2.id,
        "expected_joining_date": future_date,
        "message_to_owner": "Booking Blue Horizon"
    })
    req2_id = res2["request_id"]
    
    # Rule 6: Owner 2 declines request
    decline_res = HostelChangeService.reject_change_request(req2_id, rejection_reason="No vacancies currently", acting_owner=owner2)
    assert decline_res["status"] == "declined"
    req2 = HostelChangeRequest.objects.get(id=req2_id)
    assert req2.status == "declined"
    
    # Check tenant received notification
    t_notif_decline = TenantNotification.objects.filter(tenant_phone=t_phone, title="Advance Booking Declined").first()
    assert t_notif_decline is not None, "Tenant must receive decline notification"
    assert "declined" in t_notif_decline.message
    print(f"[PASS] Decline Flow Passed: Tenant notification => {t_notif_decline.message}")
    
    # Rule 7: Reset Condition - After decline, tenant can book again
    res3 = HostelChangeService.create_change_request({
        "tenant_phone": t_phone,
        "target_hostel_id": prop1.id,
        "expected_joining_date": future_date,
        "message_to_owner": "Re-requesting Prop 1"
    })
    req3_id = res3["request_id"]
    
    # Rule 8: Owner 1 accepts request
    accept_res = HostelChangeService.approve_change_request(req3_id, acting_owner=owner1)
    assert accept_res["status"] == "accepted"
    req3 = HostelChangeRequest.objects.get(id=req3_id)
    assert req3.status == "accepted"
    
    # Check tenant received accept notification
    t_notif_accept = TenantNotification.objects.filter(tenant_phone=t_phone, title="Advance Booking Accepted 🎉").first()
    assert t_notif_accept is not None, "Tenant must receive accept notification"
    assert "accepted" in t_notif_accept.message
    print(f"[PASS] Accept Flow Passed: Tenant notification => {t_notif_accept.message}")
    
    # Rule 9: Accepted booking blocks any new advance bookings on other properties
    try:
        HostelChangeService.create_change_request({
            "tenant_phone": t_phone,
            "target_hostel_id": prop2.id,
            "expected_joining_date": future_date,
            "message_to_owner": "Another attempt while having accepted booking"
        })
        assert False, "Should prevent creating new booking when accepted booking exists"
    except ValueError as e:
        assert "already secured an advance booking" in str(e), f"Expected secured error, got: {e}"
        print("[PASS] Rule Passed: Accepted advance booking blocks booking any other property.")
        
    status_p2_after_accept = HostelChangeService.check_can_book_hostel(t_phone, prop2.id)
    assert status_p2_after_accept["status"] == "accepted_other_property"
    print(f"[PASS] Status on other properties after accept: {status_p2_after_accept['status']} (Message: {status_p2_after_accept['message']})")
    
    print("\nALL ADVANCE BOOKING RULES & WORKFLOWS VALIDATED PERFECTLY!")

if __name__ == "__main__":
    test_advance_booking_workflow()
