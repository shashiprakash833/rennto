import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "@/src/theme/colors";

/**
 * BookNowModal Component
 * Shows informational dialog when user initiates advance booking or property change.
 */
export const BookNowModal = ({
  visible,
  onClose,
  currentHostel,
  targetHostel,
  onBookNowPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Ionicons name="calendar" size={20} color={COLORS.PRIMARY || "#7C3AED"} />
              </View>
              <Text style={styles.headerTitle}>Advance Booking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Info Message */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information"
                size={22}
                color={COLORS.PRIMARY || "#7C3AED"}
              />
              <Text style={styles.infoBoxText}>
                You are submitting an advance booking request to reserve your stay in advance.
              </Text>
            </View>

            {/* Target Property Info */}
            {targetHostel && (
              <View style={styles.formSection}>
                <Text style={styles.label}>
                  <MaterialCommunityIcons name="home-city" size={13} color={COLORS.PRIMARY || "#7C3AED"} /> Target Property
                </Text>
                <View style={styles.readOnlyField}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                  <View style={styles.hostelFieldContent}>
                    <Text style={styles.readOnlyText}>{targetHostel.name || targetHostel.hostelName}</Text>
                    <Text style={styles.hostelLocationText}>{targetHostel.location || targetHostel.address}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Current Hostel Info (if any) */}
            {currentHostel && currentHostel.name && currentHostel.name !== "None (New Tenant)" && (
              <View style={styles.formSection}>
                <Text style={styles.label}>
                  <MaterialCommunityIcons name="home-outline" size={13} color="#64748B" /> Current Stay
                </Text>
                <View style={[styles.readOnlyField, { borderColor: "#E2E8F0" }]}>
                  <MaterialCommunityIcons name="home" size={20} color="#64748B" />
                  <View style={styles.hostelFieldContent}>
                    <Text style={[styles.readOnlyText, { color: "#475569" }]}>{currentHostel.name}</Text>
                    {currentHostel.location ? (
                      <Text style={styles.hostelLocationText}>{currentHostel.location}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, { flex: 1 }]}
                onPress={onBookNowPress}
              >
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * AdvanceBookingModal / ChangeHostelRequestForm Component
 * Fully refactored real-time Advance Booking workflow:
 * - Read-only Selected Property card (no dropdown/search/pencil)
 * - Expected Joining Date picker
 * - Optional Message to Owner
 * - Primary Rennto Purple Theme
 * - No Save Draft button
 */
export const ChangeHostelRequestForm = ({
  visible,
  onClose,
  targetHostel,
  currentHostel,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    expectedJoiningDate: "",
    message: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sync state when modal opens or targetHostel changes
  useEffect(() => {
    if (visible) {
      setFormData({
        expectedJoiningDate: "",
        message: "",
      });
      setShowDatePicker(false);
    }
  }, [visible, targetHostel]);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      setFormData((prev) => ({
        ...prev,
        expectedJoiningDate: formattedDate,
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.expectedJoiningDate) {
      Alert.alert("Required Field", "Please select your expected joining date.");
      return;
    }

    const selectedProperty = targetHostel;
    if (!selectedProperty || !selectedProperty.id) {
      Alert.alert("Error", "Selected property details are missing. Please try again.");
      return;
    }

    onSubmit({
      target_hostel_id: selectedProperty.id,
      target_property_id: selectedProperty.id,
      target_property_name: selectedProperty.name || selectedProperty.hostelName || "",
      target_owner_id: selectedProperty.owner_id || selectedProperty.contact || selectedProperty.ownerPhone,
      expected_joining_date: formData.expectedJoiningDate,
      expectedJoiningDate: formData.expectedJoiningDate,
      message_to_owner: formData.message.trim(),
      message: formData.message.trim(),
      current_hostel_id: currentHostel?.id || null,
    });
  };

  const propertyName = targetHostel?.name || targetHostel?.hostelName || targetHostel?.property_name || "Selected Property";
  const propertyLocation = targetHostel?.location || targetHostel?.address || "Location not specified";
  const ownerName = targetHostel?.ownerName || targetHostel?.owner_name || targetHostel?.owner?.name || "";
  const rentAmount = targetHostel?.rent || targetHostel?.rent_amount || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, styles.formContainer]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY || "#7C3AED"} />
              </View>
              <Text style={styles.headerTitle}>Advance Booking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={loading}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 1. SELECTED PROPERTY CARD (READ-ONLY) */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="shield-check" size={13} color={COLORS.PRIMARY || "#7C3AED"} /> Selected Property (Read Only)
              </Text>
              
              <View style={styles.selectedPropertyCard}>
                <View style={styles.propertyCardHeader}>
                  <View style={styles.propertyIconBadge}>
                    <MaterialCommunityIcons name="home-city" size={22} color={COLORS.PRIMARY || "#7C3AED"} />
                  </View>
                  <View style={styles.propertyMainInfo}>
                    <Text style={styles.propertyNameText} numberOfLines={1}>{propertyName}</Text>
                    <Text style={styles.propertyLocationText} numberOfLines={1}>
                      <Ionicons name="location-outline" size={12} color="#64748B" /> {propertyLocation}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="check-decagram" size={22} color="#10B981" />
                </View>

                {(ownerName || rentAmount) && (
                  <View style={styles.propertyMetaRow}>
                    {ownerName ? (
                      <View style={styles.metaBadge}>
                        <Ionicons name="person-outline" size={12} color="#64748B" />
                        <Text style={styles.metaBadgeText}>{ownerName}</Text>
                      </View>
                    ) : null}
                    {rentAmount ? (
                      <View style={[styles.metaBadge, styles.rentBadge]}>
                        <Text style={styles.rentBadgeText}>₹{rentAmount}/mo</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            </View>

            {/* 2. EXPECTED JOINING DATE */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="calendar" size={13} color={COLORS.PRIMARY || "#7C3AED"} /> Expected Joining Date *
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  formData.expectedJoiningDate && styles.dateInputActive,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={formData.expectedJoiningDate ? (COLORS.PRIMARY || "#7C3AED") : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.dateInputText,
                    !formData.expectedJoiningDate && { color: "#94A3B8" },
                    formData.expectedJoiningDate && { color: "#0F172A", fontWeight: "700" },
                  ]}
                >
                  {formData.expectedJoiningDate ? formData.expectedJoiningDate : "Select date (YYYY-MM-DD)"}
                </Text>
                {formData.expectedJoiningDate ? (
                  <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                ) : (
                  <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>
              <Text style={styles.dateHint}>Tap to select joining date</Text>
            </View>

            {/* Date Picker Component */}
            {showDatePicker && (
              <DateTimePicker
                value={formData.expectedJoiningDate ? new Date(formData.expectedJoiningDate) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {/* 3. MESSAGE TO OWNER (OPTIONAL) */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="message-text-outline" size={13} color={COLORS.PRIMARY || "#7C3AED"} /> Message to Owner (Optional)
              </Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Tell the owner about your planned stay..."
                multiline
                numberOfLines={4}
                value={formData.message}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, message: text }))}
                placeholderTextColor="#94A3B8"
                maxLength={500}
              />
              <Text style={styles.charCount}>{formData.message.length}/500 characters</Text>
            </View>

            {/* 4. INFO BOX */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={COLORS.PRIMARY || "#7C3AED"}
              />
              <Text style={styles.infoBoxText}>
                Your advance booking request will be sent directly to the property owner for review and approval.
              </Text>
            </View>
          </ScrollView>

          {/* Footer - Cancel and Send Request Buttons */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>Send Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const AdvanceBookingModal = ChangeHostelRequestForm;
export default ChangeHostelRequestForm;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  formContainer: {
    maxHeight: "95%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  formSection: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  selectedPropertyCard: {
    backgroundColor: "#FAF5FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E9D5FF",
    elevation: 2,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  propertyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  propertyIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  propertyMainInfo: {
    flex: 1,
  },
  propertyNameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1B4B",
    letterSpacing: -0.2,
  },
  propertyLocationText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "500",
  },
  propertyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3E8FF",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  rentBadge: {
    backgroundColor: "#F3E8FF",
    borderColor: "#DDD6FE",
  },
  rentBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
  },
  readOnlyField: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  readOnlyText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },
  hostelFieldContent: {
    flex: 1,
  },
  hostelLocationText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    gap: 12,
  },
  dateInputActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#FAF5FF",
  },
  dateInputText: {
    fontSize: 15,
    color: "#0F172A",
    flex: 1,
    fontWeight: "600",
  },
  dateHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 5,
    fontWeight: "500",
    paddingLeft: 4,
  },
  messageInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
    height: 110,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 5,
    textAlign: "right",
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FAF5FF",
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 12,
    color: "#6B21A8",
    flex: 1,
    lineHeight: 18,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 0.38,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
  },
  cancelButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  submitButton: {
    flex: 0.62,
    backgroundColor: "#7C3AED", // Rennto Primary Purple Theme
    elevation: 4,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
