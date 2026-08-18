import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../theme/colors";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { BookingContext } from "@/src/context/BookingContext";
import { useMaintenance } from "../../context/MaintenanceContext";

export default function OwnerEditTenantScreen({ route, navigation }) {
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === "READ_ONLY";
  const { tenant, stayType, totalBeds } = route.params;
  const { setRefreshTrigger } = useContext(BookingContext);

  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState(tenant?.name || "");
  const [phone, setPhone] = useState(tenant?.phone || "");

  const [rent, setRent] = useState(String(tenant?.rent || ""));
  const [checkIn, setCheckIn] = useState(tenant?.checkIn || "");
  const [bed, setBed] = useState(tenant?.bed || 1);

  // Original phone number to lookup in backend URL
  const originalPhone = tenant?.phone || "";

  // Dynamic beds count based on unit capacity
  const bedsCount = Math.max(tenant?.bed ? Number(tenant.bed) : 1, totalBeds || 4);

  // Validation functions
  const isValidName = (text) => /^[A-Za-z\s]+$/.test(text.trim());
  const isValidPhone = (text) => /^\d{10,11}$/.test(text.trim());
  const isValidEmail = (text) => text.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
  const isValidDate = (text) => /^\d{4}-\d{2}-\d{2}$/.test(text.trim());

  const handleUpdate = async () => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    // Validate inputs
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter a tenant name.");
      return;
    }
    if (!isValidName(name)) {
      Alert.alert("Validation Error", "Name must contain letters only.");
      return;
    }
    if (!rent.trim() || isNaN(rent)) {
      Alert.alert("Validation Error", "Please enter a valid rent amount.");
      return;
    }
    if (!checkIn.trim()) {
      Alert.alert("Validation Error", "Please enter a check-in date.");
      return;
    }
    if (!isValidDate(checkIn)) {
      Alert.alert("Validation Error", "Check-in date must be in YYYY-MM-DD format.");
      return;
    }

    try {
      setLoading(true);
      const propertyType = stayType?.trim().toLowerCase();
      let url = "";

      if (propertyType === "hostel") {
        url = `${BASE_URL}/api/updatehostel/${tenant?.id}/`;
      } else if (propertyType === "apartment") {
        url = `${BASE_URL}/api/updateapartment/${tenant?.id}/`;
      } else if (propertyType === "commercial") {
        url = `${BASE_URL}/api/updatecommercial/${tenant?.id}/`;
      } else {
        Alert.alert("Error", `Unsupported property type: "${stayType}"`);
        setLoading(false);
        return;
      }

      // Format payload based on serializer specifications
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        rent: Number(rent),
        checkIn: checkIn.trim(),
      };

      if (propertyType === "hostel") {
        payload.bed = Number(bed);
        payload.floor = tenant.floor ? Number(tenant.floor) : null;
        payload.roomno = tenant.roomno ? Number(tenant.roomno) : null;
      } else if (propertyType === "apartment") {
        payload.floor = tenant.floor ? Number(tenant.floor) : null;
        payload.flatno = tenant.flatno ? Number(tenant.flatno) : null;
      } else if (propertyType === "commercial") {
        payload.floor = tenant.floor ? Number(tenant.floor) : null;
        payload.sectionNo = tenant.sectionNo ? Number(tenant.sectionNo) : null;
      }

      console.log("Updating tenant at:", url);
      console.log("Payload:", payload);

      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || resData.error || "Update failed");
      }

      Alert.alert("Success", "Tenant details updated successfully! ✅", [
        {
          text: "OK",
          onPress: () => {
            setRefreshTrigger((prev) => prev + 1);
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", err.message || "Failed to update tenant details. ❌");
    } finally {
      setLoading(false);
    }
  };

  const getStayTypeLabel = () => {
    switch (stayType?.trim().toLowerCase()) {
      case "hostel":
        return "Hostel Stay";
      case "apartment":
        return "Apartment Renting";
      case "commercial":
        return "Commercial Section";
      default:
        return stayType || "Unknown Stay";
    }
  };

  const getStayTypeIcon = () => {
    switch (stayType?.trim().toLowerCase()) {
      case "hostel":
        return "bed-outline";
      case "apartment":
        return "home-outline";
      case "commercial":
        return "business-outline";
      default:
        return "person-outline";
    }
  };

  const getSpaceLabel = () => {
    const floorLabel = tenant.floor ? `Floor ${tenant.floor}` : "Ground Floor";
    if (stayType === "hostel") {
      return `${floorLabel} • Room ${tenant.roomno}`;
    }
    if (stayType === "apartment") {
      return `${floorLabel} • Flat ${tenant.flatno}`;
    }
    if (stayType === "commercial") {
      return `${floorLabel} • Section ${tenant.sectionNo}`;
    }
    return floorLabel;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER HERO */}
        <LinearGradient
          colors={[COLORS.PRIMARY || "#6C2BD9", COLORS.PRIMARY_LIGHT || "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerHero}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.frostedIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Tenant</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* SPACE INFORMATION BUBBLE */}
          <View style={styles.spaceBubble}>
            <View style={styles.bubbleIconContainer}>
              <Ionicons name={getStayTypeIcon()} size={20} color={COLORS.PRIMARY || "#6C2BD9"} />
            </View>
            <View style={styles.bubbleTextContainer}>
              <Text style={styles.bubbleStayType}>{getStayTypeLabel()}</Text>
              <Text style={styles.bubbleSpaceInfo}>{getSpaceLabel()}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* FORM FIELDS */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Tenant Profile Info</Text>

            {/* FULL NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Tenant Full Name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>


            {/* MONTHLY RENT */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Rent (₹)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={18} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 8500"
                  keyboardType="numeric"
                  value={rent}
                  onChangeText={setRent}
                />
              </View>
            </View>
          </View>

          {/* DATES & ALLOTMENT */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Allotment Schedule</Text>

            {/* CHECK-IN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Check-In Date (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={18} color="#757575" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={checkIn}
                  onChangeText={setCheckIn}
                />
              </View>
            </View>



            {/* HOSTEL BED SELECTOR */}
            {stayType?.trim().toLowerCase() === "hostel" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Select Assigned Bed</Text>
                <View style={styles.bedSelectorRow}>
                  {Array.from({ length: bedsCount }, (_, i) => i + 1).map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.bedButton,
                        bed === num && styles.bedButtonSelected,
                      ]}
                      onPress={() => setBed(num)}
                    >
                      <Ionicons
                        name="bed-outline"
                        size={18}
                        color={bed === num ? "#FFF" : "#757575"}
                      />
                      <Text
                        style={[
                          styles.bedButtonText,
                          bed === num && styles.bedButtonTextSelected,
                        ]}
                      >
                        Bed {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={handleUpdate}
              activeOpacity={0.8}
              disabled={loading || isReadOnly}
              style={[{ width: "100%" }, isReadOnly && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={[COLORS.PRIMARY || "#6C2BD9", COLORS.PRIMARY_LIGHT || "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>
                      {isReadOnly ? "Unavailable During Maintenance" : "Update Details"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FC",
  },
  headerHero: {
    paddingTop: Platform.OS === "ios" ? 10 : 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  frostedIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
  },
  spaceBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(95, 37, 159, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  bubbleTextContainer: {
    flex: 1,
  },
  bubbleStayType: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bubbleSpaceInfo: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "700",
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#757575",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#212121",
    fontWeight: "500",
  },
  helperText: {
    fontSize: 11,
    color: "#9E9E9E",
    marginTop: 4,
    paddingLeft: 4,
  },
  bedSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  bedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8FC",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: "23%",
    marginRight: "2%",
    marginBottom: 8,
  },
  bedButtonSelected: {
    backgroundColor: COLORS.PRIMARY || "#6C2BD9",
    borderColor: COLORS.PRIMARY || "#6C2BD9",
  },
  bedButtonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#757575",
    marginLeft: 3,
  },
  bedButtonTextSelected: {
    color: "#FFF",
  },
  actionsContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 18,
    shadowColor: "#6C2BD9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  secondaryButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 56,
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D6D6D6",
    marginTop: 12,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#757575",
  },
});