import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLanguage } from '../src/utils/LanguageContext';

const { width, height } = Dimensions.get('window');

// Comprehensive Predefined Indian Locations (covering all canonical aliases & neighborhoods in the app)
const LOCATION_DATA = {
  states: ['Telangana', 'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Andhra Pradesh', 'Kerala', 'Goa', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana'],
  cities: {
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Karnataka': ['Bengaluru', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Rajahmundry'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Kanpur', 'Agra', 'Varanasi'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Gwalior', 'Jabalpur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panchkula', 'Ambala', 'Karnal'],
  },
  areas: {
    // Telangana
    'Hyderabad': ['Madhapur', 'Gachibowli', 'Kondapur', 'Kukatpally', 'Jubilee Hills', 'Banjara Hills', 'Ameerpet', 'Miyapur', 'Begumpet', 'Durgam Cheruvu', 'Hitec City'],
    'Warangal': ['Hanamkonda', 'Kazipet', 'Subedari', 'Naimnagar'],
    // Karnataka
    'Bengaluru': ['Whitefield', 'Marathahalli', 'Indiranagar', 'Koramangala', 'Jayanagar', 'Electronic City', 'Hebbal', 'HSR Layout', 'Sarjapur', 'Bellandur', 'BTM Layout'],
    // Maharashtra
    'Mumbai': ['Andheri', 'Bandra', 'Dadar', 'Borivali', 'Thane', 'Kurla', 'Juhu', 'Powai'],
    'Pune': ['Hinjewadi', 'Baner', 'Kothrud', 'Hadapsar', 'Wakad', 'Viman Nagar'],
    // Delhi
    'New Delhi': ['Connaught Place', 'Lajpat Nagar', 'Rohini', 'Dwarka', 'Saket', 'Hauz Khas'],
    // Tamil Nadu
    'Chennai': ['T Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Porur', 'OMR'],
    // Andhra Pradesh
    'Visakhapatnam': ['Gajuwaka', 'Madhurawada', 'Dwarka Nagar', 'MVP Colony', 'Siripuram'],
    'Vijayawada': ['Benz Circle', 'One Town', 'Patamata', 'Moghalrajpuram'],
    'Tirupati': ['Balaji Colony', 'Bairagipatteda', 'MR Palli', 'Tiruchanur'],
    // Kerala
    'Kochi': ['Ernakulam', 'Kakkanad', 'Edappally', 'Fort Kochi', 'Vytila', 'Aluva'],
    'Thiruvananthapuram': ['Technopark', 'Kazhakkoottam', 'Kovalam', 'Pattam', 'Vazhuthacaud'],
    // Goa
    'Panaji': ['Miramar', 'Dona Paula', 'Altinho', 'Campal'],
    'Margao': ['Fatorda', 'Aquem', 'Borda', 'Gogol'],
    // Gujarat
    'Ahmedabad': ['Satellite', 'C G Road', 'Bopal', 'Bodakdev', 'Prahlad Nagar', 'Vastrapur'],
    'Surat': ['Adajan', 'Piplod', 'Vesu', 'Varachha', 'Katargam'],
    // Rajasthan
    'Jaipur': ['Malviya Nagar', 'Vaishali Nagar', 'C Scheme', 'Mansarovar', 'Jagatpura'],
    'Jodhpur': ['Sardarpura', 'Shastri Nagar', 'Ratanada', 'Paota'],
    // Uttar Pradesh
    'Lucknow': ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Charbagh'],
    'Noida': ['Sector 62', 'Sector 15', 'Sector 18', 'Sector 50', 'Sector 137'],
    // Madhya Pradesh
    'Indore': ['Vijay Nagar', 'Palasia', 'Rajendra Nagar', 'Bhanwarkuan'],
    'Bhopal': ['Arera Colony', 'MP Nagar', 'Kolar Road', 'Indrapuri'],
    // Punjab
    'Ludhiana': ['Sarabha Nagar', 'Model Town', 'Ferozepur Road', 'Civil Lines'],
    'Amritsar': ['Ranjit Avenue', 'Lawrence Road', 'Golden Temple Area', 'Mall Road'],
    // Haryana
    'Gurugram': ['DLF Phase 3', 'Sector 45', 'Sohna Road', 'Golf Course Road', 'Sector 56'],
    'Faridabad': ['Sector 15', 'Sector 21', 'Sector 37', 'Green Fields'],
  }
};

