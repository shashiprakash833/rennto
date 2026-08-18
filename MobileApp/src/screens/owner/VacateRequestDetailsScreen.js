import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { BookingContext } from "@/src/context/BookingContext";
import COLORS from "../../theme/colors";
import OwnerVacateConfirmationModal from "../../components/OwnerVacateConfirmationModal";
import OwnerDeclineConfirmationModal from "../../components/OwnerDeclineConfirmationModal";

export default function VacateRequestDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const requestParam = route.params?.request;
  const requestId = route.params?.requestId || requestParam?.id;

  const { setRefreshTrigger, updateOwnerRequestStatus } = useContext(BookingContext);

  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState(requestParam || null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);

  const loadDetails = async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/vacate/request/${requestId}/`);
      if (res.ok) {
        const data = await res.json();
        setRequestData(data);
      }
    } catch (e) {
      console.log("Error loading vacate request details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && !requestParam?.tenant) {
      loadDetails();
    }
  }, [requestId]);

  const tenant = requestData?.tenant || {
    name: requestData?.tenant_name || requestData?.name || "Tenant",
    phone: requestData?.tenant_phone || requestData?.phone || "N/A",
    email: requestData?.tenant_email || requestData?.email || "N/A",
    profile_picture: requestData?.tenant_avatar || null,
  };

  const property = requestData?.property || {
    name: requestData?.propertyName || requestData?.property_name || "Selected Property",
    type: requestData?.propertyType || requestData?.property_type || "Hostel",
    floor: requestData?.requested_floor || requestData?.floor || "1st Floor",
    room: requestData?.requested_room || requestData?.room || "101",
    bed: requestData?.requested_bed || requestData?.bed || "Bed 1",
    flat: requestData?.requested_flat || requestData?.flat || null,
  };

  const status = (requestData?.status || "Pending").toLowerCase();
  const remarks = requestData?.remarks || requestData?.reason || "No remarks provided.";
  const dateStr = requestData?.created_at || requestData?.createdAt || new Date().toISOString();

  const formatDate = (str) => {
    if (!str) return "";
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleApproveConfirm = async () => {
    try {
      setLoading(true);
      let success = false;
      try {
        const res = await fetchWithAuth(`${BASE_URL}/api/vacate/request/${requestId}/approve/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          success = true;
        }
      } catch (err) {
        console.log("Dedicated vacate approve endpoint error, trying update_request_status fallback:", err);
      }

      if (!success) {
        const resFallback = await fetchWithAuth(`${BASE_URL}/api/update_request_status/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: requestId, status: "accepted", is_existing_tenant: true }),
        });
        if (resFallback.ok) success = true;
      }

      if (updateOwnerRequestStatus) {
        updateOwnerRequestStatus(requestId, "accepted");
      }

      setRefreshTrigger((prev) => prev + 1);
      setRequestData((prev) => ({ ...prev, status: "Approved" }));
      Alert.alert("Tenant Removed 🚀", `${tenant.name} has been removed from the property.`);
    } catch (e) {
      Alert.alert("Error", "Could not process tenant removal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineConfirm = async () => {
    try {
      setLoading(true);
      let success = false;
      try {
        const res = await fetchWithAuth(`${BASE_URL}/api/vacate/request/${requestId}/decline/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          success = true;
        }
      } catch (err) {
        console.log("Dedicated vacate decline endpoint error, trying update_request_status fallback:", err);
      }

      if (!success) {
        const resFallback = await fetchWithAuth(`${BASE_URL}/api/update_request_status/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: requestId, status: "rejected", is_existing_tenant: true }),
        });
        if (resFallback.ok) success = true;
      }

      if (updateOwnerRequestStatus) {
        updateOwnerRequestStatus(requestId, "rejected");
      }

      setRefreshTrigger((prev) => prev + 1);
      setRequestData((prev) => ({ ...prev, status: "Declined" }));
      Alert.alert("Request Declined ❌", "Vacate request has been declined. Tenant remains in property.");
    } catch (e) {
      Alert.alert("Error", "Could not decline request.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (status === "approved" || status === "accepted") {
      return { label: "Approved", bg: "#DCFCE7", text: "#166534" };
    }
    if (status === "declined" || status === "rejected") {
      return { label: "Declined", bg: "#FEE2E2", text: "#991B1B" };
    }
    return { label: "Pending Approval", bg: "#FEF3C7", text: "#92400E" };
  };

  const badge = getStatusBadge();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vacate Request</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading && !requestData ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Banner Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusTitleRow}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.statusTitle}>Property Vacate Request</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            </View>
            <Text style={styles.requestDate}>Submitted on {formatDate(dateStr)}</Text>
          </View>

          {/* Tenant Information Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Tenant Information</Text>
            
            <View style={styles.tenantHeaderRow}>
              {tenant.profile_picture ? (
                <Image source={{ uri: tenant.profile_picture }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(tenant.name || "T")[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.tenantName}>{tenant.name}</Text>
                <Text style={styles.tenantSub}>Existing Tenant</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelGroup}>
                <Ionicons name="call-outline" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{tenant.phone}</Text>
            </View>

            {tenant.email && tenant.email !== "N/A" ? (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name="mail-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Email</Text>
                </View>
                <Text style={styles.infoValue}>{tenant.email}</Text>
              </View>
            ) : null}
          </View>

          {/* Property Information Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Property Allocation</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelGroup}>
                <Ionicons name="business-outline" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Property</Text>
              </View>
              <Text style={styles.infoValue}>{property.name}</Text>
            </View>

            {property.floor ? (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name="layers-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Floor</Text>
                </View>
                <Text style={styles.infoValue}>{property.floor}</Text>
              </View>
            ) : null}

            {property.room || property.flat ? (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name="key-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Room / Flat</Text>
                </View>
                <Text style={styles.infoValue}>{property.room || property.flat}</Text>
              </View>
            ) : null}

            {property.bed ? (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name="bed-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Bed</Text>
                </View>
                <Text style={styles.infoValue}>{property.bed}</Text>
              </View>
            ) : null}
          </View>

          {/* Remarks Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Optional Remarks</Text>
            <Text style={styles.remarksText}>{remarks}</Text>
          </View>
        </ScrollView>
      )}

      {/* Bottom Action Bar for Pending Requests */}
      {status === "pending" && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => setDeclineModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => setAcceptModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Owner Confirmation Modals */}
      <OwnerVacateConfirmationModal
        visible={acceptModalVisible}
        onClose={() => setAcceptModalVisible(false)}
        onConfirm={handleApproveConfirm}
        tenantName={tenant.name}
      />

      <OwnerDeclineConfirmationModal
        visible={declineModalVisible}
        onClose={() => setDeclineModalVisible(false)}
        onConfirm={handleDeclineConfirm}
      />
    </SafeAreaView>
  );
}

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  requestDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  tenantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  tenantName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
  },
  tenantSub: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13.5,
    color: "#4B5563",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "700",
  },
  remarksText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    fontStyle: "italic",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  declineBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  declineBtnText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "800",
  },
  acceptBtn: {
    backgroundColor: "#10B981",
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
