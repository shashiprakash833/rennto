# Hostel Change Request Workflow - Visual Guide

## Complete User Journey

### TENANT WORKFLOW

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: OPEN HOSTEL CHANGE REQUEST FORM                          │
└──────────────────────────────────────────────────────────────────┘

User sees hostel details → Clicks "Request Change" → Modal opens

┌─────────────────────────────────────────────────────────┐
│ Request Hostel Change                               [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Current Hostel *                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🏠 Search current hostel...                    ▼  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ Target Hostel *                                         │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🔍 Search target hostel...                    ▼  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Cancel]  [Save Draft]  [Send Request]                  │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: SEARCH & SELECT CURRENT HOSTEL                           │
└──────────────────────────────────────────────────────────────────┘

User taps "Search current hostel..." field
↓
Search input appears with soft keyboard
↓
User types: "ABC"
↓
Dropdown appears below with matching results:

┌─────────────────────────────────────────────────────────┐
│ Current Hostel                                          │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🔍 ABC                                        ✕  │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🏢 ABC Hostel                                      │  │
│ │    Downtown, Main Street                           │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 🏢 ABC Boys Hostel                                 │  │
│ │    North Campus                                    │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 🏢 ABC Premium Hostel                              │  │
│ │    City Center                                     │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

User taps "ABC Hostel"
↓
Selection saved, dropdown closes
↓
Field shows:

┌─────────────────────────────────────────────────────────┐
│ Current Hostel                                          │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐  │
│ │ ✓ ABC Hostel                                   ✎   │  │
│ │   Downtown, Main Street                           │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: SEARCH & SELECT TARGET HOSTEL (Same Process)             │
└──────────────────────────────────────────────────────────────────┘

User taps "Search target hostel..." field
↓
Enters "XYZ"
↓
Dropdown shows matching results
↓
User selects "XYZ Modern Hostel"
↓
Field displays selected hostel with checkmark

┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: SELECT DATE & ADD MESSAGE                                │
└──────────────────────────────────────────────────────────────────┘

User taps date field
↓
Modal appears asking for date in YYYY-MM-DD format
↓
User enters: 2026-09-15
↓
Date is validated and saved
↓
User (optional) adds message to owner
↓
Message is auto-saved as user types

┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: SEND REQUEST                                             │
└──────────────────────────────────────────────────────────────────┘

User taps "Send Request" button
↓
Frontend validates all required fields:
  ✓ Current Hostel selected
  ✓ Target Hostel selected
  ✓ Date entered
  ✓ All data auto-saved
↓
Request sent to backend with payload:
{
  tenant_phone: "9876543210",
  tenant_name: "John Doe",
  tenant_email: "john@example.com",
  target_hostel_id: 5,
  current_hostel_id: 2,
  target_owner_id: 12,
  expected_joining_date: "2026-09-15",
  requested_room_preference: "Single Room",
  additional_details: "I need a quiet room for studies"
}
↓
UI shows loading indicator
↓
Request succeeds
↓
Modal closes with success feedback
↓
Tenant sees status: "Request Sent – Waiting for Owner Approval"
↓
Hostel details remain LOCKED


╔══════════════════════════════════════════════════════════════════╗
║                     OWNER WORKFLOW                               ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: OWNER RECEIVES NOTIFICATION                              │
└──────────────────────────────────────────────────────────────────┘

Backend creates notification:
  Title: "Hostel Change Request 📩"
  Message: "John Doe has requested to move to XYZ Modern Hostel 
            for 2026-09-15"

Notification delivered via:
  ✓ Push notification (if push_token exists)
  ✓ WebSocket broadcast (real-time)
  ✓ Database record (persistent)

Owner's phone shows:
  🔔 Hostel Change Request 📩
  John Doe has requested to move to XYZ Modern Hostel

┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: OWNER OPENS NOTIFICATION                                 │
└──────────────────────────────────────────────────────────────────┘

Owner taps notification
↓
App opens to Notification screen
↓
Owner sees request details list:

