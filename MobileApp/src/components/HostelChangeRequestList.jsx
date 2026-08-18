import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import COLORS from "@/src/theme/colors";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";

/**
 * HostelChangeRequestList Component
 * Shows pending hostel change requests for an owner
 */
export const HostelChangeRequestList = ({ ownerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [ownerId]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth(
        `${BASE_URL}/api/hostel-change/pending/${ownerId}/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (requestId) => {
    Alert.alert(
      "Approve Request",
      "Are you sure you want to approve this hostel change request?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: async () => {
            try {
              const response = await fetchWithAuth(
                `${BASE_URL}/api/hostel-change/approve/${requestId}/`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({}),
                }
              );

              if (!response.ok) {
                throw new Error("Failed to approve request");
              }

              Alert.alert("Success", "Request approved successfully");
              fetchPendingRequests();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
          style: "default",
        },
      ]
    );
  };

  const handleReject = async (requestId) => {
    Alert.prompt(
      "Reject Request",
      "Provide a reason for rejection (optional):",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Reject",
          onPress: async (reason) => {
            try {
              const response = await fetchWithAuth(
                `${BASE_URL}/api/hostel-change/reject/${requestId}/`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    rejection_reason: reason || "",
                  }),
                }
              );

              if (!response.ok) {
                throw new Error("Failed to reject request");
              }

              Alert.alert("Success", "Request rejected successfully");
              fetchPendingRequests();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
          style: "destructive",
        },
      ],
      "plain-text"
    );
  };

  const renderRequestCard = ({ item }) => (
    <View style={styles.requestCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.tenantInfo}>
          <MaterialCommunityIcons
            name="account-circle"
            size={40}
            color={COLORS.primary}
          />
          <View style={styles.tenantDetails}>
            <Text style={styles.tenantName}>{item.tenant_name}</Text>
            <Text style={styles.tenantPhone}>{item.tenant_phone}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, styles.pendingBadge]}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      {/* Hostel Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="home-city"
            size={18}
            color={COLORS.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>From Hostel</Text>
            <Text style={styles.detailValue}>
              {item.current_hostel_name}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="home-city-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>To Hostel</Text>
            <Text style={styles.detailValue}>{item.target_hostel_name}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="calendar-range"
            size={18}
            color={COLORS.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Expected Joining</Text>
            <Text style={styles.detailValue}>
              {new Date(item.expected_joining_date).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "short", day: "numeric" }
              )}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Days Until Join</Text>
            <Text style={styles.detailValue}>
              {item.days_until_joining} days
            </Text>
          </View>
        </View>

        {item.days_remaining_in_current_hostel && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={18}
              color={COLORS.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Days in Current Hostel</Text>
              <Text style={styles.detailValue}>
                {item.days_remaining_in_current_hostel} days
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Message */}
      {item.message_to_owner && (
        <View style={styles.messageSection}>
          <Text style={styles.messageLabel}>Message from Tenant</Text>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.message_to_owner}</Text>
          </View>
        </View>
      )}

      {/* Request Date */}
      <View style={styles.requestDateSection}>
        <Text style={styles.requestDateLabel}>
          Requested on{" "}
          {new Date(item.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={18}
            color={COLORS.danger}
          />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={18}
            color="white"
          />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={24}
            color={COLORS.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPendingRequests}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="inbox-outline"
            size={48}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No pending requests</Text>
          <Text style={styles.emptyStateSubtext}>
            New hostel change requests will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchPendingRequests}
        refreshing={refreshing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tenantInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  tenantDetails: {
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  tenantPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: COLORS.warningLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.warning,
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
  },
  messageSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  messageBubble: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  requestDateSection: {
    marginBottom: 12,
  },
  requestDateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionsSection: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "transparent",
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.danger,
  },
  approveButton: {
    backgroundColor: COLORS.primary,
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});
