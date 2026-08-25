import React, { useState, useCallback, useRef, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../utils/LanguageContext";
import LanguageSelector from "../../components/LanguageSelector";
import * as ImagePicker from "expo-image-picker";
import COLORS from "../../theme/colors";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { useMaintenance } from "../../context/MaintenanceContext";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  PanResponder,
  KeyboardAvoidingView,
  Platform
} from "react-native";

const initialTenant = {
  name: "...",
  role: "Resident",
  phone: "...",

  apartment: "...",
  location: "...",
  status: "Pending Join"
};

export default function TenantProfile({ navigation }) {
  const { isConnected } = useNetwork();
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === "READ_ONLY";
  const checkReadOnly = () => {
    if (isReadOnly) {
      Alert.alert(
        "Maintenance Mode",
        "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application."
      );
      return true;
    }
    return false;
  };
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [tenantData, setTenantData] = useState(initialTenant);
  const [profileImage, setProfileImage] = useState(null);


  // --- AI Assistant Draggable State & Chat ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  useEffect(() => {
    setAiMessages([
      { id: '1', text: t("ai_assistant_greeting_tenant") || "Hello! I am your Rennto AI Assistant. Ask me anything about using the app (e.g., issues, payments, hostels).", sender: 'ai' }
    ]);
  }, [t]);
  const [aiInputText, setAiInputText] = useState("");

  const aiPan = useRef(new Animated.ValueXY()).current;
  const aiPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        aiPan.setOffset({
          x: aiPan.x._value,
          y: aiPan.y._value
        });
        aiPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: aiPan.x, dy: aiPan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        aiPan.flattenOffset();
      }
    })
  ).current;

  // Edit Form States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTenantProfile = useCallback(async () => {
    try {
      const phone = await AsyncStorage.getItem("tenantPhone");

      if (!phone) return;

      const response = await fetchWithAuth(
        `${BASE_URL}/api/tenantdetails/${encodeURIComponent(phone.trim())}/`
      );

      const data = await response.json();

      console.log("API DATA:", data);

      if (response.ok) {

        const tenantInfo = {
          name: data.name || "Tenant",
          phone: data.phone || "N/A",

          apartment: data.property_name || "N/A",

          room_number: data.room_number || "N/A",
          floor_number: data.floor_number || "N/A",
          bed_number: data.bed_number || "N/A",

          location: data.location || "N/A",

          role: data.status === "Active" ? "Verified Resident" : "Pending Join",
          status: data.status || "Pending Join"
        };

        setTenantData(tenantInfo);

        setEditName(data.name || "");
        setEditPhone(data.phone || "");

        // IMAGE
        if (data.identityImage) {
          console.log("IDENTITY IMAGE:", data.identityImage);
          console.log("TYPE:", typeof data.identityImage);

          setProfileImage(`${data.identityImage}?t=${new Date().getTime()}`);
        } else {
          setProfileImage(null);
        }
      }



    } catch (e) {
      console.log("ERROR:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateProfile = async () => {
    if (checkReadOnly()) return;
    if (!editName.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setSaving(true);

    try {
      const phone = await AsyncStorage.getItem("tenantPhone");
      if (!phone) {
        Alert.alert("Error", "Phone number not found");
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", editName);
      // We don't append phone since it is uneditable

      const response = await fetchWithAuth(
        `${BASE_URL}/api/tenant_profile_update/${encodeURIComponent(phone.trim())}/`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTenantData((prev) => ({
          ...prev,
          name: editName,
        }));

        Alert.alert("Success", data.message);

        setShowEditModal(false);
      } else {
        Alert.alert("Error", data.error || "Update failed");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Server error");
    } finally {
      setSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isConnected !== undefined) {
        fetchTenantProfile();
      }
    }, [fetchTenantProfile, isConnected])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTenantProfile();
    setRefreshing(false);
  }, [fetchTenantProfile]);

  const uploadProfileImage = async (uri) => {
    if (checkReadOnly()) return;
    try {
      const phone = await AsyncStorage.getItem("tenantPhone");
      if (!phone) return;

      const formData = new FormData();
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("tenant_img_field", {
        uri: uri,
        name: filename,
        type: type,
      });

      const response = await fetchWithAuth(
        `${BASE_URL}/api/tenant_profile_update/${encodeURIComponent(phone.trim())}/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        fetchTenantProfile();
      } else {
        Alert.alert(t("error") || "Error", `${t("failed_upload") || "Failed to upload image"}: ${response.status}`);
      }
    } catch (error) {
      console.log("Upload error:", error);
      Alert.alert(t("error") || "Error", `${t("failed_upload") || "Failed to upload image"}: ${error.message}`);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      uploadProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      uploadProfileImage(result.assets[0].uri);
    }
  };

  const handleSendAiMessage = () => {
    if (!aiInputText.trim()) return;
    const userMsg = { id: Date.now().toString(), text: aiInputText.trim(), sender: 'user' };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInputText("");

    setTimeout(() => {
      let aiReply = "I'm still learning! Could you rephrase your question?";
      const lowerQ = userMsg.text.toLowerCase();

      if (lowerQ === 'hi' || lowerQ === 'hello' || lowerQ === 'hey') {
        aiReply = "Hello! 👋 How can I help you with your Rennto app today?";
      } else if (lowerQ.includes('how are you')) {
        aiReply = "I'm doing great, thank you! Ready to help you. What do you need assistance with?";

      } else if (
        lowerQ.includes('support') ||
        lowerQ.includes('help') ||
        lowerQ.includes('contact') ||
        lowerQ.includes('customer care') ||
        lowerQ.includes('phone number') ||
        lowerQ.includes('call')
      ) {
        aiReply = "For further assistance, please contact Rennto Support:\n📞 +91 9542704244\n📧 support@rennto.com\nOur team will help you resolve your issue as soon as possible.";
      }
      else if (lowerQ.includes('issue') || lowerQ.includes('complain') || lowerQ.includes('problem')) {
        aiReply = "You can report issues to your owner directly by going to the Notifications tab and tapping the '+' icon at the top right to raise a new issue.";
      } else if (lowerQ.includes('pay') || lowerQ.includes('upi') || lowerQ.includes('screenshot')) {
        aiReply = "To upload a payment screenshot, go to the Payment History tab in your Profile, tap on your pending payment, and use the upload button.";
      } else if (lowerQ.includes('hostel') || lowerQ.includes('search') || lowerQ.includes('join')) {
        aiReply = "Go to the Search (Hostel) tab at the bottom to find new properties and send a join request.";
      } else if (lowerQ.includes('edit') || lowerQ.includes('profile')) {
        aiReply = "You can edit your profile details or change your picture right here by tapping the pencil icon or your profile photo.";
      } else if (lowerQ.includes('thank')) {
        aiReply = "You're very welcome! Let me know if you need anything else. 😊";
      } else if (lowerQ.includes('how are you')) {
        aiReply = "I'm doing great, thank you! Ready to help you. What do you need assistance with?";
      }
      else if (
        lowerQ.includes('support') ||
        lowerQ.includes('help') ||
        lowerQ.includes('contact') ||
        lowerQ.includes('customer care') ||
        lowerQ.includes('phone number') ||
        lowerQ.includes('call')
      ) {
        aiReply =
          "For further assistance, please contact Rennto Support:\n\n📞 +91 9542704244\n📧 support@rennto.com\n\nOur team will help you as soon as possible.";
      }
      else if (
        lowerQ.includes('issue') ||
        lowerQ.includes('complain') ||
        lowerQ.includes('problem')
      ) {
        aiReply =
          "You can report issues to your owner directly by going to the Notifications tab and tapping the '+' icon at the top right.\n\nNeed additional help?\n📞 +91 9542704244";
      }
      else if (
        lowerQ.includes("rent") ||
        lowerQ.includes("due") ||
        lowerQ.includes("amount") ||
        lowerQ.includes("payment due") ||
        lowerQ.includes("payment")
      ) {
        aiReply =
          "To check your rent dues or make a payment, please visit the Payments tab. You can view your payment history and upload screenshots for any pending payments there.";
      }
      else if (lowerQ.includes("owner")) {
        aiReply = "You can contact your property owner using the contact details available in the Property Information section.";
      }
      else {
        aiReply = "I'm still learning! Could you rephrase your question? Try asking about issues, payments, or finding hostels.";
      }

      setAiMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiReply, sender: 'ai' }]);
    }, 800);
  };

  const handleLogout = async () => {
    Alert.alert(t("logout") || "Logout", t("logout_confirm") || "Are you sure you want to logout?", [
      { text: t("cancel") || "Cancel", style: "cancel" },
      { text: t("logout") || "Logout", onPress: async () => { await AsyncStorage.multiRemove(["tenantPhone", "tenantName", "userToken", "tenantEmail", "tenantId", "userRole"]); navigation.reset({ index: 0, routes: [{ name: 'RoleSection', params: { skipSplash: true } }] }) } }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7A3FC4" />
        <Text style={styles.loaderText}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  if (isConnected === false && tenantData.name === "...") {
    return <OfflineView />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true}/>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7A3FC4"]} />}
      >
        {/* Header Gradient - Same as Owner */}
        <LinearGradient
          colors={['#5F259F', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow} />

          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() => setShowProfileModal(true)}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                  onLoad={() => console.log("IMAGE LOADED SUCCESS")}
                  onError={(e) => console.log("PROFILE IMAGE ERROR:", e.nativeEvent)}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageLetter}>{tenantData.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.name, { color: '#FFFFFF' }]}>{tenantData.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={[styles.roleText, { color: '#FFFFFF' }]}>
                {tenantData.role === "Resident" ? t("resident") : tenantData.role === "Verified Resident" ? t("verified_resident") : tenantData.role === "Pending Join" ? t("pending_join") : (t(tenantData.role) || tenantData.role)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Resident Information */}
        {tenantData.status === "Active" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("resident_details") || "Resident Details"}</Text>
            <View style={styles.infoCard}>
              <InfoItem icon="call-outline" label={t("phone") || "Phone"} value={tenantData.phone} color="#10B981" />

              {tenantData.apartment && tenantData.apartment !== "N/A" && (
                <>
                  <View style={styles.divider} />
                  <InfoItem icon="business-outline" label={t("property_name") || "Property Name"} value={tenantData.apartment} color="#6366F1" />
                </>
              )}

              {tenantData.room_number && tenantData.room_number !== "N/A" && (
                <>
                  <View style={styles.divider} />
                  <InfoItem
                    icon="home-outline"
                    label={tenantData.bed_number && tenantData.bed_number !== "N/A" ? (t("room_bed_floor") || "Room, Bed & Floor") : (t("room_flat_floor") || "Room/Flat & Floor")}
                    value={`${tenantData.room_number} ${tenantData.bed_number && tenantData.bed_number !== "N/A" ? `(Bed: ${tenantData.bed_number})` : ""} (${t("floor") || "Floor"}: ${tenantData.floor_number})`}
                    color="#8B5CF6"
                  />
                </>
              )}

              {tenantData.location && tenantData.location !== "N/A" && (
                <>
                  <View style={styles.divider} />
                  <InfoItem icon="location-outline" label={t("location") || "Location"} value={tenantData.location} color="#EC4899" />
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("basic_information") || "Basic Information"}</Text>
            <View style={styles.infoCard}>
              <InfoItem icon="call-outline" label={t("phone") || "Phone"} value={tenantData.phone} color="#10B981" />
            </View>
          </View>
        )}



        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account_actions") || "Account Actions"}</Text>
          <View style={styles.actionsCard}>
            {tenantData.status === "Active" && (
              <ActionItem
                icon="time-outline"
                label={t("payment_history") || "Payment History"}
                color="#7C3AED"
                onPress={() => navigation.navigate("TenantPaymentHistory")}
              />
            )}
            <ActionItem
              icon="globe-outline"
              label={t("languages") || "Languages"}
              color="#10B981"
              onPress={() => setShowLangModal(true)}
            />
            <ActionItem
              icon="document-text-outline"
              label={t("request_history") || "Request History"}
              color="#3B82F6"
              onPress={() => navigation.navigate("TenantRequestHistory")}
            />
            <ActionItem
              icon="notifications-outline"
              label={t("notifications") || "Notifications"}
              color="#F59E0B"
              onPress={() => navigation.navigate('TenantNotification')}
            />
            <ActionItem
              icon="log-out-outline"
              label={t("logout") || "Sign Out"}
              color="#DC2626"
              onPress={handleLogout}
              isLast
            />
          </View>
        </View>

      </ScrollView>

      {/* Profile Settings Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("profile_settings") || "Profile Settings"}</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowProfileModal(false);
                takePhoto();
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="camera-outline" size={24} color="#0369A1" />
              </View>
              <Text style={styles.optionLabel}>{t("take_photo") || "Take New Photo"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowProfileModal(false);
                pickImage();
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="image-outline" size={24} color="#7A3FC4" />
              </View>
              <Text style={styles.optionLabel}>{t("choose_gallery") || "Choose from Gallery"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowProfileModal(false);
                setShowEditModal(true);
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="create-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.optionLabel}>{t("edit_profile_details") || "Edit Profile Details"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalCancelText}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Edit Profile Form Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.formModalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("edit_profile") || "Edit Profile"}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("full_name") || "Full Name"}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t("full_name") || "Enter your name"}
                />
              </View>
            </View>


            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{t("save") || "Save Changes"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCancelText}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <LanguageSelector
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
      />

      {/* Draggable AI Assistant FAB */}
      <Animated.View
        {...aiPanResponder.panHandlers}
        style={[
          styles.aiFab,
          {
            transform: [
              { translateX: aiPan.x },
              { translateY: aiPan.y }
            ]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAiModal(true)}
          style={{ width: '100%', height: '100%' }}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6', '#D946EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiFabGradient}
          >
            <MaterialIcons name="support-agent" size={26} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* AI Assistant Modal */}
      <Modal
        visible={showAiModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAiModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAiModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { height: '80%', padding: 0 }]}>
            <LinearGradient
              colors={['#7A3FC4', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="support-agent" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFF' }}>{t("support_agent") || "Support Agent"}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                {aiMessages.map(msg => (
                  <View key={msg.id} style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#7A3FC4' : '#F3F4F6',
                    padding: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 16,
                    marginBottom: 12,
                    maxWidth: '85%'
                  }}>
                    <Text style={{ fontSize: 15, color: msg.sender === 'user' ? '#FFF' : '#1F2937', lineHeight: 22 }}>
                      {msg.text}
                    </Text>
                  </View>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: '#1F2937' }}
                  placeholder={t("ask_a_question") || "Ask a question..."}
                  placeholderTextColor="#9CA3AF"
                  value={aiInputText}
                  onChangeText={setAiInputText}
                  multiline
                />
                <TouchableOpacity
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#7A3FC4', justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}
                  onPress={handleSendAiMessage}
                >
                  <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const InfoItem = ({ icon, label, value, color }) => (
  <View style={styles.infoItem}>
    <View style={[styles.infoIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ActionItem = ({ icon, label, color, onPress, isLast }) => (
  <TouchableOpacity style={[styles.actionItem, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons name="chevron-forward-outline" size={20} color="#CBD5E1" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  content: {
    paddingBottom: 110
  },
  header: {

    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  notifBtn: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  profileImageLetter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7A3FC4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(122,63,196,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A3FC4',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 14,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginLeft: 14,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    gap: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: '#64748B',
  },
  formModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  formModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 12,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#7A3FC4',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  aiFab: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  aiFabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

});