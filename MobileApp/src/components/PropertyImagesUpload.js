import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { useLanguage } from "../utils/LanguageContext";

export default function PropertyImagesUpload({ ownerPhone }) {
  const { t } = useLanguage();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPickerModal, setShowPickerModal] = useState(false);

  useEffect(() => {
    if (ownerPhone) {
      fetchImages();
    }
  }, [ownerPhone]);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth(`${BASE_URL}/api/owner/property-images/`);
      const data = await res.json();
      if (res.ok && data.success) {
        setImages(data.images || []);
      }
    } catch (e) {
      console.log("Error fetching property images:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const openGallery = async () => {
    if (isUploading || isLoading) return;
    setShowPickerModal(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    handleImagePickerResult(result);
  };

  const openCamera = async () => {
    if (isUploading || isLoading) return;
    setShowPickerModal(false);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission Denied", "Sorry, we need camera permissions to make this work!");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    handleImagePickerResult(result);
  };

  const handleImagePickerResult = async (result) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      let hasSizeError = false;
      const validAssets = [];
      
      result.assets.forEach((asset) => {
        if (asset.fileSize && asset.fileSize > 5242880) {
          hasSizeError = true;
          setErrorMsg(t("image_size_limit") || "Image must be under 5MB");
        } else if (asset) {
          if (!asset.mimeType) asset.mimeType = "image/jpeg";
          validAssets.push(asset);
        }
      });

      if (validAssets.length > 0) {
        if (!hasSizeError) {
          setErrorMsg("");
        }
        await uploadImages(validAssets);
      }
    }
  };

  const uploadImages = async (assets) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('action', 'upload');
      assets.forEach((asset, idx) => {
        formData.append('images', {
          uri: asset.uri,
          name: asset.name || `gallery_${Date.now()}_${idx}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      });

      const res = await fetchWithAuth(`${BASE_URL}/api/owner/property-images/`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImages(data.images || []);
      } else {
        console.log("Error", data.message || "Failed to upload images");
      }
    } catch (e) {
      console.log("Error", "Network error while uploading images");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imagePath) => {
    console.log(
      "Delete Image",
      "Are you sure you want to delete this property image?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsUploading(true);
              const formData = new FormData();
              formData.append('action', 'delete');
              formData.append('image_path', imagePath);
              
              const res = await fetchWithAuth(`${BASE_URL}/api/owner/property-images/`, {
                method: 'POST',
                body: formData,
              });
              const data = await res.json();
              if (res.ok && data.success) {
                setImages(data.images || []);
              } else {
                console.log("Error", data.message || "Failed to delete image");
              }
            } catch (e) {
              console.log("Error", "Network error while deleting image");
            } finally {
              setIsUploading(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      {/* Section Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F5F3FF", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
            <Ionicons name="images" size={18} color="#7C3AED" />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>{t("property_gallery") || "Property Gallery"}</Text>
            <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 1 }}>{t("upload_room_property_photos") || "Upload room & property photos"}</Text>
          </View>
        </View>
        {/* Photo count badge */}
        {images.length > 0 && (
          <View style={{ backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{images.length}/10</Text>
          </View>
        )}
      </View>

      {/* Upload Card */}
      <TouchableOpacity
        style={{
          borderRadius: 20,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: errorMsg ? "#EF4444" : "#DDD6FE",
          backgroundColor: "#FAFAFF",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 26,
          marginBottom: 12,
          shadowColor: "#7C3AED",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 1,
          opacity: isUploading ? 0.6 : 1,
        }}
        onPress={() => setShowPickerModal(true)}
        disabled={isUploading}
        activeOpacity={0.8}
      >
        <View style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: "#F5F3FF",
          justifyContent: "center", alignItems: "center",
          marginBottom: 12,
          shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.14, shadowRadius: 8, elevation: 3,
        }}>
          {isUploading ? (
            <ActivityIndicator color="#7C3AED" size="small" />
          ) : (
            <Ionicons name="images-outline" size={30} color="#7C3AED" />
          )}
        </View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1B4B", marginBottom: 4 }}>
          {isUploading ? (t("uploading") || 'Uploading...') : (t("upload_property_gallery") || 'Upload Property Gallery')}
        </Text>
        <Text style={{ fontSize: 12, color: "#9CA3AF" }}>{t("max_photos_format") || "Maximum 10 Photos • JPG, PNG"}</Text>
      </TouchableOpacity>

      {errorMsg ? (
        <Text style={{ color: "#EF4444", fontSize: 12, marginTop: -6, marginBottom: 10, marginLeft: 4 }}>
          {errorMsg}
        </Text>
      ) : null}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {images.map((img, idx) => (
            <View key={idx} style={{ width: "30.8%" }}>
              <View style={{ borderRadius: 14, overflow: "hidden", position: "relative" }}>
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: "100%", aspectRatio: 1 }}
                  resizeMode="cover"
                />
                {/* Dark overlay on image bottom */}
                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "rgba(0,0,0,0.3)" }} />
                {/* Remove Button */}
                <TouchableOpacity
                  style={{
                    position: "absolute", top: 5, right: 5,
                    backgroundColor: "rgba(239,68,68,0.9)",
                    borderRadius: 10, width: 22, height: 22,
                    alignItems: "center", justifyContent: "center",
                  }}
                  onPress={() => deleteImage(img.path)}
                  disabled={isUploading}
                >
                  <Ionicons name="close" size={13} color="#FFF" />
                </TouchableOpacity>
                {/* Index label */}
                <View style={{ position: "absolute", bottom: 4, left: 6 }}>
                  <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>#{idx + 1}</Text>
                </View>
              </View>
            </View>
          ))}
          {/* Add more button */}
          {images.length < 10 && (
            <TouchableOpacity
              style={{
                width: "30.8%", aspectRatio: 1,
                borderRadius: 14, borderWidth: 2, borderStyle: "dashed",
                borderColor: "#DDD6FE", backgroundColor: "#FAFAFF",
                justifyContent: "center", alignItems: "center",
                opacity: isUploading ? 0.6 : 1,
              }}
              onPress={() => setShowPickerModal(true)}
              disabled={isUploading}
            >
              <Ionicons name="add" size={24} color="#7C3AED" />
              <Text style={{ fontSize: 10, color: "#7C3AED", fontWeight: "600", marginTop: 3 }}>{t("add_more") || "Add More"}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={showPickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPickerModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("upload_property_images") || "Upload Images"}</Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openCamera}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="camera-outline" size={24} color="#0369A1" />
              </View>
              <Text style={styles.optionLabel}>{t("take_photo") || "Take Photo"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openGallery}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="image-outline" size={24} color="#7A3FC4" />
              </View>
              <Text style={styles.optionLabel}>{t("choose_gallery") || "Choose from Gallery"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={styles.modalCancelText}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  modalCancelBtn: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
