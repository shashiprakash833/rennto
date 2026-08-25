import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BookingContext } from "@/src/context/BookingContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useLanguage } from '../../utils/LanguageContext';
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import COLORS from "../../theme/colors";

const OwnerNotificationScreen = ({ route }) => {
  const { t } = useLanguage();
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const dateOptions = { month: "short", day: "numeric" };
    if (date.getFullYear() !== now.getFullYear()) {
      dateOptions.year = "numeric";
    }

    return `${date.toLocaleDateString("en-US", dateOptions)}, ${timeStr}`;
  };

  const navigation = useNavigation();
  const {
    userPhone,
    setRequests: setGlobalRequests,
    refreshTrigger,
    setRefreshTrigger,
    markAllAsSeen,
    clearAllNotifications,
    clearedIds,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead
  } = useContext(BookingContext);

  const phone = route?.params?.phone || userPhone;
  const ownerPropertyType = (route?.params?.propertyType || "").toLowerCase();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    if (!phone) return;
    // Only show full-screen loading on initial fetch to prevent UI flicker
    if (!refreshing && requests.length === 0) setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/owner_requests/${encodeURIComponent(phone)}/`);
      const data = await res.json();

      const mappedData = (Array.isArray(data) ? data : []).map(item => {
        if (item.is_existing_tenant) {
          return {
            ...item,
            type: "existing_tenant",
            floor: item.requested_floor || item.floor,
            room: item.requested_room || item.room,
            bed: item.requested_bed || item.bed,
          };
        }
        if (item.is_vacate_request || item.type === "vacate_request" || item.type === "VACATE_REQUEST") {
          return {
            ...item,
            type: "vacate_request",
            title: "Vacate Request",
            tenant_name: item.name || item.tenant_name || "Tenant",
            message: `${item.name || item.tenant_name || "Tenant"} has requested to vacate the property.`,
          };
        }
        return item;
      });

      let vacateData = [];
      try {
        const vRes = await fetchWithAuth(`${BASE_URL}/api/vacate/requests/?owner_phone=${encodeURIComponent(phone)}`);
        if (vRes.ok) {
          const vJson = await vRes.json();
          vacateData = (Array.isArray(vJson) ? vJson : []).map(v => ({
            ...v,
            type: "vacate_request",
            title: "Vacate Request",
            tenant_name: v.tenant?.name || "Tenant",
            message: `${v.tenant?.name || "Tenant"} has requested to vacate the property.`,
          }));
        }
      } catch (vErr) {
        console.log("Could not fetch dedicated vacate requests:", vErr);
      }

      let hostelChangeData = [];
      try {
        const hcRes = await fetchWithAuth(`${BASE_URL}/api/hostel-change/pending/${encodeURIComponent(phone)}/`);
        if (hcRes.ok) {
          const hcJson = await hcRes.json();
          hostelChangeData = (Array.isArray(hcJson.requests) ? hcJson.requests : []).map(hc => ({
            ...hc,
            type: "hostel_change_request",
            title: "Hostel Change Request 📩",
            tenant_name: hc.tenant_name || "Tenant",
            tenant_phone: hc.tenant_phone || "",
            message: `${hc.tenant_name || "Tenant"} requested to move from ${hc.current_hostel_name || 'Current Hostel'} to ${hc.target_hostel_name || 'Target Hostel'}.`,
          }));
        }
      } catch (hcErr) {
        console.log("Could not fetch hostel change requests:", hcErr);
      }

      const rawCombined = [...hostelChangeData, ...vacateData, ...mappedData];
      const seenMap = new Map();
      rawCombined.forEach(item => {
        const key = `${item.type || 'req'}_${item.id}`;
        if (!seenMap.has(key)) {
          seenMap.set(key, item);
        }
      });
      const combinedData = Array.from(seenMap.values());

      const filteredData = combinedData.filter(item => {
        if (!ownerPropertyType) return true; // If no type passed, show all
        const itemType = (item.propertyType || item.property_type || "").toLowerCase();
        // Match the specific property type, fallback to showing if item has no type to not break existing
        if (!itemType) return true;
        return itemType === ownerPropertyType;
      });

      setRequests(filteredData);
      setGlobalRequests(filteredData);
    } catch (error) {
      console.log("Error", "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      fetchUnreadCount?.();
      markAllNotificationsRead?.();
      markAllAsSeen?.();
    }, [phone, refreshTrigger])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [phone]);

  const handleAction = async (action, id, isExisting = false) => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/update_request_status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, status: action, is_existing_tenant: !!isExisting }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Server returned HTTP ${res.status}`);
      }

      setRefreshTrigger(prev => prev + 1); // Notify Home screen to refresh stats 🚀
      fetchRequests(); // Refresh local list
      console.log("Success", `Request ${action === "accepted" ? "approved" : "declined"} successfully.`);
    } catch (error) {
      console.log("Error", error.message || "Failed to update request status");
    }
  };

  const groupRequests = (reqs) => {
    const sorted = [...reqs].sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    const groups = { New: [], Earlier: [] };
    const now = new Date();

    sorted.forEach((item) => {
      const date = new Date(item.created_at || item.createdAt);
      const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
      if (diffHours < 24) groups.New.push(item);
      else groups.Earlier.push(item);
    });
    return groups;
  };

  const getStatusConfig = (item) => {
    const status = (item.status || "pending").toLowerCase();

    if (item.type === "issue") {
      switch (status) {
        case "completed": return { label: t("resolved") || "Resolved", color: COLORS.SUCCESS, bg: "#E8F5E9" };
        case "in progress": return { label: t("in_progress") || "In Progress", color: COLORS.PRIMARY, bg: "#F5F3FF" };
        default: return { label: t("open") || "Open", color: COLORS.ERROR, bg: "#FFEBEE" };
      }
    }

    if (item.type === "payment") {
      switch (status) {
        case "success": return { label: t("success") || "Success", color: COLORS.SUCCESS, bg: "#E8F5E9" };
        case "failed": return { label: t("failed") || "Failed", color: COLORS.ERROR, bg: "#FFEBEE" };
        default: return { label: t("verifying") || "Verifying", color: COLORS.WARNING, bg: "#FFF8E1" };
      }
    }

    switch (status) {
      case "accepted": return { label: t("approved") || "Approved", color: COLORS.SUCCESS, bg: "#E8F5E9" };
      case "rejected": return { label: t("declined") || "Declined", color: COLORS.ERROR, bg: "#FFEBEE" };
      case "withdrawn": return { label: t("withdrawn") || "Withdrawn", color: COLORS.TEXT_LIGHT, bg: "#F1F5F9" };
      case "allotted": return { label: t("room_allotted") || "Room Allotted", color: COLORS.PRIMARY, bg: "#F5F3FF" };
      default: return { label: t("pending") || "Pending", color: COLORS.WARNING, bg: "#FFF8E1" };
    }
  };

  const renderBadge = (icon, text) => (
    <View style={styles.badge}>
      <Ionicons name={icon} size={14} color={COLORS.TEXT_SECONDARY} />
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );

  const renderCard = (item) => {
    const status = (item.status || "pending").toLowerCase();
    const config = getStatusConfig(item);

    if (item.type === "issue") {
      return (
        <TouchableOpacity
          key={`${item.type}-${item.id}`}
          style={styles.card}
          onPress={() => navigation.navigate("OwnerNavigation", { screen: "Issues" })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: "#FFF1F2" }]}>
                <Ionicons name="construct-outline" size={20} color={COLORS.ERROR} />
              </View>
              <View>
                <Text style={styles.userName}>{item.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.userPhone}>From: {item.tenant_name}</Text>
                  <Text style={styles.timeDot}>•</Text>
                  <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={[styles.cardMessage, { marginTop: 12, color: COLORS.TEXT_SECONDARY }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={[styles.badgeRow, { marginTop: 12 }]}>
            {renderBadge("alert-circle-outline", `${item.severity} Severity`)}
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === "payment") {
      return (
        <TouchableOpacity
          key={`${item.type}-${item.id}`}
          style={styles.card}
          onPress={() => navigation.navigate("OwnerNavigation", { screen: "Payments" })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.SUCCESS} />
              </View>
              <View>
                <Text style={styles.userName}>Payment: ₹{item.amount}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.userPhone}>From: {item.tenant_name}</Text>
                  <Text style={styles.timeDot}>•</Text>
                  <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <View style={[styles.propertySection, { borderTopWidth: 0, marginTop: 10, paddingTop: 0 }]}>
            <Text style={[styles.propertyName, { fontSize: 13 }]}>{item.property_name}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === "vacate_request" || item.type === "VACATE_REQUEST") {
      const iconName = "log-out-outline";
      const iconColor = "#EF4444";
      const iconBg = "#FEF2F2";
      const tenantName = item.tenant?.name || item.tenant_name || item.name || "Tenant";
      const propertyName = item.propertyName || item.property_name || item.property?.name || "Property";
      const reqId = item.id || item.request_id;
      const isPending = (item.status || "pending").toLowerCase() === "pending";

      const handleApproveVacate = async (id) => {
        Alert.alert(
          "Remove Tenant",
          `Are you sure you want to remove this tenant?\n\nTenant: ${tenantName}\n\nPlease confirm that all pending rent, dues, and fees have been settled.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              style: "destructive",
              onPress: async () => {
                try {
                  const response = await fetchWithAuth(`${BASE_URL}/api/vacate/request/${id}/approve/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                  });
                  if (response.ok) {
                    Alert.alert("Approved ✅", "Vacate request approved and tenant removed from property.");
                    setRefreshTrigger((prev) => prev + 1);
                    fetchRequests();
                    fetchUnreadCount?.();
                  } else {
                    const errJson = await response.json().catch(() => ({}));
                    Alert.alert("Error", errJson.error || errJson.message || "Failed to approve vacate request.");
                  }
                } catch (e) {
                  Alert.alert("Error", e.message);
                }
              },
            },
          ]
        );
      };

      const handleDeclineVacate = async (id) => {
        Alert.alert(
          "Decline Vacate Request",
          `Are you sure you want to decline this vacate request? ${tenantName} will remain active in the property.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Decline",
              onPress: async () => {
                try {
                  const response = await fetchWithAuth(`${BASE_URL}/api/vacate/request/${id}/decline/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                  });
                  if (response.ok) {
                    Alert.alert("Declined ❌", "Vacate request declined. Tenant remains in property.");
                    setRefreshTrigger((prev) => prev + 1);
                    fetchRequests();
                    fetchUnreadCount?.();
                  } else {
                    const errJson = await response.json().catch(() => ({}));
                    Alert.alert("Error", errJson.error || errJson.message || "Failed to decline vacate request.");
                  }
                } catch (e) {
                  Alert.alert("Error", e.message);
                }
              },
            },
          ]
        );
      };

      return (
        <TouchableOpacity
          key={`vacate-${item.id}`}
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("VacateRequestDetailsScreen", { requestId: reqId, request: item })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>Vacate Property Request</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <Text style={styles.userPhone} numberOfLines={1}>{tenantName}</Text>
                  <Text style={styles.timeDot}>•</Text>
                  <Text style={styles.timeText}>{formatDate(item.created_at || item.createdAt)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 4 }}>
              Property: <Text style={{ fontWeight: "700", color: COLORS.TEXT_PRIMARY }}>{propertyName}</Text>
            </Text>
            {item.remarks ? (
              <Text style={{ fontSize: 12, color: "#6B7280", fontStyle: "italic", marginTop: 4 }}>
                {`"${item.remarks}"`}
              </Text>
            ) : null}
          </View>

          {isPending && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#F3F4F6", paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" }}
                onPress={() => handleDeclineVacate(reqId)}
              >
                <Text style={{ color: "#4B5563", fontWeight: "700", fontSize: 13 }}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#EF4444", paddingVertical: 10, borderRadius: 8, alignItems: "center" }}
                onPress={() => handleApproveVacate(reqId)}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (item.type === "hostel_change_request") {
      const handleApproveHC = async (reqId) => {
        Alert.alert(
          "Accept Advance Booking",
          `Accept advance booking request from ${item.tenant_name}?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Accept",
              onPress: async () => {
                try {
                  setRequests(prev => prev.map(r => (r.id === reqId && r.type === "hostel_change_request") ? { ...r, status: "accepted" } : r));
                  const response = await fetchWithAuth(`${BASE_URL}/api/hostel-change/approve/${reqId}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                  });
                  if (response.ok) {
                    Alert.alert("Accepted ✅", "Advance booking request accepted.");
                    fetchRequests();
                    fetchUnreadCount?.();
                  } else {
                    const errJson = await response.json();
                    Alert.alert("Error", errJson.error || "Failed to accept.");
                    fetchRequests();
                  }
                } catch (e) {
                  Alert.alert("Error", e.message);
                  fetchRequests();
                }
              }
            }
          ]
        );
      };

      const handleRejectHC = async (reqId) => {
        Alert.alert(
          "Decline Advance Booking",
          `Decline advance booking request from ${item.tenant_name}?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Decline",
              style: "destructive",
              onPress: async () => {
                try {
                  setRequests(prev => prev.map(r => (r.id === reqId && r.type === "hostel_change_request") ? { ...r, status: "declined" } : r));
                  const response = await fetchWithAuth(`${BASE_URL}/api/hostel-change/reject/${reqId}/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rejection_reason: "Owner declined request" }),
                  });
                  if (response.ok) {
                    Alert.alert("Declined ✖", "Advance booking request declined.");
                    fetchRequests();
                    fetchUnreadCount?.();
                  } else {
                    const errJson = await response.json();
                    Alert.alert("Error", errJson.error || "Failed to decline.");
                    fetchRequests();
                  }
                } catch (e) {
                  Alert.alert("Error", e.message);
                  fetchRequests();
                }
              }
            }
          ]
        );
      };

      const isPending = (item.status || "pending").toLowerCase() === "pending";

      return (
        <View key={`hostel-change-${item.id}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="calendar" size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>Advance Booking Request 📩</Text>
                <Text style={[styles.userPhone, { color: COLORS.TEXT_PRIMARY, marginTop: 4 }]}>
                  {item.tenant_name} ({item.tenant_phone})
                </Text>
              </View>
            </View>
            <View style={[
              styles.statusTag,
              {
                backgroundColor:
                  item.status?.toLowerCase() === "accepted" || item.status?.toLowerCase() === "approved"
                    ? "#DCFCE7"
                    : item.status?.toLowerCase() === "declined" || item.status?.toLowerCase() === "rejected"
                    ? "#FEE2E2"
                    : "#FEF3C7"
              }
            ]}>
              <Text style={[
                styles.statusTagText,
                {
                  color:
                    item.status?.toLowerCase() === "accepted" || item.status?.toLowerCase() === "approved"
                      ? "#16A34A"
                      : item.status?.toLowerCase() === "declined" || item.status?.toLowerCase() === "rejected"
                      ? "#DC2626"
                      : "#D97706"
                }
              ]}>
                {item.status ? item.status.toUpperCase() : "PENDING"}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
            {item.current_hostel_name && item.current_hostel_name !== "None (New Tenant)" && (
              <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 4 }}>
                Current Property: <Text style={{ fontWeight: "700", color: COLORS.TEXT_PRIMARY }}>{item.current_hostel_name}</Text>
              </Text>
            )}
            <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 4 }}>
              Requested Property: <Text style={{ fontWeight: "700", color: "#7C3AED" }}>{item.target_hostel_name}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, marginBottom: 4 }}>
              Expected Joining Date: <Text style={{ fontWeight: "600", color: "#0F172A" }}>{item.expected_joining_date}</Text>
            </Text>
            {item.created_at ? (
              <Text style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>
                Request Time: {new Date(item.created_at).toLocaleString()}
              </Text>
            ) : null}
            {item.message_to_owner ? (
              <Text style={{ fontSize: 12, color: "#475569", fontStyle: "italic", marginTop: 4, backgroundColor: "#F8FAFC", padding: 8, borderRadius: 8 }}>
                {`"${item.message_to_owner}"`}
              </Text>
            ) : null}
          </View>

          {isPending && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#EF4444",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6
                }}
                onPress={() => handleRejectHC(item.id)}
              >
                <Ionicons name="close-circle" size={16} color="#FFF" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>✖ Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#10B981",
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6
                }}
                onPress={() => handleApproveHC(item.id)}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>✔ Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (item.type === "accommodation_change") {
      const iconName = item.subType === "ROOM"
        ? "business-outline"
        : item.subType === "BED"
          ? "bed-outline"
          : "layers-outline";
      const iconColor = "#7C3AED";
      const iconBg = "#F3E8FF";

      return (
        <View key={`${item.type}-${item.id}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.title || "Accommodation Change"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.userPhone}>{item.tenant_name || item.name || "Tenant"}</Text>
                  <Text style={styles.timeDot}>•</Text>
                  <Text style={styles.timeText}>{formatDate(item.created_at || item.createdAt)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <Text style={[styles.cardMessage, { marginTop: 10, color: COLORS.TEXT_PRIMARY }]} numberOfLines={3}>
            {item.message || "Tenant requested an accommodation change."}
          </Text>

          {item.reason ? (
            <Text style={{ fontSize: 12, color: COLORS.TEXT_SECONDARY, fontStyle: "italic", marginTop: 4 }}>
              Reason: {item.reason}
            </Text>
          ) : null}

          {status === "pending" ? (
            <View style={[styles.actionButtons, { marginTop: 14 }]}>
              <TouchableOpacity
                style={[styles.btn, styles.approveBtn, { backgroundColor: "#10B981" }]}
                onPress={() => {
                  handleAction("accepted", item.id, item.is_existing_tenant);
                  Alert.alert("Approved", `${item.title || "Request"} approved successfully.`);
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.btnTextPrimary}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.declineBtn]}
                onPress={() => {
                  handleAction("rejected", item.id, item.is_existing_tenant);
                  Alert.alert("Declined", `${item.title || "Request"} declined.`);
                }}
              >
                <Text style={styles.btnTextSecondary}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    }

    if (item.type === "VERIFICATION" || item.type === "MESSAGE" || item.id?.toString().startsWith("notif_")) {
      return (
        <View key={`notif-${item.id}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.title || "Notification"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <Text style={styles.timeText}>{formatDate(item.created_at || item.createdAt)}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusTag, { backgroundColor: item.is_read ? "#F3F4F6" : "#EDE9FE" }]}>
              <Text style={[styles.statusTagText, { color: item.is_read ? "#6B7280" : COLORS.PRIMARY }]}>
                {item.is_read ? "Read" : "New"}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardMessage, { marginTop: 10, color: COLORS.TEXT_PRIMARY }]} numberOfLines={4}>
            {item.message}
          </Text>
        </View>
      );
    }

    return (
      <View key={`${item.type}-${item.id}`} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, paddingRight: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={styles.userName}>{item.name}</Text>
                {item.type === "existing_tenant" ? (
                  <View style={{ backgroundColor: "#E0E7FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#4338CA" }}>{t("existing_tenant") || "Existing Tenant"}</Text>
                  </View>
                ) : item.type !== "issue" && item.type !== "payment" ? (
                  <View style={{ backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669" }}>{t("new_tenant") || "New Tenant"}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Text style={styles.userPhone}>{item.phone}</Text>
                <Text style={styles.timeDot}>•</Text>
                <Text style={styles.timeText}>
                  {formatDate(item.created_at || item.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.propertySection}>
          <Text style={styles.propertyName}>{item.propertyName || "Selected Property"}</Text>
          <View style={styles.badgeRow}>
            {item.type !== "existing_tenant" && item.propertyType && renderBadge("home-outline", item.propertyType)}
            {item.floor && renderBadge("business-outline", `Floor ${item.floor}`)}

            {item.type === "existing_tenant" ? (
              <>
                {(item.propertyType || "").toLowerCase() === "hostel" && item.room && renderBadge("business-outline", `Room ${item.room}`)}
                {(item.propertyType || "").toLowerCase() === "hostel" && item.bed && renderBadge("bed-outline", `Bed ${item.bed}`)}
                {(item.propertyType || "").toLowerCase() === "apartment" && item.flat && renderBadge("business-outline", `Room ${item.flat}`)}
                {(item.propertyType || "").toLowerCase() === "apartment" && item.sharing && renderBadge("home-outline", `Type ${item.sharing}`)}
                {(item.propertyType || "").toLowerCase() === "commercial" && item.room && renderBadge("business-outline", `Unit ${item.room}`)}
              </>
            ) : (
              <>
                {item.room && renderBadge("business-outline", `Room ${item.room}`)}
                {item.flat && renderBadge("business-outline", `Flat ${item.flat}`)}
                {item.bed && renderBadge("bed-outline", `Bed ${item.bed}`)}
                {item.sharing && renderBadge("people-outline", item.sharing)}
              </>
            )}

            {item.section && renderBadge("business-outline", `Section ${item.section}`)}
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("check_in") || "Check-in"}</Text>
            <Text style={styles.detailValue}>{item.checkIn || t("flexible") || "Flexible"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("phone") || "Phone"}</Text>
            <Text style={styles.detailValue}>{item.phone}</Text>
          </View>
        </View>

        {status === "pending" ? (
          <View style={styles.actionButtons}>
            {item.type === "existing_tenant" ? (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => handleAction("accepted", item.db_id || item.id, item.is_existing_tenant)}
                >
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.WHITE} />
                  <Text style={styles.btnTextPrimary}>{t("accept") || "Accept"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.declineBtn]}
                  onPress={() => handleAction("rejected", item.db_id || item.id, item.is_existing_tenant)}
                >
                  <Text style={styles.btnTextSecondary}>{t("decline") || "Decline"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.allotBtn]}
                  onPress={() => navigation.navigate("OwnerNavigation", {
                    screen: "Home",
                    params: { phone, autoFillData: { ...item, requestId: item.db_id || item.id } }
                  })}
                >
                  <Ionicons name="bed-outline" size={18} color={COLORS.WHITE} />
                  <Text style={styles.btnTextPrimary}>{t("allot_room") || "Allot Room"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.declineBtn]}
                  onPress={() => handleAction("rejected", item.db_id || item.id, item.is_existing_tenant)}
                >
                  <Text style={styles.btnTextSecondary}>{t("decline") || "Decline"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : status === "allotted" ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              onPress={() => handleAction("accepted", item.db_id || item.id, item.is_existing_tenant)}
            >
              <Ionicons name="checkmark-done" size={18} color={COLORS.WHITE} />
              <Text style={styles.btnTextPrimary}>{t("approve") || "Approve"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={() => handleAction("rejected", item.db_id || item.id, item.is_existing_tenant)}>
              <Text style={styles.btnTextSecondary}>{t("decline") || "Decline"}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  // Filter out cleared notifications
  const visibleRequests = requests.filter(r => !clearedIds.includes(r.id));
  const grouped = groupRequests(visibleRequests);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home")} style={{ marginRight: 12, padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{t("guest_requests") || "Guest Requests"}</Text>
              <Text style={styles.headerSubtitle}>{t("manage_incoming_booking_applications") || "Manage incoming booking applications"}</Text>
            </View>
          </View>
          {visibleRequests.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                Alert.alert(
                  t("clear_all") || "Clear All",
                  t("clear_all_confirm") || "Are you sure you want to clear all notifications?",
                  [
                    { text: t("cancel") || "Cancel", style: "cancel" },
                    { text: t("clear_all") || "Clear All", onPress: () => clearAllNotifications(requests), style: "destructive" }
                  ]
                );
              }}
            >
              <Text style={styles.clearBtnText}>{t("clear_all") || "Clear All"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />
        }
      >
        {visibleRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={80} color={COLORS.BORDER} />
            <Text style={styles.emptyTitle}>{t("all_cleared") || "All cleared!"}</Text>
            <Text style={styles.emptyText}>{t("managed_all_guest_requests") || "You've managed all your guest requests."}</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([title, items]) => (
            items.length > 0 && (
              <View key={title} style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {items.map(renderCard)}
              </View>
            )
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.ERROR,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_LIGHT,
    marginHorizontal: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    flexShrink: 1,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  timeDot: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  propertySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  propertyName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: "row",
    marginTop: 16,
    gap: 20,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.TEXT_LIGHT,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
  },
  allotBtn: {
    backgroundColor: COLORS.PRIMARY,
    flex: 2,
  },
  approveBtn: {
    backgroundColor: COLORS.SUCCESS,
    flex: 2,
  },
  declineBtn: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btnTextPrimary: {
    color: COLORS.WHITE,
    fontWeight: "700",
    marginLeft: 8,
  },
  btnTextSecondary: {
    color: COLORS.ERROR,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});

export default OwnerNotificationScreen;
