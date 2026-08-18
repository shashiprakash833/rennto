import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import COLORS from "../../theme/colors";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useMaintenance } from "../../context/MaintenanceContext";

export default function OwnerEditProfileScreen({ navigation }) {
  const { maintenanceMode } = useMaintenance();
  const insets = useSafeAreaInsets();
  const isReadOnly = maintenanceMode === "READ_ONLY";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [ownerData, setOwnerData] = useState({
    name: "",
    property_name: "",
    area: "",
    image: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const phone = await AsyncStorage.getItem("ownerPhone");
      if (!phone) return;
      const response = await fetchWithAuth(`${BASE_URL}/api/owner_data/${encodeURIComponent(phone.trim())}/`);
      const data = await response.json();
      if (response.ok) {
        setOwnerData({
          name: data.step1.name,
          
          property_name: data.step1.property_name || "",
          area: data.step1.area || "",
          image: data.step1.owner_img_field || "",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Profile Photo",
      "Choose an option to update your profile photo:",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Pick image error:", error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Take photo error:", error);
    }
  };

  const uploadProfileImage = async (uri) => {
    setSaving(true);
    try {
      const phone = await AsyncStorage.getItem("ownerPhone");
      if (!phone) return;

      const formData = new FormData();
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("owner_img_field", {
        uri: uri,
        name: filename,
        type: type,
      });

      const response = await fetchWithAuth(`${BASE_URL}/api/owner_profile_update/${encodeURIComponent(phone.trim())}/`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        setOwnerData(prev => ({ ...prev, image: uri }));
        Alert.alert("Success", "Profile picture updated successfully");
      } else {
        Alert.alert("Error", "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Something went wrong during image upload");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const phone = await AsyncStorage.getItem("ownerPhone");
      if (!phone) {
        Alert.alert("Error", "Phone number not found");
        setSaving(false);
        return;
      }
      
      const formData = new FormData();
      formData.append("name", ownerData.name);
      formData.append("property_name", ownerData.property_name);
      formData.append("area", ownerData.area);
      // We do not append phone since it shouldn't be updated

      const response = await fetchWithAuth(`${BASE_URL}/api/owner_profile_update/${encodeURIComponent(phone.trim())}/`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        navigation.goBack();
      } else {
        const errorText = await response.text();
        console.error("Profile update failed:", errorText);
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'android' ? 100 : 20}
        extraHeight={120}
        bounces={false}
        overScrollMode="never"
      >
        {/* PROFILE IMAGE SECTION */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={[styles.avatarWrapper, isReadOnly && { opacity: 0.6 }]} onPress={isReadOnly ? () => Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.") : showImageOptions} activeOpacity={0.8}>
            {ownerData.image ? (
              <View style={{ width: 100, height: 100, borderRadius: 50, overflow: 'hidden' }}>
                {/* Always show placeholder letter beneath image while loading */}
                <View style={[styles.avatarPlaceholder, { position: 'absolute', top: 0, left: 0 }]}>
                  <Text style={styles.avatarLetter}>
                    {ownerData.name ? ownerData.name.charAt(0).toUpperCase() : "O"}
                  </Text>
                </View>
                <Image
                  source={{ uri: ownerData.image }}
                  style={[styles.avatar, { opacity: imageLoading ? 0 : 1 }]}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {ownerData.name ? ownerData.name.charAt(0).toUpperCase() : "O"}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={ownerData.name}
            onChangeText={(text) => setOwnerData({ ...ownerData, name: text })}
            placeholder="Enter your name"
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Property Name</Text>
          <TextInput
            style={styles.input}
            value={ownerData.property_name}
            onChangeText={(text) => setOwnerData({ ...ownerData, property_name: text })}
            placeholder="Enter property name"
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location / Area</Text>
          <TextInput
            style={styles.input}
            value={ownerData.area}
            onChangeText={(text) => setOwnerData({ ...ownerData, area: text })}
            placeholder="Enter area"
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isReadOnly && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving || isReadOnly}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isReadOnly ? "Unavailable During Maintenance" : "Save Changes"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    padding: 20,
    paddingBottom: 20,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  saveBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  cancelBtnText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "700",
  },
});