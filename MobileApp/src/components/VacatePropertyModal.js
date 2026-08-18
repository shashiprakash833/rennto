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

export default function VacatePropertyModal({
  visible,
  onClose,
  onConfirm,
  propertyName,
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
              {/* Door Exit Icon Header */}
              <View style={styles.iconCircle}>
                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
              </View>

              {/* Modal Title */}
              <Text style={styles.title}>Vacate Property</Text>

              {/* Detailed Description */}
              <Text style={styles.message}>
                Are you sure you want to submit a property vacate request
                {propertyName ? ` for ${propertyName}` : ""}?
              </Text>
              
              <Text style={styles.subMessage}>
                Once submitted, your owner must approve the request. Until approval, your tenancy remains active.
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
                  <Text style={styles.confirmBtnText}>Submit Request</Text>
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
    paddingHorizontal: 24,
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
    backgroundColor: "#FEF2F2",
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
    marginBottom: 8,
    fontWeight: "600",
  },
  subMessage: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBtn: {
    backgroundColor: "#EF4444",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
