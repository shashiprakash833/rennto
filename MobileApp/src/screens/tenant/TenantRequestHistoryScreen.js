import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { fetchWithAuth } from "../../config/Api";
import { BookingContext } from "../../context/BookingContext";
import COLORS from "../../theme/colors";
import { useLanguage } from "../../utils/LanguageContext";

export default function TenantRequestHistoryScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const bookingCtx = useContext(BookingContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vacateRequests, setVacateRequests] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, vacate, change
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");

  const fetchAllRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const storedTenant =
        bookingCtx?.userPhone ||
        (await AsyncStorage.getItem("tenantPhone")) ||
        (await AsyncStorage.getItem("userPhone")) ||
        "";
      setTenantPhone(storedTenant);

      if (!storedTenant) {
        setVacateRequests([]);
        setChangeRequests([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch Vacate Requests
      const vPromise = fetchWithAuth(
        `${BASE_URL}/api/vacate/requests/?tenant_phone=${encodeURIComponent(storedTenant)}`
      ).then(res => (res.ok ? res.json() : []));

      // Fetch Hostel Change Requests
      const cPromise = fetchWithAuth(
        `${BASE_URL}/api/hostel-change/my-requests/${encodeURIComponent(storedTenant)}/`
      ).then(res => (res.ok ? res.json() : []));

      const [vData, cData] = await Promise.all([vPromise, cPromise]);

      setVacateRequests(Array.isArray(vData) ? vData : []);
      setChangeRequests(Array.isArray(cData) ? cData : []);
    } catch (e) {
      console.log("Error fetching request history:", e);
      setVacateRequests([]);
      setChangeRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookingCtx?.userPhone]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests, bookingCtx?.refreshTrigger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllRequests(true);
    bookingCtx?.fetchUnreadCount?.();
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
      case "completed":
        return {
          label: "Completed",
          color: "#1E40AF",
          bg: "#DBEAFE",
          border: "#93C5FD",
          icon: "checkmark-done-circle",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "#4B5563",
          bg: "#F3F4F6",
          border: "#E5E7EB",
          icon: "ban",
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

  // Combine and format
  const normalizedVacate = vacateRequests.map(item => ({
    ...item,
    reqType: "vacate",
    reqTitle: "Vacate Property Request",
    targetProperty: item.property_name || item.propertyName || "Property",
    displayDate: item.created_at,
    rawStatus: item.status,
  }));

  const normalizedChange = changeRequests.map(item => ({
    ...item,
    reqType: "change",
    reqTitle: "Hostel Change Request",
    targetProperty: item.target_hostel_name || item.target_hostel?.hostelName || "Target Hostel",
    currentProperty: item.current_hostel_name || item.current_hostel?.hostelName || "Current Hostel",
    displayDate: item.created_at,
    rawStatus: item.status,
    room_number: item.requested_room_preference || "N/A",
  }));

  let combined = [];
  if (activeTab === "all") {
    combined = [...normalizedVacate, ...normalizedChange];
  } else if (activeTab === "vacate") {
    combined = [...normalizedVacate];
  } else if (activeTab === "change") {
    combined = [...normalizedChange];
  }

  // Sort newest first
  combined.sort((a, b) => new Date(b.displayDate || 0) - new Date(a.displayDate || 0));

  // Search filter
  const filtered = combined.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const pName = (r.targetProperty || "").toLowerCase();
    const rType = (r.reqTitle || "").toLowerCase();
    const rStatus = (r.rawStatus || "").toLowerCase();
    return pName.includes(q) || rType.includes(q) || rStatus.includes(q);
  });

  const renderRequestCard = ({ item }) => {
    const statusCfg = getStatusConfig(item.rawStatus);
    const isVacate = item.reqType === "vacate";

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTypeRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isVacate ? "#FEE2E2" : "#E0E7FF" },
              ]}
            >
              <Ionicons
                name={isVacate ? "log-out-outline" : "swap-horizontal-outline"}
                size={18}
                color={isVacate ? "#DC2626" : "#4F46E5"}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.reqTitleText}>{item.reqTitle}</Text>
              <Text style={styles.dateText}>{formatDate(item.displayDate)}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusCfg.bg,
                borderColor: statusCfg.border,
              },
            ]}
          >
            <Ionicons
              name={statusCfg.icon}
              size={13}
              color={statusCfg.color}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Request Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={15} color="#6B7280" />
            <Text style={styles.detailLabel}>Property:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.targetProperty}
            </Text>
          </View>

          {item.currentProperty && (
            <View style={styles.detailRow}>
              <Ionicons name="home-outline" size={15} color="#6B7280" />
              <Text style={styles.detailLabel}>From:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.currentProperty}
              </Text>
            </View>
          )}

          {Boolean(item.room_number && item.room_number !== "N/A") && (
            <View style={styles.detailRow}>
              <Ionicons name="key-outline" size={15} color="#6B7280" />
              <Text style={styles.detailLabel}>Room / Bed:</Text>
              <Text style={styles.detailValue}>{item.room_number}</Text>
            </View>
          )}

          {Boolean(item.remarks || item.message_to_owner) && (
            <View style={[styles.detailRow, { alignItems: "flex-start", marginTop: 4 }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color="#6B7280" style={{ marginTop: 2 }} />
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={[styles.detailValue, { flex: 1 }]}>
                {item.remarks || item.message_to_owner}
              </Text>
            </View>
          )}
        </View>

        {/* Status Explanation Banner */}
        {item.rawStatus?.toLowerCase() === "historical" && (
          <View style={styles.historicalBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.historicalBannerText}>
              Archived record from a previous stay session. Read-only.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Request History</Text>
          <Text style={styles.headerSub}>All past and active stay requests</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by property or status..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 8 }}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
            All ({normalizedVacate.length + normalizedChange.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "vacate" && styles.tabBtnActive]}
          onPress={() => setActiveTab("vacate")}
        >
          <Text style={[styles.tabText, activeTab === "vacate" && styles.tabTextActive]}>
            Vacate ({normalizedVacate.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "change" && styles.tabBtnActive]}
          onPress={() => setActiveTab("change")}
        >
          <Text style={[styles.tabText, activeTab === "change" && styles.tabTextActive]}>
            Hostel Change ({normalizedChange.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading request history...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? "No requests match your search criteria."
              : "You have not submitted any stay or vacate requests yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.reqType}-${item.id || index}`}
          renderItem={renderRequestCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7C3AED"]}
              tintColor="#7C3AED"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#1E293B",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  cardTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  reqTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  dateText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  detailsGrid: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    width: 80,
  },
  detailValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1,
  },
  historicalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historicalBannerText: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
