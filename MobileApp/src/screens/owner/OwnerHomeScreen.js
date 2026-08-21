
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { BookingContext } from "@/src/context/BookingContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useContext } from "react";
import { useWindowDimensions } from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import COLORS from "@/src/theme/colors";
import { useMaintenance } from "../../context/MaintenanceContext";
import * as Notifications from "../../utils/NotificationsProxy";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { OwnerAccountContext } from "@/src/context/OwnerAccountContext";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import { WebView } from "react-native-webview";
import { useLanguage } from "../../utils/LanguageContext";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const getAvatarBgColor = (name) => {
  const char = (name || "A").charAt(0).toUpperCase();
  const colors = {
    A: "#3B82F6", B: "#10B981", C: "#EF4444", D: "#F59E0B", E: "#8B5CF6",
    F: "#EC4899", G: "#06B6D4", H: "#F97316", I: "#14B8A6", J: "#6366F1",
    K: "#34D399", L: "#FB7185", M: "#60A5FA", N: "#F472B6", O: "#A78BFA",
    P: "#34D399", Q: "#F59E0B", R: "#6C2BD9", S: "#3B82F6", T: "#F43F5E",
    U: "#0EA5E9", V: "#8B5CF6", W: "#10B981", X: "#EF4444", Y: "#F59E0B", Z: "#6C2BD9"
  };
  return colors[char] || "#6C2BD9";
};

// Configuration
const SIDEBAR_WIDTH_RATIO = 0.18; // 18% of screen width
const MAX_SIDEBAR_WIDTH = 75;
const CONTENT_GAP = 10;
const CONTAINER_PADDING = 18;

export default function BuildingScreen({ route }) {
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
  const { t, changeLanguage, language } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [viewMode, setViewMode] = useState("floor");
  const [apartments, setApartments] = useState({});
  const [apartmentCounts, setApartmentCounts] = useState({});

  const navigation = useNavigation();
  const [response_data, setResponseData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editableLayout, setEditableLayout] = useState([]);
  const { unreadNotificationCount, fetchUnreadCount, pendingCount, setRequests, refreshTrigger, setRefreshTrigger } = useContext(BookingContext);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount?.();
    }, [])
  );

  const ownerUnreadCount = unreadNotificationCount || 0;
  const ownerBadgeText = ownerUnreadCount > 99 ? "99+" : `${ownerUnreadCount}`;
  const { selectedAccount } = useContext(OwnerAccountContext);
  const phone = selectedAccount ? selectedAccount.id : (route?.params?.phone || "");
  // const propertyStayType = response_data?.stay_type || "hostel";
  const ownerName = response_data?.owner?.name;
  const ownerPhone = response_data?.owner?.phone;
  const floorsData = response_data?.building_layout;
  // const roomsData = response_data?.building_layout?.flatMap(floor => floor.rooms);
  const roomsData =
    response_data?.building_layout?.flatMap(floor => floor.rooms || []) || [];

  const bedsData =
    response_data?.building_layout?.flatMap(floor =>
      (floor.rooms || []).flatMap(room => room.beds || [])
    ) || [];
  const { width: windowWidth, height: screenH } = useWindowDimensions();
  const sidebarWidth = Math.max(50, windowWidth * 0.17);
  const availableWidth = windowWidth - sidebarWidth - CONTENT_GAP - (CONTAINER_PADDING * 2);
  const SPACING = 12;
  const snap = availableWidth + SPACING;
  const cardWidth = availableWidth;
  const cardHeight = screenH * 0.58; // Balanced vertical height
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderRef = useRef(null);
  const sidebarRef = useRef(null);
  const editModeRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isManualScroll = useRef(false);
  const sqftInputRefs = useRef({});
  const [filterMode, setFilterMode] = useState(null);
  const [bedCounts, setBedCounts] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tenantName, setTenantName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [tenantPhone, settenantPhone] = useState("");
  const [bedNumber, setBedNumber] = useState(1);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [tenants, setTenants] = useState({});
  const [idProofFile, setIdProofFile] = useState("");
  const [idProofUri, setIdProofUri] = useState("");
  const [hasApp, setHasApp] = useState(true);
  const [aadharId, setAadharId] = useState("");
  const [aadharProofUri, setAadharProofUri] = useState("");
  const [touchedAadharId, setTouchedAadharId] = useState(false);

  // States for scroll tracking, sticky header offset/height, and safe area insets
  const insets = useSafeAreaInsets();
  const [scrollY, setScrollY] = useState(0);
  const [headerY, setHeaderY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(60);
  const [isScrolled, setIsScrolled] = useState(false);

  const pickAadharProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need library permissions to upload Aadhaar proof.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAadharProofUri(result.assets[0].uri);
    }
  };

  const getAbsoluteUri = (uri) => {
    if (!uri) return null;
    if (uri.startsWith("http")) return uri;
    return `${BASE_URL}${uri.startsWith("/") ? "" : "/"}${uri}`;
  };

  const [idPreviewVisible, setIdPreviewVisible] = useState(false);
  const [idPreviewHtml, setIdPreviewHtml] = useState("");
  const [idOpenUri, setIdOpenUri] = useState("");
  const [previewUri, setPreviewUri] = useState("");
  const [showBottomViewId, setShowBottomViewId] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [tenantsListModalVisible, setTenantsListModalVisible] = useState(false);
  const [tenantsList, setTenantsList] = useState([]);
  const [editAll] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [rowEditIndex, setRowEditIndex] = useState(null);
  const [rowEditValues, setRowEditValues] = useState({});
  const [tenantsExpanded, setTenantsExpanded] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [pendingAllotment, setPendingAllotment] = useState(null);
  const [isSavingTenant, setIsSavingTenant] = useState(false);
const [isSavingLayout, setIsSavingLayout] = useState(false);
const [originalLayoutSnapshot, setOriginalLayoutSnapshot] = useState(null);
const [isAddingFloor, setIsAddingFloor] = useState(false);
  const onPinchStateChange = (e) => {
    if (e.nativeEvent.state === State.END) {
      setPreviewScale((prev) => Math.min(3, Math.max(1, prev)));
    }
  };
  const floorPulse = useRef(new Animated.Value(0.8)).current;
  const floorScale = floorPulse.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0.99, 1.01],
  });
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floorPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(floorPulse, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floorPulse]);


  useEffect(() => {
  editModeRef.current = editMode;
}, [editMode]);

useEffect(() => {
    if (route?.params?.editMode !== undefined) {
      setEditMode(route.params.editMode);
      if (route.params.editMode) {
        setViewMode("floor");
        if (response_data?.building_layout) {
          setOriginalLayoutSnapshot(response_data.building_layout);
        } else {
          setOriginalLayoutSnapshot(null);
        }
      }
    }
  }, [route?.params?.editMode, route?.params?.ts]);

  useEffect(() => {
  if (editMode && originalLayoutSnapshot === null && response_data?.building_layout) {
    setOriginalLayoutSnapshot(response_data.building_layout);
  }
}, [response_data, editMode]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!route?.params?.editMode) {
        setViewMode("floor");
      }
    });
    return unsubscribe;
  }, [navigation, route?.params?.editMode]);

  const [touchedName, setTouchedName] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedRent, setTouchedRent] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!phone) return;

    const fetchData = async () => {
      try {
        const detailsRes = await fetchWithAuth(
          `${BASE_URL}/api/details/${encodeURIComponent(phone)}/`
        );
        if (!detailsRes.ok) {
          setResponseData(null);
          return;
        }
        const detailsData = await detailsRes.json();
        setResponseData(detailsData);
        if (!editModeRef.current) {
          setEditableLayout(detailsData.building_layout || detailsData.step3?.building_layout || []);
        }

        if (detailsData.property_type === "hostel") {
          const hostelRes = await fetchWithAuth(
            `${BASE_URL}/api/getbeds/${encodeURIComponent(phone)}/`
          );
          const hostelData = await hostelRes.json();

          if (hostelData.data?.length > 0) {
            const formattedTenants = {};
            const counts = {};

            hostelData.data.forEach((t) => {
              const key = `Floor ${t.floor}-${t.roomno}`;
              if (!formattedTenants[key]) formattedTenants[key] = [];
              formattedTenants[key].push(t);
            });

            Object.keys(formattedTenants).forEach((key) => {
              counts[key] = formattedTenants[key].length;
            });

            setTenants(formattedTenants);
            setBedCounts(counts);
          } else {
            setTenants({});
            setBedCounts({});
          }

        } else if (detailsData.property_type === "apartment") {
          const apartmentRes = await fetchWithAuth(
            `${BASE_URL}/api/getapartmentbeds/${encodeURIComponent(phone)}/`
          );
          const apartmentData = await apartmentRes.json();

          console.log("Apartment API Raw:", apartmentData);

          if (apartmentData.data?.length > 0) {
            const formattedApartments = {};
            const counts = {};

            apartmentData.data.forEach((a) => {
              const key = `Floor ${a.floor}-${a.flatno}`; // Make sure flatno exists in API
              if (!formattedApartments[key]) formattedApartments[key] = [];
              formattedApartments[key].push(a);
            });

            Object.keys(formattedApartments).forEach((key) => {
              counts[key] = formattedApartments[key].length;
            });
            
            setApartments(formattedApartments); // normalized state for deletion
            setApartmentCounts(counts);
          } else {
            setApartments({});
            setApartmentCounts({});
          }

        }

        else if (detailsData.property_type === "commercial") {
          const commercialRes = await fetchWithAuth(
            `${BASE_URL}/api/getcommercialbeds/${encodeURIComponent(phone)}/`
          );
          const commercialData = await commercialRes.json();

          console.log("Commercial API Raw:", commercialData);

          if (commercialData.data?.length > 0) {
            const formattedCommercial = {};
            const counts = {};

            commercialData.data.forEach((c) => {
              const key = `Floor ${c.floor}-${c.sectionNo}`; // ✅ IMPORTANT
              if (!formattedCommercial[key]) formattedCommercial[key] = [];
              formattedCommercial[key].push(c);
            });

            Object.keys(formattedCommercial).forEach((key) => {
              counts[key] = formattedCommercial[key].length;
            });

            // ✅ reuse existing states (no extra changes needed)
            setApartments(formattedCommercial);
            setApartmentCounts(counts);
          } else {
            setApartments({});
            setApartmentCounts({});
          }
        }


      } catch (err) {
        console.log("Fetch Error:", err);
      }
    };

    fetchData();
   }, [phone, refreshTrigger, selectedAccount, isConnected]);

  useEffect(() => {
    if (route.params?.autoFillData) {
      setPendingAllotment(route.params.autoFillData);
    }
  }, [route.params?.autoFillData]);

  const stayType = (response_data?.property_type || "hostel").trim().toLowerCase();

  const dataToRender =
    stayType === "apartment" ? apartments :
      stayType === "commercial" ? apartments :
        tenants;

  const countsToRender =
    stayType === "apartment" ? apartmentCounts :
      stayType === "commercial" ? apartmentCounts :
        bedCounts;

  useEffect(() => {
    if (!modalVisible) {
      setIdProofFile("");
      setIdProofUri("");
      setIdPreviewHtml("");
      setIdPreviewVisible(false);
    }
  }, [modalVisible]);

  useEffect(() => {
    setActiveIndex(0);
    isManualScroll.current = true;
    sliderRef.current?.scrollTo({ x: 0, animated: true });
    setTimeout(() => {
      isManualScroll.current = false;
    }, 350);
  }, [filterMode]);
  const makeRooms = (n) =>
    Array.from(
      { length: n === 1 ? 15 : 4 },
      (_, i) => `${n}${String(i + 1).padStart(2, "0")}`,
    );
  const floors = Array.from({ length: 15 }, (_, i) => {
    const floorNumber = i + 1;
    return { floor: `Floor ${floorNumber}`, rooms: makeRooms(floorNumber) };
  });


  const getUnits = (floor) => {
    if (stayType === "hostel") return floor.rooms || [];
    if (stayType === "apartment") return floor.flats || [];
    if (stayType === "commercial") return [floor];
    return [];
  };
  const activeLayout = editMode ? editableLayout : (response_data?.building_layout || []);

