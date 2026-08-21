import React, { useContext, useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BookingContext } from "@/src/context/BookingContext";
import { TenantContext } from "@/src/context/TenantContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../../theme/colors";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
import { useLanguage } from "../../utils/LanguageContext";


const TenantNotificationScreen = () => {
  const { t } = useLanguage();
  const { isConnected } = useNetwork();
  const ws = useRef(null);
  const navigation = useNavigation();
  const { tenantPhone } = useContext(TenantContext);
  const {
    requests,
    setRequests,
    refreshTrigger,
    setRefreshTrigger,
    markAllAsSeen,
    clearAllNotifications,
    clearedIds,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount
  } = useContext(BookingContext);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningIds, setJoiningIds] = useState([]);
  const [phone, setPhone] = useState("");
  const [showIdModal, setShowIdModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBackFile, setSelectedBackFile] = useState(null);
  const [selectedSelfie, setSelectedSelfie] = useState(null);
  const [selectedPaymentScreenshot, setSelectedPaymentScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aadharId, setAadharId] = useState("");

  // Load persisted joined IDs and phone number from AsyncStorage on mount
  useEffect(() => {
    const loadPhone = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem("tenantPhone");
        if (storedPhone) setPhone(storedPhone);
      } catch (e) { }
    };
    loadPhone();
  }, []);

  // Re-load joined IDs whenever phone changes — keyed per-phone so users don't bleed state
  useEffect(() => {
    const activePhone = phone || tenantPhone;
    if (!activePhone) return;
    const loadJoinedIds = async () => {
      try {
        const storageKey = `joinedRequestIds_${activePhone}`;
        const stored = await AsyncStorage.getItem(storageKey);
        setJoiningIds(stored ? JSON.parse(stored) : []);
      } catch (e) { }
    };
    loadJoinedIds();
  }, [phone, tenantPhone]);



  const handleReject = async (item) => {
    Alert.alert(
      "Reject Approval",
      "Are you sure you want to reject this booking? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetchWithAuth(`${BASE_URL}/api/withdraw_request/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tenant_phone: phone || tenantPhone,
                  owner_phone: item.owner_phone || item.ownerEmail,
                  property_name: item.propertyName || item.property_name,
                }),
              });
              if (res.ok) {
                setRefreshTrigger((prev) => prev + 1);
              }
            } catch (err) {
              console.log("Reject error", err);
            }
          }
        }
      ]
    );
  };

  const handleJoinNow = (item) => {
    if (joiningIds.includes(item.id)) return;
    setSelectedItem(item);
    setSelectedFile(null);
    setSelectedBackFile(null);
    setSelectedSelfie(null);
    setSelectedPaymentScreenshot(null);
    setAadharId("");
    setShowIdModal(true);
  };

  const handlePickDocument = async (type) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "image/*",
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        if (type === "front") setSelectedFile(asset);
        else if (type === "back") setSelectedBackFile(asset);
        else if (type === "selfie") setSelectedSelfie(asset);
        else if (type === "payment") setSelectedPaymentScreenshot(asset);
      }
    } catch (err) {
      console.log("Error picking document", err);
    }
  };

  const submitIdentityProof = async () => {
    const activePhone = await AsyncStorage.getItem("tenantPhone");
    if (!activePhone) {
      Alert.alert("Error", "Tenant details not found. Please log in again.");
      return;
    }

    if (!selectedFile || !selectedBackFile || !selectedItem || !aadharId) {
      Alert.alert("Error", "Please enter Aadhaar ID, and upload Aadhaar Front & Back images.");
      return;
    }

    if (aadharId.length !== 12) {
      Alert.alert("Error", "Aadhaar ID must be exactly 12 numeric digits.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("phone", activePhone);
      formData.append("aadhar_id", aadharId);
      formData.append("aadhar_image", {
        uri: selectedFile.uri,
        name: selectedFile.name || "aadhar_front.jpg",
        type: selectedFile.mimeType || "image/jpeg"
      });
      formData.append("aadhar_back_image", {
        uri: selectedBackFile.uri,
        name: selectedBackFile.name || "aadhar_back.jpg",
        type: selectedBackFile.mimeType || "image/jpeg"
      });

      const res = await fetchWithAuth(`${BASE_URL}/api/tenant/submit_verification/`, {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();

      if (res.ok) {
        const item = selectedItem;
        const updatedIds = [...joiningIds, item.id];
        setJoiningIds(updatedIds);

        try {
          const activePhone = phone || tenantPhone;
          const storageKey = `joinedRequestIds_${activePhone}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify(updatedIds));
        } catch (e) { }

        setUploading(false);
        setShowIdModal(false);

        navigation.replace("WelcomeScreen", {
          propertyName: item.propertyName || item.property_name,
          requestId: item.id,
        });
      } else {
        setUploading(false);
        Alert.alert("Failed to Submit", resData.error || "An unexpected error occurred.");
      }
    } catch (err) {
      setUploading(false);
      console.log("Error submitting identity proof:", err);
      Alert.alert("Error", "Could not submit identity proof. Please check your network.");
    }
  };

  // Mark all notifications as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount?.();
      markAllNotificationsRead?.();
      markAllAsSeen?.();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, [phone, tenantPhone]);

  const getData = (item) => {
    if (item.type === "PAYMENT") {
      const pStatus = (item.status || "PENDING").toUpperCase();
      if (pStatus === "SUCCESS") {
        return {
          title: t("payment_approved") || "Payment Approved",
          message: t("payment_verified_desc", { amount: item.amount, propertyName: item.propertyName }) || `Your payment of ₹${item.amount} for ${item.propertyName} has been verified.`,
          icon: "card",
          color: COLORS.SUCCESS,
          lightColor: "#E8F5E9",
        };
      }
      if (pStatus === "FAILED" || pStatus === "REJECTED") {
        return {
          title: t("payment_declined") || "Payment Declined",
          message: t("payment_rejected_desc", { amount: item.amount }) || `Your payment of ₹${item.amount} was rejected. Please contact the owner.`,
          icon: "close-circle",
          color: COLORS.ERROR,
          lightColor: "#FFEBEE",
        };
      }
      return {
        title: t("payment_processing") || "Payment Processing",
        message: t("payment_processing_desc", { amount: item.amount }) || `Your payment of ₹${item.amount} is currently under verification.`,
        icon: "time-outline",
        color: COLORS.WARNING,
        lightColor: "#FFF8E1",
      };
    }

    if (item.type === "hostel_change_request") {
      const hcStatus = (item.status || "pending").toLowerCase();
      if (hcStatus === "approved") {
        return {
          title: "Hostel Change Approved",
          message: item.message || "Your hostel change request was approved. Select floor, room, and bed.",
          icon: "checkmark-circle",
          color: "#10B981",
          lightColor: "#DCFCE7",
        };
      }
      if (hcStatus === "rejected") {
        return {
          title: "Hostel Change Rejected",
          message: item.message || "Your hostel change request was rejected. You remain in your current hostel.",
          icon: "close-circle",
          color: "#EF4444",
          lightColor: "#FEE2E2",
        };
      }
      return {
        title: "Hostel Change Request Submitted",
        message: item.message || "Your hostel change request is waiting for owner approval.",
        icon: "git-compare-outline",
        color: "#4F46E5",
        lightColor: "#EEF2FF",
      };
    }

    if (item.type === "vacate_request" || item.notification_type === "vacate_request" || (item.title || "").toLowerCase().includes("vacate")) {
      const vStatus = (item.status || "pending").toLowerCase();
      if (vStatus === "approved" || vStatus === "accepted") {
        return {
          title: "Vacate Request Approved",
          message: item.message || "Your vacate request has been approved.",
          icon: "checkmark-circle",
          color: "#10B981",
          lightColor: "#DCFCE7",
        };
      }
      if (vStatus === "declined" || vStatus === "rejected") {
        return {
          title: "Vacate Request Declined",
          message: item.message || "Your vacate request has been declined.",
          icon: "close-circle",
          color: "#EF4444",
          lightColor: "#FEE2E2",
        };
      }
      return {
        title: "Vacate Request Submitted",
        message: item.message || "Your vacate request has been submitted to the property owner.",
        icon: "log-out-outline",
        color: "#F59E0B",
        lightColor: "#FEF3C7",
      };
    }

    if (item.type === "MESSAGE") {
      const isRemoval = (item.title || "").toLowerCase().includes("removed");
      return {
        title: item.title || "Notification",
        message: item.message,
        icon: isRemoval ? "warning-outline" : "notifications",
        color: isRemoval ? COLORS.ERROR : COLORS.PRIMARY,
        lightColor: isRemoval ? "#FFEBEE" : "#EDE9FE",
      };
    }

    const status = (item.status || "pending").toLowerCase();
    if (status === "accepted" || status === "allotted" || status === "pending_confirmation") {
      if (item.id && item.id.toString().startsWith("exreq_")) {
        return {
          title: t("booking_completed") || "Booking Completed",
          message: t("booking_completed_desc") || "You have successfully joined this property. Welcome home!",
          icon: "home",
          color: COLORS.SUCCESS,
          lightColor: "#E8F5E9",
        };
      }
      return {
        title: t("booking_approved") || "Booking Approved",
        message: t("booking_approved_desc") || "Great news! Your booking request has been approved.",
        icon: "checkmark-circle",
        color: COLORS.SUCCESS,
        lightColor: "#E8F5E9",
      };
    }
    if (status === "completed" || status === "joined") {
      return {
        title: t("booking_completed") || "Booking Completed",
        message: t("booking_completed_desc") || "You have successfully joined this property. Welcome home!",
        icon: "home",
        color: COLORS.SUCCESS,
        lightColor: "#E8F5E9",
      };
    }
    if (status === "rejected") {
      return {
        title: t("booking_declined") || "Booking Declined",
        message: t("booking_declined_desc") || "We're sorry, your booking request was not accepted.",
        icon: "close-circle",
        color: COLORS.ERROR,
        lightColor: "#FFEBEE",
      };
    }
    if (status === "withdrawn") {
      return {
        title: t("request_withdrawn") || "Request Withdrawn",
        message: t("request_withdrawn_desc") || "You have cancelled your join request for this property.",
        icon: "close-circle-outline",
        color: COLORS.TEXT_LIGHT,
        lightColor: "#F5F5F5",
      };
    }
    return {
      title: t("request_pending") || "Request Pending",
      message: t("request_pending_desc") || "Your application is currently being reviewed by the owner.",
      icon: "time",
      color: COLORS.WARNING,
      lightColor: "#FFF8E1",
    };
  };

  const groupNotifications = (notifs) => {
    const sorted = [...notifs].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    const now = new Date();

    sorted.forEach((item) => {
      const date = new Date(item.createdAt || item.created_at);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups.Today.push(item);
      else if (diffDays === 1) groups.Yesterday.push(item);
      else groups.Earlier.push(item);
    });

    return groups;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const dateOptions = { month: "short", day: "numeric" };
    if (date.getFullYear() !== now.getFullYear()) {
      dateOptions.year = "numeric";
    }

    return `${date.toLocaleDateString("en-US", dateOptions)}, ${timeStr}`;
  };

const visibleRequests = requests.filter(r => !clearedIds.includes(r.id));
  const filteredRequests = visibleRequests;
  const grouped = groupNotifications(filteredRequests);
 
  const handleNotificationNavigation = (item) => {
    const rawType = (item?.type || "").toLowerCase();
    const title = (item?.title || "").toLowerCase();
    const msg = (item?.message || "").toLowerCase();
    if (rawType.includes("payment") || title.includes("payment")||title.includes("due") || title.includes("rent") || msg.includes("payment")) {
      navigation.navigate("TenantNavigation", { screen: "Payment" });
      return;
    }
    if (rawType.includes("issue") || title.includes("issue") || msg.includes("issue")) {
      navigation.navigate("TenantNavigation", { screen: "Issues" });
      return;
    }
    navigation.navigate("TenantNavigation", { screen: "Home", params: { screen: "TenantHome" } });
  };
 
  const renderCard = (item) => {
    const data = getData(item);
    const timeFormatted = formatDate(item.createdAt || item.created_at);

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.7}
        style={styles.cardContainer}
        onPress={() => handleNotificationNavigation(item)}
      >
        <View style={styles.card}>
          <View style={[styles.statusIndicator, { backgroundColor: data.color }]} />

          <View style={[styles.iconContainer, { backgroundColor: data.lightColor }]}>
            <Ionicons name={data.icon} size={22} color={data.color} />
          </View>

          <View style={styles.content}>
            <Text style={styles.cardTitle}>{data.title}</Text>

            {data.message ? (
              <Text style={styles.cardMessage}>
                {data.message}
              </Text>
            ) : null}

            {(item.propertyName || item.property_name) ? (
              <View style={styles.propertyRow}>
                <Ionicons name="business-outline" size={13} color="#64748B" />
                <Text style={styles.propertyName} numberOfLines={1}>
                  {item.propertyName || item.property_name}
                </Text>
              </View>
            ) : null}

            {timeFormatted ? (
              <Text style={styles.timeText}>
                {timeFormatted}
              </Text>
            ) : null}

            {((item.status || "").toLowerCase() === "accepted" || (item.status || "").toLowerCase() === "allotted") && !(item.id && item.id.toString().startsWith("exreq_")) && (
              joiningIds.includes(item.id) ? (
                <View style={[styles.actionBtn, styles.alreadyJoinedBtn]}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.WHITE} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>{t("already_joined") || "Already Joined"}</Text>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.SUCCESS }]}
                    onPress={() => handleJoinNow(item)}
                  >
                    <Text style={styles.actionBtnText}>{t("join_now") || "Join Now"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.ERROR, marginLeft: 10 }]}
                    onPress={() => handleReject(item)}
                  >
                    <Text style={styles.actionBtnText}>{t("reject") || "Reject"}</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
            {(item.status || "").toLowerCase() === "accepted" && (item.id && item.id.toString().startsWith("exreq_")) && (
              <View style={[styles.actionBtn, styles.alreadyJoinedBtn]}>
                <Ionicons name="home" size={16} color={COLORS.WHITE} style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>{t("joined") || "Joined ✓"}</Text>
              </View>
            )}

            {["completed", "joined"].includes((item.status || "").toLowerCase()) && (
              <View style={[styles.actionBtn, styles.alreadyJoinedBtn]}>
                <Ionicons name="home" size={16} color={COLORS.WHITE} style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>{t("joined") || "Joined ✓"}</Text>
              </View>
            )}
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isConnected === false && requests.length === 0) {
    return <OfflineView />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t("notifications") || "Notifications"}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {t("stay_updated_booking_status") || "Stay updated on your booking status"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {visibleRequests.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  t("clear_all") || "Clear All",
                  t("clear_all_confirm") || "Are you sure you want to clear all notifications?",
                  [
                    { text: t("cancel") || "Cancel", style: "cancel" },
                    { text: t("clear_all") || "Clear All", onPress: clearAllNotifications, style: "destructive" }
                  ]
                );
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>{t("clear_all") || "Clear All"}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setRefreshTrigger((prev) => prev + 1)}
            style={styles.refreshIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />
        }
      >
        {visibleRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="notifications-off-outline" size={44} color="#7C3AED" />
            </View>
            <Text style={styles.emptyTitle}>{t("no_notifications") || "No notifications yet"}</Text>
            <Text style={styles.emptyText}>{t("all_caught_up") || "You're all caught up."}</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([title, items]) => (
            items.length > 0 && (
              <View key={title} style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {items.map(renderCard)}
              </View>
            )
          ))
        )}
      </ScrollView>

      <Modal
        visible={showIdModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!uploading) setShowIdModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Identity Verification</Text>
              <TouchableOpacity 
                disabled={uploading} 
                onPress={() => setShowIdModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.infoText}>
                  Please enter your 12-digit Aadhaar ID and upload a screenshot proof to verify and join the property.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Aadhaar ID *</Text>
              <View style={styles.textInputContainer}>
                <Ionicons name="card-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 12-digit Aadhaar ID"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={12}
                  value={aadharId}
                  onChangeText={(text) => setAadharId(text.replace(/[^0-9]/g, ''))}
                  editable={!uploading}
                />
              </View>

              {/* AADHAAR FRONT */}
              <Text style={styles.inputLabel}>Aadhaar Card Front Image *</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={uploading}
                onPress={() => handlePickDocument("front")}
                style={[
                  styles.uploadContainer,
                  selectedFile && styles.uploadContainerActive
                ]}
              >
                {selectedFile ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedFile.uri }} style={styles.proofImagePreview} />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile.name || "aadhar_front.jpg"}
                      </Text>
                      <Text style={styles.fileSize}>Image selected</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteFileBtn} 
                      disabled={uploading}
                      onPress={() => setSelectedFile(null)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={COLORS.PRIMARY} />
                    <Text style={styles.uploadTitle}>Choose Aadhaar Front</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* AADHAAR BACK */}
              <Text style={styles.inputLabel}>Aadhaar Card Back Image *</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={uploading}
                onPress={() => handlePickDocument("back")}
                style={[
                  styles.uploadContainer,
                  selectedBackFile && styles.uploadContainerActive
                ]}
              >
                {selectedBackFile ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedBackFile.uri }} style={styles.proofImagePreview} />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedBackFile.name || "aadhar_back.jpg"}
                      </Text>
                      <Text style={styles.fileSize}>Image selected</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteFileBtn} 
                      disabled={uploading}
                      onPress={() => setSelectedBackFile(null)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={COLORS.PRIMARY} />
                    <Text style={styles.uploadTitle}>Choose Aadhaar Back</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.guidelinesBox}>
                <Text style={styles.guidelineTitle}>Upload Guidelines:</Text>
                <Text style={styles.guidelineItem}>• Document must be clearly visible and not blurry.</Text>
                <Text style={styles.guidelineItem}>• Ensure all four edges of the document are captured.</Text>
                <Text style={styles.guidelineItem}>• High resolution JPG, PNG formats are accepted.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                disabled={uploading}
                style={[styles.modalActionBtn, styles.cancelBtn]}
                onPress={() => setShowIdModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!selectedFile || !selectedBackFile || !aadharId || uploading}
                style={[
                  styles.modalActionBtn, 
                  styles.submitBtn,
                  (!selectedFile || !selectedBackFile || !aadharId || uploading) && styles.submitBtnDisabled
                ]}
                onPress={submitIdentityProof}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.WHITE} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit & Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "400",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  refreshIcon: {
    padding: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 40,
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingRight: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 20,
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 6,
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  propertyName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7C3AED",
    marginTop: 2,
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    paddingLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    backgroundColor: "#F1F5F9",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  alreadyJoinedBtn: {
    flexDirection: "row",
    backgroundColor: "#27ae60",
    marginTop: 12,
    flex: 0,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  actionBtnText: {
    color: COLORS.WHITE,
    fontWeight: "bold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: "#F5F3FF",
    borderRadius: 999,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  uploadContainer: {
    backgroundColor: "#FAF9FF",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: 20,
    padding: 20,
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  uploadContainerActive: {
    borderStyle: "solid",
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#F9F8FF",
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    fontWeight: "500",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  proofImagePreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },
  deleteFileBtn: {
    padding: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  guidelinesBox: {
    backgroundColor: "#FAF9FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.05)",
  },
  guidelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  guidelineItem: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
    marginBottom: 4,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  modalActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  cancelBtnText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(139, 92, 246, 0.4)",
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9FF",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.15)",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },
});

export default TenantNotificationScreen;