const AMENITIES_LIST = [
  { name: 'WiFi', icon: 'wifi-outline', library: 'Ionicons' },
  { name: 'Parking', icon: 'alpha-p-circle-outline', library: 'MaterialCommunityIcons' },
  { name: 'AC', icon: 'snowflake', library: 'MaterialCommunityIcons' },
  { name: 'Gym', icon: 'dumbbell', library: 'MaterialCommunityIcons' },
  { name: 'Security', icon: 'shield-checkmark-outline', library: 'Ionicons' },
  { name: 'Laundry', icon: 'washing-machine', library: 'MaterialCommunityIcons' },
  { name: 'Power Backup', icon: 'flash-outline', library: 'Ionicons' },
  { name: 'Elevator', icon: 'elevator-passenger-outline', library: 'MaterialCommunityIcons' },
  { name: 'CCTV', icon: 'cctv', library: 'MaterialCommunityIcons' },
];

const CATEGORIES = [
  { name: 'All', icon: 'apps', library: 'MaterialCommunityIcons' },
  { name: 'Hostel', icon: 'bed-outline', library: 'Ionicons' },
  { name: 'Apartment', icon: 'business-outline', library: 'Ionicons' },
  { name: 'Commercial', icon: 'storefront-outline', library: 'Ionicons' },
];

const DISTANCES = [
  { km: 5, label: '5 KM', sub: 'Within 5 KM' },
  { km: 10, label: '10 KM', sub: 'Within 10 KM' },
  { km: 20, label: '20 KM', sub: 'Within 20 KM' },
  { km: 50, label: '50 KM', sub: 'Within 50 KM' },
];

const SORT_OPTIONS = [
  'Recommended',
  'Price Low-High',
  'Price High-Low',
  'Nearest First',
];

