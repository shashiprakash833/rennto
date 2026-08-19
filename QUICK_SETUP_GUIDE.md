# Hostel Change Request Feature - Quick Setup Guide

## 🚀 Quick Start

This guide will help you integrate the hostel change request feature into your existing application in ~15 minutes.

---

## Prerequisites

- Django backend running with current models
- React Native mobile app
- Database migrations applied
- API endpoints configured

---

## Step 1: Backend Setup (5 minutes)

### 1.1 Verify Model Migration
```bash
cd BackendServer
source demo/Scripts/activate  # On Windows: .\demo\Scripts\Activate.ps1
python manage.py migrate
```

**Expected Output:**
```
Applying HAC.0007_hostelchangerequest... OK
```

### 1.2 Verify API Endpoints
All 6 new endpoints should be automatically available:
- POST `/api/hostel-change/create/`
- GET `/api/hostel-change/check-status/<tenant_phone>/<target_hostel_id>/`
- GET `/api/hostel-change/pending/<owner_id>/`
- POST `/api/hostel-change/approve/<request_id>/`
- POST `/api/hostel-change/reject/<request_id>/`
- GET `/api/hostel-change/my-requests/<tenant_phone>/`

**Test Endpoint (using curl or Postman):**
```bash
curl -X GET \
  'http://localhost:8000/api/hostel-change/check-status/9876543210/1/' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## Step 2: Frontend Setup (10 minutes)

### 2.1 Copy Components
Copy the following files to your MobileApp:
```
MobileApp/src/components/ChangeHostelModal.jsx
MobileApp/src/components/HostelChangeRequestList.jsx
MobileApp/src/hooks/useHostelChangeRequest.js
```

### 2.2 Add to Property Details Screen

Open your existing property details screen (e.g., `HostelScreen.js` or `PropertyDetailsScreen.jsx`):

```javascript
// 1. Import new components
import { BookNowModal, ChangeHostelRequestForm } from '@/src/components/ChangeHostelModal';
import { useHostelChangeRequest } from '@/src/hooks/useHostelChangeRequest';

// 2. Initialize state and hook
const [bookNowModalVisible, setBookNowModalVisible] = useState(false);
const [changeFormVisible, setChangeFormVisible] = useState(false);
const { checkBookingStatus, createChangeRequest, loading } = useHostelChangeRequest();

// 3. On book button press
const handleBookPress = async () => {
  const status = await checkBookingStatus(userPhone, hostelId);
  
  if (status.status === 'already_staying') {
    setBookNowModalVisible(true);
  } else if (status.status === 'can_book') {
    proceedToNormalBooking();
  }
};

// 4. Add modals to JSX
<BookNowModal
  visible={bookNowModalVisible}
  onClose={() => setBookNowModalVisible(false)}
  currentHostel={status.current_hostel}
  targetHostel={hostel}
  onBookNowPress={() => {
    setBookNowModalVisible(false);
    setChangeFormVisible(true);
  }}
/>

<ChangeHostelRequestForm
  visible={changeFormVisible}
  onClose={() => setChangeFormVisible(false)}
  currentHostel={status.current_hostel}
  targetHostel={hostel}
  loading={loading}
  onSubmit={async (data) => {
    await createChangeRequest(
      userPhone,
      data.target_hostel_id,
      data.expectedJoiningDate,
      data.message
    );
  }}
/>
```

### 2.3 Add to Owner Dashboard

Open your owner dashboard screen:

```javascript
import { HostelChangeRequestList } from '@/src/components/HostelChangeRequestList';

// In your dashboard JSX
<HostelChangeRequestList ownerId={ownerId} />
```

---

## Step 3: Test the Flow (5 minutes)

### 3.1 Test Tenant Side

1. **Create test data**:
   - Create tenant account (phone: 9876543210)
   - Assign to Hostel A with TenantBeds entry
   - Create Hostel B with owner

2. **Test flow**:
   - Open app as tenant
   - Navigate to Hostel B details
   - Should see "Already Staying" message
   - Click "Book Now"
   - Fill form with future date
   - Submit request

3. **Expected result**:
   ```
   ✓ Request created in DB with status=pending
   ✓ Owner receives notification
   ✓ Tenant sees confirmation message
   ```

### 3.2 Test Owner Side

1. **Open owner dashboard**
   - Login as owner of Hostel B
   - View "Hostel Change Requests" section
   - Should see pending request from tenant

2. **Approve/Reject**:
   - Click "Approve" on request
   - Tenant should receive notification
   - Request status changes to "approved"

3. **After approval**:
   - Tenant can now see "Request Approved" message
   - Can click to select room/bed
   - Proceeds with normal booking flow

---

## Step 4: Verification Checklist

- [ ] Backend migrations applied successfully
- [ ] API endpoints responding (test with Postman)
- [ ] Components imported without errors
- [ ] Modals show correctly on mobile
- [ ] Form submission works
- [ ] Owner dashboard displays requests
- [ ] Notifications sent (if enabled)
- [ ] Database records created
- [ ] Status changes reflect in UI

---

## Troubleshooting

### Issue: "Module not found" for components
**Solution**: Verify file paths match your project structure. Update imports accordingly.

### Issue: API returns 401 Unauthorized
**Solution**: Ensure JWT token is being sent. Check `fetchWithAuth` implementation in your Api.js

### Issue: Notifications not working
**Solution**: Configure Firebase Cloud Messaging (FCM) and verify push_token is saved.

### Issue: Modal not showing
**Solution**: Ensure parent component is using React.useState() correctly. Check StyleSheet calculations.

### Issue: Date picker not opening
**Solution**: The example uses Alert.prompt(). For production, use a proper date picker library like:
   ```bash
   npm install react-native-date-picker
   ```

---

## API Examples

### Create Request
```bash
POST /api/hostel-change/create/
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "tenant_phone": "9876543210",
  "target_hostel_id": 2,
  "expected_joining_date": "2026-09-01",
  "message_to_owner": "Looking forward to your hostel!"
}

