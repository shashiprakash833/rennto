import React, { useState, useEffect } from 'react';   // 1
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { fetchWithAuth } from '../../config/Api';
import COLORS from '../../theme/colors';
import { useMaintenance } from '../../context/MaintenanceContext';
import { useNetwork } from '../../hooks/useNetwork';
import OfflineView from '../../components/OfflineView';

export default function OwnerEditBuildingScreen({ navigation }) {
  const { isConnected } = useNetwork();
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === 'READ_ONLY';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [propertyType, setPropertyType] = useState(''); // 'hostel', 'apartment', 'commercial'
  const [buildingLayout, setBuildingLayout] = useState([]);
const [ownerPhone, setOwnerPhone] = useState('');
  const [expandedFloor, setExpandedFloor] = useState(null);
  
const [areaModalVisible, setAreaModalVisible] = useState(false);
const [areaModalInput, setAreaModalInput] = useState('');
const [areaModalFloorNo, setAreaModalFloorNo] = useState(null);
const [areaModalSectionNo, setAreaModalSectionNo] = useState(null);
  const [originalLayoutSnapshot, setOriginalLayoutSnapshot] = useState([]);

  useEffect(() => {
    fetchBuildingDetails();
  }, [isConnected]);

  const fetchBuildingDetails = async () => {
    try {
      const phone = await AsyncStorage.getItem('ownerPhone');
      if (!phone) {
        Alert.alert('Error', 'Owner phone not found in storage');
        setLoading(false);
        return;
      }
      setOwnerPhone(phone);

      const res = await fetchWithAuth(`${BASE_URL}/api/details/${encodeURIComponent(phone)}/`);
      if (res.ok) {
        const data = await res.json();
        setPropertyType(data.property_type || 'hostel');
        setBuildingLayout(data.step3?.building_layout || []);
        setOriginalLayoutSnapshot(data.step3?.building_layout || []);
      } else {
        Alert.alert('Error', 'Failed to fetch building details');
      }
    } catch (error) {
      console.log('Error fetching details:', error);
      Alert.alert('Error', 'An error occurred while loading building details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const payload = {
        building_layout: buildingLayout,
        stay_type: propertyType,
      };

      const res = await fetchWithAuth(`${BASE_URL}/api/update_building_layout/${encodeURIComponent(ownerPhone)}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

if (res.ok) {
        setOriginalLayoutSnapshot(buildingLayout);
        navigation.goBack();
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.error || 'Failed to update building layout');
      }
    } catch (error) {
      console.log('Error updating layout:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

const addFloor = () => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    setBuildingLayout((prevLayout) => {
      const nextFloorNo = prevLayout.length > 0
        ? Math.max(...prevLayout.map(f => f.floorNo)) + 1
        : 1;

      const newFloor = {
        floorNo: nextFloorNo,
        ...(propertyType === 'hostel' && { rooms: [] }),
        ...(propertyType === 'apartment' && { flats: [] }),
        ...(propertyType === 'commercial' && { sections: [] }),
      };

      setExpandedFloor(nextFloorNo);
      return [...prevLayout, newFloor];
    });
  };

  const removeFloor = (floorNo) => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    Alert.alert(
      'Remove Floor',
      `Are you sure you want to remove Floor ${floorNo}? All units on this floor will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = buildingLayout.filter(f => f.floorNo !== floorNo);
            // Re-index floors sequentially
            const reindexed = updated.map((f, idx) => ({
              ...f,
              floorNo: idx + 1,
            }));
            setBuildingLayout(reindexed);
            if (expandedFloor === floorNo) setExpandedFloor(null);
          }
        }
      ]
    );
  };