const FilterBottomSheet = forwardRef(({ onApply, onReset, allProperties = [], screenType = 'Home' }, ref) => {
  const { t } = useLanguage();
  // Bottom Sheet Visibility
  const [visible, setVisible] = useState(false);

  // States
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [distance, setDistance] = useState(null);
  const [category, setCategory] = useState('All');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [priceSliderValue, setPriceSliderValue] = useState(100000);
  const [sortBy, setSortBy] = useState('Recommended');

  // Screen-specific sub-filters
  const [selectedHostelType, setSelectedHostelType] = useState('');
  const [selectedBhkType, setSelectedBhkType] = useState('');
  const [selectedCommercialType, setSelectedCommercialType] = useState('');

  // Modal Selection Selector
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState(''); // 'state', 'city', 'area', 'minPrice', 'maxPrice', 'sortBy'
  const [selectorSearch, setSelectorSearch] = useState('');

  // Extract Dynamic Locations from active properties to merge with static values
  const dynamicLocations = useMemo(() => {
    const states = new Set();
    const cityMap = {}; // state -> Set of cities
    const areaMap = {}; // city -> Set of areas

    allProperties.forEach(p => {
      if (p.address) {
        let parts = p.address.split(',')
          .map(s => s.replace(/\b\d{6}\b/g, '').trim())
          .filter(s => s.length > 0);

        if (parts.length > 0 && parts[parts.length - 1].toLowerCase() === 'india') {
          parts.pop();
        }
        
        if (parts.length >= 3) {
          const stateVal = parts[parts.length - 1];
          const cityVal = parts[parts.length - 2];
          const areaVal = parts[parts.length - 3];
          
          states.add(stateVal);
          
          if (!cityMap[stateVal]) cityMap[stateVal] = new Set();
          cityMap[stateVal].add(cityVal);
          
          if (!areaMap[cityVal]) areaMap[cityVal] = new Set();
          areaMap[cityVal].add(areaVal);
        } else if (parts.length === 2) {
          const stateVal = parts[parts.length - 1];
          const cityVal = parts[parts.length - 2];
          
          states.add(stateVal);
          
          if (!cityMap[stateVal]) cityMap[stateVal] = new Set();
          cityMap[stateVal].add(cityVal);
        }
      }
    });

    const cityMapArr = {};
    Object.entries(cityMap).forEach(([k, v]) => {
      cityMapArr[k] = Array.from(v);
    });

    const areaMapArr = {};
    Object.entries(areaMap).forEach(([k, v]) => {
      areaMapArr[k] = Array.from(v);
    });

    return {
      states: Array.from(states),
      cities: cityMapArr,
      areas: areaMapArr
    };
  }, [allProperties]);

  // Combined Location lists
  const availableStates = useMemo(() => {
    const combined = new Set([...LOCATION_DATA.states, ...dynamicLocations.states]);
    return Array.from(combined).sort();
  }, [dynamicLocations.states]);

  const availableCities = useMemo(() => {
    if (!selectedState) return [];
    const staticCities = LOCATION_DATA.cities[selectedState] || [];
    const dynCities = dynamicLocations.cities[selectedState] || [];
    const combined = new Set([...staticCities, ...dynCities]);
    return Array.from(combined).sort();
  }, [selectedState, dynamicLocations.cities]);

  const availableAreas = useMemo(() => {
    if (!selectedCity) return [];
    const staticAreas = LOCATION_DATA.areas[selectedCity] || [];
    const dynAreas = dynamicLocations.areas[selectedCity] || [];
    const combined = new Set([...staticAreas, ...dynAreas]);
    return Array.from(combined).sort();
  }, [selectedCity, dynamicLocations.areas]);

  useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss: () => setVisible(false),
  }));

  const handleAmenityToggle = (amenityName) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityName)
        ? prev.filter(a => a !== amenityName)
        : [...prev, amenityName]
    );
  };

  const handleApply = () => {
    onApply?.({
      state: selectedState,
      city: selectedCity,
      area: selectedArea,
      distance: distance,
      category: category,
      amenities: selectedAmenities,
      minPrice: null,
      maxPrice: priceSliderValue < 100000 ? priceSliderValue : null,
      sortBy: sortBy,
      hostelType: selectedHostelType,
      bhkType: selectedBhkType,
      commercialType: selectedCommercialType,
    });
    setVisible(false);
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedArea('');
    setDistance(null);
    setCategory('All');
    setSelectedAmenities([]);
    setPriceSliderValue(100000);
    setSortBy('Recommended');
    setSelectedHostelType('');
    setSelectedBhkType('');
    setSelectedCommercialType('');
    onReset?.();
  };

  const handleSelectType = (type) => {
    if (category === type) {
      setCategory('All');
    } else {
      setCategory(type);
    }
  };

  // Open Selector list modal
  const openSelector = (type) => {
    setSelectorType(type);
    setSelectorSearch('');
    setSelectorVisible(true);
  };

  // Selector Data
  const selectorData = useMemo(() => {
    let list = [];
    if (selectorType === 'state') list = availableStates;
    else if (selectorType === 'city') list = availableCities;
    else if (selectorType === 'area') list = availableAreas;
    else if (selectorType === 'sortBy') list = SORT_OPTIONS;

    if (selectorSearch.trim()) {
      return list.filter(item => item.toLowerCase().includes(selectorSearch.toLowerCase()));
    }
    return list;
  }, [selectorType, selectorSearch, availableStates, availableCities, availableAreas]);

  const handleSelect = (item) => {
    if (selectorType === 'state') {
      setSelectedState(item);
      setSelectedCity('');
      setSelectedArea('');
    } else if (selectorType === 'city') {
      setSelectedCity(item);
      setSelectedArea('');
    } else if (selectorType === 'area') {
      setSelectedArea(item);
    } else if (selectorType === 'sortBy') {
      setSortBy(item);
    }
    setSelectorVisible(false);
  };

  return (
    <>
      {/* Sliding Sheet Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          {/* Dismiss sheet when tapping the backdrop area */}
          <TouchableWithoutFeedback onPress={() => setVisible(false)}>
            <View style={styles.backdropSpacer} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetContainer}>
            <LinearGradient
              colors={['#ffffff', '#fcfaff', '#f8f4ff']}
              style={styles.sheetGradient}
            >
              {/* Draggable indicator bar */}
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.filterIconBg}>
                    <Ionicons name="options-outline" size={20} color="#6C63FF" />
                  </View>
                  <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{t("filters") || t("filter") || "Filters"}</Text>
                    <Text style={styles.headerSubtitle}>{t("find_perfect_space") || "Find your perfect space"}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setVisible(false)}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* 1. STATE */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("state") || "State"}</Text>
                  <TouchableOpacity
                    style={styles.dropdownInput}
                    onPress={() => openSelector('state')}
                  >
                    <View style={styles.dropdownLeft}>
                      <Ionicons name="location-outline" size={18} color="#6C63FF" style={styles.inputIcon} />
                      <Text style={[styles.inputText, !selectedState && styles.placeholderText]}>
                        {selectedState || (t('select_state') || 'Select State')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* 2. CITY */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("city") || "City"}</Text>
                  <TouchableOpacity
                    style={[styles.dropdownInput, !selectedState && styles.disabledInput]}
                    disabled={!selectedState}
                    onPress={() => openSelector('city')}
                  >
                    <View style={styles.dropdownLeft}>
                      <Ionicons name="location-outline" size={18} color={selectedState ? '#6C63FF' : '#ccc'} style={styles.inputIcon} />
                      <Text style={[styles.inputText, !selectedCity && styles.placeholderText]}>
                        {selectedCity || (selectedState ? (t('select_city') || 'Select City') : (t('select_state_first') || 'Select State first'))}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* 3. AREA */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("area") || "Area"}</Text>
                  <TouchableOpacity
                    style={[styles.dropdownInput, !selectedCity && styles.disabledInput]}
                    disabled={!selectedCity}
                    onPress={() => openSelector('area')}
                  >
                    <View style={styles.dropdownLeft}>
                      <Ionicons name="location-outline" size={18} color={selectedCity ? '#6C63FF' : '#ccc'} style={styles.inputIcon} />
                      <Text style={[styles.inputText, !selectedArea && styles.placeholderText]}>
                        {selectedArea || (selectedCity ? (t('select_area') || 'Select Area') : (t('select_city_first') || 'Select City first'))}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* 4. DISTANCE */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("nearby_distance") || "Near By (Distance)"}</Text>
                  <View style={styles.distanceGrid}>
                    {DISTANCES.map((item) => {
                      const active = distance === item.km;
                      return (
                        <TouchableOpacity
                          key={item.km}
                          style={[styles.distanceCard, active && styles.distanceCardActive]}
                          onPress={() => setDistance(distance === item.km ? null : item.km)}
                        >
                          {active && (
                            <View style={styles.activeCheckBadge}>
                              <Ionicons name="checkmark-sharp" size={10} color="#fff" />
                            </View>
                          )}
                          <View style={styles.distanceHeader}>
                            <Ionicons
                              name="locate"
                              size={18}
                              color={active ? '#6C63FF' : '#999'}
                            />
                            <Text style={[styles.distanceLabel, active && styles.distanceLabelActive]}>
                              {item.km} {t("km") || "KM"}
                            </Text>
                          </View>
                          <Text style={[styles.distanceSub, active && styles.distanceSubActive]}>
                            {t("within_km", { count: item.km }) || `Within ${item.km} KM`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 5. DYNAMIC CATEGORY/SUB-FILTERS */}
                {(!screenType || screenType === 'Home') && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("category") || "Category"}</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((item) => {
                        const active = category === item.name;
                        return (
                          <TouchableOpacity
                            key={item.name}
                            style={[styles.categoryCard, active && styles.categoryCardActive]}
                            onPress={() => setCategory(item.name)}
                          >
                            {item.library === 'MaterialCommunityIcons' ? (
                              <MaterialCommunityIcons
                                name={item.icon}
                                size={24}
                                color={active ? '#6C63FF' : '#555'}
                              />
                            ) : (
                              <Ionicons
                                name={item.icon}
                                size={24}
                                color={active ? '#6C63FF' : '#555'}
                              />
                            )}
                            <Text style={[styles.categoryCardText, active && styles.categoryCardTextActive]}>
                              {t(item.name.toLowerCase()) || item.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {screenType === 'Hostel' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("hostel_type") || "Hostel Type"}</Text>
                    <View style={styles.categoryGrid}>
                      {['Boys', 'Girls', 'Coliving'].map((item) => {
                        const active = selectedHostelType === item;
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[styles.categoryCard, active && styles.categoryCardActive]}
                            onPress={() => setSelectedHostelType(selectedHostelType === item ? '' : item)}
                          >
                            <Ionicons
                              name={item === 'Boys' ? 'male-outline' : item === 'Girls' ? 'female-outline' : 'people-outline'}
                              size={24}
                              color={active ? '#6C63FF' : '#555'}
                            />
                            <Text style={[styles.categoryCardText, active && styles.categoryCardTextActive]}>
                              {t(item.toLowerCase()) || item}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {screenType === 'Apartment' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("bhk_type") || "BHK Type"}</Text>
                    <View style={styles.categoryGrid}>
                      {['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'].map((item) => {
                        const active = selectedBhkType === item;
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.categoryCard, 
                              active && styles.categoryCardActive,
                              { width: (width - 64) / 3 }
                            ]}
                            onPress={() => setSelectedBhkType(selectedBhkType === item ? '' : item)}
                          >
                            <MaterialCommunityIcons
                              name="home-outline"
                              size={24}
                              color={active ? '#6C63FF' : '#555'}
                            />
                            <Text style={[styles.categoryCardText, active && styles.categoryCardTextActive]}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {screenType === 'Commercial' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t("space_type") || "Space Type"}</Text>
                    <View style={styles.categoryGrid}>
                      {['Office', 'Shop', 'Coworking', 'Warehouse'].map((item) => {
                        const active = selectedCommercialType === item;
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[styles.categoryCard, active && styles.categoryCardActive]}
                            onPress={() => setSelectedCommercialType(selectedCommercialType === item ? '' : item)}
                          >
                            <MaterialCommunityIcons
                              name={item === 'Office' ? 'briefcase-outline' : item === 'Shop' ? 'storefront-outline' : item === 'Coworking' ? 'account-group-outline' : 'warehouse'}
                              size={24}
                              color={active ? '#6C63FF' : '#555'}
                            />
                            <Text style={[styles.categoryCardText, active && styles.categoryCardTextActive]}>
                              {t(item.toLowerCase()) || item}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* 6. AMENITIES */}
                <View style={styles.section}>
                  <View style={styles.amenitiesHeadingRow}>
                    <Text style={styles.sectionTitle}>{t("facilities") || t("amenities") || "Amenities"}</Text>
                    <TouchableOpacity onPress={() => {}}>
                      <Text style={styles.seeAllText}>{t("see_all") || "See All"} &gt;</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.amenitiesGrid}>
                    {AMENITIES_LIST.map((item) => {
                      const active = selectedAmenities.includes(item.name);
                      return (
                        <TouchableOpacity
                          key={item.name}
                          style={[styles.amenityPill, active && styles.amenityPillActive]}
                          onPress={() => handleAmenityToggle(item.name)}
                        >
                          <View style={styles.amenityRow}>
                            {item.library === 'MaterialCommunityIcons' ? (
                              <MaterialCommunityIcons
                                name={item.icon}
                                size={16}
                                color={active ? '#6C63FF' : '#555'}
                                style={styles.amenityIcon}
                              />
                            ) : (
                              <Ionicons
                                name={item.icon}
                                size={16}
                                color={active ? '#6C63FF' : '#555'}
                                style={styles.amenityIcon}
                              />
                            )}
                            <Text style={[styles.amenityText, active && styles.amenityTextActive]}>
                              {t(item.name.toLowerCase()?.replace(/\s+/g, '_')) || item.name}
                            </Text>
                            {active && (
                              <View style={styles.pillCheckBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#6C63FF" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 7. PRICE SLIDER */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("price_range") || "Price Range"}</Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={100000}
                    step={1000}
                    value={priceSliderValue}
                    onValueChange={(val) => setPriceSliderValue(val)}
                    minimumTrackTintColor="#6C63FF"
                    maximumTrackTintColor="#DDD"
                    thumbTintColor="#6C63FF"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabelText}>₹ 0</Text>
                    <Text style={styles.sliderLabelText}>
                      {priceSliderValue === 100000 ? '₹ 1,00,000+' : `₹ ${priceSliderValue.toLocaleString('en-IN')}`}
                    </Text>
                  </View>
                </View>

                {/* 8. SORT BY */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("sort_by") || "Sort By"}</Text>
                  <TouchableOpacity
                    style={styles.dropdownInput}
                    onPress={() => openSelector('sortBy')}
                  >
                    <View style={styles.dropdownLeft}>
                      <Ionicons name="swap-vertical-outline" size={18} color="#6C63FF" style={styles.inputIcon} />
                      <Text style={styles.inputText}>
                        {t(sortBy?.toLowerCase()?.replace(/\s+/g, '_')?.replace('-', '_')) || sortBy}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Action Footer Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={handleReset}
                >
                  <Ionicons name="refresh-outline" size={18} color="#6C63FF" style={{ marginRight: 6 }} />
                  <Text style={styles.resetBtnText}>{t("reset_all") || "Reset All"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleApply}
                >
                  <LinearGradient
                    colors={['#8A7BFF', '#6C63FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    <Ionicons name="options-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.applyBtnText}>{t("apply_filters") || "Apply Filters"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Bottom Selector Modal */}
      <Modal
        visible={selectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectorVisible(false)}
        >
          <View style={styles.selectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>
                {selectorType === 'state' ? (t('select_state') || 'Select State') :
                 selectorType === 'city' ? (t('select_city') || 'Select City') :
                 selectorType === 'area' ? (t('select_area') || 'Select Area') : (t('sort_by') || 'Sort By')}
              </Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Search Input for lists */}
            {['state', 'city', 'area'].includes(selectorType) && (
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t("search_item_placeholder") || "Search item..."}
                  placeholderTextColor="#999"
                  value={selectorSearch}
                  onChangeText={setSelectorSearch}
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={selectorData}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                let active = false;
                if (selectorType === 'state') active = selectedState === item;
                else if (selectorType === 'city') active = selectedCity === item;
                else if (selectorType === 'area') active = selectedArea === item;
                else if (selectorType === 'sortBy') active = sortBy === item;

                return (
                  <TouchableOpacity
                    style={[styles.selectorItem, active && styles.selectorItemActive]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[styles.selectorItemText, active && styles.selectorItemTextActive]}>
                      {selectorType === 'sortBy' ? (t(item?.toLowerCase()?.replace(/\s+/g, '_')?.replace('-', '_')) || item) : item}
                    </Text>
                    {active && <Ionicons name="checkmark-sharp" size={18} color="#6C63FF" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
});

export default FilterBottomSheet;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdropSpacer: {
    flex: 1,
  },
  sheetContainer: {
    height: height * 0.9,
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  sheetGradient: {
    flex: 1,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0eaff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 140,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    opacity: 0.7,
  },
  distanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  distanceCard: {
    backgroundColor: '#fff',
    width: (width - 60) / 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  distanceCardActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  activeCheckBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 6,
  },
  distanceLabelActive: {
    color: '#6C63FF',
  },
  distanceSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  distanceSubActive: {
    color: '#8B5CF6',
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryCardActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  categoryCardText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 6,
  },
  categoryCardTextActive: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  amenitiesHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C63FF',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityPill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  amenityPillActive: {
    borderColor: '#C7D2FE',
    backgroundColor: '#F5F3FF',
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityIcon: {
    marginRight: 6,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  amenityTextActive: {
    color: '#6C63FF',
  },
  pillCheckBadge: {
    marginLeft: 6,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  priceSelectorSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  priceSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  priceSeparator: {
    fontSize: 16,
    color: '#9CA3AF',
    marginHorizontal: 12,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6C63FF',
  },
  applyBtn: {
    flex: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  selectorContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.7,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    padding: 0,
  },
  selectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorItemActive: {
    backgroundColor: '#F9FAFB',
  },
  selectorItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  selectorItemTextActive: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});