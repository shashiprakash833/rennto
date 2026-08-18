import React, { createContext, useState, useEffect, useRef, useMemo } from "react";
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

  // 1. Initial Data Load & User Phone Sync
  useEffect(() => {
    const loadData = async () => {
      try {
        const tenant = await AsyncStorage.getItem("tenantPhone");
        const owner = await AsyncStorage.getItem("ownerPhone");
        const role = await AsyncStorage.getItem("userRole");
        const storedSeen = await AsyncStorage.getItem("notificationSeenIds");
        const storedCleared = await AsyncStorage.getItem("notificationClearedIds");

        const activePhone = tenant || owner;
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
        const role = await AsyncStorage.getItem("userRole");
        const activePhone = tenant || owner;
        if (activePhone !== userPhone || role !== userRole) {
          console.log("BookingContext user switched:", userPhone, "->", activePhone, "role:", role);
          setuserPhone(activePhone);
          setUserRole(role);
          if (!activePhone) {
            setRequests([]);
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

  // 1.5. Fetch Initial Requests & Sync
  const fetchRequests = async () => {
    if (!userPhone) return;

    try {
      const isOwner = userRole === 'owner';
      const endpoint = isOwner ? "owner_requests" : "tenant_notifications";

      const response = await fetchWithAuth(
        `${BASE_URL}/api/${endpoint}/${encodeURIComponent(userPhone)}/`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setRequests(data);
      }

      if (!isOwner) {
        const detailsRes = await fetchWithAuth(
          `${BASE_URL}/api/tenantdetails/${encodeURIComponent(userPhone)}/`
        );
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          setIsTenantVacated(detailsData && detailsData.status === "Vacated");
          setTenantStatus(detailsData?.status || "");
          setJoinedProperty(detailsData);
        }
      } else {
        setIsTenantVacated(false);
        setTenantStatus("");
        setJoinedProperty(null);
      }
    } catch (error) {
      console.log("Fetch Requests Error:", error);
    }
  };

  useEffect(() => {
    if (isTenantVacated) {
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

    const hasPendingRequest = requests.some((item) => {
      const status = (item.status || "").toLowerCase();
      return ["pending", "allotted", "pending_confirmation"].includes(status);
    });

    if (hasPendingRequest) {
      setIsJoined(false);
      return;
    }

    setIsJoined(false);
  }, [requests, isTenantVacated, tenantStatus]);

  useEffect(() => {
    fetchRequests();
  }, [userPhone, refreshTrigger]);

  useEffect(() => {

  }, [requests, isTenantVacated, isJoined]);

  // NEW: Poling as backup to WebSocket for robust UI updates
  useEffect(() => {
    if (!userPhone) return;
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [userPhone]);

  // 2. WebSocket Connection Management
  useEffect(() => {
    if (!userPhone) return;

    // Use tenant-notifications path for tenants, normal notifications path for owners/others
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
          console.log("WS Data Received:", data);

          // Trigger a full refresh when any notification comes in
          setRefreshTrigger((prev) => prev + 1);

          // Show popup alert if message exists
          const msgText = data.content?.message || data.message;
          const msgType = data.content?.type || data.type;

          if (msgText) {
            // Check if this is a real-time status update or join request
            if (msgType === "status_update" || msgType === "incoming_request" || msgType === "ISSUE" || msgType === "PAYMENT" || msgType === "PAYMENT_VERIFIED") {
              playSound();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setRefreshTrigger((prev) => prev + 1); // Immediate UI refresh!
              Alert.alert("New Notification 🔔", msgText);
            }
            if (msgType === "tenant_removed") {
              playSound();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              // Force an immediate refresh so screens reflect the vacated state
              setRefreshTrigger((prev) => prev + 1);
              Alert.alert(
                "Removed from Property ⚠️",
                "The owner has removed you from the property.",
              );
            }
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
  }, [userPhone, userRole]);

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

  return (
    <BookingContext.Provider
      value={{
        requests: combinedRequests, // Combine real and mock
        setRequests,
        isJoined,
        joinedProperty,
        pendingCount,
        userPhone,
        setuserPhone,
        refreshTrigger,
        setRefreshTrigger,
        markAllAsSeen,
        clearAllNotifications,
        clearedIds,
        submitOwnerRequest,
        updateOwnerRequestStatus
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};