┌────────────────────────────────────────────────────────┐
│ Pending Hostel Change Requests                      [X]│
├────────────────────────────────────────────────────────┤
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ John Doe                                         │  │
│ │ 📧 john@example.com                              │  │
│ │ 📱 9876543210                                    │  │
│ │                                                  │  │
│ │ Current: ABC Hostel                              │  │
│ │ Target: XYZ Modern Hostel                        │  │
│ │ Joining: 2026-09-15 (in 30 days)                │  │
│ │ Preference: Single Room                          │  │
│ │                                                  │  │
│ │ Message: "I need a quiet room for studies"       │  │
│ │                                                  │  │
│ │ [Accept ✓]  [Reject ✕]                          │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ STEP 3A: OWNER APPROVES REQUEST                                  │
└──────────────────────────────────────────────────────────────────┘

Owner taps "Accept ✓" button
↓
Backend processes:
  1. Updates HostelChangeRequest.status = 'approved'
  2. Records approval timestamp
  3. Sends notification to tenant
  4. Sends WebSocket message to tenant
  5. Marks hostel as "approved" for this tenant
↓
Tenant receives notification:
  ✓ "Your request to move to XYZ Modern Hostel 
      has been approved!"
↓
Tenant can now:
  ✓ View full hostel details
  ✓ Check room availability
  ✓ Book room in target hostel


┌──────────────────────────────────────────────────────────────────┐
│ STEP 3B: OWNER REJECTS REQUEST                                   │
└──────────────────────────────────────────────────────────────────┘

Owner taps "Reject ✕" button
↓
Backend processes:
  1. Updates HostelChangeRequest.status = 'rejected'
  2. Records rejection timestamp
  3. Sends notification to tenant
  4. Sends WebSocket message to tenant
↓
Tenant receives notification:
  ✗ "Your request to move to XYZ Modern Hostel 
      has been rejected by the owner"
↓
Tenant cannot:
  ✗ View hostel details
  ✗ Book room in target hostel
  ✗ Access hostel information
↓
Tenant can submit new request to different hostel


╔══════════════════════════════════════════════════════════════════╗
║                    DATA FLOW SUMMARY                             ║
╚══════════════════════════════════════════════════════════════════╝

FRONTEND (MobileApp)
   ↓
   Collects form data:
   - Current Hostel: Selected with auto-search
   - Target Hostel: Selected with auto-search
   - Date: Validated YYYY-MM-DD format
   - Message: Auto-saved as typed
   - Tenant Info: Pre-filled from session
   ↓
BACKEND (Django)
   ↓
   Validates & Creates:
   - HostelChangeRequest model
   - Notification record
   - Push notification
   - WebSocket broadcast
   ↓
OWNER (Mobile App)
   ↓
   Receives & Reviews:
   - Push notification
   - In-app notification
   - Request details screen
   ↓
   Action Taken:
   - [Accept] → Approval notification sent
   - [Reject] → Rejection notification sent
   ↓
TENANT (Mobile App)
   ↓
   Receives Notification:
   - "Request Approved" OR "Request Rejected"
   ↓
   Access Control Updated:
   - Approved: Details UNLOCKED
   - Rejected: Details REMAIN LOCKED


╔══════════════════════════════════════════════════════════════════╗
║                    KEY FEATURES                                  ║
╚══════════════════════════════════════════════════════════════════╝

✅ Dynamic Search with Real-time Filtering
   - As user types, results update instantly
   - Shows hostel name and location
   - Smooth dropdown with visual connection

✅ Auto-Save Behavior
   - Form data saved as user selects
   - No manual "Save" needed
   - Draft can be saved for later

✅ Owner-Only Notifications
   - Target hostel owner receives notification
   - Complete tenant details for verification
   - Only target owner, not broadcast

✅ Status Tracking
   - Pending: Awaiting owner review
   - Approved: User can access hostel
   - Rejected: User access denied

✅ Clean UI Design
   - Text-only "Cancel" button
   - Connected dropdown design
   - Clear visual feedback
   - Professional appearance

✅ Real-time Updates
   - WebSocket notifications
   - Immediate status changes
   - Live approval/rejection feedback

✅ Secure Access Control
   - Approved requests unlock details
   - Rejected requests keep details locked
   - No bypass possible via UI

---

**This workflow ensures secure, transparent, and efficient hostel
change request management with clear communication between tenants
and hostel owners.**
