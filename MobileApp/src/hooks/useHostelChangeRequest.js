import { useState, useCallback } from 'react';
import BASE_URL, { fetchWithAuth } from '@/src/config/Api';

/**
 * Custom hook for managing hostel change requests
 */
export const useHostelChangeRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  /**
   * Check if a tenant can book a specific hostel
   * Returns status, message, and current hostel info
   */
  const checkBookingStatus = useCallback(
    async (tenantPhone, targetHostelId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/hostel-change/check-status/${tenantPhone}/${targetHostelId}/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to check booking status');
        }

        const data = await response.json();
        setBookingStatus(data);
        return data;
      } catch (err) {
        console.log('Error checking booking status:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Create a new hostel change request
   */
  const createChangeRequest = useCallback(
    async (tenantPhone, targetHostelId, expectedJoiningDate, message = '', extraData = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/hostel-change/create/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tenant_phone: tenantPhone,
              target_hostel_id: targetHostelId,
              expected_joining_date: expectedJoiningDate,
              message_to_owner: message,
              tenant_name: extraData.tenantName || '',
              tenant_email: extraData.tenantEmail || '',
              requested_room_preference: extraData.roomPreference || '',
              additional_details: extraData.additionalDetails || message,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || errorData.detail || 'Failed to create request');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.log('Error creating change request:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get all change requests for a tenant
   */
  const getTenantChangeRequests = useCallback(
    async (tenantPhone) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/hostel-change/my-requests/${tenantPhone}/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }

        const data = await response.json();
        return data.requests || [];
      } catch (err) {
        console.log('Error fetching tenant requests:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get pending requests for an owner
   */
  const getOwnerPendingRequests = useCallback(
    async (ownerId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/hostel-change/pending/${ownerId}/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch owner requests');
        }

        const data = await response.json();
        return data.requests || [];
      } catch (err) {
        console.log('Error fetching owner requests:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Approve a hostel change request (Owner action)
   */
  const approveRequest = useCallback(
    async (requestId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/hostel-change/approve/${requestId}/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to approve request');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.log('Error approving request:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Reject a hostel change request (Owner action)
   */
  const rejectRequest = useCallback(
    async (requestId, rejectionReason = '') => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/hostel-change/reject/${requestId}/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rejection_reason: rejectionReason,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reject request');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.log('Error rejecting request:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get all available hostels for tenant to search and select
   */
  const getAvailableHostels = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth(
          `${BASE_URL}/api/owner_props/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch hostels');
        }

        const data = await response.json();
        return data.hostels || data.data || [];
      } catch (err) {
        console.log('Error fetching available hostels:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    bookingStatus,
    checkBookingStatus,
    createChangeRequest,
    getTenantChangeRequests,
    getOwnerPendingRequests,
    approveRequest,
    rejectRequest,
    getAvailableHostels,
  };
};