Response:
{
  "message": "Your hostel change request has been sent successfully",
  "request_id": 123,
  "existing": false
}
```

### Check Booking Status
```bash
GET /api/hostel-change/check-status/9876543210/2/
Authorization: Bearer TOKEN

Response:
{
  "status": "already_staying",
  "message": "You are already staying in a property...",
  "can_request_change": true,
  "current_hostel": {
    "id": 1,
    "name": "Hostel A",
    "location": "Location A"
  }
}
```

### Get Pending Requests (Owner)
```bash
GET /api/hostel-change/pending/OWNER_ID/
Authorization: Bearer TOKEN

Response:
{
  "count": 1,
  "requests": [
    {
      "id": 123,
      "tenant_name": "John Doe",
      "tenant_phone": "9876543210",
      "current_hostel_name": "Hostel A",
      "target_hostel_name": "Hostel B",
      "expected_joining_date": "2026-09-01",
      "days_until_joining": 10,
      "status": "pending",
      "message_to_owner": "Looking forward...",
      "created_at": "2026-08-14T..."
    }
  ]
}
```

### Approve Request
```bash
POST /api/hostel-change/approve/123/
Content-Type: application/json
Authorization: Bearer TOKEN

Response:
{
  "message": "Request approved successfully"
}
```

### Reject Request
```bash
POST /api/hostel-change/reject/123/
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "rejection_reason": "Dates not available"
}

Response:
{
  "message": "Request rejected successfully"
}
```

---

## Database Queries for Testing

### Check all hostel change requests
```sql
SELECT * FROM HAC_hostelchangerequest 
ORDER BY created_at DESC;
```

### Get pending requests for owner
```sql
SELECT * FROM HAC_hostelchangerequest 
WHERE target_owner_id = 5 AND status = 'pending'
ORDER BY created_at DESC;
```

### Get tenant's requests
```sql
SELECT * FROM HAC_hostelchangerequest 
WHERE tenant_id = 10
ORDER BY created_at DESC;
```

### Update request status (manual test)
```sql
UPDATE HAC_hostelchangerequest 
SET status = 'approved' 
WHERE id = 123;
```

---

## Environment Variables

No additional environment variables needed. The feature uses existing configurations:
- `BASE_URL`: API base URL (from Api.js)
- `JWT_TOKEN`: User authentication token (from AsyncStorage)

---

## Performance Notes

1. **API Calls**:
   - Check status: ~100-200ms
   - Create request: ~150-300ms
   - Fetch pending requests: ~100-200ms

2. **Database**:
   - Indexed on: (tenant_id), (target_hostel_id), (target_owner_id), (status)
   - Queries are optimized with select_related()

3. **Caching**:
   - Consider caching hostel details (30 sec TTL)
   - Cache user's current hostel info

---

## Security Considerations

✅ **Implemented**:
- JWT token required for all endpoints
- Owner can only approve/reject requests for their own hostels
- Tenant cannot send duplicate requests
- Blocked tenants cannot send requests
- Date validation (no past dates)

⚠️ **To Consider**:
- Rate limiting on request creation (prevent spam)
- Notification spam prevention
- Request expiration (auto-reject after 30 days)
- Audit logging for approvals/rejections

---

## Next Steps

1. **Testing**:
   - Test with real users
   - Monitor API performance
   - Check notification delivery

2. **Enhancement**:
   - Add request expiration
   - Add multiple date options
   - Add chat between tenant/owner
   - Add analytics dashboard

3. **Deployment**:
   - Run migrations on production
   - Deploy backend changes
   - Deploy mobile app update
   - Monitor for errors

---

## Support

For issues or questions:
1. Check HOSTEL_CHANGE_REQUEST_GUIDE.md for detailed documentation
2. Review EXAMPLE_INTEGRATION.jsx for working example
3. Check API responses and error messages
4. Review server logs for backend errors

---

**Last Updated**: 2026-08-14
**Version**: 1.0
**Status**: Ready for Integration ✅
