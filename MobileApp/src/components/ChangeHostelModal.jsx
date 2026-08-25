import React, { useState } from "react";
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
  FlatList,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import COLORS from "@/src/theme/colors";

/**
 * Reusable Search Field for Hostels
 */
const HostelSearchField = ({
  label,
  iconName,
  placeholder,
  selectedHostel,
  onSelectHostel,
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
  filteredHostels,
}) => {
  return (
    <View style={styles.formSection}>
      <Text style={styles.label}>
        <MaterialCommunityIcons name={iconName} size={13} color={COLORS.primary} /> {label}
      </Text>

      {selectedHostel ? (
        <TouchableOpacity
          style={styles.readOnlyField}
          onPress={() => {
            setShowSearch(!showSearch);
            setSearchQuery("");
          }}
        >
          <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
          <View style={styles.hostelFieldContent}>
            <Text style={styles.readOnlyText}>{selectedHostel.name}</Text>
            <Text style={styles.hostelLocationText}>{selectedHostel.location}</Text>
          </View>
          <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.readOnlyField}
          onPress={() => setShowSearch(!showSearch)}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={COLORS.primary} />
          <Text style={styles.placeholderText}>{placeholder}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* Search Box */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={18} color="#a0aec0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hostels..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#a0aec0"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#a0aec0" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search Results */}
      {showSearch && filteredHostels.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={filteredHostels}
            scrollEnabled={false}
            keyExtractor={(item) => `search-${item.id?.toString()}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => onSelectHostel(item)}
              >
                <MaterialCommunityIcons name="home-city" size={16} color={COLORS.primary} />
                <View style={styles.resultItemContent}>
                  <Text style={styles.resultItemName}>{item.name}</Text>
                  <Text style={styles.resultItemLocation}>{item.location}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

/**
 * BookNowModal Component
 * Shows when a user tries to book a hostel while already staying in one.
 * Provides an option to request a hostel change.
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Already Staying</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Warning Message */}
            <View style={styles.messageBox}>
              <MaterialCommunityIcons
                name="office-building-transfer"
                size={24}
                color={COLORS.primary || "#5F259F"}
              />
              <Text style={styles.messageText}>
                You are currently registered in a property. You can request a hostel change to this property below.
              </Text>
            </View>

            {/* Current Hostel Info */}
            {currentHostel && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Current Hostel</Text>
                <View style={styles.hostelCard}>
                  <Text style={styles.hostelName}>{currentHostel.name}</Text>
                  <Text style={styles.hostelLocation}>{currentHostel.location}</Text>
                </View>
              </View>
            )}

            {/* Target Hostel Info */}
            {targetHostel && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Target Hostel</Text>
                <View style={styles.hostelCard}>
                  <Text style={styles.hostelName}>{targetHostel.name}</Text>
                  <Text style={styles.hostelLocation}>{targetHostel.location}</Text>
                </View>
              </View>
            )}

            {/* Help Text */}
            <View style={styles.helpBox}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.helpText}>
                {"Click \"Book Now\" to send a request to the hostel owner. They will review your request and notify you once approved."}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.bookNowFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.bookNowButton]}
              onPress={onBookNowPress}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="white"
              />
              <Text style={styles.bookNowButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * ChangeHostelRequestForm Component
 * Form for submitting a hostel change request with auto-complete and auto-save
 */
export const ChangeHostelRequestForm = ({
  visible,
  onClose,
  currentHostel,
  targetHostel,
  onSubmit,
  loading = false,
  availableHostels = [],
}) => {
  const [formData, setFormData] = useState({
    currentHostel: currentHostel?.name || "",
    targetHostel: targetHostel?.name || "",
    expectedJoiningDate: "",
    message: "",
  });

  const [currentHostelSearchQuery, setCurrentHostelSearchQuery] = useState("");
  const [targetHostelSearchQuery, setTargetHostelSearchQuery] = useState("");
  const [showCurrentHostelSearch, setShowCurrentHostelSearch] = useState(false);
  const [showTargetHostelSearch, setShowTargetHostelSearch] = useState(false);
  const [selectedCurrentHostel, setSelectedCurrentHostel] = useState(currentHostel || null);
  const [selectedTargetHostel, setSelectedTargetHostel] = useState(targetHostel || null);
  const [showDateInput, setShowDateInput] = useState(false);



  // Filter current hostels
  const filteredCurrentHostels = availableHostels.filter(hostel => {
    const query = (currentHostelSearchQuery || "").toLowerCase();
    const name = (hostel.name || "").toLowerCase();
    const location = (hostel.location || "").toLowerCase();
    return name.includes(query) || location.includes(query);
  });

  // Filter target hostels
  const filteredTargetHostels = availableHostels.filter(hostel => {
    const query = (targetHostelSearchQuery || "").toLowerCase();
    const name = (hostel.name || "").toLowerCase();
    const location = (hostel.location || "").toLowerCase();
    return name.includes(query) || location.includes(query);
  });

  // Auto-save current hostel selection
  const handleSelectCurrentHostel = (hostel) => {
    setSelectedCurrentHostel(hostel);
    setFormData(prev => ({
      ...prev,
      currentHostel: hostel.name,
    }));
    setShowCurrentHostelSearch(false);
    setCurrentHostelSearchQuery("");
  };

  // Auto-save target hostel selection
  const handleSelectTargetHostel = (hostel) => {
    setSelectedTargetHostel(hostel);
    setFormData(prev => ({
      ...prev,
      targetHostel: hostel.name,
    }));
    setShowTargetHostelSearch(false);
    setTargetHostelSearchQuery("");
  };

  // Auto-save date
  const handleDateSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      expectedJoiningDate: date,
    }));
  };

  // Auto-save message
  const handleMessageChange = (text) => {
    setFormData(prev => ({
      ...prev,
      message: text,
    }));
  };

  const handleSubmit = () => {
    if (!formData.expectedJoiningDate) {
      Alert.alert("Error", "Please select an expected joining date");
      return;
    }

    const finalCurrentHostel = selectedCurrentHostel || currentHostel;
    if (!finalCurrentHostel) {
      Alert.alert("Error", "Please select a current hostel");
      return;
    }

    const finalTargetHostel = selectedTargetHostel || targetHostel;

    // Send request with all form data to target owner
    onSubmit({
      ...formData,
      target_hostel_id: finalTargetHostel?.id,
      current_hostel_id: finalCurrentHostel?.id,
      target_owner_id: finalTargetHostel?.owner_id,
    });
  };

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
            <Text style={styles.headerTitle}>Request Hostel Change</Text>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.content}>

            {/* Current Hostel with Search and Auto-save */}
            <HostelSearchField
              label="Current Hostel"
              iconName="home"
              placeholder="Search current hostel..."
              selectedHostel={selectedCurrentHostel}
              onSelectHostel={handleSelectCurrentHostel}
              searchQuery={currentHostelSearchQuery}
              setSearchQuery={setCurrentHostelSearchQuery}
              showSearch={showCurrentHostelSearch}
              setShowSearch={setShowCurrentHostelSearch}
              filteredHostels={filteredCurrentHostels}
            />



            {/* Expected Joining Date with Auto-save */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="calendar" size={13} color={COLORS.primary} /> Expected Joining Date *
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDateInput(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={formData.expectedJoiningDate ? "#10b981" : COLORS.primary}
                />
                <Text
                  style={[
                    styles.dateInputText,
                    !formData.expectedJoiningDate && { color: "#a0aec0" },
                    formData.expectedJoiningDate && { color: "#1a202c", fontWeight: "700" },
                  ]}
                >
                  {formData.expectedJoiningDate ? (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={14} color="#10b981" /> {formData.expectedJoiningDate}
                    </>
                  ) : (
                    "Select date (YYYY-MM-DD)"
                  )}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateHint}>Tap to select date</Text>
            </View>

            {/* Date Input */}
            {showDateInput && (
              <DateTimePicker
                value={formData.expectedJoiningDate ? new Date(formData.expectedJoiningDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDateInput(false);
                  if (selectedDate) {
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                    const day = String(selectedDate.getDate()).padStart(2, "0");
                    const formattedDate = `${year}-${month}-${day}`;
                    setFormData(prev => ({
                      ...prev,
                      expectedJoiningDate: formattedDate,
                    }));
                  }
                }}
              />
            )}

            {/* Message to Owner with Auto-save */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                <MaterialCommunityIcons name="message-text" size={13} color={COLORS.primary} /> Message to Owner (Optional)
              </Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                placeholder="Tell the owner about your stay..."
                multiline
                numberOfLines={4}
                value={formData.message}
                onChangeText={handleMessageChange}
                placeholderTextColor="#a0aec0"
              />
              <Text style={styles.charCount}>{formData.message.length} characters</Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.infoBoxText}>
                Your request will be sent directly to the target hostel owner. They will review and respond to your request.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons - Two Row Layout */}
          <View style={styles.footer}>
            {/* First Row - Cancel and Draft */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <MaterialCommunityIcons name="close" size={18} color="#2d3748" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.draftButton]}
                onPress={() => {
                  Alert.alert("Draft Saved", "Your form data has been saved as draft");
                }}
                disabled={loading}
              >
                <MaterialCommunityIcons name="content-save" size={18} color="#64748b" />
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </TouchableOpacity>
            </View>

            {/* Second Row - Send Request (Full Width) */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                styles.fullWidthButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.sendButtonContent}>
                <MaterialCommunityIcons
                  name="send"
                  size={24}
                  color="white"
                />
                <Text style={styles.submitButtonText}>Send Request</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
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
    borderBottomColor: "#e8ecf1",
    backgroundColor: "#f8fafb",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a202c",
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  messageBox: {
    flexDirection: "row",
    backgroundColor: "#fff5f5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#f56565",
    elevation: 2,
    shadowColor: "#f56565",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  messageText: {
    fontSize: 13,
    color: "#c53030",
    marginLeft: 12,
    flex: 1,
    lineHeight: 19,
    fontWeight: "500",
  },
  infoSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hostelCard: {
    backgroundColor: "#f7fafc",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  hostelName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a202c",
    letterSpacing: -0.2,
  },
  hostelLocation: {
    fontSize: 12,
    color: "#718096",
    marginTop: 5,
    fontWeight: "500",
  },
  helpBox: {
    flexDirection: "row",
    backgroundColor: "#edf2f7",
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 17,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#f8fafb",
    paddingBottom: 20,
    gap: 12,
  },
  bookNowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#f8fafb",
    paddingBottom: 20,
    gap: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fullWidthButton: {
    width: "100%",
    height: 56,
    paddingVertical: 0,
    marginTop: 12,
  },
  cancelButton: {
    width: "48%",
    height: 50,
    paddingVertical: 0,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#cbd5e0",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cancelButtonText: {
    color: "#2d3748",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  draftButton: {
    width: "48%",
    height: 50,
    paddingVertical: 0,
    backgroundColor: "#f0f4f8",
    borderWidth: 1.5,
    borderColor: "#cbd5e0",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  draftButtonText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  bookNowButton: {
    backgroundColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    width: "48%",
  },
  bookNowButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  sendButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Search Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 0,
    marginBottom: -1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#1a202c",
    fontWeight: "500",
  },
  searchResults: {
    marginTop: -1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  resultItemContent: {
    marginLeft: 10,
    flex: 1,
  },
  resultItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a202c",
  },
  resultItemLocation: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
    fontWeight: "500",
  },
  hostelFieldContent: {
    flex: 1,
    marginLeft: 10,
  },
  hostelLocationText: {
    fontSize: 12,
    color: "#718096",
    marginTop: 4,
    fontWeight: "500",
  },
  placeholderText: {
    color: "#a0aec0",
    fontSize: 14,
    fontWeight: "500",
  },
  charCount: {
    fontSize: 11,
    color: "#a0aec0",
    marginTop: 6,
    textAlign: "right",
    fontWeight: "500",
  },
  dateHint: {
    fontSize: 11,
    color: "#a0aec0",
    marginTop: 6,
    fontWeight: "500",
  },
  datePickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  datePickerBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 350,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a202c",
    marginBottom: 8,
  },
  datePickerHint: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 16,
    fontWeight: "500",
  },
  datePickerInput: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 16,
    backgroundColor: "#f7fafc",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clearButton: {
    backgroundColor: "#fed7d7",
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c53030",
  },
  confirmButton: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  // Form Styles
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1a202c",
    marginBottom: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingLeft: 4,
  },
  readOnlyField: {
    backgroundColor: "#f7fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readOnlyText: {
    fontSize: 15,
    color: "#1a202c",
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "#cbd5e0",
    gap: 12,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dateInputText: {
    fontSize: 15,
    color: "#1a202c",
    flex: 1,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  textInput: {
    backgroundColor: "#f7fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "#cbd5e0",
    fontSize: 15,
    color: "#1a202c",
    fontWeight: "500",
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  messageInput: {
    height: 120,
    textAlignVertical: "top",
    paddingVertical: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 16,
    alignItems: "flex-start",
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoBoxText: {
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 19,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  // Additional styles for form icons
  formIconBox: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  // Form section header with icon
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  formSectionIcon: {
    marginRight: 8,
  },

  // Input focus state (can be applied conditionally)
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
});
