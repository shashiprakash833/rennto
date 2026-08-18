import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AccommodationChangeModal({
  visible,
  onClose,
  onSubmit,
  changeType, // "FLOOR", "ROOM", "BED"
  currentAllocation = {},
  availableOptions = {},
}) {
  const currentFloor = currentAllocation?.floor || "2nd Floor";
  const currentRoom = currentAllocation?.room || "204";
  const currentBed = currentAllocation?.bed || "Bed 2";

  const floorOptions = availableOptions?.floors || ["1st Floor", "2nd Floor", "3rd Floor", "4th Floor"];
  const roomOptions = availableOptions?.rooms || ["201", "202", "301", "302", "303"];
  const bedOptions = availableOptions?.beds || ["Bed 1", "Bed 2", "Bed 3"];

  const [selectedFloor, setSelectedFloor] = useState(floorOptions[0] || "");
  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0] || "");
  const [selectedBed, setSelectedBed] = useState(bedOptions[0] || "");
  const [reason, setReason] = useState("");

  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showBedDropdown, setShowBedDropdown] = useState(false);

  useEffect(() => {
    if (visible) {
      if (floorOptions.length > 0) setSelectedFloor(floorOptions[0]);
      if (roomOptions.length > 0) setSelectedRoom(roomOptions[0]);
      if (bedOptions.length > 0) setSelectedBed(bedOptions[0]);
      setReason("");
      setShowFloorDropdown(false);
      setShowRoomDropdown(false);
      setShowBedDropdown(false);
    }
  }, [visible, changeType]);

  const getTitle = () => {
    switch (changeType) {
      case "FLOOR":
        return "Change Floor";
      case "ROOM":
        return "Change Room";
      case "BED":
        return "Change Bed";
      default:
        return "Request Accommodation Change";
    }
  };

  const getSubTitle = () => {
    switch (changeType) {
      case "FLOOR":
        return "Select a new floor in your property.";
      case "ROOM":
        return "Select a new room in your property.";
      case "BED":
        return "Select a new bed allocation.";
      default:
        return "Submit a request to change your stay details.";
    }
  };

  const handleSubmit = () => {
    const payload = {
      changeType,
      currentFloor,
      currentRoom,
      currentBed,
      requestedFloor: changeType === "FLOOR" || changeType === "ROOM" ? selectedFloor : currentFloor,
      requestedRoom: changeType === "ROOM" || changeType === "BED" ? selectedRoom : currentRoom,
      requestedBed: changeType === "BED" ? selectedBed : null,
      reason: reason.trim(),
    };
    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.container}>
              {/* Header Close Bar */}
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getTitle()}</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Current Details Summary Card */}
                <View style={styles.currentDetailsCard}>
                  <Text style={styles.cardSectionTitle}>Current Details</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Floor</Text>
                    <Text style={styles.detailValue}>{currentFloor}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Room</Text>
                    <Text style={styles.detailValue}>{currentRoom}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bed</Text>
                    <Text style={styles.detailValue}>{currentBed}</Text>
                  </View>
                </View>

                {/* Selection Dropdown Section */}
                <Text style={styles.sectionHeader}>
                  {changeType === "FLOOR"
                    ? "Select New Floor"
                    : changeType === "ROOM"
                    ? "Select New Room"
                    : "Select New Bed"}
                </Text>

                {/* FLOOR PICKER */}
                {(changeType === "FLOOR" || changeType === "ROOM") && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Floor</Text>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowFloorDropdown((prev) => !prev)}
                    >
                      <Text style={styles.dropdownValue}>{selectedFloor}</Text>
                      <Ionicons
                        name={showFloorDropdown ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {showFloorDropdown && (
                      <View style={styles.dropdownMenu}>
                        {floorOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.dropdownItem,
                              selectedFloor === opt && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedFloor(opt);
                              setShowFloorDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedFloor === opt && styles.dropdownItemTextActive,
                              ]}
                            >
                              {opt}
                            </Text>
                            {selectedFloor === opt && (
                              <Ionicons name="checkmark" size={16} color="#7C3AED" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* ROOM PICKER */}
                {(changeType === "ROOM" || changeType === "BED") && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Room</Text>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowRoomDropdown((prev) => !prev)}
                    >
                      <Text style={styles.dropdownValue}>{selectedRoom}</Text>
                      <Ionicons
                        name={showRoomDropdown ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {showRoomDropdown && (
                      <View style={styles.dropdownMenu}>
                        {roomOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.dropdownItem,
                              selectedRoom === opt && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedRoom(opt);
                              setShowRoomDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedRoom === opt && styles.dropdownItemTextActive,
                              ]}
                            >
                              {opt}
                            </Text>
                            {selectedRoom === opt && (
                              <Ionicons name="checkmark" size={16} color="#7C3AED" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* BED PICKER */}
                {changeType === "BED" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>Bed (Vacant Only)</Text>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowBedDropdown((prev) => !prev)}
                    >
                      <Text style={styles.dropdownValue}>{selectedBed}</Text>
                      <Ionicons
                        name={showBedDropdown ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {showBedDropdown && (
                      <View style={styles.dropdownMenu}>
                        {bedOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.dropdownItem,
                              selectedBed === opt && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedBed(opt);
                              setShowBedDropdown(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedBed === opt && styles.dropdownItemTextActive,
                              ]}
                            >
                              {opt}
                            </Text>
                            {selectedBed === opt && (
                              <Ionicons name="checkmark" size={16} color="#7C3AED" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Reason Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>Reason (Optional)</Text>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="I want to change due to personal preference."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    value={reason}
                    onChangeText={setReason}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>Submit Request</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "85%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  currentDetailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13.5,
    color: "#4B5563",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 6,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#F3E8FF",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: "#7C3AED",
    fontWeight: "700",
  },
  reasonInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: "#1F2937",
    minHeight: 70,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
