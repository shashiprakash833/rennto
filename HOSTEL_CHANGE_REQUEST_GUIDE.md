# Hostel Change Request Flow - Implementation Guide

## Overview
This feature allows users who are already staying in one hostel to request moving to another hostel after their current stay period. The flow includes user request submission, owner approval/rejection, and final booking completion.

---

## Architecture

### Backend (Django/DRF)

#### Models
- **HostelChangeRequest**: Stores hostel change requests with statuses (pending, approved, rejected)
  - Location: `BackendServer/HAC/models.py`
  - Key fields: tenant, current_hostel, target_hostel, expected_joining_date, status

#### Services
- **HostelChangeService**: Handles business logic for hostel change requests
  - Location: `BackendServer/HAC/services/hostel_change_service.py`
  - Key methods:
    - `create_change_request()`: Creates a new request
    - `approve_change_request()`: Owner approves request
    - `reject_change_request()`: Owner rejects request
    - `check_can_book_hostel()`: Checks if tenant can book a hostel

#### API Endpoints
All endpoints are prefixed with `/api/`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `hostel-change/create/` | Tenant | Create a new change request |
| GET | `hostel-change/check-status/<tenant_phone>/<target_hostel_id>/` | Tenant | Check booking status |
| GET | `hostel-change/pending/<owner_id>/` | Owner | Get pending requests |
| POST | `hostel-change/approve/<request_id>/` | Owner | Approve a request |
| POST | `hostel-change/reject/<request_id>/` | Owner | Reject a request |
| GET | `hostel-change/my-requests/<tenant_phone>/` | Tenant | Get tenant's requests |

---

## Frontend Components (React Native)

### 1. ChangeHostelModal.jsx
Location: `MobileApp/src/components/ChangeHostelModal.jsx`

#### BookNowModal Component
Shows when user tries to book a hostel while already staying in one.

**Props:**
```javascript
{
  visible: boolean,           // Modal visibility
  onClose: function,          // Close handler
  currentHostel: {            // User's current hostel
    id: number,
    name: string,
    location: string
  },
  targetHostel: {             // Hostel to book
    id: number,
    name: string,
    location: string
  },
  onBookNowPress: function    // Book Now button handler
}
```

#### ChangeHostelRequestForm Component
Form for submitting the hostel change request.

**Props:**
```javascript
{
  visible: boolean,           // Modal visibility
  onClose: function,          // Close handler
  currentHostel: object,      // Current hostel details
  targetHostel: object,       // Target hostel details
  onSubmit: function,         // Form submission handler
  loading: boolean            // Loading state
}
```

### 2. HostelChangeRequestList.jsx
Location: `MobileApp/src/components/HostelChangeRequestList.jsx`

Owner dashboard component showing pending hostel change requests.

**Props:**
```javascript
{
  ownerId: string   // Owner's ID
}
```

**Features:**
- Display pending requests with tenant details
- Show current and target hostels
- Display expected joining date and days remaining
- Show tenant's optional message
- Approve/Reject buttons with reasons

---

## Custom Hook: useHostelChangeRequest

Location: `MobileApp/src/hooks/useHostelChangeRequest.js`

### Methods

#### checkBookingStatus(tenantPhone, targetHostelId)
Check if a tenant can book a specific hostel.

**Returns:**
```javascript
{
  status: 'can_book' | 'already_staying' | 'pending_request' | 'approved_request',
  message: string,
  current_hostel: {...},
  request_id: number,
  can_request_change: boolean
}
```

#### createChangeRequest(tenantPhone, targetHostelId, expectedJoiningDate, message)
Create a hostel change request.

**Parameters:**
- `tenantPhone`: string (phone number)
- `targetHostelId`: number (ID of target hostel)
- `expectedJoiningDate`: string (YYYY-MM-DD format)
- `message`: string (optional message to owner)

#### getTenantChangeRequests(tenantPhone)
Get all hostel change requests for a tenant.

#### getOwnerPendingRequests(ownerId)
Get pending hostel change requests for an owner.

#### approveRequest(requestId)
Approve a hostel change request (Owner only).

#### rejectRequest(requestId, rejectionReason)
Reject a hostel change request (Owner only).

---

## Integration Steps

### Step 1: Integrate CheckBookingStatus in Property Details Screen

When a user views a hostel property details, first check if they can book it:

