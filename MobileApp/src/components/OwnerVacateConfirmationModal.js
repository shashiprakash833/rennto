import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function OwnerVacateConfirmationModal({
  visible,
  onClose,
  onConfirm,
  tenantName = "Tenant",
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.container}>
              {/* Green Warning/Approval Header Circle */}
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark-circle-outline" size={34} color="#10B981" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Remove Tenant</Text>

              {/* Description */}
              <Text style={styles.message}>
                Are you sure you want to remove{" "}
                <Text style={{ fontWeight: "800" }}>{tenantName}</Text> from this property?
              </Text>

              {/* Checklist Box */}
              <View style={styles.checklistContainer}>
                <Text style={styles.checklistHeader}>Please confirm:</Text>
                
                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Tenant has paid all pending rent.</Text>
                </View>

                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Tenant has cleared all dues.</Text>
                </View>

                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-sharp" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Tenant has vacated the property.</Text>
                </View>
              </View>

              <Text style={styles.warningNote}>
                This action cannot be undone.
              </Text>

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  checklistContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  checklistHeader: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 10,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  checkText: {
    fontSize: 12.5,
    color: "#1F2937",
    fontWeight: "600",
  },
  warningNote: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontSize: 13.5,
    fontWeight: "700",
  },
  confirmBtn: {
    backgroundColor: "#10B981",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
});
