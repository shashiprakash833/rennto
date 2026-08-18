import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
  Modal,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useNetwork } from '../../hooks/useNetwork';
import OfflineView from '../../components/OfflineView';

import { useLanguage } from '../../utils/LanguageContext';

export default function OwnerTenantsScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { isConnected } = useNetwork();
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === 'READ_ONLY';
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState(route?.params?.property_id || null);
  const [tenants, setTenants] = useState([]);

  // Details Modal States
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

  const handleViewImage = (uri) => {
    setFullscreenImage(uri);
    setIsImageViewerVisible(true);
  };

  useEffect(() => {
    fetchTenants();
  }, [isConnected]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      let storedId = await AsyncStorage.getItem('ownerPhone');
      if (!storedId) return;

      let phoneToUse = storedId;
      // Resolve actual phone number from loggedInOwnerAccounts
      const rawAccounts = await AsyncStorage.getItem('loggedInOwnerAccounts');
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        const account = accounts.find(a => String(a.id) === String(storedId));
        if (account && account.phone) {
          phoneToUse = account.phone;
        }
      }

      // Fetch from all possible tenant types
      const [hostelRes, aptRes, commRes] = await Promise.all([
        fetchWithAuth(`${BASE_URL}/api/getbeds/${encodeURIComponent(phoneToUse)}/`),
        fetchWithAuth(`${BASE_URL}/api/getapartmentbeds/${encodeURIComponent(phoneToUse)}/`),
        fetchWithAuth(`${BASE_URL}/api/getcommercialbeds/${encodeURIComponent(phoneToUse)}/`)
      ]);

      const [hostelData, aptData, commData] = await Promise.all([
        hostelRes.json(),
        aptRes.json(),
        commRes.json()
      ]);

      let allTenants = [];
      if (hostelData.data) allTenants = [...allTenants, ...hostelData.data.map(t => ({ ...t, type: 'Hostel' }))];
      if (aptData.data) allTenants = [...allTenants, ...aptData.data.map(t => ({ ...t, type: 'Apartment' }))];
      if (commData.data) allTenants = [...allTenants, ...commData.data.map(t => ({ ...t, type: 'Commercial' }))];

      // Deduplicate by name to prevent showing duplicate names
      const uniqueTenantsMap = new Map();
      allTenants.forEach(t => {
        const nameKey = (t.name || "").trim().toLowerCase();
        if (nameKey && !uniqueTenantsMap.has(nameKey)) {
          uniqueTenantsMap.set(nameKey, t);
        }
      });
      setTenants(Array.from(uniqueTenantsMap.values()));
    } catch (error) {
      console.log('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTenantDetails = async (tenant) => {
    try {
      const phone = tenant.phone || tenant.mobile || tenant.contact;
      if (!phone) {
        Alert.alert("Error", "Tenant phone number not found.");
        return;
      }
      setFetchingDetails(true);
      setDetailsModalVisible(true);

      const res = await fetchWithAuth(`${BASE_URL}/api/tenantdetails/${encodeURIComponent(phone.trim())}/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTenantDetails({
          ...data,
          bed_record_id: tenant.id,
          stay_type: tenant.type || data.property_type,
        });
      } else {
        Alert.alert("Error", "Failed to load tenant verification details.");
        setDetailsModalVisible(false);
      }
    } catch (error) {
      console.log("Error loading tenant details:", error);
      Alert.alert("Error", "Error loading tenant verification details.");
      setDetailsModalVisible(false);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleVacateTenant = async () => {
    if (isReadOnly) {
      Alert.alert(
        "Maintenance Mode",
        "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application."
      );
      return;
    }
    if (!selectedTenantDetails) return;
    const { name, bed_record_id, stay_type } = selectedTenantDetails;

    Alert.alert(
      "Vacate Tenant",
      `Are you sure you want to vacate ${name} from this property?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Vacate",
          style: "destructive",
          onPress: async () => {
            try {
              const stayTypeLower = (stay_type || "").toLowerCase();
              const endpointMap = {
                hostel: 'deletehostel',
                apartment: 'deleteapartment',
                commercial: 'deletecommercial',
              };
              const endpoint = endpointMap[stayTypeLower];
              if (!endpoint) {
                Alert.alert("Error", `Unsupported stay type: ${stay_type}`);
                return;
              }

              const res = await fetchWithAuth(`${BASE_URL}/api/${endpoint}/${bed_record_id}/`, {
                method: "DELETE",
              });

              if (res.ok) {
                Alert.alert("Success", "Tenant vacated successfully");
                setDetailsModalVisible(false);
                fetchTenants(); // reload tenant list
              } else {
                Alert.alert("Error", "Failed to vacate tenant");
              }
            } catch (err) {
              console.error("Vacate Error:", err);
              Alert.alert("Error", "Error vacating tenant.");
            }
          },
        },
      ]
    );
  };

  const renderTenant = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.tenantCard}
      onPress={() => handleViewTenantDetails(item)}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.tenantIcon}>
            <Text style={styles.tenantInitial}>{item.name ? item.name.charAt(0) : 'T'}</Text>
          </View>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>{item.name}</Text>
            <Text style={styles.tenantDetail}>Phone: {item.phone}</Text>
            <Text style={styles.tenantDetail}>
              Room {item.roomno || item.flatno || item.sectionNo}
              {item.floor !== undefined && item.floor !== null ? ` • Floor ${item.floor}` : ''}
              {(item.type || "").toLowerCase() === 'hostel' && item.bed !== undefined && item.bed !== null ? ` • Bed ${item.bed}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <Text style={[styles.tenantDetail, { color: item.aadhar_id ? '#10B981' : '#F59E0B', fontWeight: '600', marginRight: 8 }]}>
                Aadhaar: {item.aadhar_id || "Pending Verification"}
              </Text>
              {item.aadhar_image && (
                <TouchableOpacity
                  onPress={() => handleViewImage(item.aadhar_image)}
                  style={{ padding: 5, backgroundColor: '#F3F4F6', borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#E5E7EB' }}
                >
                  <Ionicons name="eye-outline" size={14} color="#7A3FC4" />
                </TouchableOpacity>
              )}
              {item.aadhar_back_image && (
                <TouchableOpacity
                  onPress={() => handleViewImage(item.aadhar_back_image)}
                  style={{ padding: 5, backgroundColor: '#F3F4F6', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' }}
                >
                  <Ionicons name="eye-outline" size={14} color="#7A3FC4" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.callButton, { alignSelf: 'flex-start', marginTop: 4 }]}
        onPress={() => {
          const phone = item.phone || item.mobile || item.contact;
          if (phone) {
            Linking.openURL(`tel:${phone}`);
          } else {
            alert('Phone number not available');
          }
        }}
      >
        <Ionicons name="call" size={15} color="#7A3FC4" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isConnected === false && tenants.length === 0) {
    return <OfflineView />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Tenants</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A3FC4" />
        </View>
      ) : (
        <FlatList
          data={tenants}
          renderItem={renderTenant}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>{t("no_tenants_found") || "No tenants found"}</Text>
            </View>
          }
        />
      )}

      {/* --- TENANT VERIFICATION DETAILS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tenant Verification details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {fetchingDetails ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7A3FC4" />
                <Text style={{ marginTop: 10, color: '#6B7280' }}>Fetching proof documents...</Text>
              </View>
            ) : selectedTenantDetails ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* Profile Card */}
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Profile Details</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{selectedTenantDetails.name}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{selectedTenantDetails.phone}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Property Name:</Text>
                    <Text style={styles.infoValue}>{selectedTenantDetails.property_name}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Allotted Space:</Text>
                    <Text style={styles.infoValue}>
                      {selectedTenantDetails.property_type} • Room {selectedTenantDetails.room_number} (Floor {selectedTenantDetails.floor_number}
                      {(selectedTenantDetails.stay_type || selectedTenantDetails.property_type || "").toLowerCase() === 'hostel' && selectedTenantDetails.bed_number ? `, Bed ${selectedTenantDetails.bed_number}` : ''})
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Monthly Rent:</Text>
                    <Text style={styles.infoValue}>₹{selectedTenantDetails.rent}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Move-In Date:</Text>
                    <Text style={styles.infoValue}>{selectedTenantDetails.check_in}</Text>
                  </View>
                </View>

                {/* Aadhaar Verification Section */}
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Identity Verification (Aadhaar)</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Aadhaar ID:</Text>
                    <Text style={styles.infoValue}>{selectedTenantDetails.aadhar_id}</Text>
                  </View>

                  {/* Aadhaar Front Proof */}
                  {selectedTenantDetails.aadhar_image ? (
                    <View style={styles.imageDocWrapper}>
                      <Text style={styles.imageDocTitle}>Aadhaar Front Image:</Text>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => handleViewImage(selectedTenantDetails.aadhar_image)}>
                        <Image
                          source={{ uri: selectedTenantDetails.aadhar_image }}
                          style={styles.docImagePreview}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Aadhaar Back Proof */}
                  {selectedTenantDetails.aadhar_back_image ? (
                    <View style={styles.imageDocWrapper}>
                      <Text style={styles.imageDocTitle}>Aadhaar Back Image:</Text>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => handleViewImage(selectedTenantDetails.aadhar_back_image)}>
                        <Image
                          source={{ uri: selectedTenantDetails.aadhar_back_image }}
                          style={styles.docImagePreview}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* Deposit Payment & Selfie Section */}
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Payment & Live Selfie</Text>

                  {/* Payment Screenshot */}
                  {selectedTenantDetails.payment_screenshot ? (
                    <View style={styles.imageDocWrapper}>
                      <Text style={styles.imageDocTitle}>Advance / Deposit Payment Screenshot:</Text>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => handleViewImage(selectedTenantDetails.payment_screenshot)}>
                        <Image
                          source={{ uri: selectedTenantDetails.payment_screenshot }}
                          style={styles.docImagePreview}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Selfie Proof */}
                  {selectedTenantDetails.selfie ? (
                    <View style={styles.imageDocWrapper}>
                      <Text style={styles.imageDocTitle}>Tenant Selfie / Live Photo:</Text>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => handleViewImage(selectedTenantDetails.selfie)}>
                        <Image
                          source={{ uri: selectedTenantDetails.selfie }}
                          style={styles.selfieImagePreview}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                {/* Action Buttons */}
                <View style={{ gap: 12, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#7A3FC4' }]}
                    onPress={() => {
                      const phone = selectedTenantDetails.phone;
                      Linking.openURL(`tel:${phone}`);
                    }}
                  >
                    <Ionicons name="call" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Call Tenant</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleVacateTenant}
                  >
                    <Ionicons name="exit-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Vacate Tenant</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Failed to load tenant details.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- FULLSCREEN IMAGE VIEWER MODAL --- */}
      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setIsImageViewerVisible(false)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {fullscreenImage ? (
            <Image
              source={{ uri: fullscreenImage }}
              style={{ width: '95%', height: '80%' }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  listContent: {
    padding: 16,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tenantIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  tenantInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7A3FC4',
  },
  tenantInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  tenantDetail: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  callButton: {
    padding: 7,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 20,
  },
  imageDocWrapper: {
    marginTop: 14,
  },
  imageDocTitle: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 6,
  },
  docImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  selfieImagePreview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});