```javascript
// In HostelScreen or PropertyDetailsScreen

import { useHostelChangeRequest } from '@/src/hooks/useHostelChangeRequest';

const [bookNowModalVisible, setBookNowModalVisible] = useState(false);
const [changeFormVisible, setChangeFormVisible] = useState(false);
const { checkBookingStatus, createChangeRequest, loading } = useHostelChangeRequest();

const handlePropertyPress = async (property) => {
  try {
    const status = await checkBookingStatus(userPhone, property.id);
    
    if (status.status === 'already_staying') {
      // Show BookNowModal
      setCurrentHostel(status.current_hostel);
      setTargetHostel(property);
      setBookNowModalVisible(true);
    } else if (status.status === 'can_book') {
      // Proceed with normal booking
      navigateToBooking(property);
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Step 2: Add BookNowModal to Property Details Screen

```javascript
import { BookNowModal, ChangeHostelRequestForm } from '@/src/components/ChangeHostelModal';

<BookNowModal
  visible={bookNowModalVisible}
  onClose={() => setBookNowModalVisible(false)}
  currentHostel={currentHostel}
  targetHostel={targetHostel}
  onBookNowPress={() => {
    setBookNowModalVisible(false);
    setChangeFormVisible(true);
  }}
/>

<ChangeHostelRequestForm
  visible={changeFormVisible}
  onClose={() => setChangeFormVisible(false)}
  currentHostel={currentHostel}
  targetHostel={targetHostel}
  loading={loading}
  onSubmit={async (formData) => {
    try {
      const result = await createChangeRequest(
        userPhone,
        formData.target_hostel_id,
        formData.expectedJoiningDate,
        formData.message
      );
      
      Alert.alert('Success', 'Your request has been sent successfully');
      setChangeFormVisible(false);
      
      // Refresh requests
      fetchTenantRequests();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }}
/>
```

### Step 3: Add Owner Dashboard Section

In the owner's dashboard (e.g., OwnerDashboardScreen), add a section for hostel change requests:

```javascript
import { HostelChangeRequestList } from '@/src/components/HostelChangeRequestList';

// In owner dashboard
<HostelChangeRequestList ownerId={ownerId} />
```

### Step 4: Display Tenant's Request Status

Create a request status screen to show tenants their pending/approved/rejected requests:

```javascript
const TenantChangeRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const { getTenantChangeRequests } = useHostelChangeRequest();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getTenantChangeRequests(userPhone);
      setRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView>
      {requests.map((request) => (
        <View key={request.id} style={styles.requestCard}>
          <Text style={styles.hostelName}>
            {request.current_hostel_name} → {request.target_hostel_name}
          </Text>
          <Text style={styles.status}>{request.status.toUpperCase()}</Text>
          <Text style={styles.date}>
            Expected: {new Date(request.expected_joining_date).toLocaleDateString()}
          </Text>
          
          {request.status === 'approved' && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => navigateToSelectRoom(request.target_hostel_id)}
            >
              <Text>Select Room/Bed</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};
```

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Tenant User Flow                         │
└─────────────────────────────────────────────────────────────┘

1. User views another hostel property
   ↓
2. System checks booking status
   ├─ CAN_BOOK → Normal booking flow
   ├─ PENDING_REQUEST → Show "Request pending" message
   ├─ APPROVED_REQUEST → Show "Request approved" + select room
   └─ ALREADY_STAYING → Show BookNowModal
   ↓
3. User clicks "Book Now"
   ↓
4. Show ChangeHostelRequestForm
   ├─ Current hostel (read-only)
   ├─ Target hostel (read-only)
   ├─ Expected joining date (date picker)
   └─ Optional message to owner
   ↓
5. User clicks "Submit Request"
   ↓
6. Request sent to owner (status: pending)
   ↓
7. Show confirmation message
   ├─ "Request sent successfully"
   └─ "Waiting for owner approval"


┌─────────────────────────────────────────────────────────────┐
│                    Owner Dashboard Flow                     │
└─────────────────────────────────────────────────────────────┘

1. Owner views dashboard
   ↓
2. HostelChangeRequestList shows pending requests
   ↓
3. Request card displays:
   ├─ Tenant name & phone
   ├─ Current & target hostels
   ├─ Expected joining date
   ├─ Tenant's message
   └─ Approve/Reject buttons
   ↓
4. Owner clicks Approve
   ├─ Request status → approved
   ├─ Tenant gets notification
   └─ Tenant can now select room
   ↓
   OR Owner clicks Reject
   ├─ Request status → rejected
   ├─ Optional rejection reason
   └─ Tenant gets notification


┌─────────────────────────────────────────────────────────────┐
│              After Owner Approval - Booking Flow            │
└─────────────────────────────────────────────────────────────┘

1. Tenant gets "Request Approved" notification
   ↓
2. Tenant navigates to select room/bed
   ├─ Show available floors
   ├─ Show available rooms
   └─ Show available beds
   ↓
3. Tenant selects Floor → Room → Bed
   ↓
4. Confirm booking
   ├─ Complete the booking
   └─ Show confirmation
```

---

## State Management

### Using BookingContext (Existing)
Update the existing BookingContext to include hostel change state:

```javascript
const BookingContext = React.createContext();

const BookingProvider = ({ children }) => {
  const [state, setState] = useState({
    // Existing state...
    
    // New hostel change state
    hostelChangeRequest: {
      id: null,
      status: null, // pending, approved, rejected
      currentHostel: null,
      targetHostel: null,
      expectedJoiningDate: null,
    },
  });

  return (
    <BookingContext.Provider value={[state, setState]}>
      {children}
    </BookingContext.Provider>
  );
};
```

---

## Error Handling

### Common Errors and Responses

#### Error: "You are already staying in a property"
- **Status**: 400 Bad Request
- **Action**: Show BookNowModal with change request option

#### Error: "You already have an active request for this property"
- **Status**: 200 OK (but with `existing: true`)
- **Action**: Show "Pending Request" message and prevent duplicate submission

#### Error: "Tenant is blocked"
- **Status**: 400 Bad Request
- **Action**: Show error message, tenant cannot submit requests

#### Error: "Expected joining date cannot be in the past"
- **Status**: 400 Bad Request
- **Action**: Show date picker validation error

---

## Notifications

### Push Notifications

#### To Tenant
- **Approval**: "Request Approved ✅ - Your hostel change request for [hostel_name] has been approved! You can now select your room and bed."
- **Rejection**: "Request Rejected ❌ - Your hostel change request for [hostel_name] has been rejected by the owner."

#### To Owner
- **New Request**: "Hostel Change Request 📩 - [tenant_name] has requested to move to [hostel_name]"

### WebSocket Notifications
Real-time notifications using Django Channels for instant updates.

---

## Testing

### Test Cases

1. **Tenant Creates Change Request**
   - Tenant already staying in Hostel A
   - Tenant views Hostel B details
   - System shows "Already Staying" message
   - Click "Book Now"
   - Fill form with joining date
   - Submit request
   - Verify request created in DB with status "pending"

2. **Owner Approves Request**
   - Owner views pending requests
   - Click "Approve" on a request
   - Verify status changes to "approved"
   - Verify tenant receives notification

3. **Owner Rejects Request**
   - Owner views pending requests
   - Click "Reject" with reason
   - Verify status changes to "rejected"
   - Verify tenant receives notification with reason

4. **After Approval - Select Room Flow**
   - Tenant gets approval notification
   - Navigate to hostel details
   - System shows "Request Approved" with "Select Room" button
   - Click to proceed with room/bed selection
   - Complete booking

---

## Database Queries

### Get pending requests for owner
```sql
SELECT * FROM HAC_hostelchangerequest 
WHERE target_owner_id = ? AND status = 'pending'
ORDER BY created_at DESC;
```

### Get all requests for tenant
```sql
SELECT * FROM HAC_hostelchangerequest 
WHERE tenant_id = ? 
ORDER BY created_at DESC;
```

### Get approved requests (for unlocking booking flow)
```sql
SELECT * FROM HAC_hostelchangerequest 
WHERE tenant_id = ? AND status = 'approved'
AND target_hostel_id = ?;
```

---

## Performance Considerations

1. **Caching**: Cache hostel details to reduce API calls
2. **Pagination**: Implement pagination for request lists (add 20 results per page)
3. **Lazy Loading**: Load request details only when needed
4. **WebSocket**: Use for real-time updates to avoid constant polling

---

## Future Enhancements

1. **Automatic Approval**: Owner can set auto-approval rules (e.g., for known tenants)
2. **Conditional Requests**: Multiple dates/options in single request
3. **Cancellation**: Tenants can cancel approved requests
4. **Analytics**: Track request success rates per hostel
5. **Chat Integration**: In-app messaging between tenant and owner
6. **Payment Lock**: Prevent new booking until vacating first property
7. **Calendar View**: Visual calendar of when requests are expected