const addUnit = (floorNo) => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    setBuildingLayout((prevLayout) => prevLayout.map(floor => {
      if (floor.floorNo !== floorNo) return floor;

      if (propertyType === 'hostel') {
        const roomsList = floor.rooms || [];
        const nextRoomNo = roomsList.length > 0 
          ? Math.max(...roomsList.map(r => r.roomNo)) + 1 
          : floorNo * 100 + 1;
        return {
          ...floor,
          rooms: [...roomsList, { roomNo: nextRoomNo, beds: 1 }]
        };
      } else if (propertyType === 'apartment') {
        const flatsList = floor.flats || [];
        const nextFlatNo = flatsList.length > 0 
          ? Math.max(...flatsList.map(f => f.flatNo)) + 1 
          : floorNo * 100 + 1;
        return {
          ...floor,
          flats: [...flatsList, { flatNo: nextFlatNo, bhk: 1 }]
        };
      } else {
        const sectionsList = floor.sections || [];
        const nextSectionNo = sectionsList.length > 0 
          ? Math.max(...sectionsList.map(s => s.sectionNo)) + 1 
          : floorNo * 100 + 1;
        return {
          ...floor,
          sections: [...sectionsList, { sectionNo: nextSectionNo, area_sqft: null }]
        };
      }
    }));
  };

const removeUnit = (floorNo, unitKey, unitValue) => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    setBuildingLayout((prevLayout) => prevLayout.map(floor => {
      if (floor.floorNo !== floorNo) return floor;

      if (propertyType === 'hostel') {
        return {
          ...floor,
          rooms: (floor.rooms || []).filter(r => r.roomNo !== unitValue)
        };
      } else if (propertyType === 'apartment') {
        return {
          ...floor,
          flats: (floor.flats || []).filter(f => f.flatNo !== unitValue)
        };
      } else {
        return {
          ...floor,
          sections: (floor.sections || []).filter(s => s.sectionNo !== unitValue)
        };
      }
    }));
  };

