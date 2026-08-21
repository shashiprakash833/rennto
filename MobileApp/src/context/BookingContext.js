import React, { createContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from '../utils/LanguageContext';
import BASE_URL, { fetchWithAuth } from "../config/Api";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { showOnceAlert } from "../utils/alertOnce";

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);
  const [userPhone, setuserPhone] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [seenIds, setSeenIds] = useState([]);
  const [clearedIds, setClearedIds] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mockRequests, setMockRequests] = useState([]); // Mock data state
  const ws = useRef(null);

  const player = useAudioPlayer(require("../../assets/notification.wav"));

  async function playSound() {
    try {
      if (player) {
        player.play();
      }
    } catch (error) {
      // error playing sound
    }
  }

  const [isJoined, setIsJoined] = useState(false);
  const [isTenantVacated, setIsTenantVacated] = useState(false);
  const [tenantStatus, setTenantStatus] = useState("");
  const [joinedProperty, setJoinedProperty] = useState(null);

  // Dedicated Unread Notification Count Fetcher
  const fetchUnreadCount = useCallback(async () => {
    if (!userPhone) {
      setUnreadNotificationCount((prev) => (prev !== 0 ? 0 : prev));
      return;
    }
    try {
      const roleParam = userRole ? `&role=${encodeURIComponent(userRole)}` : "";
      const res = await fetchWithAuth(
        `${BASE_URL}/api/notifications/unread-count/?phone=${encodeURIComponent(userPhone)}${roleParam}`
      );
      if (res.ok) {
        const data = await res.json();
        const count = typeof data.unread_count === "number" ? data.unread_count : 0;
        setUnreadNotificationCount((prev) => (prev !== count ? count : prev));
        if (userRole === "tenant") {
          console.log(`[TENANT] NOTIFICATION COUNT: ${count}`);
        } else if (userRole === "owner") {
          console.log(`[OWNER] NOTIFICATION COUNT: ${count}`);
        }
      }
    } catch (e) {
      console.log("Error fetching unread notification count:", e);
    }
  }, [userPhone, userRole]);

  const markNotificationRead = useCallback(async (notificationId) => {
    if (!notificationId) return;
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/notifications/${notificationId}/read/`, {
        method: "POST",
      });
      if (res.ok) {
        if (userRole === "tenant") {
          console.log(`[TENANT] MARKED READ: ${notificationId}`);
        } else if (userRole === "owner") {
          console.log(`[OWNER] MARKED READ: ${notificationId}`);
        }
        await fetchUnreadCount();
      }
    } catch (e) {
      console.log("Error marking notification read:", e);
    }
  }, [userRole, fetchUnreadCount]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userPhone) return;
    try {
      const roleParam = userRole ? `?role=${encodeURIComponent(userRole)}` : "";
      const res = await fetchWithAuth(`${BASE_URL}/api/notifications/${encodeURIComponent(userPhone)}/mark-all-read/${roleParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userRole }),
      });
      if (res.ok) {
        if (userRole === "tenant") {
          console.log("[TENANT] MARKED ALL READ");
        } else if (userRole === "owner") {
          console.log("[OWNER] MARKED ALL READ");
        }
        setUnreadNotificationCount(0);
      }
    } catch (e) {
      console.log("Error marking all notifications read:", e);
    }
  }, [userPhone, userRole]);

  // 1. Initial Data Load & User Phone Sync
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const tenant = await AsyncStorage.getItem("tenantPhone");
        const owner = await AsyncStorage.getItem("ownerPhone");
        const role = await AsyncStorage.getItem("userRole");
        const storedSeen = await AsyncStorage.getItem("notificationSeenIds");
        const storedCleared = await AsyncStorage.getItem("notificationClearedIds");

        const activePhone = role === "owner" ? (owner || tenant) : (tenant || owner);
        if (isMounted) {
          if (activePhone && activePhone !== userPhone) {
            setuserPhone(activePhone);
          }
          if (role && role !== userRole) {
            setUserRole(role);
          }
          if (storedSeen) setSeenIds(JSON.parse(storedSeen));
          if (storedCleared) setClearedIds(JSON.parse(storedCleared));
        }
      } catch (e) {
        console.log("Error loading context data:", e);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 1.5. Fetch Initial Requests & Sync
  const fetchRequests = useCallback(async () => {
    if (!userPhone) return;

    try {
      const isOwner = userRole === 'owner';
      const endpoint = isOwner ? "owner_requests" : "tenant_notifications";

      const response = await fetchWithAuth(
        `${BASE_URL}/api/${endpoint}/${encodeURIComponent(userPhone)}/`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setRequests((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          } catch (e) {}
          return data;
        });
      }

      if (!isOwner) {
        const detailsRes = await fetchWithAuth(
          `${BASE_URL}/api/tenantdetails/${encodeURIComponent(userPhone)}/`
        );
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const isVac = Boolean(
            !detailsData || detailsData.is_vacant || detailsData.status === "Vacated" || detailsData.property_name === "N/A" || !detailsData.property_name
          );
          setIsTenantVacated(isVac);
          setTenantStatus(detailsData?.status || "");
          if (isVac) {
            setJoinedProperty(null);
            setIsJoined(false);
          } else {
            setJoinedProperty(detailsData);
            setIsJoined(true);
          }
        }
      } else {
        setIsTenantVacated(false);
        setTenantStatus("");
        setJoinedProperty(null);
        setIsJoined(false);
      }
    } catch (error) {
      console.log("Fetch Requests Error:", error);
    }
  }, [userPhone, userRole]);

  useEffect(() => {
    if (isTenantVacated || !joinedProperty || joinedProperty.property_name === "N/A" || !joinedProperty.property_name || joinedProperty.is_vacant) {
      setIsJoined(false);
    } else if (tenantStatus === "Active" || !joinedProperty.is_vacant) {
      setIsJoined(true);
    } else {
      setIsJoined(false);
    }
  }, [isTenantVacated, tenantStatus, joinedProperty]);

  useEffect(() => {
    fetchRequests();
    fetchUnreadCount();
  }, [userPhone, refreshTrigger, fetchUnreadCount]);

  // Poll unread count only — do not bump refreshTrigger on a timer (that re-renders the whole app).
  useEffect(() => {
    if (!userPhone) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000);
    return () => clearInterval(interval);
  }, [userPhone, fetchUnreadCount]);

  // 2. WebSocket Connection Management
  useEffect(() => {
    if (!userPhone) return;

    const sanitizedPhone = userPhone
      .replace('+', '')
      .replace('@', '_')
      .replace('.', '_');

    const isTenant = userRole === "tenant";
    const wsUrl = isTenant
      ? `${BASE_URL.replace(/^http/, "ws")}/ws/tenant-notifications/${sanitizedPhone}/`
      : `${BASE_URL.replace(/^http/, "ws")}/ws/notifications/${sanitizedPhone}/`;

    let cancelled = false;
    let reconnectTimer = null;

    const connectWS = () => {
      if (cancelled) return;
      try {
        ws.current?.close();
      } catch (e) {}
      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const msgText = data.content?.message || data.message;

          if (userRole === "tenant") {
            console.log("[TENANT] NEW NOTIFICATION:", msgText || data);
          } else if (userRole === "owner") {
            console.log("[OWNER] NEW NOTIFICATION:", msgText || data);
          }

          fetchUnreadCount();
          setRefreshTrigger((prev) => prev + 1);

          if (msgText) {
            playSound();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showOnceAlert("New Notification 🔔", msgText);
          }
        } catch (err) {
          console.log("WS Message Error:", err);
        }
      };

      ws.current.onclose = () => {
        if (cancelled) return;
        reconnectTimer = setTimeout(connectWS, 4000);
      };
    };
    connectWS();
    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try {
        ws.current?.close();
      } catch (e) {}
    };
  }, [userPhone, userRole, fetchUnreadCount]);

  // Handle Marking As Seen
  const markAllAsSeen = async () => {
    const newIds = requests.map((r) => r.id);
    const uniqueIds = Array.from(new Set([...seenIds, ...newIds]));
    setSeenIds(uniqueIds);
    try {
      await AsyncStorage.setItem("notificationSeenIds", JSON.stringify(uniqueIds));
    } catch (e) {
      console.log("Error saving seenIds:", e);
    }
  };

  // Handle Clearing All Notifications
  const clearAllNotifications = async (items = []) => {
    const targetItems = Array.isArray(items) && items.length > 0 ? items : requests;
    const newIds = targetItems.map((r) => r.id);
    const uniqueIds = Array.from(new Set([...clearedIds, ...newIds]));
    setClearedIds(uniqueIds);
    setUnreadNotificationCount(0);
    try {
      await AsyncStorage.setItem("notificationClearedIds", JSON.stringify(uniqueIds));
      if (userPhone) {
        await markAllNotificationsRead();
      }
    } catch (e) {
      console.log("Error clearing notifications:", e);
    }
  };

  // Refined Pending Count
  const pendingCount = requests.filter((r) => {
    if (clearedIds.includes(r.id)) return false;

    const isUnseen = !seenIds.includes(r.id);
    const status = (r.status || "").toLowerCase();

    // 1. Join Request Logic
    if (r.type === "join_request" || r.type === "JOIN_REQUEST" || !r.type) {
      const isOwnerTask = ["pending", "allotted"].includes(status);
      const isTenantAlert = ["accepted", "rejected"].includes(status);
      
      if (userRole === "owner") {
        return isUnseen && isOwnerTask;
      }
      if (userRole === "tenant") {
        return isUnseen && isTenantAlert;
      }
      return isUnseen && (isOwnerTask || isTenantAlert);
    }

    // 2. Issue Logic
    if (r.type === "issue") {
      // Owner sees new/unseen issues
      // Tenant sees resolved issues
      return isUnseen;
    }

    // 3. Payment Logic
    if (r.type === "payment") {
      // Owner sees pending payments
      // Tenant sees successful/failed payments
      return isUnseen;
    }

    return isUnseen;
  }).length;

  // --- MOCK REQUEST HANDLERS ---
  const submitOwnerRequest = (requestData) => {
    const newReq = {
      ...requestData,
      id: "mock_" + Date.now(),
      created_at: new Date().toISOString(),
      status: "pending",
      is_mock: true
    };
    setMockRequests(prev => [newReq, ...prev]);
    Alert.alert("Success", "Request Sent to Owner!");
  };

  const updateOwnerRequestStatus = (id, newStatus) => {
    setMockRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ));
    setRefreshTrigger(prev => prev + 1);
  };

  const combinedRequests = useMemo(() => {
    return [...requests, ...mockRequests];
  }, [requests, mockRequests]);

  const contextValue = useMemo(() => ({
    requests: combinedRequests,
    setRequests,
    fetchRequests,
    isJoined,
    joinedProperty,
    pendingCount,
    unreadNotificationCount,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    userPhone,
    setuserPhone,
    userRole,
    setUserRole,
    refreshTrigger,
    setRefreshTrigger,
    markAllAsSeen,
    clearAllNotifications,
    clearedIds,
    submitOwnerRequest,
    updateOwnerRequestStatus
  }), [
    combinedRequests,
    fetchRequests,
    isJoined,
    joinedProperty,
    pendingCount,
    unreadNotificationCount,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    userPhone,
    userRole,
    refreshTrigger,
    seenIds,
    clearedIds
  ]);

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};