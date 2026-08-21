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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { fetchWithAuth } from "../../config/Api";
import { BookingContext } from "../../context/BookingContext";
import COLORS from "../../theme/colors";
import { useLanguage } from "../../utils/LanguageContext";

export default function OwnerVacateRequestsScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const bookingCtx = useContext(BookingContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, pending, approved, declined
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Modal State for Confirmation
  const [selectedReq, setSelectedReq] = useState(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVacateRequests = useCallback(async (isRefresh = false) => {
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
        `${BASE_URL}/api/vacate/requests/?owner_phone=${encodeURIComponent(storedOwner)}`
      );

      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.log("Error fetching owner vacate requests:", e);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingCtx?.userPhone]);

  useEffect(() => {
    fetchVacateRequests();
  }, [fetchVacateRequests, bookingCtx?.refreshTrigger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVacateRequests(true);
    bookingCtx?.fetchUnreadCount?.();
  };

  const handleApproveConfirm = async () => {
    if (!selectedReq || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/vacate/request/${selectedReq.id}/approve/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        Alert.alert("Approved ✅", "Tenant has been vacated and removed from the property.");
        setApproveModalVisible(false);
        setSelectedReq(null);
        if (bookingCtx?.setRefreshTrigger) {
          bookingCtx.setRefreshTrigger((prev) => prev + 1);
        }
        bookingCtx?.fetchUnreadCount?.();
        fetchVacateRequests(true);
      } else {
        Alert.alert("Error", data.error || data.message || "Failed to approve request.");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Network error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!selectedReq || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/vacate/request/${selectedReq.id}/decline/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        Alert.alert("Declined ❌", "Vacate request declined. Tenant remains in the property.");
        setDeclineModalVisible(false);
        setSelectedReq(null);
        if (bookingCtx?.setRefreshTrigger) {
          bookingCtx.setRefreshTrigger((prev) => prev + 1);
        }
        bookingCtx?.fetchUnreadCount?.();
        fetchVacateRequests(true);
      } else {
        Alert.alert("Error", data.error || data.message || "Failed to decline request.");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Network error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusConfig = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "approved":
      case "accepted":
        return {
          label: "Approved",
          color: "#166534",
          bg: "#DCFCE7",
          border: "#86EFAC",
          icon: "checkmark-circle",
        };
      case "declined":
      case "rejected":
        return {
          label: "Declined",
          color: "#991B1B",
          bg: "#FEE2E2",
          border: "#FCA5A5",
          icon: "close-circle",
        };
      case "historical":
        return {
          label: "Historical",
          color: "#6B7280",
          bg: "#F3F4F6",
          border: "#D1D5DB",
          icon: "archive-outline",
        };
      case "pending":
      default:
        return {
          label: "Pending",
          color: "#92400E",
          bg: "#FEF3C7",
          border: "#FCD34D",
          icon: "time-outline",
        };
    }
  };

  // Filter & Search Logic
  const filteredRequests = requests.filter((r) => {
    const status = (r.status || "").toLowerCase();
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && status === "pending") ||
      (activeTab === "approved" && (status === "approved" || status === "accepted")) ||
      (activeTab === "declined" && (status === "declined" || status === "rejected"));

    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const tenantName = (r.tenant_name || r.tenant?.name || "").toLowerCase();
    const propName = (r.property_name || r.propertyName || "").toLowerCase();
    const room = (r.room_number || r.property?.room || "").toLowerCase();

    return (
      tenantName.includes(query) ||
      propName.includes(query) ||
      room.includes(query)
    );
  });

  const pendingCount = requests.filter((r) => (r.status || "").toLowerCase() === "pending").length;
  const approvedCount = requests.filter((r) => ["approved", "accepted"].includes((r.status || "").toLowerCase())).length;
  const declinedCount = requests.filter((r) => ["declined", "rejected"].includes((r.status || "").toLowerCase())).length;

  const renderItem = ({ item }) => {
    const status = (item.status || "Pending").toLowerCase();
    const isPending = status === "pending";
    const statusCfg = getStatusConfig(item.status);
    const tenantName = item.tenant_name || item.tenant?.name || "Tenant";
    const tenantPhone = item.tenant_phone || item.tenant?.phone || "N/A";
    const propertyName = item.property_name || item.propertyName || "Property";
    const roomNumber = item.room_number || item.property?.room || item.property?.flat || "N/A";
    const floorNumber = item.floor_number || item.property?.floor || "N/A";
    const bedNumber = item.bed_number || item.property?.bed || null;
    const requestDate = formatDate(item.created_at);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("VacateRequestDetailsScreen", {
            requestId: item.id,
            request: item,
          })
        }
      >
        {/* Top Row: Tenant Info & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.tenantInfoRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={20} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tenantName} numberOfLines={1}>
                {tenantName}
              </Text>
              <Text style={styles.tenantPhone}>{tenantPhone}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
            <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Property & Stay Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Property</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {propertyName}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Room / Flat</Text>
            <Text style={styles.detailValue}>
              {roomNumber} {floorNumber !== "N/A" ? `(Fl ${floorNumber})` : ""}
            </Text>
          </View>

          {Boolean(bedNumber && bedNumber !== "N/A") && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bed</Text>
              <Text style={styles.detailValue}>{bedNumber}</Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Request Date</Text>
            <Text style={styles.detailValue}>{requestDate}</Text>
          </View>
        </View>

        {/* Remarks if any */}
        {Boolean(item.remarks) && (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksText} numberOfLines={2}>
              {`"${item.remarks}"`}
            </Text>
          </View>
        )}

        {/* Action Buttons for Pending Requests */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedReq(item);
                setDeclineModalVisible(true);
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedReq(item);
                setApproveModalVisible(true);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("vacate_requests") || "Vacate Requests"}</Text>
          <Text style={styles.headerSubtitle}>
            Manage and review all tenant vacate requests
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by tenant, property, or room..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
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
          style={[styles.tab, activeTab === "approved" && styles.tabActive]}
          onPress={() => setActiveTab("approved")}
        >
          <Text style={[styles.tabText, activeTab === "approved" && styles.tabTextActive]}>
            Approved ({approvedCount})
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
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading vacate requests...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="exit-outline" size={42} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Vacate Requests</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "pending"
              ? "There are no pending vacate requests at this moment."
              : "No vacate requests found matching your filter."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => `vacate-req-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
        />
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      <Modal
        visible={approveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setApproveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Remove Tenant</Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to remove this tenant?
            </Text>

            <View style={styles.modalHighlightBox}>
              <Text style={styles.modalHighlightLabel}>Tenant:</Text>
              <Text style={styles.modalHighlightValue}>
                {selectedReq?.tenant_name || selectedReq?.tenant?.name || "Tenant"}
              </Text>
            </View>

            <Text style={styles.modalSubMessage}>
              Please confirm that all pending rent, dues, and fees have been settled.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                disabled={actionLoading}
                onPress={() => setApproveModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                disabled={actionLoading}
                onPress={handleApproveConfirm}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DECLINE CONFIRMATION MODAL */}
      <Modal
        visible={declineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: "#FFFBEB" }]}>
              <Ionicons name="close-circle-outline" size={32} color="#D97706" />
            </View>

            <Text style={styles.modalTitle}>Decline Vacate Request</Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to decline this vacate request?
            </Text>

            <View style={styles.modalHighlightBox}>
              <Text style={styles.modalHighlightLabel}>Tenant:</Text>
              <Text style={styles.modalHighlightValue}>
                {selectedReq?.tenant_name || selectedReq?.tenant?.name || "Tenant"}
              </Text>
            </View>

            <Text style={styles.modalSubMessage}>
              The tenant will remain active and assigned to their current property and room.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                disabled={actionLoading}
                onPress={() => setDeclineModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#DC2626" }]}
                disabled={actionLoading}
                onPress={handleDeclineConfirm}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 2,
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
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#4B5563",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tenantInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tenantName: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#111827",
  },
  tenantPhone: {
    fontSize: 12.5,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 16,
  },
  detailItem: {
    minWidth: "45%",
    flex: 1,
  },
  detailLabel: {
    fontSize: 11.5,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13.5,
    color: "#1F2937",
    fontWeight: "700",
  },
  remarksBox: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  remarksText: {
    fontSize: 12.5,
    color: "#4B5563",
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  declineBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  declineBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 13.5,
  },
  approveBtn: {
    backgroundColor: "#16A34A",
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13.5,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14.5,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: "600",
  },
  modalHighlightBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalHighlightLabel: {
    fontSize: 13.5,
    color: "#6B7280",
    fontWeight: "600",
    marginRight: 6,
  },
  modalHighlightValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  modalSubMessage: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
  },
  modalCancelBtnText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
  },
  modalConfirmBtn: {
    backgroundColor: "#DC2626",
  },
  modalConfirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
