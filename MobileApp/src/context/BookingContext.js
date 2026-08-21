import React, { createContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from '../utils/LanguageContext';
import BASE_URL, { fetchWithAuth } from "../config/Api";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";

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

  // 1.5. Fetch Initial Requests & Sync
  const fetchRequests = useCallback(async () => {
    const role = userRole || (await AsyncStorage.getItem("userRole"));
    const isOwner = role === 'owner';
    const tenant = await AsyncStorage.getItem("tenantPhone");
    const owner = await AsyncStorage.getItem("ownerPhone");
    const selectedAccountId = await AsyncStorage.getItem("selectedAccountId");
    const phoneToUse = userPhone || (isOwner ? (selectedAccountId || owner) : tenant);
    if (!phoneToUse) return;

    try {
      const endpoint = isOwner ? "owner_requests" : "tenant_notifications";

      const response = await fetchWithAuth(
        `${BASE_URL}/api/${endpoint}/${encodeURIComponent(phoneToUse)}/`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setRequests(data);
      }

      if (!isOwner) {
        const detailsRes = await fetchWithAuth(
          `${BASE_URL}/api/tenantdetails/${encodeURIComponent(phoneToUse)}/`
        );
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const isVac = Boolean(
            detailsData && (detailsData.status === "Vacated" || detailsData.property_name === "N/A" || !detailsData.property_name)
          );
          setIsTenantVacated(isVac);
          setTenantStatus(detailsData?.status || "");
          if (isVac) {
            setJoinedProperty(null);
          } else {
            setJoinedProperty(detailsData);
          }
        }
      } else {
        setIsTenantVacated(false);
        setTenantStatus("");
        setJoinedProperty(null);
      }
    } catch (error) {
      console.log("Fetch Requests Error:", error);
    }
  }, [userPhone, userRole]);

  // Dedicated Unread Notification Count Fetcher
  const fetchUnreadCount = useCallback(async () => {
    const role = userRole || (await AsyncStorage.getItem("userRole"));
    const tenant = await AsyncStorage.getItem("tenantPhone");
    const owner = await AsyncStorage.getItem("ownerPhone");
    const selectedAccountId = await AsyncStorage.getItem("selectedAccountId");
    const phoneToUse = userPhone || (role === 'owner' ? (selectedAccountId || owner) : tenant);
    if (!phoneToUse) {
      setUnreadNotificationCount((prev) => (prev !== 0 ? 0 : prev));
      return;
    }
    fetchRequests();
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/notifications/unread-count/?phone=${encodeURIComponent(phoneToUse)}`
      );
      if (res.ok) {
        const data = await res.json();
        const count = typeof data.unread_count === "number" ? data.unread_count : 0;
        setUnreadNotificationCount((prev) => (prev !== count ? count : prev));
        if (role === "tenant") {
          console.log(`[TENANT] NOTIFICATION COUNT: ${count}`);
        } else if (role === "owner") {
          console.log(`[OWNER] NOTIFICATION COUNT: ${count}`);
        }
      }
    } catch (e) {
      console.log("Error fetching unread notification count:", e);
    }
  }, [userPhone, userRole, fetchRequests]);

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
      const res = await fetchWithAuth(`${BASE_URL}/api/notifications/${encodeURIComponent(userPhone)}/mark-all-read/`, {
        method: "POST",
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
    const loadData = async () => {
      try {
        const tenant = await AsyncStorage.getItem("tenantPhone");
        const owner = await AsyncStorage.getItem("ownerPhone");
        let role = await AsyncStorage.getItem("userRole");
        const selectedAccountId = await AsyncStorage.getItem("selectedAccountId");
        const storedSeen = await AsyncStorage.getItem("notificationSeenIds");
        const storedCleared = await AsyncStorage.getItem("notificationClearedIds");

        if (!role) {
          if (selectedAccountId || owner) role = 'owner';
          else if (tenant) role = 'tenant';
        }

        const activePhone = role === 'owner' ? (selectedAccountId || owner) : (role === 'tenant' ? tenant : (tenant || owner));
        if (activePhone !== userPhone) {
          setuserPhone(activePhone);
        }
        if (role !== userRole) {
          setUserRole(role);
        }
        if (storedSeen) setSeenIds(JSON.parse(storedSeen));
        if (storedCleared) setClearedIds(JSON.parse(storedCleared));
      } catch (e) {
        console.log("Error loading context data:", e);
      }
    };
    loadData();

    // Check periodically for user phone changes (login/logout/switch)
    const interval = setInterval(async () => {
      try {
        const tenant = await AsyncStorage.getItem("tenantPhone");
        const owner = await AsyncStorage.getItem("ownerPhone");
        let role = await AsyncStorage.getItem("userRole");
        const selectedAccountId = await AsyncStorage.getItem("selectedAccountId");
        
        if (!role) {
          if (selectedAccountId || owner) role = 'owner';
          else if (tenant) role = 'tenant';
        }

        const activePhone = role === 'owner' ? (selectedAccountId || owner) : (role === 'tenant' ? tenant : (tenant || owner));
        if (activePhone !== userPhone || role !== userRole) {
          console.log("BookingContext user switched:", userPhone, "->", activePhone, "role:", role);
          setuserPhone(activePhone);
          setUserRole(role);
          if (!activePhone) {
            setRequests([]);
            setUnreadNotificationCount(0);
            setIsTenantVacated(false);
            setTenantStatus("");
            setIsJoined(false);
            setJoinedProperty(null);
          }
        }
      } catch (e) {
        console.log("Error checking user phone in interval:", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userPhone, userRole]);

  useEffect(() => {
    if (isTenantVacated || (joinedProperty && (joinedProperty.property_name === "N/A" || !joinedProperty.property_name))) {
      setIsJoined(false);
      return;
    }

    if (tenantStatus === "Active") {
      setIsJoined(true);
      return;
    }

    const joined = requests.some((item) => {
      const status = (item.status || "").toLowerCase();
      return ["completed", "joined", "active", "occupied"].includes(status);
    });

    if (joined) {
      setIsJoined(true);
      return;
    }

    const hasPendingJoinRequest = requests.some((item) => {
      const type = (item.type || item.notification_type || item.request_type || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      if (type.includes("vacate")) return false;
      return ["pending", "allotted", "pending_confirmation"].includes(status);
    });

    if (hasPendingJoinRequest) {
      setIsJoined(false);
      return;
    }

    setIsJoined(false);
  }, [requests, isTenantVacated, tenantStatus, joinedProperty]);

  useEffect(() => {
    fetchRequests();
    fetchUnreadCount();
  }, [userPhone, refreshTrigger, fetchUnreadCount]);

  // Backup polling interval for unread count & UI updates
  useEffect(() => {
    if (!userPhone) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
      setRefreshTrigger((prev) => prev + 1);
    }, 10000);
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

    const connectWS = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const msgText = data.content?.message || data.message;
          const msgType = data.content?.type || data.type;

          if (userRole === "tenant") {
            console.log("[TENANT] NEW NOTIFICATION:", msgText || data);
          } else if (userRole === "owner") {
            console.log("[OWNER] NEW NOTIFICATION:", msgText || data);
          }

          // Immediately update unread count & refresh trigger
          fetchUnreadCount();
          setRefreshTrigger((prev) => prev + 1);

          if (msgText) {
            playSound();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("New Notification 🔔", msgText);
          }

        } catch (err) {
          console.log("WS Message Error:", err);
        }
      };

      ws.current.onclose = () => {
        if (userPhone) {
          setTimeout(connectWS, 3000);
        }
      };
    };
    connectWS();
    return () => ws.current?.close();
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

  // NEW: Handle Clearing (Hiding) All Notifications
  const clearAllNotifications = async () => {
    const newIds = requests.map((r) => r.id);
    const uniqueIds = Array.from(new Set([...clearedIds, ...newIds]));
    setClearedIds(uniqueIds);
    try {
      await AsyncStorage.setItem("notificationClearedIds", JSON.stringify(uniqueIds));
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
      const isTenantAlert = ["accepted", "allotted", "pending_confirmation", "completed", "joined", "rejected"].includes(status);
      
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
    if (r.type === "payment" || r.type === "PAYMENT") {
      // Owner sees pending payments
      // Tenant sees successful/failed payments
      return isUnseen;
    }

    // 4. Vacate Request Logic
    if (r.type === "vacate_request" || r.type === "VACATE_REQUEST") {
      const isOwnerTask = status === "pending";
      const isTenantAlert = ["approved", "accepted", "declined", "rejected"].includes(status);
      if (userRole === "owner") {
        return isUnseen && isOwnerTask;
      }
      if (userRole === "tenant") {
        return isUnseen && isTenantAlert;
      }
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

  const totalUnreadCount = Math.max(unreadNotificationCount, pendingCount);

  const contextValue = useMemo(() => ({
    requests: combinedRequests,
    setRequests,
    isJoined,
    joinedProperty,
    pendingCount,
    unreadNotificationCount: totalUnreadCount,
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
    isJoined,
    joinedProperty,
    pendingCount,
    totalUnreadCount,
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