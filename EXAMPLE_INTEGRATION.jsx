/**
 * Example Integration: HostelPropertyDetailsScreen
 * 
 * This file demonstrates how to integrate the hostel change request feature
 * into an existing property details screen.
 * 
 * Location: MobileApp/src/screens/tenant/HostelPropertyDetailsScreen.jsx
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import COLORS from "../../theme/colors";
import BASE_URL from "@/src/config/Api";

// Import the new components and hook
import { BookNowModal, ChangeHostelRequestForm } from "@/src/components/ChangeHostelModal";
import { useHostelChangeRequest } from "@/src/hooks/useHostelChangeRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HostelPropertyDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { hostel } = route.params; // Hostel data passed from listing screen

  // State management
  const [currentHostel, setCurrentHostel] = useState(null);
  const [bookNowModalVisible, setBookNowModalVisible] = useState(false);
  const [changeFormVisible, setChangeFormVisible] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [userPhone, setUserPhone] = useState(null);

  // Use the custom hook
  const {
    loading,
    error,
    checkBookingStatus,
    createChangeRequest,
    getTenantChangeRequests,
  } = useHostelChangeRequest();

  // Load user phone from storage
  useEffect(() => {
    loadUserPhone();
  }, []);

  // Check booking status when component loads
  useEffect(() => {
    if (userPhone) {
      checkStatus();
    }
  }, [userPhone]);

  const loadUserPhone = async () => {
    try {
      const phone = await AsyncStorage.getItem("userPhone");
      setUserPhone(phone);
    } catch (error) {
      console.error("Error loading user phone:", error);
    }
  };

  const checkStatus = async () => {
    try {
      const status = await checkBookingStatus(userPhone, hostel.id);
      setBookingStatus(status);

      if (status.status === "already_staying") {
        setCurrentHostel(status.current_hostel);
      }
    } catch (err) {
      console.error("Error checking booking status:", err);
    }
  };

  const handleBookPress = () => {
    if (bookingStatus?.status === "already_staying") {
      // Show BookNowModal
      setBookNowModalVisible(true);
    } else if (bookingStatus?.status === "approved_request") {
      // Navigate to room selection
      Alert.alert(
        "Request Approved",
        "Your request has been approved! You can now select your room.",
        [
          {
            text: "Cancel",
            onPress: () => {},
            style: "cancel",
          },
          {
            text: "Select Room",
            onPress: () => navigateToRoomSelection(),
            style: "default",
          },
        ]
      );
    } else if (bookingStatus?.status === "pending_request") {
      Alert.alert(
        "Request Pending",
        "You have a pending request for this hostel. Please wait for the owner to respond."
      );
    } else if (bookingStatus?.status === "can_book") {
      // Proceed with normal booking flow
      navigateToRoomSelection();
    }
  };

  const navigateToRoomSelection = () => {
    navigation.navigate("SelectRoom", {
      hostel: hostel,
      requestId: bookingStatus?.request_id,
    });
  };

  const handleChangeRequestSubmit = async (formData) => {
    try {
      const result = await createChangeRequest(
        userPhone,
        formData.target_hostel_id,
        formData.expectedJoiningDate,
        formData.message
      );

      Alert.alert("Success", "Your request has been sent successfully", [
        {
          text: "OK",
          onPress: () => {
            setChangeFormVisible(false);
            setBookNowModalVisible(false);
            // Refresh booking status
            checkStatus();
          },
          style: "default",
        },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit request");
    }
  };

  // Render "Already Staying" warning if applicable
  const renderStayingWarning = () => {
    if (bookingStatus?.status !== "already_staying") {
      return null;
    }

    return (
      <View style={styles.warningSection}>
        <View style={styles.warningBox}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color={COLORS.warning}
          />
          <Text style={styles.warningText}>
            You are already staying in a property. Please vacate or contact the
            owner before requesting another property.
          </Text>
        </View>

        {currentHostel && (
          <View style={styles.currentHostelInfo}>
            <Text style={styles.infoLabel}>Currently Staying In:</Text>
            <View style={styles.hostelCard}>
              <Text style={styles.hostelName}>{currentHostel.name}</Text>
              <Text style={styles.hostelLocation}>{currentHostel.location}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.bookNowButtonSection}
          onPress={() => setBookNowModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={20}
            color="white"
          />
          <Text style={styles.bookNowButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render "Request Approved" info if applicable
  const renderApprovedStatus = () => {
    if (bookingStatus?.status !== "approved_request") {
      return null;
    }

    return (
      <View style={styles.approvedSection}>
        <View style={styles.approvedBox}>
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={COLORS.success}
          />
          <Text style={styles.approvedText}>
            Your request has been approved! You can now select your room and
            bed.
          </Text>
        </View>
      </View>
    );
  };

  // Main book button
  const renderBookButton = () => {
    const buttonText = bookingStatus?.status === "approved_request"
      ? "Select Room & Bed"
      : bookingStatus?.status === "pending_request"
      ? "Request Pending..."
      : bookingStatus?.status === "already_staying"
      ? "View Book Now Options"
      : "Book Now";

    const isDisabled = bookingStatus?.status === "pending_request" || loading;

    return (
      <TouchableOpacity
        style={[styles.mainBookButton, isDisabled && styles.disabledButton]}
        onPress={handleBookPress}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <MaterialCommunityIcons
              name={bookingStatus?.status === "approved_request" ? "door-open" : "calendar-plus"}
              size={20}
              color="white"
            />
            <Text style={styles.bookButtonText}>{buttonText}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hostel Header/Image */}
        <View style={styles.header}>
          {hostel.cover_image && (
            <Image
              source={{ uri: hostel.cover_image }}
              style={styles.headerImage}
            />
          )}
        </View>

        {/* Hostel Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.hostelTitle}>{hostel.hostelName}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.location}>{hostel.location}</Text>
          </View>
          <View style={styles.typeRow}>
            <Text style={styles.typeLabel}>Type:</Text>
            <Text style={styles.typeValue}>
              {hostel.hostelType?.charAt(0).toUpperCase() +
                hostel.hostelType?.slice(1)}
            </Text>
          </View>
          <View style={styles.rentRow}>
            <Text style={styles.rentLabel}>Rent:</Text>
            <Text style={styles.rentValue}>
              ₹{hostel.rent_amount}/month
            </Text>
          </View>
        </View>

        {/* Facilities */}
        {hostel.facilities && (
          <View style={styles.facilitiesSection}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            <View style={styles.facilitiesList}>
              {Object.entries(hostel.facilities).map(([key, value]) => (
                value && (
                  <View key={key} style={styles.facilityItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color={COLORS.success}
                    />
                    <Text style={styles.facilityText}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                )
              ))}
            </View>
          </View>
        )}

        {/* Booking Status Sections */}
        {renderStayingWarning()}
        {renderApprovedStatus()}

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color={COLORS.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Book Button */}
      <View style={styles.bookButtonContainer}>
        {renderBookButton()}
      </View>

      {/* Modals */}
      <BookNowModal
        visible={bookNowModalVisible}
        onClose={() => setBookNowModalVisible(false)}
        currentHostel={currentHostel}
        targetHostel={{
          id: hostel.id,
          name: hostel.hostelName,
          location: hostel.location,
        }}
        onBookNowPress={() => {
          setBookNowModalVisible(false);
          setChangeFormVisible(true);
        }}
      />

      <ChangeHostelRequestForm
        visible={changeFormVisible}
        onClose={() => setChangeFormVisible(false)}
        currentHostel={currentHostel}
        targetHostel={{
          id: hostel.id,
          name: hostel.hostelName,
          location: hostel.location,
        }}
        loading={loading}
        onSubmit={handleChangeRequestSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 80, // Space for fixed button
  },
  header: {
    height: 250,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  headerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoSection: {
    padding: 16,
  },
  hostelTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  typeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  rentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rentLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  rentValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  facilitiesSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  facilitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "48%",
  },
  facilityText: {
    fontSize: 12,
    color: COLORS.text,
  },
  warningSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warning,
    flex: 1,
    lineHeight: 18,
  },
  currentHostelInfo: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  hostelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  hostelName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  hostelLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bookNowButtonSection: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bookNowButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  approvedSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  approvedBox: {
    flexDirection: "row",
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  approvedText: {
    fontSize: 13,
    color: COLORS.success,
    flex: 1,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: "flex-start",
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  bookButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mainBookButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default HostelPropertyDetailsScreen;