const updateUnitValue = (floorNo, unitValue, field, change) => {
    setBuildingLayout((prevLayout) => prevLayout.map(floor => {
      if (floor.floorNo !== floorNo) return floor;

      if (propertyType === 'hostel') {
        return {
          ...floor,
          rooms: (floor.rooms || []).map(r => {
            if (r.roomNo !== unitValue) return r;
            return { ...r, [field]: Math.max(1, Math.min(10, r[field] + change)) };
          })
        };
      } else if (propertyType === 'apartment') {
        return {
          ...floor,
          flats: (floor.flats || []).map(f => {
            if (f.flatNo !== unitValue) return f;
            return { ...f, [field]: Math.max(1, Math.min(10, f[field] + change)) };
          })
        };
      } else {
    return floor;
}
    }));
  };



  const openAreaModal = (floorNo, sectionNo, currentArea) => {
    if (isReadOnly) {
      Alert.alert("Maintenance Mode", "This action is temporarily unavailable during scheduled maintenance. You can continue to browse other parts of the application.");
      return;
    }
    setAreaModalFloorNo(floorNo);
    setAreaModalSectionNo(sectionNo);
    setAreaModalInput(currentArea ? String(currentArea) : '');
    setAreaModalVisible(true);
  };

  const handleSaveArea = () => {
    const num = parseInt(areaModalInput, 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid area in sq.ft');
      return;
    }
    setBuildingLayout((prevLayout) => prevLayout.map(floor => {
      if (floor.floorNo !== areaModalFloorNo) return floor;
      return {
        ...floor,
        sections: (floor.sections || []).map(s =>
          s.sectionNo === areaModalSectionNo ? { ...s, area_sqft: num } : s
        ),
      };
    }));
    setAreaModalVisible(false);
    setAreaModalInput('');
    setAreaModalFloorNo(null);
    setAreaModalSectionNo(null);
  };





  const toggleFloorExpand = (floorNo) => {
    setExpandedFloor(expandedFloor === floorNo ? null : floorNo);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading building layout...</Text>
      </View>
    );
  }

  if (isConnected === false && buildingLayout.length === 0) {
    return <OfflineView />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5F259F" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setBuildingLayout(originalLayoutSnapshot);
            setExpandedFloor(null);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Building Structure</Text>
        <TouchableOpacity
          onPress={() => {
            setBuildingLayout(originalLayoutSnapshot);
            setExpandedFloor(null);
            navigation.goBack();
          }}
          style={{ paddingHorizontal: 8, paddingVertical: 8 }}
        >
          <Text style={{ color: COLORS.ERROR, fontWeight: '700', fontSize: 14 }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.infoText}>
            Customize your building layout here. Add or remove floors, and update the capacity/structure of individual rooms or sections.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Floors & Units Layout ({propertyType.toUpperCase()})</Text>

        {buildingLayout.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No floors set up yet.</Text>
            <TouchableOpacity style={styles.addFloorBtnInline} onPress={addFloor}>
              <Text style={styles.addFloorBtnText}>Add First Floor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          buildingLayout.map((floor) => {
            const isExpanded = expandedFloor === floor.floorNo;
            const unitsCount = propertyType === 'hostel' 
              ? floor.rooms?.length || 0 
              : propertyType === 'apartment' 
              ? floor.flats?.length || 0 
              : floor.sections?.length || 0;

            return (
              <View key={floor.floorNo} style={styles.floorCard}>
                <TouchableOpacity 
                  style={styles.floorHeader} 
                  onPress={() => toggleFloorExpand(floor.floorNo)}
                  activeOpacity={0.7}
                >
                  <View style={styles.floorHeaderLeft}>
                    <Ionicons name="layers-outline" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.floorName}>Floor {floor.floorNo}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unitsCount} {propertyType === 'hostel' ? 'Rooms' : propertyType === 'apartment' ? 'Flats' : 'Sections'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.floorHeaderRight}>
                    <TouchableOpacity 
                      style={styles.deleteFloorIcon} 
                      onPress={() => removeFloor(floor.floorNo)}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
                    </TouchableOpacity>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.floorDetails}>
                    {/* Units list */}
                    {propertyType === 'hostel' && (floor.rooms || []).map((room) => (
                      <View key={room.roomNo} style={styles.unitRow}>
                        <View style={styles.unitInfo}>
                          <Ionicons name="bed-outline" size={18} color="#4B5563" />
                          <Text style={styles.unitLabel}>Room {room.roomNo}</Text>
                        </View>
                        <View style={styles.unitActions}>
                          <Text style={styles.sharingLabel}>Beds:</Text>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => updateUnitValue(floor.floorNo, room.roomNo, 'beds', -1)}
                          >
                            <Text style={styles.qtyBtnText} allowFontScaling={false}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{room.beds}</Text>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => updateUnitValue(floor.floorNo, room.roomNo, 'beds', 1)}
                          >
                            <Text style={styles.qtyBtnText} allowFontScaling={false}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteUnitBtn} 
                            onPress={() => removeUnit(floor.floorNo, 'roomNo', room.roomNo)}
                          >
                            <Ionicons name="close-circle-outline" size={20} color={COLORS.ERROR} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {propertyType === 'apartment' && (floor.flats || []).map((flat) => (
                      <View key={flat.flatNo} style={styles.unitRow}>
                        <View style={styles.unitInfo}>
                          <Ionicons name="home-outline" size={18} color="#4B5563" />
                          <Text style={styles.unitLabel}>Flat {flat.flatNo}</Text>
                        </View>
                        <View style={styles.unitActions}>
                          <Text style={styles.sharingLabel}>BHK:</Text>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => updateUnitValue(floor.floorNo, flat.flatNo, 'bhk', -1)}
                          >
                            <Text style={styles.qtyBtnText} allowFontScaling={false}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{flat.bhk}</Text>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => updateUnitValue(floor.floorNo, flat.flatNo, 'bhk', 1)}
                          >
                            <Text style={styles.qtyBtnText} allowFontScaling={false}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteUnitBtn} 
                            onPress={() => removeUnit(floor.floorNo, 'flatNo', flat.flatNo)}
                          >
                            <Ionicons name="close-circle-outline" size={20} color={COLORS.ERROR} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {propertyType === 'commercial' && (floor.sections || []).map((section) => (
  <View key={section.sectionNo} style={styles.unitRow}>
    <View style={styles.unitInfo}>
      <Ionicons name="business-outline" size={18} color="#4B5563" />
      <Text style={styles.unitLabel}>Section {section.sectionNo}</Text>
    </View>
    <View style={styles.unitActions}>
      <TouchableOpacity
        style={styles.areaEditBtn}
        activeOpacity={0.7}
        onPress={() => openAreaModal(floor.floorNo, section.sectionNo, section.area_sqft)}
      >
        <Ionicons name="resize-outline" size={14} color={COLORS.PRIMARY} style={{ marginRight: 6 }} />
        <Text style={styles.areaEditBtnText}>
          {section.area_sqft ? `${section.area_sqft} sq.ft` : 'Set Area'}
        </Text>
        <Ionicons name="pencil" size={12} color={COLORS.PRIMARY} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteUnitBtn} 
        onPress={() => removeUnit(floor.floorNo, 'sectionNo', section.sectionNo)}
      >
        <Ionicons name="close-circle-outline" size={20} color={COLORS.ERROR} />
      </TouchableOpacity>
    </View>
  </View>
))}

                    <TouchableOpacity style={styles.addUnitBtn} onPress={() => addUnit(floor.floorNo)}>
                      <Ionicons name="add" size={16} color={COLORS.PRIMARY} />
                      <Text style={styles.addUnitBtnText}>
                        Add {propertyType === 'hostel' ? 'Room' : propertyType === 'apartment' ? 'Flat' : 'Section'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {buildingLayout.length > 0 && (
          <TouchableOpacity style={styles.addFloorBtn} onPress={addFloor}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addFloorText}>Add Floor</Text>
          </TouchableOpacity>
        )}
</ScrollView>

      <Modal
        visible={areaModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAreaModalVisible(false)}
      >
        <View style={styles.areaModalOverlay}>
          <View style={styles.areaModalCard}>
            <Text style={styles.areaModalTitle}>
              {areaModalSectionNo !== null ? `Section ${areaModalSectionNo} Area` : 'Set Area'}
            </Text>
            <Text style={styles.areaModalSubLabel}>Enter Area (sq.ft)</Text>
            <TextInput
              placeholder="e.g. 500"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={areaModalInput}
              onChangeText={(v) => setAreaModalInput(v.replace(/[^0-9]/g, ''))}
              autoFocus
              style={styles.areaModalInput}
            />
            <View style={styles.areaModalActions}>
              <TouchableOpacity
                onPress={() => { setAreaModalVisible(false); setAreaModalInput(''); }}
                style={styles.areaModalCancelBtn}
              >
                <Text style={styles.areaModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveArea} style={styles.areaModalSaveBtn}>
                <Text style={styles.areaModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, (saving || isReadOnly) && styles.saveBtnDisabled]} 
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4C1D95',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  addFloorBtnInline: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addFloorBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  floorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FDFDFD',
  },
  floorHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  floorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteFloorIcon: {
    padding: 6,
    marginRight: 12,
  },
  floorDetails: {
    padding: 16,
    backgroundColor: '#FAFAF9',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
unitRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    flexShrink: 1,
  },
unitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    paddingRight: 4,
    columnGap: 6,
    rowGap: 6,
    width: '100%',
    flexShrink: 1,
  },
sharingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
    flexShrink: 0,
  },
qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
qtyText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 0,
  },
  deleteUnitBtn: {
    padding: 6,
    marginLeft: 8,
  },
  addUnitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addUnitBtnText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: 6,
  },
  addFloorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addFloorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
areaEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    flexShrink: 1,
    maxWidth: '70%',
  },
  areaEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  areaModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  areaModalCard: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    elevation: 12,
  },
  areaModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  areaModalSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  areaModalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
  },
  areaModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  areaModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  areaModalCancelText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  areaModalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
  },
  areaModalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