const addFloor = () => {
    if (checkReadOnly() || isAddingFloor) return;
    setIsAddingFloor(true);
    let newIndexToScroll = 0;

    setEditableLayout((prevLayout) => {
      let nextFloorNo = 1;
      if (prevLayout && prevLayout.length > 0) {
        const maxFloor = Math.max(...prevLayout.map(f => f.floorNo));
        nextFloorNo = maxFloor + 1;
      }

      let newFloor = { floorNo: nextFloorNo };
      if (stayType === "hostel") {
        newFloor.rooms = [{ roomNo: 1, beds: 1 }];
      } else if (stayType === "apartment") {
        newFloor.flats = [{ flatNo: `${nextFloorNo}01`, bhk: 1 }];
      } else if (stayType === "commercial") {
        newFloor.sections = [{ sectionNo: 1, area_sqft: null }];
      }

      const newLayout = [...prevLayout, newFloor];
      newIndexToScroll = newLayout.length - 1;
      return newLayout;
    });

    setTimeout(() => {
      setActiveIndex(newIndexToScroll);
      syncSidebar(newIndexToScroll);
      if (sliderRef.current) {
        sliderRef.current.scrollTo({ x: newIndexToScroll * snap, animated: true });
      }
      setIsAddingFloor(false);
    }, 100);
  };

const addUnit = (floorNo) => {
    if (checkReadOnly()) return;
    setEditableLayout((prevLayout) => prevLayout.map(floor => {
      if (floor.floorNo !== floorNo) return floor;

      if (stayType === 'hostel') {
        const roomsList = floor.rooms || [];
        const nextRoomNo = roomsList.length > 0
          ? Math.max(...roomsList.map(r => r.roomNo || 0)) + 1
          : floorNo * 100 + 1;
        return {
          ...floor,
          rooms: [...roomsList, { roomNo: nextRoomNo, beds: 1 }]
        };
      } else if (stayType === 'apartment') {
        const flatsList = floor.flats || [];
        const nextFlatNo = flatsList.length > 0
          ? Math.max(...flatsList.map(f => f.flatNo || 0)) + 1
          : floorNo * 100 + 1;
        return {
          ...floor,
          flats: [...flatsList, { flatNo: nextFlatNo, bhk: 1 }]
        };
      } else {
        const sectionsList = floor.sections || [];
        const nextSectionNo = sectionsList.length > 0
          ? Math.max(...sectionsList.map(s => s.sectionNo || 0)) + 1
          : floorNo * 100 + 1;
        return {
          ...floor,
          sections: [...sectionsList, { sectionNo: nextSectionNo, area_sqft: null }]
        };
      }
}));
  };

const updateUnit = (floorNo, unitLabel, action, value) => {
    if (checkReadOnly()) return;
    setEditableLayout((prevLayout) => prevLayout.map(floor => {
      if (floor.floorNo !== floorNo) return floor;

      if (stayType === 'hostel') {
        let roomsList = floor.rooms || [];
        if (action === 'delete_unit') {
          roomsList = roomsList.filter(r => String(r.roomNo) !== String(unitLabel));
        } else {
          roomsList = roomsList.map(r => {
            if (String(r.roomNo) === String(unitLabel)) {
              const currentBeds = r.beds || 1;
              if (action === 'increment_beds') return { ...r, beds: currentBeds + 1 };
              if (action === 'decrement_beds' && currentBeds > 1) return { ...r, beds: currentBeds - 1 };
            }
            return r;
          });
        }
        return { ...floor, rooms: roomsList };
      } else if (stayType === 'apartment') {
        let flatsList = floor.flats || [];
        if (action === 'delete_unit') {
          flatsList = flatsList.filter(f => String(f.flatNo) !== String(unitLabel));
        } else {
          flatsList = flatsList.map(f => {
            if (String(f.flatNo) === String(unitLabel)) {
              const currentBhk = f.bhk || 1;
              if (action === 'increment_bhk') return { ...f, bhk: Math.min(6, currentBhk + 1) };
              if (action === 'decrement_bhk') return { ...f, bhk: Math.max(1, currentBhk - 1) };
              if (action === 'set_bhk' && value !== undefined) {
                const num = parseInt(value, 10);
                return { ...f, bhk: isNaN(num) ? currentBhk : Math.max(1, Math.min(6, num)) };
              }
            }
            return f;
          });
        }
        return { ...floor, flats: flatsList };
      } else {
        let sectionsList = floor.sections || [];

if (action === "delete_unit") {
    sectionsList = sectionsList.filter(
        s => String(s.sectionNo) !== String(unitLabel)
    );
} else if (action === "set_area" && value !== undefined) {
    sectionsList = sectionsList.map(s => {
        if (String(s.sectionNo) !== String(unitLabel)) {
            return s;
        }

        const num = parseInt(value, 10);

        return {
            ...s,
            area_sqft: isNaN(num) || num <= 0 ? null : num,
        };
    });
}

return {
    ...floor,
    sections: sectionsList,
};
      }
    }));
  };

const removeFloor = (floorNo) => {
    if (checkReadOnly()) return;
    setEditableLayout((prevLayout) => prevLayout.filter(f => f.floorNo !== floorNo));
  };

  const dynamicFloors = (activeLayout || []).map((f) => {
    if (stayType === "hostel") {
      return {
        floor: `Floor ${f.floorNo}`,
        floorNo: f.floorNo,
        units: (f.rooms || []).map((r) => ({
          label: `${f.floorNo}${String(r.roomNo).padStart(2, "0")}`,
          beds: r.beds,
          roomNo: r.roomNo,
        })),
      };
    }

    if (stayType === "apartment") {
      return {
        floor: `Floor ${f.floorNo}`,
        floorNo: f.floorNo,
        units: (f.flats || []).map((fl, idx) => ({
          label: fl.flatNo ? String(fl.flatNo) : `${f.floorNo}${String(idx + 1).padStart(2, "0")}`,
          type: fl?.bhk ? `${fl.bhk} BHK` : "Not Assigned",
          flatNo: fl.flatNo,
          bhk: fl.bhk,
        })),
      };
    }

    if (stayType === "commercial") {
      return {
        floor: `Floor ${f.floorNo}`,
        floorNo: f.floorNo,
        units: (f.sections || []).map((sec, idx) => ({
          id: idx + 1,
          label: `${sec.sectionNo ?? idx + 1}`,
          display: `Section ${sec.sectionNo ?? idx + 1}`,
          area: sec.area_sqft ?? 0,
          sectionNo: sec.sectionNo,
        })),
      };
    }

    return { floor: `Floor ${f.floorNo}`, floorNo: f.floorNo, units: [] };
  }).sort((a, b) => Number(a.floorNo) - Number(b.floorNo)) || [];

  const isOccupied = (floorLabel, unitLabel) => {
    const key = `${floorLabel}-${unitLabel}`;

    let count = 0;
    if (stayType === "hostel") {
      count = bedCounts[key] ?? 0;
    } else if (stayType === "apartment" || stayType === "commercial") {
      count = apartmentCounts[key] ?? 0;
    }
    return count > 0;
  };

  const getCount = (floorLabel, unitLabel) => {
    const key = `${floorLabel}-${unitLabel}`;

    if (stayType === "hostel") {
      return bedCounts[key] ?? 0;
    } else if (stayType === "apartment" || stayType === "commercial") {
      return apartmentCounts[key] ?? 0;
    }
    return 0;
  };

