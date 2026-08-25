import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { fetchWithAuth } from "../../config/Api";
import { BookingContext } from "../../context/BookingContext";
import COLORS from "../../theme/colors";
import { useLanguage } from "../../utils/LanguageContext";

export default function OwnerAdvanceBookingRequestsScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const bookingCtx = useContext(BookingContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, pending, accepted, declined
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdvanceRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const storedOwner =
        bookingCtx?.userPhone ||
        (await AsyncStorage.getItem("ownerPhone")) ||
        (await AsyncStorage.getItem("userPhone")) ||
        "";
      setOwnerPhone(storedOwner);

      if (!storedOwner) {
        setRequests([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetchWithAuth(
        `${BASE_URL}/api/hostel-change/all/${encodeURIComponent(storedOwner)}/?status=all`
      );

      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.log("Error fetching owner advance booking requests:", e);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingCtx?.userPhone]);

  useEffect(() => {
    fetchAdvanceRequests();
  }, [fetchAdvanceRequests, bookingCtx?.refreshTrigger]);

  const handleApprove = async (request) => {
    Alert.alert(
      "Accept Advance Booking",
      `Are you sure you want to accept the advance booking request from ${request.tenant_name || "Tenant"} for ${request.target_property_name || request.target_hostel_name || "Property"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setActionLoading(true);
              // Optimistic UI update
              setRequests((prev) =>
                prev.map((r) => (r.id === request.id ? { ...r, status: "accepted" } : r))
              );

              const res = await fetchWithAuth(
                `${BASE_URL}/api/hostel-change/approve/${request.id}/`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
                }
              );

              if (res.ok) {
                Alert.alert("Success 🎉", "Advance booking request has been accepted.");
                fetchAdvanceRequests(true);
                bookingCtx?.fetchUnreadCount?.();
                bookingCtx?.fetchRequests?.();
              } else {
                const errData = await res.json();
                Alert.alert("Error", errData.error || "Failed to accept request.");
                fetchAdvanceRequests(true);
              }
            } catch (err) {
              Alert.alert("Error", err.message || "Something went wrong.");
              fetchAdvanceRequests(true);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async (request) => {
    Alert.alert(
      "Decline Advance Booking",
      `Are you sure you want to decline the advance booking request from ${request.tenant_name || "Tenant"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              // Optimistic UI update
              setRequests((prev) =>
                prev.map((r) => (r.id === request.id ? { ...r, status: "declined" } : r))
              );

              const res = await fetchWithAuth(
                `${BASE_URL}/api/hostel-change/reject/${request.id}/`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rejection_reason: "Owner declined request" }),
                }
              );

              if (res.ok) {
                Alert.alert("Notice", "Advance booking request has been declined.");
                fetchAdvanceRequests(true);
                bookingCtx?.fetchUnreadCount?.();
                bookingCtx?.fetchRequests?.();
              } else {
                const errData = await res.json();
                Alert.alert("Error", errData.error || "Failed to decline request.");
                fetchAdvanceRequests(true);
              }
            } catch (err) {
              Alert.alert("Error", err.message || "Something went wrong.");
              fetchAdvanceRequests(true);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filter requests by Tab & Search Query
  const filteredRequests = requests.filter((item) => {
    const status = (item.status || "pending").toLowerCase();
    let matchesTab = true;
    if (activeTab === "pending") matchesTab = status === "pending";
    else if (activeTab === "accepted") matchesTab = status === "accepted" || status === "approved";
    else if (activeTab === "declined") matchesTab = status === "declined" || status === "rejected";

    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const tName = (item.tenant_name || "").toLowerCase();
    const tPhone = (item.tenant_phone || "").toLowerCase();
    const pName = (item.target_property_name || item.target_hostel_name || "").toLowerCase();
    return tName.includes(query) || tPhone.includes(query) || pName.includes(query);
  });

  const pendingCount = requests.filter((r) => (r.status || "pending").toLowerCase() === "pending").length;
  const acceptedCount = requests.filter((r) => ["accepted", "approved"].includes((r.status || "").toLowerCase())).length;
  const declinedCount = requests.filter((r) => ["declined", "rejected"].includes((r.status || "").toLowerCase())).length;

  const renderStatusBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "accepted" || s === "approved") {
      return (
        <View style={[styles.badge, styles.badgeAccepted]}>
          <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
          <Text style={styles.badgeTextAccepted}>Accepted</Text>
        </View>
      );
    }
    if (s === "declined" || s === "rejected") {
      return (
        <View style={[styles.badge, styles.badgeDeclined]}>
          <Ionicons name="close-circle" size={12} color="#DC2626" />
          <Text style={styles.badgeTextDeclined}>Declined</Text>
        </View>
      );
    }
    if (s === "cancelled") {
      return (
        <View style={[styles.badge, styles.badgeCancelled]}>
          <Ionicons name="ban" size={12} color="#64748B" />
          <Text style={styles.badgeTextCancelled}>Cancelled</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgePending]}>
        <Ionicons name="time" size={12} color="#D97706" />
        <Text style={styles.badgeTextPending}>Pending</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isPending = (item.status || "pending").toLowerCase() === "pending";
    const targetName = item.target_property_name || item.target_hostel_name || "Target Property";
    const currentName = item.current_property_name || item.current_hostel_name || "New Tenant";

    return (
      <View style={styles.requestCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.tenantInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#7C3AED" />
            </View>
            <View style={styles.tenantTextContainer}>
              <Text style={styles.tenantName}>{item.tenant_name || "Tenant"}</Text>
              <Text style={styles.tenantPhone}>
                <Ionicons name="call-outline" size={11} color="#64748B" /> {item.tenant_phone || "N/A"}
              </Text>
            </View>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        {/* Property & Request Details */}
        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="home-city" size={16} color="#7C3AED" />
            <Text style={styles.detailLabel}>Requested Property:</Text>
            <Text style={styles.detailValueBold} numberOfLines={1}>{targetName}</Text>
          </View>

          {currentName && currentName !== "None (New Tenant)" && currentName !== "New Tenant" && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="home-outline" size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Current Stay:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{currentName}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={15} color="#059669" />
            <Text style={styles.detailLabel}>Expected Joining:</Text>
            <Text style={styles.detailValueDate}>{item.expected_joining_date || "Not specified"}</Text>
          </View>

          {item.created_at && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={15} color="#94A3B8" />
              <Text style={styles.detailLabel}>Requested On:</Text>
              <Text style={styles.detailValueSub}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          )}

          {item.message_to_owner ? (
            <View style={styles.messageBox}>
              <Ionicons name="chatbox-ellipses-outline" size={14} color="#7C3AED" />
              <Text style={styles.messageText}>"{item.message_to_owner}"</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons for Pending Requests */}
        {isPending && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleDecline(item)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleApprove(item)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Advance Booking Requests</Text>
          <Text style={styles.headerSubtitle}>Manage incoming advance reservations</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{pendingCount}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by tenant name, phone, property..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
            All ({requests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "accepted" && styles.tabActive]}
          onPress={() => setActiveTab("accepted")}
        >
          <Text style={[styles.tabText, activeTab === "accepted" && styles.tabTextActive]}>
            Accepted ({acceptedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "declined" && styles.tabActive]}
          onPress={() => setActiveTab("declined")}
        >
          <Text style={[styles.tabText, activeTab === "declined" && styles.tabTextActive]}>
            Declined ({declinedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => `adv-req-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAdvanceRequests(true);
              }}
              colors={["#7C3AED"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="calendar-outline" size={48} color="#C4B5FD" />
              </View>
              <Text style={styles.emptyTitle}>No Advance Bookings</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "No advance booking requests match your search."
                  : activeTab === "pending"
                  ? "You have no pending advance booking requests."
                  : "No advance booking requests found in this section."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  headerBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#7C3AED",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tenantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  tenantTextContainer: {
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  tenantPhone: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeTextPending: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  badgeAccepted: {
    backgroundColor: "#DCFCE7",
  },
  badgeTextAccepted: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  badgeDeclined: {
    backgroundColor: "#FEE2E2",
  },
  badgeTextDeclined: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  badgeCancelled: {
    backgroundColor: "#F1F5F9",
  },
  badgeTextCancelled: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  cardBody: {
    paddingVertical: 10,
    gap: 7,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "600",
    flex: 1,
  },
  detailValueBold: {
    fontSize: 13,
    color: "#7C3AED",
    fontWeight: "800",
    flex: 1,
  },
  detailValueDate: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
  },
  detailValueSub: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FAF5FF",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  messageText: {
    fontSize: 12,
    color: "#581C87",
    fontStyle: "italic",
    flex: 1,
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  declineBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  declineBtnText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  acceptBtn: {
    backgroundColor: "#16A34A",
    elevation: 2,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