const filteredFloors = editMode
    ? dynamicFloors
    : dynamicFloors.filter((f) => {
        if (filterMode === "occupied") {
          return (f.units || []).some((u) => isOccupied(f.floor, u.label));
        }
        if (filterMode === "empty") {
          return (f.units || []).some((u) => !isOccupied(f.floor, u.label));
        }
        return true;
      });

  const getTileColor = (floorLabel, unitLabel) => {
    const c = getCount(floorLabel, unitLabel);

    // If the unit is occupied, show green regardless of filter mode
    if (c > 0) return "#aaf8c5"; // light green for occupied

    // Apply filter mode colors when a filter is active
    if (filterMode === "occupied") return "#aaf8c5"; // light green
    if (filterMode === "empty") return "#f28f8f"; // light red

    // Default color when no filter and empty
    return "#c0b4f3"; // light violet
  };

  const handleSelectFloor = (idx) => {
    isManualScroll.current = true;
    setActiveIndex(idx);
    sliderRef.current?.scrollTo({
      x: idx * snap,
      animated: true,
    });
  };
  const syncSidebar = (index) => {
    const SIDE_BUTTON_HEIGHT = 44;
    const SIDE_BUTTON_GAP = 12;
    const offset = Math.max(
      0,
      idxToOffset(index, SIDE_BUTTON_HEIGHT, SIDE_BUTTON_GAP) - 100,
    );
    sidebarRef.current?.scrollTo({ y: offset, animated: true });
  };

  useEffect(() => {
    syncSidebar(activeIndex);
  }, [activeIndex]);
  const idxToOffset = (idx, h, g) => idx * (h + g);

  
  const totalRooms = dynamicFloors.reduce(
    (sum, f) => sum + (f.units?.length || 0),
    0
  );

  const totalBedsCount = dynamicFloors.reduce(
    (sum, f) => sum + (f.units || []).reduce((acc, u) => acc + (u.beds || 1), 0),
    0
  );

  const occupiedRooms = dynamicFloors.reduce(
    (sum, f) =>
      sum +
      (f.units || []).filter((u) =>
        isOccupied(f.floor, u.label)
      ).length,
    0
  );

  const occupiedBedsCount = dynamicFloors.reduce(
    (sum, f) =>
      sum +
      (f.units || []).reduce((acc, u) => acc + getCount(f.floor, u.label), 0),
    0
  );
  const handleSave = async (row, idx) => {
    if (checkReadOnly()) return;
    try {
      const vv = rowEditValues[idx] || {};

      const propertyType = stayType?.trim().toLowerCase(); // ✅ FIXED

      const phone = vv.phone || row.phone;
      console.log("FINAL TYPE:", propertyType);
      console.log("FINAL URL:", url);
      let url = "";

      if (propertyType === "hostel") {
        url = `${BASE_URL}/api/updatehostel/${phone}/`;
      }
      else if (propertyType === "apartment") {
        url = `${BASE_URL}/api/updateapartment/${phone}/`;
      }
      else if (propertyType === "commercial") {
        url = `${BASE_URL}/api/updatecommercial/${phone}/`;
      }
      else {
        alert(`Invalid property type: "${propertyType}"`);
        console.log("DEBUG stayType:", stayType);
        return;
      }

      const rawPayload = { ...row, ...vv };

      const payload = {
        name: rawPayload.name,
        phone: rawPayload.phone,
        bed: Number(rawPayload.bed),
        floor: rawPayload.floor ? Number(rawPayload.floor) : null,
        roomno: rawPayload.roomno ? Number(rawPayload.roomno) : null,
        rent: rawPayload.rent ? Number(rawPayload.rent) : 0,
        checkIn: rawPayload.checkIn,
        checkOut: rawPayload.checkOut,
      };

      console.log("FINAL URL:", url);
      console.log("PAYLOAD:", payload);

      const response = await fetchWithAuth(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("BACKEND ERROR:", data);

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      alert("Saved successfully ✅");

    } catch (error) {
      console.error(error);
      alert("Save failed ❌");
    }
  };
  const emptyRooms = totalRooms - occupiedRooms;
  const emptyBedsCount = totalBedsCount - occupiedBedsCount;
  
  const openTenantModal = (floorLabel, room) => {

    setSelectedFloor(String(floorLabel || ""));
    setSelectedRoom(String(room || ""));

    const current = getCount(floorLabel, room);
    setBedNumber(Math.min(4, current + 1));

    if (pendingAllotment) {
      setTenantName(pendingAllotment.name || "");
      setContactNumber(pendingAllotment.phone || "");
      settenantPhone(pendingAllotment.phone || "");
      setCheckIn(pendingAllotment.checkIn || "");
      setCheckOut(pendingAllotment.checkOut || "");
      setMonthlyRent("");
      setIdProofUri(pendingAllotment.idUri || "");
      setHasApp(true);
      setAadharId("");
      setAadharProofUri("");
      setTouchedAadharId(false);
    } else {
      setTenantName("");
      setContactNumber("");
      settenantPhone("");
      setMonthlyRent("");

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setCheckIn(`${yyyy}-${mm}-${dd}`);

      setCheckOut("");
      setIdProofUri("");
      setHasApp(true);
      setAadharId("");
      setAadharProofUri("");
      setTouchedAadharId(false);
    }

    setIdProofFile("");
    setIdPreviewHtml("");
    setIdPreviewVisible(false);
    setTouchedName(false);
    setTouchedPhone(false);
    setTouchedEmail(false);
    setTouchedRent(false);
    setModalVisible(true);
  };
  const isValidName = (name) => name.trim().length > 0;
  const isValidPhone = (phone) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  };
  const isValidEmail = (mail) =>
    mail.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());
  const isFormValid = () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const baseValid = (
      isValidName(tenantName) &&
      isValidPhone(contactNumber) &&
      monthlyRent.trim().length > 0 &&
      (stayType !== "hostel" || bedNumber >= 1) &&
      dateRegex.test(checkIn.trim()) &&
      (checkOut.trim().length === 0 || dateRegex.test(checkOut.trim()))
    );
    if (!hasApp) {
      return baseValid && /^\d{12}$/.test(aadharId);
    }
    return baseValid;
  };
  const addTenant = () => {
    console.log("ADDING TENANT", {
      tenantName,
      contactNumber,
      tenantPhone,
      monthlyRent,
      idProofUri,
    });
    if (!selectedFloor || !selectedRoom) {
      setModalVisible(false);
      return;
    }
    if (!isFormValid()) {
      return;
    }
    const key = `${selectedFloor}-${selectedRoom}`;
    
    const newTenant = {
      name: tenantName.trim(),
      phone: contactNumber.trim(),
      bed: bedNumber,
      rent: monthlyRent.trim(),
      checkIn: checkIn.trim(),
      checkOut: checkOut.trim(),
      idUri: idOpenUri || idProofUri,
    };

    if (stayType === "apartment" || stayType === "commercial") {
      setApartments((prev) => {
        const list = prev[key] ?? [];
        return {
          ...prev,
          [key]: [...list, newTenant],
        };
      });

      setApartmentCounts((prev) => {
        const next = Math.min(4, (prev[key] ?? 0) + 1);
        return { ...prev, [key]: next };
      });
    } else {
      setTenants((prev) => {
        const list = prev[key] ?? [];
        return {
          ...prev,
          [key]: [...list, newTenant],
        };
      });

      setBedCounts((prev) => {
        const next = Math.min(4, (prev[key] ?? 0) + 1);
        return { ...prev, [key]: next };
      });
    }
    setIdProofFile("");
    setIdProofUri("");
    setIdOpenUri("");
    setIdPreviewVisible(false);
    setShowBottomViewId(false);
    setModalVisible(false);
  };
  const removeTenant = (floorLabel, room, index) => {
    const key = `${floorLabel}-${room}`;
    setTenants((prev) => {
      const list = prev[key] ?? [];
      const nextList = list.filter((_, i) => i !== index);
      return { ...prev, [key]: nextList };
    });
    setBedCounts((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) - 1);
      return { ...prev, [key]: next };
    });
  }; const getTotalBeds = (floorLabel, roomLabel) => {
    const floor = dynamicFloors.find((f) => f.floor === floorLabel);
    const unit = floor?.units.find((u) => u.label === roomLabel);
    return unit?.beds ?? 0;
  };
  //   const getTotalBeds = (floorLabel, roomLabel) => {
  //   const floor = dynamicFloors.find((f) => f.floor === floorLabel);
  //   const room = floor?.rooms.find((r) => r.roomLabel === roomLabel);
  //   return room?.beds ?? 0;
  // };
  // console.log("Selected Floor:", selectedFloor);
  // console.log("Selected Room:", selectedRoom);
  // const saveTenant = async () => {
  //   try {
  //         // console.log("🚀 Sending:", selectedFloor, selectedRoom); // DEBUG

  //     const formData = new FormData();

  //     formData.append("name", tenantName);
  //     formData.append("phone", contactNumber);
  //       //     formData.append("bed", bedNumber);
  //     formData.append("rent", monthlyRent);
  //     formData.append("checkIn", checkIn);
  //     formData.append("checkOut", checkOut);
  // //  const floorNumber = selectedFloor
  // //   ? selectedFloor.replace("Floor ", "")
  // //   : "";
  // // let floorNumber = "";

  // // if (selectedFloor !== null && selectedFloor !== undefined) {
  // //   if (typeof selectedFloor === "string") {
  // //     floorNumber = selectedFloor.replace("Floor ", "");
  // //   } else {
  // //     floorNumber = selectedFloor.toString(); // 👈 IMPORTANT
  // //   }
  // // }

  // // formData.append("floor", floorNumber);
  // // formData.append("owner_phone", ownerPhone); // ✅ correct key
  // console.log("Selected Floor:", selectedFloor);

  // const floorNumber = selectedFloor
  //   ? parseInt(selectedFloor.toString().replace("Floor ", ""))
  //   : null;

  // if (floorNumber !== null && !isNaN(floorNumber)) {
  //   formData.append("floor", floorNumber);
  // }

  // // formData.append("roomno", parseInt(selectedRoom));
  // if (stayType === "hostel") {
  //   formData.append("roomno", parseInt(selectedRoom));
  // }

  // else if (stayType === "apartment") {
  //   formData.append("flatno", selectedRoom); // keep as string (like 101, 102)
  // }

  // else if (stayType === "commercial") {
  //   formData.append("sectionNo", selectedRoom); // ✅ send number instead of text
  // }
  // formData.append("owner_phone", ownerPhone);


  // // formData.append("floor", floorNumber);   // ✅ now sends 1
  // // formData.append("roomno", parseInt(selectedRoom));
  // // formData.append("ownerPhone")

  //     if (idProofUri) {
  //       formData.append("idUri", {
  //         uri: idProofUri,
  //         name: "idproof.jpg",
  //         type: "image/jpeg",
  //       });
  //     }

  //     const response = await fetch(
  //       "http://192.168.1.26:8000/api/tenentbeds/",
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  // const res1 = await fetch(
  //       "http://192.168.1.26:8000/api/apartmentbeds/",
  //        {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  //     const data = await response.json();
  //     console.log("Tenant saved:", data);
  // addTenant(); 
  //   } catch (error) {
  //     console.log("Error saving tenant:", error);
  //   }
  // };


  const registerForPushNotifications = async () => {

  try {

    if (!Device.isDevice) {
      console.log("Physical device required");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {

      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {

      console.log("Push permission denied");
      return;
    }

    if (Platform.OS === "android") {

      await Notifications.setNotificationChannelAsync(
        "default",
        {
          name: "default",
          importance:
            Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6C63FF",
        }
      );
    }

    const tokenData =
      await Notifications.getExpoPushTokenAsync({
        projectId:
          Constants.expoConfig?.extra?.eas?.projectId,
      });

    const pushToken = tokenData.data;

    console.log(
      "OWNER PUSH TOKEN:",
      pushToken
    );

const res = await fetchWithAuth(
  `${BASE_URL}/api/save-push-token/`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: phone,
      role: "owner",
      push_token: pushToken,
    }),
  }
);

console.log("SAVE TOKEN STATUS:", res.status);

const data = await res.json();

console.log("TOKEN SAVE RESPONSE:", data);

    console.log("OWNER TOKEN SAVED");

  } catch (error) {

    console.log(
      "PUSH TOKEN ERROR:",
      error
    );
  }
};
useEffect(() => {

  if (phone) {

    registerForPushNotifications();

  }

}, [phone]);
  const saveTenant = async () => {
    if (checkReadOnly() || isSavingTenant) return;
    setIsSavingTenant(true);
    try {
      const formData = new FormData();

      formData.append("name", tenantName);
      formData.append("phone", contactNumber);
      if (stayType === "hostel") {
        formData.append("bed", bedNumber);
      }
      formData.append("rent", monthlyRent);
      if (checkIn) formData.append("checkIn", checkIn);
      if (checkOut) formData.append("checkOut", checkOut);

      const floorNumber = selectedFloor
        ? parseInt(selectedFloor.toString().replace("Floor ", ""))
        : null;

      if (floorNumber !== null && !isNaN(floorNumber)) {
        formData.append("floor", floorNumber);
      }

      // ✅ TYPE BASED DATA
      if (stayType === "hostel") {
        formData.append("roomno", parseInt(String(selectedRoom).replace(/\D/g, "")));
      }
      else if (stayType === "apartment") {
        formData.append("flatno", parseInt(selectedRoom) || selectedRoom);
      }

      else if (stayType === "commercial") {
        formData.append("sectionNo", parseInt(selectedRoom) || selectedRoom); // ✅ correct
      }


      formData.append("owner_phone", phone);

      if (!hasApp) {
        formData.append("has_app", "false");
        formData.append("is_offline", "true");
        formData.append("aadhar_id", aadharId);
        if (aadharProofUri) {
          const filename = aadharProofUri.split('/').pop() || "aadhar_proof.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          formData.append("aadhar_image", {
            uri: aadharProofUri,
            name: filename,
            type: type,
          });
        }
      }

      if (idProofUri) {
        formData.append("idUri", {
          uri: idProofUri,
          name: "idproof.jpg",
          type: "image/jpeg",
        });
      }

      // 🔥 SELECT API BASED ON TYPE
      let url = "";

      if (stayType === "hostel") {
        url = `${BASE_URL}/api/tenentbeds/`;
      }
      else if (stayType === "apartment") {

        url = `${BASE_URL}/api/apartmentbeds/`;
      }
      else if (stayType === "commercial") {
        url = `${BASE_URL}/api/commercialbeds/`; // or your commercial API
      }

      console.log("🚀 Hitting API:", url);

      // ✅ ONLY ONE API CALL
      const response = await fetchWithAuth(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Tenant saved response:", data);

      if (!response.ok) {
        console.log("Error details from backend:", data);
        let errorMsg = "Please check your inputs and try again.";
        if (data) {
          if (typeof data === "object") {
            errorMsg = Object.entries(data)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
              .join("\n");
          } else {
            errorMsg = String(data);
          }
        }
        Alert.alert("Failed to Add Tenant", errorMsg);
        return;
      }

      if (pendingAllotment?.requestId) {
        try {
          await fetchWithAuth(`${BASE_URL}/api/update_request_status/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: pendingAllotment.requestId,
              status: "accepted",
              is_existing_tenant: pendingAllotment.is_existing_tenant || false,
            }),
          });
        } catch (err) {
          console.error("Error updating request status:", err);
        }
      }
            // ✅ SEND PUSH NOTIFICATION
try {

  await fetchWithAuth(
    `${BASE_URL}/api/send-tenant-notification/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: contactNumber,
        title: "Room Allotted ✅",
        body: `Your room ${selectedRoom} has been allotted successfully`,
      }),
    }
  );

  console.log("✅ Notification Sent");

} catch (err) {

  console.log(
    "❌ Notification Error:",
    err
  );

}


      // Instead of manual addTenant, just clear the form and trigger a fresh API fetch
      setIdProofFile("");
      setIdProofUri("");
      setIdOpenUri("");
      setIdPreviewVisible(false);
      setShowBottomViewId(false);
      setModalVisible(false);
      
      setRefreshTrigger((prev) => prev + 1);


      if (pendingAllotment) {
        setPendingAllotment(null);
        navigation.navigate("OwnerNavigation", { screen: "Home" });
      }
    } catch (error) {
      console.log("Error saving tenant:", error);
      Alert.alert("Error Saving Tenant", error.message || "An unexpected error occurred.");
    } finally {
      setIsSavingTenant(false);
    }
  };

  const deleteTenant = (tenant) => {
    if (checkReadOnly()) return;
    Alert.alert(
      "Remove Tenant",
      `Are you sure you want to remove ${tenant.name} from this room?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const endpointMap = {
                hostel: 'deletehostel',
                apartment: 'deleteapartment',
                commercial: 'deletecommercial',
              };
              const endpoint = endpointMap[stayType];
              const id = tenant.id; // numeric ID for deletion
              const res = await fetchWithAuth(`${BASE_URL}/api/${endpoint}/${id}/`, {
                method: "DELETE",
              });

              if (res.ok) {
                //alert("Tenant removed successfully");
                setRefreshTrigger((prev) => prev + 1);
                setTenantsListModalVisible(false);
              } else {
                alert("Failed to remove tenant");
              }
            } catch (err) {
              console.error("Delete Error:", err);
            }
          },
        },
      ]
    );
  };

  const blockTenant = (tenant) => {
    if (checkReadOnly()) return;
    Alert.alert(
      "Block Tenant",
      `Are you sure you want to block ${tenant.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetchWithAuth(`${BASE_URL}/api/block_tenant/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  tenant_phone: tenant.phone,
                  owner_phone: phone,
                  reason: 'Manual block from owner app'
                }),
              });

              if (res.ok) {
                alert("Tenant blocked successfully");
                setRefreshTrigger((prev) => prev + 1);
                setTenantsListModalVisible(false);
              } else {
                alert("Failed to block tenant");
              }
            } catch (err) {
              console.error("Block Error:", err);
            }
          },
        },
      ]
    );
  };

  const editTenant = (tenant) => {
    setTenantsListModalVisible(false);

    // Determine floor label
    let floorLabel = selectedFloor;
    if (tenant.floorName) {
      floorLabel = tenant.floorName;
    } else if (tenant.floor) {
      floorLabel = String(tenant.floor).startsWith("Floor ") ? String(tenant.floor) : `Floor ${tenant.floor}`;
    }

    // Determine room/unit label
    let roomLabel = selectedRoom;
    if (tenant.roomLabel) {
      roomLabel = tenant.roomLabel;
    } else if (tenant.roomno) {
      roomLabel = String(tenant.roomno);
    } else if (tenant.flatno) {
      roomLabel = String(tenant.flatno);
    } else if (tenant.sectionNo) {
      roomLabel = String(tenant.sectionNo);
    }

    const totalBeds = getTotalBeds(floorLabel, roomLabel);

    navigation.navigate("OwnerEditTenantScreen", { tenant, stayType, totalBeds });
  };
  if (isConnected === false && !response_data) {
    return <OfflineView />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F8FC" }} edges={["left", "right", "bottom"]}>
      {/* Dynamic Status Bar - Translucent, changing icon colors depending on scroll state */}
      <StatusBar
        barStyle={isScrolled ? "dark-content" : "light-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      {/* Dedicated White Cover behind Status Bar when sticky header is active */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: isScrolled ? "#FFF" : "transparent",
          zIndex: 999,
          pointerEvents: "none",
        }}
      />
<ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setScrollY(currentScrollY);
          if (headerY > 0) {
            const threshold = headerY - insets.top;
            if (currentScrollY >= threshold && !isScrolled) {
              setIsScrolled(true);
            } else if (currentScrollY < threshold && isScrolled) {
              setIsScrolled(false);
            }
          }
        }}
      >
        {/* HEADER HERO SECTION */}
        <LinearGradient
          colors={["#6C2BD9", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerHero, { paddingTop: insets.top + 16 }]}
        >
          {/* TOP BAR */}
          <View style={styles.headerTopRow}>
            {/* Location Pill */}
            <View style={styles.locationPill}>
              <Ionicons name="location-outline" size={14} color="#FFF" />
              <Text numberOfLines={1} style={styles.locationPillText}>
                {response_data?.address || t('location_not_set')}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate("OwnerNotificationScreen", { phone: phone })}
                style={styles.frostedIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="#FFF" />
                {ownerUnreadCount > 0 && (
                  <Animated.View style={styles.pulseBadge}>
                    <Text style={styles.badgeText}>
                      {ownerBadgeText}
                    </Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* GREETINGS ROW */}
          <View style={styles.greetingsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingTitle}>
                {t("welcome_back") || "Welcome Back"},{"\n"}{ownerName || t("owner")} 👋
              </Text>
              <View style={styles.premiumPropertyBadge}>
                <View style={styles.pulsingIndicator} />
                <Text style={styles.premiumPropertyText} numberOfLines={1}>
                  {response_data?.name || response_data?.property_name || t('my_property')} {stayType === 'hostel' ? `(${totalRooms} ${t("rooms") || "Rooms"})` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.premiumIllustrationContainer}>
              <View style={styles.glowRing1} />
              <View style={styles.glowRing2} />
              <Image
                source={require("../../../assets/images/rent2.png")}
                style={styles.homeHeaderLogo}
                resizeMode="cover"
              />
            </View>
          </View>

        </LinearGradient>

        {/* STATS CARDS SECTION */}
        <View style={styles.premiumStatsRow}>
          {/* Card 1: Total Rooms */}
          <TouchableOpacity
            onPress={() => setFilterMode(null)}
            style={[
              styles.statsCardPremium,
              { backgroundColor: "#FFF" },
              filterMode === null && {
                backgroundColor: "#F5F3FF",
                borderColor: "#cbbce4ff",
                shadowColor: "#6C2BD9",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.statsIconBox, { backgroundColor: "rgba(108, 43, 217, 0.1)" }]}>
              <Ionicons name="apps" size={18} color="#6C2BD9" />
            </View>
            <Text style={styles.statsNumber}>{stayType === "hostel" ? totalBedsCount : totalRooms}</Text>
            <Text style={styles.statsLabel}>{stayType === "hostel" ? t("total_beds") : t("total_rooms")}</Text>
          </TouchableOpacity>

          {/* Card 2: Occupied */}
          <TouchableOpacity
            onPress={() => setFilterMode("occupied")}
            style={[
              styles.statsCardPremium,
              { backgroundColor: "#FFF" },
              filterMode === "occupied" && {
                backgroundColor: "#F0FDF4",
                borderColor: "#cfeedaff",
                shadowColor: "#22C55E",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.statsIconBox, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
              <Ionicons name="people" size={18} color="#22C55E" />
            </View>
            <Text style={styles.statsNumber}>{stayType === "hostel" ? occupiedBedsCount : occupiedRooms}</Text>
            <Text style={styles.statsLabel}>{stayType === "hostel" ? t("beds_occupied") : t("occupied")}</Text>
          </TouchableOpacity>

          {/* Card 3: Vacant */}
          <TouchableOpacity
            onPress={() => setFilterMode("empty")}
            style={[
              styles.statsCardPremium,
              { backgroundColor: "#FFF" },
              filterMode === "empty" && {
                backgroundColor: "#FEF2F2",
                borderColor: "#e5babaff",
                shadowColor: "#EF4444",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.statsIconBox, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
              <Ionicons name="home" size={18} color="#EF4444" />
            </View>
            <Text style={styles.statsNumber}>{stayType === "hostel" ? emptyBedsCount : emptyRooms}</Text>
            <Text style={styles.statsLabel}>{stayType === "hostel" ? t("beds_vacant") : t("vacant")}</Text>
          </TouchableOpacity>
        </View>

        {/* BUILDING OVERVIEW TITLE & TOGGLE */}
        {/* Outer container keeps a fixed height in the ScrollView layout flow to prevent shifts/jumps */}
        <View
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            if (y > 0 && y !== headerY) {
              setHeaderY(y);
            }
            if (height > 0 && !isScrolled && height !== headerHeight) {
              setHeaderHeight(height);
            }
          }}
          style={{
            height: headerHeight,
            zIndex: 10,
          }}
        >
          {/* Inner container shifts up and increases padding when sticky to slide under status bar and show a white background */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: isScrolled ? -insets.top : 0,
              height: isScrolled ? headerHeight + insets.top : headerHeight,
              paddingTop: isScrolled ? insets.top : 0,
              backgroundColor: isScrolled ? "#FFF" : "#F8F8FC",
              justifyContent: "center",
              borderBottomWidth: isScrolled ? StyleSheet.hairlineWidth : 0,
              borderBottomColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: isScrolled ? 4 : 0 },
              shadowOpacity: isScrolled ? 0.05 : 0,
              shadowRadius: 3,
              elevation: isScrolled ? 3 : 0,
            }}
          >
            <View style={styles.segmentedControlCenterRow}>
              <View style={styles.toggleContainerCentered}>
                <TouchableOpacity
                  onPress={() => setViewMode("floor")}
                  style={[
                    styles.toggleBtnMinimal,
                    styles.toggleBtnDivider,
                    viewMode === "floor" && styles.toggleBtnMinimalActive
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="business-outline"
                    size={17}
                    color="#7C3AED"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.toggleTextMinimal}>
                    {t("floor_view") || "Floor View"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  style={[
                    styles.toggleBtnMinimal,
                    viewMode === "list" && styles.toggleBtnMinimalActive
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="list-outline"
                    size={17}
                    color="#7C3AED"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.toggleTextMinimal}>
                    {t("list_view") || "List View"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* CONDITIONALLY RENDER FLOOR OR LIST VIEW */}
        {viewMode === "floor" ? (
          <View style={styles.floorPlanRow}>
            {filteredFloors.length === 0 ? (
              <View style={{ flex: 1, padding: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", borderRadius: 24, marginHorizontal: 16, minHeight: 250, shadowColor: "#9E9E9E", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <Ionicons name="business-outline" size={48} color="#C0B4F3" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#212121", textAlign: "center" }}>
                  No Floors with Matching Filter
                </Text>
                <Text style={{ fontSize: 13, color: "#757575", marginTop: 6, textAlign: "center" }}>
                  {`There are currently no rooms or apartments matching "${filterMode === "occupied" ? "Occupied" : "Vacant"}".`}
                </Text>
              </View>
            ) : (
              <>
                {/* LEFT FLOOR SIDEBAR */}
                <View style={styles.floorSidebarCard}>
                  <ScrollView
                    ref={sidebarRef}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 10, alignItems: "center" }}
                  >
                    {filteredFloors.map((f, idx) => (
                      <TouchableOpacity
                        key={f.floorNo}
                        onPress={() => handleSelectFloor(idx)}
                        style={[
                          styles.floorSidebarPill,
                          activeIndex === idx && styles.floorSidebarPillActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.floorSidebarPillText,
                            activeIndex === idx && styles.floorSidebarPillTextActive,
                          ]}
                        >
                          F{f.floor.replace("Floor ", "")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* ROOM GRID SECTION */}
                <ScrollView
                  ref={sliderRef}
                  horizontal
                  snapToInterval={snap}
                  decelerationRate="fast"
                  scrollEventThrottle={8}
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  onScroll={(e) => {
                    if (isManualScroll.current) return;
                    const x = e.nativeEvent.contentOffset.x;
                    const idx = Math.round(x / snap);
                    if (idx !== activeIndex && idx >= 0 && idx < filteredFloors.length) {
                      setActiveIndex(idx);
                    }
                  }}
                  onMomentumScrollEnd={(e) => {
                    isManualScroll.current = false;
                    const x = e.nativeEvent.contentOffset.x;
                    const idx = Math.round(x / snap);
                    if (idx >= 0 && idx < filteredFloors.length) {
                      setActiveIndex(idx);
                      syncSidebar(idx);
                    }
                  }}
                >
                 {filteredFloors.map((item, index) => (
                    <View
                      key={item.floorNo}
                      style={[
                        styles.roomGridCard,
                        {
                          width: cardWidth,
                          marginRight: (index === filteredFloors.length - 1 && !editMode) ? 0 : SPACING,
                        },
                      ]}
                    >
                      <View style={styles.roomGridHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, flexWrap: "wrap", gap: 6, paddingVertical: 4 }}>
                          <Ionicons name="layers-outline" size={18} color="#6C2BD9" style={{ marginRight: 6 }} />
                          <Text style={styles.roomGridTitle}>{item.floor.replace("Floor", t("floor") || "Floor")}</Text>
                          {editMode && (
                            <>
                              <TouchableOpacity
                                onPress={addFloor}
                                disabled={isAddingFloor}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  backgroundColor: "#6C2BD9",
                                  paddingVertical: 4,
                                  paddingHorizontal: 8,
                                  borderRadius: 6,
                                  marginLeft: 6,
                                  opacity: isAddingFloor ? 0.5 : 1
                                }}
                              >
                                <Ionicons name="layers" size={14} color="white" />
                                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginLeft: 2 }}>
                                   {t("add_floor") || "Add Floor"}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  const floorNo = item.floorNo || parseInt(item.floor.replace("Floor ", ""));
                                  addUnit(floorNo);
                                }}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  backgroundColor: "#7C3AED",
                                  paddingVertical: 4,
                                  paddingHorizontal: 8,
                                  borderRadius: 6,
                                }}
                              >
                                <Ionicons name="add" size={14} color="white" />
                                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginLeft: 2 }}>
                                  {stayType === "hostel" ? (t("add_room") || "Add Room") : stayType === "apartment" ? (t("add_flat") || "Add Flat") : (t("add_section") || "Add Section")}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  const floorNo = item.floorNo || parseInt(item.floor.replace("Floor ", ""));
                                  Alert.alert(
                                    'Delete Floor',
                                    `Are you sure you want to delete ${item.floor}? All rooms/units on this floor will be removed.`,
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      { text: 'Delete', style: 'destructive', onPress: () => removeFloor(floorNo) }
                                    ]
                                  );
                                }}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  backgroundColor: "#EF4444",
                                  paddingVertical: 4,
                                  paddingHorizontal: 8,
                                  borderRadius: 6,
                                }}
                              >
                                <Ionicons name="trash" size={14} color="white" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                        {!editMode && (
                          <Text style={styles.roomGridSubtitle}>
                            {
                              (item.units || []).filter((unit) => {
                                const count = getCount(item.floor, unit.label);
                                if (filterMode === "occupied") return count > 0;
                                if (filterMode === "empty") return count === 0;
                                return true;
                              }).length
                            }{" "}
                            {stayType === "hostel" ? t("rooms") : stayType === "apartment" ? t("flats") || "Flats" : t("sections") || "Sections"}
                          </Text>
                        )}
                      </View>

                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                      >
                        <View style={styles.roomCardGrid}>
                          {(item.units || [])
                            .filter((unit) => {
                              const count = getCount(item.floor, unit.label);
                              if (filterMode === "occupied") return count > 0;
                              if (filterMode === "empty") return count === 0;
                              return true;
                            })
                            .map((unit, i) => {
                              const roomKey = `${item.floor}-${unit.label}`;
                              const roomTenants = dataToRender[roomKey] || [];
                              const count = roomTenants.length;
                              const isOccupiedRoom = count > 0;
                              const totalBeds = stayType === "hostel" ? (unit.beds || 0) : 1;
                              const emptyBedsCount = Math.max(0, totalBeds - count);
                              const floorNoVal = item.floorNo || parseInt(item.floor.replace("Floor ", ""));
                              const unitIdVal = unit.roomNo || unit.flatNo || unit.sectionNo;
                              const refKey = `${floorNoVal}-${unitIdVal}`;

                              // Dynamic state mapping matching mockup
                              let badgeBg = "rgba(239, 68, 68, 0.1)";
                              let badgeTextCol = "#EF4444";
                              let statusText = t("vacant") || "Vacant";
                              let dotCol = "#22C55E";
                              let paymentLabel = t("available_for_rent") || "Available for rent";
                              let bedsLabel = stayType === "hostel" ? `${count}/${unit.beds} ${t("beds") || "Beds"}` : stayType === "apartment" ? `${unit.type}` : `${unit.area} ${t("sqft") || "sq.ft"}`;

                              if (isOccupiedRoom) {
                                if (stayType === "hostel" && count < totalBeds) {
                                  // Partial Occupancy
                                  badgeBg = "rgba(245, 158, 11, 0.15)";
                                  badgeTextCol = "#D97706";
                                  statusText = t("partial") || "Partial";
                                  dotCol = "#F59E0B";
                                  paymentLabel = t("partially_occupied") || "Partially Occupied";
                                } else {
                                  badgeBg = "rgba(34, 197, 94, 0.1)";
                                  badgeTextCol = "#22C55E";
                                  statusText = (stayType !== "hostel" && roomTenants.length > 0) ? roomTenants[0].name.substring(0, 10) : (t("occupied") || "Occupied");
                                  dotCol = "#22C55E";
                                  paymentLabel = t("paid") || "Paid";
                                }
                              }

                              // Get first tenant info
                              const primaryTenant = roomTenants[0];

                              return (
                                <TouchableOpacity
                                  key={unit.label || i}
                                  style={styles.premiumRoomCard}
                                  activeOpacity={0.8}
                                  disabled={editMode}
                                  onPress={() => {
                                    if (isOccupiedRoom) {
                                      setSelectedRoom(unit.label);
                                      setSelectedFloor(item.floor);
                                      setTenantsList(roomTenants);
                                      setTenantsListModalVisible(true);
                                    } else {
                                      openTenantModal(item.floor, unit.label);
                                    }
                                  }}
                                >
                                  {/* Top Row: Number & Status Badge */}
                                  <View style={styles.roomCardHeader}>
                                    <Text style={styles.roomNoText}>{unit.label}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                                      <Text style={[styles.statusBadgeText, { color: badgeTextCol }]}>{statusText}</Text>
                                    </View>
                                  </View>

                                  {/* Middle Row: Beds count only */}
                                  <Text style={styles.bedsLabelText}>{bedsLabel}</Text>

                                  {/* Action Buttons / Edit Controls */}
                                 {editMode ? (
                                    <View style={{ width: "100%", marginTop: 8 }}>
                                      {stayType === "hostel" && (
                                        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 4, paddingVertical: 2, justifyContent: "space-between", marginBottom: 6 }}>
                                          <TouchableOpacity
                                            onPress={(e) => { e.stopPropagation(); updateUnit(item.floorNo || parseInt(item.floor.replace("Floor ", "")), unit.roomNo || unit.flatNo || unit.sectionNo, 'decrement_beds'); }}
                                            style={{ padding: 6 }}
                                          >
                                            <Ionicons name="remove-circle-outline" size={18} color="#4B5563" />
                                          </TouchableOpacity>
                                          <Text style={{ fontWeight: "700", color: "#111827", fontSize: 13 }}>{unit.beds} </Text>
                                          <TouchableOpacity
                                            onPress={(e) => { e.stopPropagation(); updateUnit(item.floorNo || parseInt(item.floor.replace("Floor ", "")), unit.roomNo || unit.flatNo || unit.sectionNo, 'increment_beds'); }}
                                            style={{ padding: 6 }}
                                          >
                                            <Ionicons name="add-circle-outline" size={18} color="#4B5563" />
                                          </TouchableOpacity>
                                        </View>
                                      )}
{stayType === "apartment" && (
  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 2, paddingVertical: 2, justifyContent: "space-between", marginBottom: 6, overflow: "hidden" }}>
    <TouchableOpacity
      onPress={(e) => { e.stopPropagation(); updateUnit(item.floorNo || parseInt(item.floor.replace("Floor ", "")), unit.roomNo || unit.flatNo || unit.sectionNo, 'decrement_bhk'); }}
      style={{ padding: 4, flexShrink: 0 }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="remove-circle-outline" size={18} color="#4B5563" />
    </TouchableOpacity>
    <Text
      style={{ fontWeight: "700", color: "#111827", fontSize: 12, flexShrink: 1, textAlign: "center" }}
      numberOfLines={1}
    >
      {unit.bhk || 1}
    </Text>
    <TouchableOpacity
      onPress={(e) => { e.stopPropagation(); updateUnit(item.floorNo || parseInt(item.floor.replace("Floor ", "")), unit.roomNo || unit.flatNo || unit.sectionNo, 'increment_bhk'); }}
      style={{ padding: 4, flexShrink: 0 }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="add-circle-outline" size={18} color="#4B5563" />
    </TouchableOpacity>
  </View>
)}
{stayType === "commercial" && (
  <TouchableOpacity
    activeOpacity={1}
    onPress={() => {
      sqftInputRefs.current[refKey]?.focus();
    }}
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F3F4F6",
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 8,
      marginBottom: 6,
    }}
  >
    <TextInput
      ref={(el) => {
        if (el) sqftInputRefs.current[refKey] = el;
      }}
      value={unit.area === 0 || unit.area === null || unit.area === undefined ? "" : String(unit.area)}
      placeholder="0"
      placeholderTextColor="#9CA3AF"
      onChangeText={(val) => {
        const cleaned = val.replace(/[^0-9]/g, "");
        updateUnit(floorNoVal, unitIdVal, 'set_area', cleaned);
      }}
      onPressIn={(e) => e.stopPropagation()}
      keyboardType="numeric"
      style={{
        fontWeight: "700",
        color: "#111827",
        fontSize: 13,
        maxWidth: 50,
        textAlign: "center",
        padding: 0,
      }}
    />
    <Text style={{ fontWeight: "600", color: "#4B5563", fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
      sq.ft
    </Text>
  </TouchableOpacity>
)}
                                      <TouchableOpacity
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          const unitId = unit.roomNo || unit.flatNo || unit.sectionNo;
                                          const unitType = stayType === 'hostel' ? 'Room' : stayType === 'apartment' ? 'Flat' : 'Section';
                                          Alert.alert(
                                            `Delete ${unitType}`,
                                            `Are you sure you want to delete ${unitType} ${unit.label}?`,
                                            [
                                              { text: 'Cancel', style: 'cancel' },
                                              { text: 'Delete', style: 'destructive', onPress: () => updateUnit(item.floorNo || parseInt(item.floor.replace("Floor ", "")), unitId, 'delete_unit') }
                                            ]
                                          );
                                        }}
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          backgroundColor: "#FEE2E2",
                                          borderRadius: 8,
                                          paddingVertical: 6,
                                        }}
                                        activeOpacity={0.7}
                                      >
                                        <Ionicons name="trash" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                                        <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}>{t("delete") || "Delete"}</Text>
                                      </TouchableOpacity>
                                    </View>
                                  ) : (
                                    <View style={[styles.roomCardBottom, { justifyContent: "flex-end" }]}>
                                      {isOccupiedRoom && emptyBedsCount === 0 ? (
                                        <View style={[styles.actionDotsBtn, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                                          <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                                        </View>
                                      ) : (
                                        <TouchableOpacity
                                          onPress={(e) => {
                                            e.stopPropagation();
                                            openTenantModal(item.floor, unit.label);
                                          }}
                                          style={styles.cardAddBtn}
                                          activeOpacity={0.7}
                                        >
                                          <Ionicons name="add" size={16} color="#6C2BD9" />
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                  {editMode && (
                    <TouchableOpacity
                      onPress={addFloor}
                      disabled={isAddingFloor}
                      style={[
                        styles.roomGridCard,
                        {
                          width: cardWidth,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#F5F3FF",
                          borderStyle: "dashed",
                          borderWidth: 2,
                          borderColor: "#7C3AED",
                          borderRadius: 16,
                          minHeight: cardHeight * 0.8
                        },
                      ]}
                    >
                      <Ionicons name="add-circle" size={48} color="#7C3AED" />
                      <Text style={{ fontSize: 18, color: "#7C3AED", fontWeight: "700", marginTop: 10 }}>
                        Add New Floor
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        ) : (
          /* LIST VIEW SECTION */
          <View style={styles.listViewContainer}>
            {(() => {
              // 1. Get filtered list of tenants based on filterMode
              const tenantsList = Object.entries(dataToRender).flatMap(([key, list]) => {
                const [floorName, roomLabel] = key.split("-");
                if (filterMode === "empty") {
                  return [];
                }
                return list.map((t) => ({
                  ...t,
                  roomKey: key,
                  floorName,
                  roomLabel,
                }));
              });

              // 2. If no tenants in this mode, show beautiful empty states
              if (tenantsList.length === 0) {
                if (filterMode === "empty") {
                  return (
                    <View style={styles.emptyListCard}>
                      <Ionicons name="home-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                      <Text style={[styles.emptyListText, { fontWeight: "bold", color: "#111827" }]}>
                        No occupants in vacant units
                      </Text>
                      <Text style={[styles.emptyListText, { fontSize: 13, color: "#6B7280", marginTop: 4 }]}>
                        Switch to Floor View to allot these vacant units.
                      </Text>
                    </View>
                  );
                }
                return (
                  <View style={styles.emptyListCard}>
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyListText}>No tenants registered in the building</Text>
                  </View>
                );
              }

              // 3. Render the filtered list of tenants
              return tenantsList.map((tenantItem, idx) => (
                <View key={`${tenantItem.roomKey}-${idx}`} style={styles.listTenantCard}>
                  <View style={styles.listTenantTop}>
                    <View style={styles.listAvatar}>
                      <Text style={styles.listAvatarText}>
                        {(tenantItem.name || "T").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.listTenantName}>{tenantItem.name}</Text>
                      <Text style={styles.listTenantDetails}>
                        {tenantItem.floorName} • {stayType === "hostel" ? `Room ${tenantItem.roomLabel}` : stayType === "apartment" ? `Flat ${tenantItem.roomLabel}` : `Section ${tenantItem.roomLabel}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        const tel = `tel:${tenantItem.phone}`;
                        Linking.openURL(tel).catch(() => { });
                      }}
                      style={styles.listCallBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={18} color="#22C55E" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.listSeparator} />

                  <View style={styles.listTenantBottom}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      {!!tenantItem.rent && (
                        <View style={styles.listMetaPill}>
                          <Ionicons name="cash" size={14} color="#6C2BD9" />
                          <Text style={styles.listMetaText}>₹{tenantItem.rent}</Text>
                        </View>
                      )}
                      {!!tenantItem.bed && stayType === "hostel" && (
                        <View style={styles.listMetaPill}>
                          <Ionicons name="bed" size={14} color="#8B5CF6" />
                          <Text style={styles.listMetaText}>Bed {tenantItem.bed}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => blockTenant(tenantItem)}
                        style={[styles.listActionBtn, { backgroundColor: "rgba(243, 156, 18, 0.08)" }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="ban-outline" size={16} color="#F39C12" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => editTenant(tenantItem)}
                        style={[styles.listActionBtn, { backgroundColor: "rgba(108, 43, 217, 0.08)" }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={16} color="#6C2BD9" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => deleteTenant(tenantItem)}
                        style={[styles.listActionBtn, { backgroundColor: "rgba(239, 68, 68, 0.08)" }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ));
            })()}



          </View>
        )}
      </ScrollView>
      {editMode && (
        <View style={{
          backgroundColor: "#EEF2F6",
          padding: 12,
          paddingBottom: 24, // Extra padding for bottom placement
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: "#D1D5DB",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}>
          <Text style={{ fontWeight: "700", color: "#1F2937" }}>{t("edit_building_mode") || "Edit Building Mode"}</Text>
          <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
              onPress={() => {
                setEditMode(false);
                setEditableLayout(originalLayoutSnapshot ?? response_data?.building_layout ?? []);
              }}
              style={{
                backgroundColor: "#E5E7EB",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginRight: 8
              }}
            >
              <Text style={{ color: "#374151", fontWeight: "700", fontSize: 13 }}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
<TouchableOpacity
              disabled={isSavingLayout}
              onPress={async () => {
                if (checkReadOnly() || isSavingLayout) return;
                setIsSavingLayout(true);
                try {
                  const payload = {
                    building_layout: editableLayout,
                    stay_type: stayType,
                  };
                  const res = await fetchWithAuth(`${BASE_URL}/api/update_building_layout/${encodeURIComponent(phone)}/`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                  });
                  if (res.ok) {
                    setResponseData(prev => prev ? { ...prev, building_layout: editableLayout } : prev);
                    setOriginalLayoutSnapshot(editableLayout);
                    setEditMode(false);
                    setRefreshTrigger(prev => prev + 1);
                  } else {
                    const errorData = await res.json();
                    Alert.alert('Error', errorData.error || 'Failed to update layout');
                  }
                } catch (err) {
                  Alert.alert('Error', 'Failed to save changes');
                } finally {
                  setIsSavingLayout(false);
                }
              }}
              style={{
                backgroundColor: "#7C3AED",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                opacity: isSavingLayout ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{t("save_layout") || "Save Layout"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal transparent={false} visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.modalOverlay, { backgroundColor: COLORS.WHITE }]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderBar}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { fontSize: 22, color: COLORS.WHITE, fontWeight: "800" }]}>
                    {selectedRoom ? (stayType === "hostel" ? `Room ${selectedRoom}` : stayType === "apartment" ? `Flat ${selectedRoom}` : `Section ${selectedRoom}`) : "Registration"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Ionicons name="layers-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginLeft: 4 }}>
                      {selectedFloor ? (String(selectedFloor).includes("Floor") ? selectedFloor : `Floor ${selectedFloor}`) : "No Floor"}
                    </Text>
                    {ownerPhone && (
                      <>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)", marginHorizontal: 8 }} />
                        <Ionicons name="mail-outline" size={14} color="rgba(255,255,255,0.8)" />
                        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginLeft: 4 }}>{ownerPhone}</Text>
                      </>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.WHITE} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContentScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                nestedScrollEnabled
                keyboardShouldPersistTaps="always"
              >
                <View style={[styles.modalStatsCards, { paddingHorizontal: 0, paddingTop: 8 }]}>
                  <TouchableOpacity
                    onPress={() => {
                      const list = (stayType === "hostel" ? tenants : apartments)[`${selectedFloor}-${selectedRoom}`] ?? [];
                      setTenantsList(list);
                      setTenantsListModalVisible(true);
                    }}
                    style={[styles.statBadge, { backgroundColor: "#F3E8FF", paddingVertical: 10 }]}
                  >
                    <Text style={[styles.statBadgeLabel, { color: COLORS.PRIMARY, fontSize: 10, marginBottom: 2 }]}>CURRENT TENANTS</Text>
                    <Text style={[styles.statBadgeValue, { color: COLORS.PRIMARY, fontSize: 16 }]}>
                      {getCount(selectedFloor ?? "", selectedRoom ?? "")} Active
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.statBadge, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={[styles.statBadgeLabel, { color: COLORS.SUCCESS }]}>Available</Text>
                    <Text style={[styles.statBadgeValue, { color: COLORS.SUCCESS }]}>
                      {stayType === "hostel" ?
                        `${Math.max(0, getTotalBeds(selectedFloor ?? "", selectedRoom ?? "") - getCount(selectedFloor ?? "", selectedRoom ?? ""))} Beds` :
                        "1 Unit"}
                    </Text>
                  </View>
                </View>
                {/* Section Header hidden per user request as it's redundant with the button above */}
                {/* <View style={styles.modalSectionHeader}>
                  ...
                </View> */}

                <View style={{ height: 10 }} />
                <View style={{ height: 10 }} />

                {/* App Status Selection Selector */}
                <View style={[styles.formSection, { backgroundColor: "#F9FAFB", paddingVertical: 12 }]}>
                  <Text style={[styles.inputLabel, { marginBottom: 8, fontSize: 13, fontWeight: "700" }]}>Registration Type</Text>
                  <View style={{ flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 12, padding: 4 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: hasApp ? COLORS.PRIMARY : "transparent",
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row"
                      }}
                      onPress={() => setHasApp(true)}
                    >
                      <Text style={{ color: hasApp ? COLORS.WHITE : COLORS.TEXT_PRIMARY, fontWeight: "600", fontSize: 13 }}>Tenant Has App</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: !hasApp ? COLORS.PRIMARY : "transparent",
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row"
                      }}
                      onPress={() => setHasApp(false)}
                    >
                      <Text style={{ color: !hasApp ? COLORS.WHITE : COLORS.TEXT_PRIMARY, fontWeight: "600", fontSize: 13 }}>{"Tenant Doesn't Have App"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Personal Information Card */}
                <View style={[styles.formSection, styles.cardPersonal]}>
                  <View style={styles.formSectionTitle}>
                    <Ionicons name="person-circle" size={24} color={COLORS.PRIMARY} style={{ marginRight: 10 }} />
                    <Text style={[styles.formSectionTitle, { marginBottom: 0 }]}>Personal Information</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={[styles.inputWrapper, touchedName && !isValidName(tenantName) && styles.inputErrorBorder]}>
                      <Ionicons name="person-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                      <TextInput
                        value={tenantName}
                        onChangeText={(t) => { if (/^[A-Za-z\s]*$/.test(t)) setTenantName(t); }}
                        onBlur={() => setTouchedName(true)}
                        style={styles.modernInput}
                        placeholder="Full Name"
                        placeholderTextColor={COLORS.TEXT_LIGHT}
                      />
                    </View>
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Contact Number</Text>
                      <View style={[styles.inputWrapper, touchedPhone && !isValidPhone(contactNumber) && styles.inputErrorBorder]}>
                        <Ionicons name="call-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                        <TextInput
                          value={contactNumber}
                          onChangeText={(t) => setContactNumber(t.replace(/[^0-9]/g, "").slice(0, 11))}
                          onBlur={() => setTouchedPhone(true)}
                          style={styles.modernInput}
                          placeholder="Phone No"
                          keyboardType="numeric"
                          maxLength={11}
                        />
                      </View>
                    </View>
                  </View>


                </View>

                {/* Room & Bed Assignment Card */}
                <View style={[styles.formSection, styles.cardRoom]}>
                  <View style={styles.formSectionTitle}>
                    <Ionicons name="business-outline" size={24} color={COLORS.PRIMARY} style={{ marginRight: 10 }} />
                    <Text style={[styles.formSectionTitle, { marginBottom: 0 }]}>Room Assignment</Text>
                  </View>

                  <View style={[styles.rowContainer, { marginTop: 10 }]}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Floor</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: "#F9FAFB" }]}>
                        <Ionicons name="layers-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                        <Text style={[styles.modernInput, { color: COLORS.TEXT_PRIMARY, textAlignVertical: "center" }]}>
                          {selectedFloor ? String(selectedFloor).replace("Floor ", "") : "--"}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>
                        {stayType === "hostel" ? "Room" : stayType === "apartment" ? "Flat" : "Section"}
                      </Text>
                      <View style={[styles.inputWrapper, { backgroundColor: "#F9FAFB" }]}>
                        <Ionicons name="home-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                        <Text style={[styles.modernInput, { color: COLORS.TEXT_PRIMARY, textAlignVertical: "center" }]}>
                          {selectedRoom ? String(selectedRoom).replace("Section ", "").replace("Room ", "").replace("Flat ", "") : "--"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {stayType === "hostel" && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.inputLabel}>Select Available Bed</Text>
                      <View style={styles.bedSelectionGrid}>
                        {(() => {
                          const occupied = (tenants[`${selectedFloor}-${selectedRoom}`] ?? []).map((x) => x.bed);
                          const totalBeds = getTotalBeds(selectedFloor, selectedRoom);
                          return Array.from({ length: totalBeds }, (_, i) => i + 1).map((b) => {
                            const isOcc = occupied.includes(b);
                            const isSelected = bedNumber === b;
                            return (
                              <TouchableOpacity
                                key={b}
                                style={[
                                  styles.bedCard,
                                  isSelected && styles.bedCardSelected,
                                  isOcc && styles.bedCardOccupied,
                                  !isOcc && !isSelected && { borderColor: "#E5E7EB", borderWidth: 1 }
                                ]}
                                onPress={() => !isOcc && setBedNumber(b)}
                                disabled={isOcc}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name={isOcc ? "person" : "bed"}
                                  size={24}
                                  color={isSelected ? COLORS.WHITE : (isOcc ? COLORS.SUCCESS : COLORS.PRIMARY)}
                                />
                                <Text style={[
                                  styles.bedCardText,
                                  isSelected && styles.bedCardTextSelected,
                                  isOcc && { color: COLORS.SUCCESS, fontSize: 10, marginTop: 2, fontWeight: "bold" }
                                ]}>
                                  {isOcc ? "Occupied" : `Bed ${b}`}
                                </Text>
                                {isSelected && !isOcc && (
                                  <View style={styles.selectedBadge}>
                                    <Ionicons name="checkmark" size={10} color={COLORS.PRIMARY} />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          });
                        })()}
                      </View>
                    </View>
                  )}
                </View>

                {/* Lease & Terms Card */}
                <View style={[styles.formSection, styles.cardLease]}>
                  <View style={styles.formSectionTitle}>
                    <Ionicons name="document-lock-outline" size={24} color={COLORS.PRIMARY} style={{ marginRight: 10 }} />
                    <Text style={[styles.formSectionTitle, { marginBottom: 0 }]}>Lease & Identity</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Monthly Rent (₹)</Text>
                    <View style={[styles.inputWrapper, touchedRent && monthlyRent.trim().length === 0 && styles.inputErrorBorder]}>
                      <Ionicons name="cash-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                      <TextInput
                        value={monthlyRent}
                        onChangeText={(t) => setMonthlyRent(t.replace(/[^0-9]/g, ""))}
                        onBlur={() => setTouchedRent(true)}
                        style={styles.modernInput}
                        placeholder="Expected Rent Amount"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={[styles.inputGroup, styles.flex1]}>
                      <Text style={styles.inputLabel}>Check-in Date</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                        <TextInput
                          value={checkIn}
                          onChangeText={(t) => setCheckIn(t.replace(/[^\d/-]/g, ""))}
                          style={styles.modernInput}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                    </View>
                  </View>

                  {!hasApp && (
                    <>
                      <View style={[styles.inputGroup, { marginTop: 12 }]}>
                        <Text style={styles.inputLabel}>Aadhaar ID (Required)</Text>
                        <View style={[styles.inputWrapper, touchedAadharId && !/^\d{12}$/.test(aadharId) && styles.inputErrorBorder]}>
                          <Ionicons name="card-outline" size={20} color={COLORS.PRIMARY} style={styles.inputIcon} />
                          <TextInput
                            value={aadharId}
                            onChangeText={(t) => setAadharId(t.replace(/[^0-9]/g, "").slice(0, 12))}
                            onBlur={() => setTouchedAadharId(true)}
                            style={styles.modernInput}
                            placeholder="Enter Aadhaar No"
                            keyboardType="numeric"
                            maxLength={12}
                          />
                        </View>
                        {touchedAadharId && !/^\d{12}$/.test(aadharId) && (
                          <Text style={{ color: "red", fontSize: 11, marginTop: 4 }}>Aadhaar ID must be exactly 12 digits</Text>
                        )}
                      </View>

                      <View style={[styles.inputGroup, { marginTop: 12 }]}>
                        <Text style={styles.inputLabel}>Aadhaar Proof Image (Optional)</Text>
                        <TouchableOpacity
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F3F4F6",
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: "#D1D5DB",
                            borderStyle: "dashed",
                            justifyContent: "center"
                          }}
                          onPress={pickAadharProof}
                        >
                          <Ionicons name="cloud-upload-outline" size={22} color={COLORS.PRIMARY} style={{ marginRight: 8 }} />
                          <Text style={{ color: COLORS.TEXT_PRIMARY, fontWeight: "600" }}>
                            {aadharProofUri ? "Change Proof Image" : "Upload Aadhaar Front Page"}
                          </Text>
                        </TouchableOpacity>
                        {aadharProofUri ? (
                          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
                            <Image source={{ uri: aadharProofUri }} style={{ width: 80, height: 50, borderRadius: 6 }} />
                            <TouchableOpacity
                              onPress={() => setAadharProofUri("")}
                              style={{ marginLeft: 12, backgroundColor: "#FEE2E2", padding: 6, borderRadius: 6 }}
                            >
                              <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "700" }}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </>
                  )}

                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, isSavingTenant && { opacity: 0.7 }]}
                  disabled={isSavingTenant}
                  onPress={() => {
                    if (!isFormValid()) {
                      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                      if (!isValidName(tenantName)) return Alert.alert("Validation Error", "Please enter a valid Full Name.");
                      if (!isValidPhone(contactNumber)) return Alert.alert("Validation Error", "Please enter a valid Contact Number (at least 10 digits).");
                      if (monthlyRent.trim().length === 0) return Alert.alert("Validation Error", "Please enter the Monthly Rent.");
                      if (stayType === "hostel" && bedNumber < 1) return Alert.alert("Validation Error", "Please select a bed.");
                      if (!dateRegex.test(checkIn.trim())) return Alert.alert("Validation Error", "Please enter a valid Check-in Date (YYYY-MM-DD).");

                      if (!hasApp && !/^\d{12}$/.test(aadharId)) return Alert.alert("Validation Error", "Please enter a valid 12-digit Aadhaar ID.");
                      return Alert.alert("Validation Error", "Please check all fields.");
                    }
                    saveTenant();   
                  }}
                >
                  {isSavingTenant ? (
                    <ActivityIndicator color={COLORS.WHITE} size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Confirm Registration</Text>
                      <Ionicons name="checkmark-done" size={24} color={COLORS.WHITE} />
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ID Preview Modal */}
      <Modal transparent visible={idPreviewVisible} animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.TEXT_PRIMARY }]}>ID Preview</Text>
              <View style={styles.previewZoomControls}>
                <TouchableOpacity
                  style={styles.zoomIconBtn}
                  onPress={() => setPreviewScale(Math.max(1, previewScale - 0.2))}
                >
                  <Ionicons name="remove" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.zoomIndicator}>{Math.round(previewScale * 100)}%</Text>
                <TouchableOpacity
                  style={styles.zoomIconBtn}
                  onPress={() => setPreviewScale(Math.min(3, previewScale + 0.2))}
                >
                  <Ionicons name="add" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIdPreviewVisible(false)}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons name="close-circle" size={32} color={COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
              </View>
            </View>

            <PinchGestureHandler
              onGestureEvent={(e) => {
                const scale = e.nativeEvent.scale ?? 1;
                setPreviewScale((prev) => Math.min(3, Math.max(1, prev * scale)));
              }}
              onHandlerStateChange={onPinchStateChange}
            >
              <View style={styles.previewContent}>
                <ScrollView
                  contentContainerStyle={{ alignItems: "center" }}
                  showsVerticalScrollIndicator={false}
                >
                  {previewUri ? (
                    previewUri.toLowerCase().endsWith(".pdf") ? (
                      <WebView
                        source={{
                          uri: Platform.OS === "android" && /^https?:/i.test(previewUri)
                            ? "https://docs.google.com/gview?embedded=true&url=" + encodeURIComponent(previewUri)
                            : previewUri,
                        }}
                        style={{
                          width: Dimensions.get("window").width - 80,
                          height: 400 * previewScale,
                        }}
                      />
                    ) : (
                      <Image
                        source={{ uri: previewUri }}
                        style={{
                          width: Dimensions.get("window").width - 40,
                          height: 400 * previewScale,
                        }}
                        resizeMode="contain"
                      />
                    )
                  ) : (
                    <Text style={{ padding: 20 }}>No preview available</Text>
                  )}
                </ScrollView>
              </View>
            </PinchGestureHandler>
          </View>
        </View>
      </Modal>
      {/* NEW: Tenants List Modal */}
      <Modal
        visible={tenantsListModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTenantsListModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#FFF", width: "100%", maxHeight: "80%", borderRadius: 24, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY }}>Current Tenants</Text>
              <TouchableOpacity onPress={() => setTenantsListModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.TEXT_LIGHT} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 15 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {tenantsList.length > 0 ? tenantsList.map((tenantItem, idx) => (
                <View key={idx} style={{ marginBottom: 12, backgroundColor: "#F9FAFB", padding: 16, borderRadius: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY }}>{tenantItem.name}</Text>
                      <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 }}>Bed {tenantItem.bed}</Text>
                    </View>
                  </View>
                  <View style={{ height: 1, backgroundColor: "#EEE", marginVertical: 12 }} />

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <View style={{ flexDirection: "row", gap: 15, width: "100%", paddingBottom: 8 }}>
                      {!!tenantItem.rent && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="cash-outline" size={14} color={COLORS.PRIMARY} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.PRIMARY }}>₹{tenantItem.rent}</Text>
                        </View>
                      )}
                      {!!tenantItem.idUri && (
                        <TouchableOpacity
                          onPress={() => {
                            setPreviewUri(getAbsoluteUri(tenantItem.idUri));
                            setIdPreviewVisible(true);
                          }}
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons name="id-card-outline" size={14} color="#E74C3C" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 14, fontWeight: "600", color: "#E74C3C" }}>ID</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "space-between", width: "100%" }}>
                      <TouchableOpacity
                        onPress={() => {
                          const tel = `tel:${tenantItem.phone}`;
                          Linking.openURL(tel).catch(() => { });
                        }}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "rgba(39, 174, 96, 0.1)" }}
                      >
                        <Ionicons name="call" size={16} color={COLORS.SUCCESS} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.SUCCESS }}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => blockTenant(tenantItem)}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "rgba(243, 156, 18, 0.1)" }}
                      >
                        <Ionicons name="ban-outline" size={16} color="#F39C12" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#F39C12" }}>Block</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => editTenant(tenantItem)}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "rgba(95, 37, 159, 0.05)" }}
                      >
                        <Ionicons name="create-outline" size={16} color={COLORS.PRIMARY} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.PRIMARY }}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => deleteTenant(tenantItem)}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "rgba(231, 76, 60, 0.05)" }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#E74C3C" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#E74C3C" }}>{t("delete") || "Delete"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )) : (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                  <Text style={{ marginTop: 12, color: COLORS.TEXT_SECONDARY }}>No tenants currently in this room.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>



      {/* Language Selection Modal */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7eeee",
    padding: 10,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 5,
    letterSpacing: -0.5,
  },
  contentRow: {
    flexDirection: "row",
    gap: 8, // Reduced gap
    marginTop: 12, // Slightly tighter
  },
  sidebar: {
    width: Dimensions.get("window").width * 0.17,
    height: Dimensions.get("window").height * 0.58, // Match cardHeight
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3F4FB",
    marginVertical: 4, // Spaced out
  },
  sideButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sideButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "800",
    textAlign: "center",
  },
  sideButtonTextActive: {
    color: COLORS.WHITE,
  },
  sideBarProgress: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginTop: 6,
    overflow: "hidden",
  },
  sideBarProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f7eeee", // Match main background
    zIndex: 5,
  },
  slider: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardScroll: {
    flex: 1,
  },
  subHeader: {
    fontSize: 62,
    color: "gray",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
    paddingHorizontal: 15, // Added space before/after boxes
  },
  statBox: {
    flex: 1,
    minHeight: 85, // Slimmer boxes
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    width: 28, // Smaller icons
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18, // Slightly smaller text
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 0,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  floorTitle: {
    marginTop: 0,
    marginBottom: 8,
    fontWeight: "700",
    color: "#222",
    fontSize: 16,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
  },
  roomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roomBox: {
    width: "30.5%",
    aspectRatio: 1,
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  roomNumber: {
    color: COLORS.WHITE,
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roomText: {
    color: COLORS.WHITE,
    fontSize: 9.5,
    fontWeight: "700",
    opacity: 0.9,
    marginTop: 1,
  },
  plus: {
    color: "#fff",
    fontSize: 16,
    marginTop: 5,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  controlBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: COLORS.BACKGROUND,
    flex: 1,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.WHITE,
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 6,
    borderRadius: 12,
  },
  modalHeaderBar: {
    paddingTop: Platform.OS === "ios" ? 40 : 15,
    backgroundColor: COLORS.PRIMARY,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  modalStatsCards: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    marginBottom: 10,
  },
  statBadge: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  statBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  statBadgeValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalContentScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  formSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  cardPersonal: {
    backgroundColor: COLORS.WHITE,
    borderColor: "rgba(95, 37, 159, 0.1)", // PRIMARY with low opacity
    borderWidth: 1,
  },
  cardRoom: {
    backgroundColor: COLORS.WHITE,
    borderColor: "rgba(95, 37, 159, 0.1)",
    borderWidth: 1,
  },
  cardLease: {
    backgroundColor: COLORS.WHITE,
    borderColor: "rgba(95, 37, 159, 0.1)",
    borderWidth: 1,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
  },
  inputErrorBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.ERROR,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  bedSelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  bedCard: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: "relative",
  },
  bedCardSelected: {
    backgroundColor: COLORS.PRIMARY,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bedCardOccupied: {
    backgroundColor: "rgba(39, 174, 96, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(39, 174, 96, 0.3)",
  },
  bedCardText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 4,
  },
  bedCardTextSelected: {
    color: COLORS.WHITE,
  },
  selectedBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.PRIMARY,
  },
  uploadActionText: {
    marginLeft: 10,
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },
  idMiniPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.SUCCESS,
  },
  idMiniPreviewText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.SUCCESS,
    fontWeight: "600",
    marginLeft: 10,
  },
  viewIdBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 8,
  },
  viewIdText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: "800",
  },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 32,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.TEXT_LIGHT,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "800",
    marginRight: 10,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewCard: {
    width: "95%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 30,
    overflow: "hidden",
    maxHeight: "85%",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  previewZoomControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  zoomIndicator: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    minWidth: 50,
    textAlign: "center",
  },
  zoomIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  previewContent: {
    padding: 10,
    backgroundColor: "#F3F4F6",
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    paddingHorizontal: 6,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: "900",
  },
  tenantCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  tenantName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  tenantMeta: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
  },
  tenantDelete: {
    fontSize: 18,
    color: COLORS.ERROR,
    paddingHorizontal: 8,
  },
  emptyTenants: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  // --- PREMIUM REDESIGN STYLES ---
  headerHero: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 44,
    paddingBottom: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#6C2BD9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: "60%",
  },
  locationPillText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  frostedIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pulseBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6C2BD9",
  },
  greetingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  greetingTitle: {
    color: "#FFF",
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  premiumPropertyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
    maxWidth: "100%",
  },
  pulsingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 8,
  },
  premiumPropertyText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  premiumIllustrationContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  homeHeaderLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  glowRing1: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  glowRing2: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  inlineCardAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(108, 43, 217, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  buildingIllustration: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  glassAlert: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  glassAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  glassAlertText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  glassAlertTime: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 8,
  },
  premiumStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
    zIndex: 200,
  },
  statsCardPremium: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2.5,
    borderColor: "#FFF",
  },
  statsIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 22,
  },
  segmentedControlCenterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 4,
  },
  toggleContainerCentered: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    padding: 3,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleBtnMinimal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  toggleBtnDivider: {
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },
  toggleBtnMinimalActive: {
    backgroundColor: "#F3E8FF",
  },
  toggleTextMinimal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7C3AED",
  },
  toggleTextActive: {
    color: "#FFF",
  },
  floorPlanRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  floorSidebarCard: {
    width: 50,
    backgroundColor: "#FFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    paddingVertical: 8,
    alignItems: "center",
    height: Dimensions.get("window").height - 150,
  },
  floorSidebarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F8FC",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  floorSidebarPillActive: {
    backgroundColor: "#6C2BD9",
    borderColor: "#6C2BD9",
    shadowColor: "#6C2BD9",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  floorSidebarPillText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4B5563",
  },
  floorSidebarPillTextActive: {
    color: "#FFF",
  },
  roomGridCard: {
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    height: Dimensions.get("window").height - 150,
  },
  roomGridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
    paddingBottom: 10,
  },
  roomGridTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  roomGridSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  roomCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  premiumRoomCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderColor: "#EEF2F6",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  roomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomNoText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6C2BD9",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  bedsLabelText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
    marginTop: 4,
  },
  paymentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  paymentLabelText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  cardSeparator: {
    height: 1,
    backgroundColor: "#EEF2F6",
    marginVertical: 8,
  },
  roomCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  occupantRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 4,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  occupantName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  availableText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    fontStyle: "italic",
    flex: 1,
  },
  actionDotsBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(107, 114, 128, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardAddBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(108, 43, 217, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  listViewContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  listTenantCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  listTenantTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6C2BD9",
    justifyContent: "center",
    alignItems: "center",
  },
  listAvatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  listTenantName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  listTenantDetails: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  listCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  listSeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  listTenantBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  listMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginLeft: 4,
  },
  listActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyListCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  emptyListText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  shortcutsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  shortcutsScroll: {
    marginTop: 10,
    marginLeft: -20,
    marginRight: -20,
  },
  shortcutCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    width: 120,
    marginRight: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  shortcutIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",

    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  expensesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  expensesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  expensesTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  viewAllText: {
    fontSize: 14,
    color: "#6C2BD9",
    fontWeight: "600",
  },
  emptyExpensesCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyExpensesText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 12,
  },
  addExpenseBtnSmall: {
    backgroundColor: "#6C2BD9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addExpenseBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  expenseDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
    maxWidth: 180,
  },
  expenseDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#DC2626",
  },
  addExpenseBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6C2BD9",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
});
