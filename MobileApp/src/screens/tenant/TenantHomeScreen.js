import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import DateTimePicker from "@react-native-community/datetimepicker";   //1 2 3
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as DocumentPicker from "expo-document-picker";
import { useContext } from "react";
import { BookingContext } from "@/src/context/BookingContext";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { TenantContext } from "@/src/context/TenantContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { useLanguage } from "../../utils/LanguageContext";
import { useMaintenance } from "../../context/MaintenanceContext";
import { LinearGradient } from "expo-linear-gradient";
import FilterBottomSheet from "../../../components/FilterBottomScreen";
import { BookNowModal, ChangeHostelRequestForm } from "@/src/components/ChangeHostelModal";
import { useHostelChangeRequest } from "@/src/hooks/useHostelChangeRequest";
import * as Notifications from "../../utils/NotificationsProxy";
import Constants from "expo-constants";
import * as Device from "expo-device";

import {
  Animated,
  ImageBackground,
  BackHandler,
  Dimensions,
  Image,
  Linking,
  Modal,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import VacatePropertyModal from "../../components/VacatePropertyModal";
import VacateConfirmationModal from "../../components/VacateConfirmationModal";
import AccommodationChangeModal from "../../components/AccommodationChangeModal";
import ImageViewer from "react-native-image-zoom-viewer";

import axios from "axios";
import COLORS from "../../theme/colors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

// Map of canonical city name → list of all accepted aliases/typos
const CITY_ALIASES = {
  hyderabad: [
    "hyderabad", "hyderabd", "hyderad", "hydrabad", "hydarabad",
    "hyderbaad", "hiderabad", "hyd"
  ],
  bengaluru: [
    "bengaluru", "bangalore", "banglore", "banglor", "benglor",
    "bangalor", "bengalore", "blr"
  ],
  mumbai: ["mumbai", "bombay", "mumbai", "mumbay", "bomby", "bom"],
  delhi: ["delhi", "new delhi", "newdelhi", "nd", "dilli"],
  chennai: ["chennai", "madras", "chenai", "madras"],
  kolkata: ["kolkata", "calcutta", "kolkatta", "kolkota", "cal"],
  pune: ["pune", "poona", "puna"],
  ahmedabad: ["ahmedabad", "ahemdabad", "ahmadabad", "amdavad"],
  jaipur: ["jaipur", "jaipure", "jaypur"],
  surat: ["surat"],
  lucknow: ["lucknow", "lko"],
  kanpur: ["kanpur", "cawnpore"],
  nagpur: ["nagpur", "nagpure"],
  visakhapatnam: ["visakhapatnam", "vizag", "vishakhapatnam", "visakhapatanam"],
  bhopal: ["bhopal"],
  indore: ["indore"],
  patna: ["patna"],
  vadodara: ["vadodara", "baroda"],
  coimbatore: ["coimbatore", "coimbatur", "covai"],
  kochi: ["kochi", "cochin", "ernakulam"],
  thiruvananthapuram: ["thiruvananthapuram", "trivandrum", "tvm"],
  guwahati: ["guwahati", "gauhati"],
  chandigarh: ["chandigarh", "chd"],
  bhubaneswar: ["bhubaneswar", "bhubaneshwar", "bbsr"],
  dehradun: ["dehradun", "ddn"],
  noida: ["noida"],
  gurugram: ["gurugram", "gurgaon", "grg"],
  faridabad: ["faridabad"],
  agra: ["agra"],
  varanasi: ["varanasi", "banaras", "benares", "kashi"],
  mysuru: ["mysuru", "mysore"],
  mangaluru: ["mangaluru", "mangalore"],
  hubli: ["hubli", "hubballi"],
  belagavi: ["belagavi", "belgaum"],
  vijayawada: ["vijayawada", "vijayavada", "bezawada"],
  tirupati: ["tirupati", "tirupathi"],
  warangal: ["warangal"],
  nellore: ["nellore"],
  guntur: ["guntur"],
  rajahmundry: ["rajahmundry", "rajamahendravaram"],
};

// Neighborhood → canonical city mapping
const NEIGHBORHOOD_CITY_MAP = {
  // Hyderabad
  "durgam charuvu": "hyderabad", "durgam cheruvu": "hyderabad",
  "hitec city": "hyderabad", "hitech city": "hyderabad",
  "madhapur": "hyderabad", "gachibowli": "hyderabad",
  "kondapur": "hyderabad", "kukatpally": "hyderabad",
  "secunderabad": "hyderabad", "jubilee hills": "hyderabad",
  "banjara hills": "hyderabad", "ameerpet": "hyderabad",
  "charminar": "hyderabad", "miyapur": "hyderabad",
  "begumpet": "hyderabad", "dilshuknagar": "hyderabad",
  "lb nagar": "hyderabad", "uppal": "hyderabad",
  "kphb": "hyderabad", "nallagandla": "hyderabad",
  "narsingi": "hyderabad", "manikonda": "hyderabad",
  // Bangalore
  "whitefield": "bengaluru", "marathahalli": "bengaluru",
  "indiranagar": "bengaluru", "koramangala": "bengaluru",
  "jayanagar": "bengaluru", "electronic city": "bengaluru",
  "hebbal": "bengaluru", "byatarayanapura": "bengaluru",
  "yelahanka": "bengaluru", "banashankari": "bengaluru",
  "jp nagar": "bengaluru", "hsr layout": "bengaluru",
  "sarjapur": "bengaluru", "bellandur": "bengaluru",
  "btm layout": "bengaluru", "rajajinagar": "bengaluru",
  "malleshwaram": "bengaluru", "sadashivanagar": "bengaluru",
  // Mumbai
  "andheri": "mumbai", "bandra": "mumbai", "dadar": "mumbai",
  "borivali": "mumbai", "thane": "mumbai", "navi mumbai": "mumbai",
  "kurla": "mumbai", "juhu": "mumbai", "powai": "mumbai",
  // Delhi / NCR
  "connaught place": "delhi", "lajpat nagar": "delhi",
  "rohini": "delhi", "dwarka": "delhi", "saket": "delhi",
  "hauz khas": "delhi",
  // Chennai
  "t nagar": "chennai", "adyar": "chennai", "anna nagar": "chennai",
  "velachery": "chennai", "porur": "chennai", "omr": "chennai",
  // Pune
  "hinjewadi": "pune", "baner": "pune", "kothrud": "pune",
  "hadapsar": "pune", "wakad": "pune", "viman nagar": "pune",
};

const CITY_STATE_MAP = {
  hyderabad: "telangana", warangal: "telangana", nizamabad: "telangana", karimnagar: "telangana", khammam: "telangana",
  bengaluru: "karnataka", mysore: "karnataka", mysuru: "karnataka", mangalore: "karnataka", mangaluru: "karnataka", hubli: "karnataka", belgaum: "karnataka", belagavi: "karnataka",
  mumbai: "maharashtra", pune: "maharashtra", nagpur: "maharashtra", thane: "maharashtra", nashik: "maharashtra",
  delhi: "delhi", "new delhi": "delhi", dwarka: "delhi", rohini: "delhi", saket: "delhi",
  chennai: "tamil nadu", coimbatore: "tamil nadu", madurai: "tamil nadu", trichy: "tamil nadu", salem: "tamil nadu",
  visakhapatnam: "andhra pradesh", vizag: "andhra pradesh", vijayawada: "andhra pradesh", guntur: "andhra pradesh", nellore: "andhra pradesh", tirupati: "andhra pradesh", rajahmundry: "andhra pradesh",
  kochi: "kerala", cochin: "kerala", thiruvananthapuram: "kerala", trivandrum: "kerala", kozhikode: "kerala", thrissur: "kerala", kollam: "kerala",
  panaji: "goa", margao: "goa", "vasco da gama": "goa", mapusa: "goa",
  ahmedabad: "gujarat", surat: "gujarat", vadodara: "gujarat", baroda: "gujarat", rajkot: "gujarat", gandhinagar: "gujarat",
  jaipur: "rajasthan", jodhpur: "rajasthan", udaipur: "rajasthan", kota: "rajasthan", ajmer: "rajasthan",
  lucknow: "uttar pradesh", noida: "uttar pradesh", ghaziabad: "uttar pradesh", kanpur: "uttar pradesh", agra: "uttar pradesh", varanasi: "uttar pradesh",
  indore: "madhya pradesh", bhopal: "madhya pradesh", gwalior: "madhya pradesh", jabalpur: "madhya pradesh",
  ludhiana: "punjab", amritsar: "punjab", jalandhar: "punjab", patiala: "punjab",
  gurugram: "haryana", faridabad: "haryana", panchkula: "haryana", ambala: "haryana", karnal: "haryana"
};

const normalizeSearchText = (text, isSearchableText = false) => {
  if (!text) return "";
  let t = text.toLowerCase();

  // Step 1: Normalize all city aliases → canonical city name
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (t.includes(alias)) {
        t = t.split(alias).join(canonical);
      }
    }
  }

  // Step 2: For address/property text, enrich with city name if only neighborhood is present
  if (isSearchableText) {
    for (const [neighborhood, city] of Object.entries(NEIGHBORHOOD_CITY_MAP)) {
      if (t.includes(neighborhood) && !t.includes(city)) {
        t += " " + city;
      }
    }
    for (const [city, state] of Object.entries(CITY_STATE_MAP)) {
      if (t.includes(city) && !t.includes(state)) {
        t += " " + state;
      }
    }
  }

  return t;
};


const categories = [
  { id: "1", name: "All", icon: "grid-outline" },
  { id: "2", name: "Hostel", icon: "bed-outline" },
  { id: "3", name: "Apartment", icon: "business-outline" },
  { id: "4", name: "Commercial", icon: "briefcase-outline" },
];

export default function TenantHomeScreen({ route }) {
  const { t } = useLanguage();
  const bookingCtx = useContext(BookingContext);
  const submitOwnerRequest = bookingCtx?.submitOwnerRequest;
  const joinedProperty = bookingCtx?.joinedProperty;
  const isJoined = Boolean(bookingCtx?.isJoined && joinedProperty && joinedProperty.property_name !== "N/A");

  const [vacateModalVisible, setVacateModalVisible] = useState(false);
  const [vacateSubmitting, setVacateSubmitting] = useState(false);
  const [vacateRequestStatus, setVacateRequestStatus] = useState(null);
  const [accommodationModalVisible, setAccommodationModalVisible] = useState(false);
  const [accommodationType, setAccommodationType] = useState("FLOOR");

  useEffect(() => {
    const fetchVacateStatus = async () => {
      const phone = bookingCtx?.userPhone || (await AsyncStorage.getItem("tenantPhone"));
      if (phone && isJoined && joinedProperty) {
        try {
          const currentPropName = (joinedProperty.property_name || joinedProperty.name || "").toLowerCase().trim();
          const vRes = await fetchWithAuth(
            `${BASE_URL}/api/vacate/requests/?tenant_phone=${encodeURIComponent(phone)}`
          );
          if (vRes.ok) {
            const vJson = await vRes.json();
            const matchingPending = Array.isArray(vJson)
              ? vJson.find(
                  (r) =>
                    (r.property_name || r.propertyName || "").toLowerCase().trim() === currentPropName &&
                    (r.status || "").toLowerCase() === "pending"
                )
              : null;
            setVacateRequestStatus(matchingPending ? "Pending" : null);
          } else if (joinedProperty.has_pending_vacate) {
            setVacateRequestStatus("Pending");
          } else {
            setVacateRequestStatus(null);
          }
        } catch (ve) {
          console.log("Error fetching vacate status:", ve);
          setVacateRequestStatus(joinedProperty.has_pending_vacate ? "Pending" : null);
        }
      } else {
        setVacateRequestStatus(null);
      }
    };
    fetchVacateStatus();
  }, [bookingCtx?.userPhone, bookingCtx?.refreshTrigger, isJoined, joinedProperty]);

  const handleVacateConfirm = async () => {
    if (vacateSubmitting) return;
    if ((vacateRequestStatus || "").toLowerCase() === "pending") {
      Alert.alert("Request Pending ⏳", "You already have a pending vacate request. Please wait for the owner to respond.");
      return;
    }
    try {
      setVacateSubmitting(true);
      const tenantPhoneNum =
        bookingCtx?.userPhone ||
        joinedProperty?.tenant_phone ||
        joinedProperty?.phone ||
        (await AsyncStorage.getItem("tenantPhone")) ||
        "";

      if (!tenantPhoneNum) {
        Alert.alert("Error", "Tenant phone missing. Please log in again.");
        return;
      }

      const vacatePayload = {
        tenant_phone: tenantPhoneNum,
        owner_id: joinedProperty?.owner_id || joinedProperty?.owner_phone || joinedProperty?.owner,
        owner_phone: joinedProperty?.owner_phone || joinedProperty?.owner_id || joinedProperty?.owner,
        property_name: joinedProperty?.property_name || joinedProperty?.name || "Property",
        property_type: joinedProperty?.property_type || joinedProperty?.type || "hostel",
        remarks: "Tenant requested to vacate the property.",
      };

      const res = await fetchWithAuth(`${BASE_URL}/api/vacate/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vacatePayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || "Could not submit vacate request.");
      }

      setVacateRequestStatus(data.status || "Pending");
      if (bookingCtx?.setRefreshTrigger) {
        bookingCtx.setRefreshTrigger((prev) => prev + 1);
      }
      Alert.alert(
        data.existing ? "Request Pending ⏳" : "Vacate Request Submitted 🚀",
        data.message || "Your vacate request has been submitted to your property owner. You will remain in this property until the owner accepts your request."
      );
    } catch (e) {
      Alert.alert("Error", e.message || "Could not submit vacate request.");
    } finally {
      setVacateSubmitting(false);
    }
  };

  const handleAccommodationSubmit = async (payload) => {
    try {
      const tenantPhoneNum =
        bookingCtx?.userPhone ||
        joinedProperty?.tenant_phone ||
        joinedProperty?.phone ||
        joinedProperty?.phoneNumber ||
        joinedProperty?.mobile ||
        joinedProperty?.contactNumber ||
        (await AsyncStorage.getItem("tenantPhone")) ||
        (await AsyncStorage.getItem("userPhone")) ||
        "";

      const requestPayload = {
        type: "accommodation_change",
        subType: payload.changeType,
        title: `${payload.changeType} Change Request`,
        message: `${joinedProperty?.tenant_name || tenantPhoneNum || "Tenant"} requested ${payload.changeType.toLowerCase()} change to ${payload.requestedFloor || payload.requestedRoom || payload.requestedBed || "new allocation"}.`,
        status: "pending",
        tenant_name: joinedProperty?.tenant_name || "Tenant",
        tenant_phone: tenantPhoneNum,
        property_name: joinedProperty?.property_name || "Property",
        requested_floor: payload.requestedFloor,
        requested_room: payload.requestedRoom,
        requested_bed: payload.requestedBed,
        reason: payload.reason,
      };

      if (submitOwnerRequest) {
        submitOwnerRequest(requestPayload);
      }

      Alert.alert(
        "Request Submitted 🚀",
        `Your ${payload.changeType.toLowerCase()} change request has been sent to the property owner for approval.`
      );
    } catch (e) {
      Alert.alert("Error", "Could not submit request.");
    }
  };

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

  // PUSH NOTIFICATION SETUP
  useEffect(() => {

    registerForPushNotifications();

    const notificationListener =
      Notifications.addNotificationReceivedListener(notification => {

        console.log(
          "NOTIFICATION RECEIVED:",
          notification
        );

        fetchTenantRequests();
      });

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(response => {

        console.log(
          "NOTIFICATION CLICKED:",
          response
        );

        navigation.navigate("TenantNotification");
      });

    return () => {

      notificationListener.remove();
      responseListener.remove();

    };

  }, []);

  const registerForPushNotifications = async () => {

    try {
      if (!Device.isDevice) {

        console.log(
          "Push notifications require physical device"
        );

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
      console.log(
        "PROJECT ID:",
        Constants.expoConfig?.extra?.eas?.projectId
      );
      const tokenData =
        await Notifications.getExpoPushTokenAsync({
          projectId:
            Constants.expoConfig?.extra?.eas?.projectId,
        });

      const pushToken = tokenData.data;

      console.log("EXPO PUSH TOKEN:", pushToken);

      const tenantPhone =
        await AsyncStorage.getItem("tenantPhone");

      if (!tenantPhone) {
        console.log("Tenant phone missing");
        return;
      }

      const response = await fetchWithAuth(
        `${BASE_URL}/api/save-push-token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: tenantPhone,
            push_token: pushToken,
          }),
        }
      );

      const data = await response.json();

      console.log("TOKEN SAVE RESPONSE:", data);

    } catch (error) {

      console.log(
        "Push Notification Error:",
        error
      );
    }
  };

  // FILTER STATES
  const [showExploreProperties, setShowExploreProperties] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedHostelType, setSelectedHostelType] = useState("");
  const [selectedTenantType, setSelectedTenantType] = useState("");
  const [allProperties, setAllProperties] = useState([]);
  const [selectedCommercialFeature, setSelectedCommercialFeature] =
    useState("");

  const [nearMe, setNearMe] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasFetchedLocationRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshLocation = async () => {
    setRefreshing(true);
    hasFetchedLocationRef.current = false;
    await fetchProperties();
    await fetchTenantRequests();
    await getLocation();
    setRefreshing(false);
  };

  const [selectedProperty, setSelectedProperty] = useState(null);
  const bookingContext = useContext(BookingContext);

  const requests = bookingContext?.requests || [];
  const { tenantEmail, setTenantEmail } = useContext(TenantContext);
  const { setRequests, refreshTrigger } = useContext(BookingContext);
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Rehydrate TenantEmail if empty (e.g. after refresh or app restart)
  useEffect(() => {
    const checkEmail = async () => {
      if (!tenantEmail) {
        const stored = await AsyncStorage.getItem("tenantEmail");
        if (stored) {
          console.log("Rehydrating TenantContext with:", stored);
          setTenantEmail(stored);
        }
      }
    };
    checkEmail();
  }, []);

  // Hostel Change Request States & Hook
  const { checkBookingStatus, createChangeRequest, getAvailableHostels, loading: hcLoading } = useHostelChangeRequest();
  const [bookNowModalVisible, setBookNowModalVisible] = useState(false);
  const [changeFormVisible, setChangeFormVisible] = useState(false);
  const [targetHostelInfo, setTargetHostelInfo] = useState(null);
  const [currentHostelInfo, setCurrentHostelInfo] = useState(null);
  const [availableHostelList, setAvailableHostelList] = useState([]);

  const formatCheckInDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "12 Jul 2025";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleString("en-US", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "05 Aug 2025";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleString("en-US", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: "Invite friends to Rennto and earn rewards for your next payment! Download the app: https://rennto.in",
      });
    } catch (error) {
      console.log("Error sharing invite:", error);
    }
  };

  const unreadCount = bookingContext?.unreadNotificationCount || 0;
  const badgeText = unreadCount > 99 ? "99+" : `${unreadCount}`;

  useFocusEffect(
    useCallback(() => {
      bookingContext?.fetchUnreadCount?.();
    }, [])
  );

  const fetchTenantRequests = () => {
    // Rely on BookingContext to fetch and sync state. Just trigger a refresh if needed.
    bookingContext?.setRefreshTrigger?.(prev => prev + 1);
  };

  // Animation logic for pulsating notification
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [unreadCount]);

  const fetchProperties = async (coords = null) => {
    try {
      setLoading(true);
      console.log("Fetching properties...");

      let url = `${BASE_URL}/api/owner_props/`;
      const currentCoords = coords || userCoords;
      if (currentCoords) {
        url += `?latitude=${currentCoords.latitude}&longitude=${currentCoords.longitude}`;
        if (nearMe > 0) {
          url += `&radius=${nearMe}`;
        }
      }

      const response = await fetchWithAuth(url);
      const result = await response.json();

      console.log("API RESPONSE:", result);

      const MEDIA_URL = `${BASE_URL}/media/`;

      const formattedData = result.data.map((item) => {
        let mainImage = item.image
          ? item.image.startsWith("http")
            ? item.image
            : MEDIA_URL + item.image
          : null;

        let galleryImages = item.gallery
          ? item.gallery.map((img) =>
            img.startsWith("http") ? img : MEDIA_URL + img
          )
          : [];

        if (!mainImage && galleryImages.length > 0) {
          mainImage = galleryImages[0];
        }

        return {
          id: String(item.id),
          type: item.type || "Property",

          hostelType: item.hostelType || "N/A",
          allowedTenants: item.allowedTenants || "Anyone",

          name: item.name || "Unnamed Property",
          address: item.address || "No Address",
          contact: item.contact || "No Contact",

          ownerPhone: item.owner_phone,
          owner_id: item.owner_id,

          latitude: item.latitude ? parseFloat(item.latitude) : null,
          longitude: item.longitude ? parseFloat(item.longitude) : null,
          distance_km: item.distance_km ? parseFloat(item.distance_km).toFixed(1) : null,

          image: mainImage || "https://via.placeholder.com/400",

          isAvailable: item.isAvailable ?? true,
          ownerName: item.owner_name || "Owner",

          facilities: item.facilities || [],
          galleryImages: galleryImages,

          commercialType: item.commercialType || "",
          officeType: item.officeType || "",
          rent: item.rent || "",
          floors: item.floors || [],
        };
      });

      console.log("PROPERTIES LOADED:", formattedData.length);
      setAllProperties(formattedData);
    } catch (error) {
      console.log("Fetch Properties Error:", error);
    } finally {
      setLoading(false);
    }
  };


  const [locationName, setLocationName] = useState(t("fetching_location") || "Fetching location...");
  const [isModalVisible, setModalVisible] = useState(false);
  const [mainSearch, setMainSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [maxRent, setMaxRent] = useState(100000);
  const filterSheetRef = useRef(null);

  // New strict filter states
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [sortBy, setSortBy] = useState("Recommended");

  const handleApplyFilters = (filters) => {
    setFilterState(filters.state || "");
    setFilterCity(filters.city || "");
    setFilterArea(filters.area || "");
    setNearMe(filters.distance || 0);

    if (filters.category) {
      if (selectedType !== filters.category) {
        setSelectedType(filters.category);
        setSelectedHostelType("");
        setSelectedTenantType("");
        setSelectedCommercialFeature("");
      }
    }

    setSelectedFacilities(filters.amenities || []);
    setMaxRent(filters.maxPrice || 100000);
    setSortBy(filters.sortBy || "Recommended");
  };




  const handlePress = (item) => {
    navigation.navigate("PropertyDetailsScreen", { property: item });
  };

  useFocusEffect(
    useCallback(() => {
      bookingCtx?.fetchRequests?.();
      bookingCtx?.fetchUnreadCount?.();
      fetchProperties();
      if (!hasFetchedLocationRef.current) {
        hasFetchedLocationRef.current = true;
        getLocation()
          .then((coords) => {
            if (coords) fetchProperties(coords);
          })
          .catch(() => {});
      }
    }, [])
  );

  // Removed useEffect for fetchProperties to avoid continuous API calls on filter change

  useEffect(() => {
    if (route?.params?.property) {
      navigation.navigate("PropertyDetailsScreen", { property: route.params.property });
      navigation.setParams({ property: undefined });
    } else if (route?.params?.propertyName) {
      const prop = allProperties.find(p => p.name === route.params.propertyName);
      if (prop) {
        navigation.navigate("PropertyDetailsScreen", { property: prop });
        navigation.setParams({ propertyName: undefined });
      }
    }
  }, [route?.params?.property, route?.params?.propertyName, allProperties]);

  // NEW: One-time Welcome Screen check for newly accepted tenants
  useEffect(() => {
    const checkWelcome = async () => {
      const acceptedReq = requests.find(r => r.status?.toLowerCase() === "accepted" && r.status?.toLowerCase() !== "withdrawn");
      if (acceptedReq) {
        const welcomeSeen = await AsyncStorage.getItem("welcomeSeen");
        if (welcomeSeen !== "true") {
          navigation.replace("WelcomeScreen", {
            propertyName: acceptedReq.propertyName || acceptedReq.property_name,
          });
        }
      }
    };
    if (requests.length > 0) {
      checkWelcome();
    }
  }, [requests]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTenantRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [tenantEmail]);

  useEffect(() => {
    const backAction = () => {
      if (selectedProperty) {
        setSelectedProperty(null); // go back to property list
        return true; // prevent default back action
      }
      return false; // allow normal back
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [selectedProperty]);

  const getLocation = async () => {
    try {
      setLocationName(t("fetching_location") || "Fetching location...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName(t("permission_denied") || "Location permission denied");
        return null;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      // 1. Update Coords for the distance formula
      setUserCoords({ latitude, longitude });

      // 2. Clear manual search text so it doesn't conflict with local results
      setMainSearch("");

      let addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        setLocationName(`${addr.district || addr.name}, ${addr.city}`);
      }
      return { latitude, longitude };
    } catch (error) {
      console.log(error);
      setLocationName("Unable to fetch location");
      return null;
    }
  };



  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // KM

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const normalizeFacility = (name) => {
    if (!name) return "";
    let clean = name.toLowerCase().trim();
    if (clean === "elevator" || clean === "lift") return "lift";
    if (clean === "power backup" || clean === "powerbackup") return "power_backup";
    if (clean === "play area" || clean === "playarea") return "play_area";
    return clean.replace(/\s+/g, '_');
  };

  // Filtering Logic
  // Filtering Logic (Wrapped in useMemo for performance)
  const filteredProperties = useMemo(() => {

    // 1. Filter
    const filtered = allProperties.filter((item) => {

      const normalizedAddress = normalizeSearchText(item.address || "", true);

      // Check hierarchical location matches
      const matchesState = !filterState || normalizedAddress.includes(filterState.toLowerCase().trim());
      const matchesCity = !filterCity || normalizedAddress.includes(filterCity.toLowerCase().trim());
      const matchesArea = !filterArea || normalizedAddress.includes(filterArea.toLowerCase().trim());

      // Fallback search match for the main search bar (if it's not overridden by filters)
      const searchText = normalizeSearchText(mainSearch.trim(), false);
      const searchableText = normalizeSearchText(`
        ${item.name || ""} ${item.address || ""} ${item.type || ""}
      `, true).replace(/,/g, " ").replace(/\s+/g, " ");

      const matchesSearch = searchText === "" || searchableText.includes(searchText);

      // Category
      const matchesType = selectedType === "All" || item.type === selectedType;

      // Distance
      let matchesDistance = true;
      if (nearMe > 0) {
        if (!userCoords || !item.latitude || !item.longitude) {
          matchesDistance = false;
        } else {
          const distance = getDistance(
            userCoords.latitude,
            userCoords.longitude,
            item.latitude,
            item.longitude
          );
          matchesDistance = distance <= nearMe;
        }
      }

      // Amenities
      const matchesFacilities = selectedFacilities.length === 0 ||
        selectedFacilities.every((f) => {
          const normF = normalizeFacility(f);
          return item.facilities?.some((itemFac) => normalizeFacility(itemFac) === normF);
        });

      // Sub Filters
      let matchesSpecial = true;
      if (selectedHostelType && item.type === "Hostel") {
        matchesSpecial = (item.hostelType || "").toLowerCase() === selectedHostelType.toLowerCase();
      }
      if (selectedTenantType && item.type === "Apartment") {
        matchesSpecial = (item.allowedTenants || "").toLowerCase().trim() === selectedTenantType.toLowerCase();
      }
      if (selectedCommercialFeature && item.type === "Commercial") {
        const commercialValue = (item.commercialType || item.officeType || "").toLowerCase().trim();
        matchesSpecial = commercialValue === selectedCommercialFeature.toLowerCase();
      }

      // Rent
      let matchesRent = true;
      if (maxRent && maxRent < 100000) {
        const r = parseFloat(item.rent);
        if (!isNaN(r)) {
          matchesRent = r <= maxRent;
        }
      }

      return (
        matchesState &&
        matchesCity &&
        matchesArea &&
        matchesSearch &&
        matchesType &&
        matchesDistance &&
        matchesFacilities &&
        matchesSpecial &&
        matchesRent &&
        item.isAvailable
      );
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      const normalize = (str) => (str || "").replace(/\s+/g, '').toLowerCase();

      // PRIORITY: ACCEPTED PROPERTIES ALWAYS FIRST
      const latestA = requests.find(r => normalize(r.propertyName || r.property_name) === normalize(a.name));
      const isAcceptedA = latestA?.status?.toLowerCase() === "accepted" || latestA?.status?.toLowerCase() === "completed" || latestA?.status?.toLowerCase() === "allotted";

      const latestB = requests.find(r => normalize(r.propertyName || r.property_name) === normalize(b.name));
      const isAcceptedB = latestB?.status?.toLowerCase() === "accepted" || latestB?.status?.toLowerCase() === "completed" || latestB?.status?.toLowerCase() === "allotted";

      if (isAcceptedA && !isAcceptedB) return -1;
      if (!isAcceptedA && isAcceptedB) return 1;

      // APPLY USER SELECTED SORT
      if (sortBy === "Price Low-High") {
        return (parseFloat(a.rent) || 0) - (parseFloat(b.rent) || 0);
      } else if (sortBy === "Price High-Low") {
        return (parseFloat(b.rent) || 0) - (parseFloat(a.rent) || 0);
      } else if ((sortBy === "Nearest First" || sortBy === "Recommended") && userCoords) {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = getDistance(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude);
        const distB = getDistance(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
        return distA - distB;
      }

      // Default Recommended (already sorted by Priority, or just fallback to ID/name)
      return 0;
    });

  }, [
    allProperties, mainSearch, filterState, filterCity, filterArea,
    selectedType, nearMe, userCoords, selectedFacilities, selectedHostelType,
    selectedTenantType, selectedCommercialFeature, maxRent, sortBy, requests
  ]);
  const handleSelectType = (type) => {

    if (selectedType === type) {
      setSelectedType("All");
    } else {
      setSelectedType(type);
    }

    setSelectedHostelType("");
    setSelectedTenantType("");
    setSelectedCommercialFeature("");
  };

  const resetAllFilters = () => {
    setSelectedFacilities([]);
    setSelectedHostelType("");
    setSelectedTenantType("");
    setSelectedCommercialFeature("");
    setNearMe(0);
    setSelectedType("All");
    setMainSearch("");
    setFilterState("");
    setFilterCity("");
    setFilterArea("");
    setSortBy("Recommended");
    setMaxRent(100000);
  };
  const activeFilterCount = [
    nearMe > 0,

    selectedType !== "All",
    selectedHostelType !== "",
    selectedTenantType !== "",
    selectedCommercialFeature !== "",
    selectedFacilities.length > 0,
  ].filter(Boolean).length;


  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={homeStyles.container}
        edges={["left", "right", "bottom"]}
      >
        {/* Header */}
        {/* HERO SECTION */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshLocation} />
          }
        >
          {bookingContext?.isJoined && joinedProperty && joinedProperty.property_name !== "N/A" ? (
            <ImageBackground
              source={
                joinedProperty.property_image
                  ? { uri: joinedProperty.property_image }
                  : require("../../../assets/images/tenantBackground.jpg")
              }
              style={homeStyles.joinedHeroSection}
              imageStyle={homeStyles.joinedHeroBgImage}
            >
              {/* Overlay for readability */}
              <View style={homeStyles.overlay} />

              {/* TOP ROW WITH NOTIFICATION */}
              <View style={homeStyles.topRow}>
                <View style={homeStyles.joinedStatusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                  <Text style={homeStyles.joinedStatusText}>{t("joined_property") || "Joined Property"}</Text>
                </View>

                <View style={homeStyles.heroIcons}>
                  <TouchableOpacity
                    style={homeStyles.heroIconBtn}
                    onPress={() => navigation.navigate("TenantNotification")}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={22}
                      color="#fff"
                    />
                    {unreadCount > 0 && (
                      <View style={homeStyles.heroBadge}>
                        <Text style={homeStyles.heroBadgeText}>
                          {badgeText}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* PROPERTY INFORMATION */}
              <View style={homeStyles.joinedHeroContent}>
                <Text style={homeStyles.joinedPropertyType}>
                  {(joinedProperty.property_type ? (t(joinedProperty.property_type.toLowerCase()) || joinedProperty.property_type) : (t("joined") || "Joined")).toUpperCase()}
                </Text>
                <Text style={homeStyles.joinedPropertyName} numberOfLines={1}>
                  {joinedProperty.property_name}
                </Text>
                <View style={homeStyles.joinedLocationWrapper}>
                  <Ionicons name="location" size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={homeStyles.joinedLocationText} numberOfLines={2}>
                    {joinedProperty.location || "No Address Available"}
                  </Text>
                </View>
              </View>

              {/* SEARCH */}
              <View style={homeStyles.newSearchBar}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#999"
                />
                <TextInput
                  style={homeStyles.newSearchInput}
                  placeholder={t("search_location_property") || "Search location, property..."}
                  placeholderTextColor="#999"
                  value={mainSearch}
                  onChangeText={(text) => setMainSearch(text)}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={homeStyles.filterBtn}
                  onPress={() => filterSheetRef.current?.present()}
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color="#6C63FF"
                  />
                  <Text style={homeStyles.filterText}>
                    {t("filters") || "Filters"}
                    {activeFilterCount > 0
                      ? ` (${activeFilterCount})`
                      : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          ) : (
            <ImageBackground
              source={require("../../../assets/images/tenantBackground.jpg")}
              style={homeStyles.heroSection}
              imageStyle={homeStyles.heroBgImage}
            >
              {/* TOP ROW */}
              <View style={homeStyles.topRow}>
                <View style={homeStyles.locationWrapper}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="#fff"
                  />
                  <Text
                    numberOfLines={1}
                    style={homeStyles.locationText}
                  >
                    {locationName}
                  </Text>
                </View>

                <View style={homeStyles.heroIcons}>
                  <TouchableOpacity
                    style={homeStyles.heroIconBtn}
                    onPress={() => navigation.navigate("TenantNotification")}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={22}
                      color="#fff"
                    />
                    {unreadCount > 0 && (
                      <View style={homeStyles.heroBadge}>
                        <Text style={homeStyles.heroBadgeText}>
                          {badgeText}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* TITLE */}
              <View style={homeStyles.heroContent}>
                <Text style={homeStyles.heroTitle}>
                  {t("find_perfect_space") || "Find Your\nPerfect Space"}
                </Text>
                <Text style={homeStyles.heroSubtitle}>
                  {t("perfect_space_subtitle") || "Hostels, Apartments & Commercial spaces near you"}
                </Text>
              </View>

              {/* SEARCH */}
              <View style={homeStyles.newSearchBar}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#999"
                />
                <TextInput
                  style={homeStyles.newSearchInput}
                  placeholder={t("search_location_placeholder") || "Search location, property..."}
                  placeholderTextColor="#999"
                  value={mainSearch}
                  onChangeText={(text) => setMainSearch(text)}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={homeStyles.filterBtn}
                  onPress={() => filterSheetRef.current?.present()}
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color="#6C63FF"
                  />
                  <Text style={homeStyles.filterText}>
                    {t("filter") || "Filters"}
                    {activeFilterCount > 0
                      ? ` (${activeFilterCount})`
                      : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          )}

          {/* JOINED TENANT MY STAY DASHBOARD */}
          {isJoined && joinedProperty && joinedProperty.property_name !== "N/A" ? (
            <View style={homeStyles.myStayContainer}>
              {/* ACTIVE STAY SUMMARY CARD */}
              <View style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 18,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#1F2937" }} numberOfLines={1}>
                      {joinedProperty.property_name || joinedProperty.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                      {joinedProperty.location || joinedProperty.address || "Active Residence"}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#166534" }}>Active Stay</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
                  <View style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
                      Type: {joinedProperty.property_type || joinedProperty.type || "Hostel"}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
                      Floor: {joinedProperty.floor || joinedProperty.floor_number || joinedProperty.floor_no || "1"}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
                      Room: {joinedProperty.room || joinedProperty.room_number || joinedProperty.room_no || "101"}
                    </Text>
                  </View>
                  {Boolean(joinedProperty.bed || joinedProperty.bed_number) && (
                    <View style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#374151" }}>
                        Bed: {joinedProperty.bed || joinedProperty.bed_number}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={homeStyles.myStayHeaderRow}>
                <Text style={homeStyles.myStayTitle}>
                  {t("my_stay") || "My Stay"}
                </Text>
              </View>

              <View style={homeStyles.myStayGrid}>
                {/* 1. Vacate Property Card */}
                <TouchableOpacity
                  style={homeStyles.myStayCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    if ((vacateRequestStatus || "").toLowerCase() === "pending") {
                      Alert.alert("Request Pending ⏳", "Your vacate request is waiting for the owner to accept or decline.");
                      return;
                    }
                    setVacateModalVisible(true);
                  }}
                >
                  <View style={[homeStyles.myStayIconCircle, { backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                  </View>
                  <Text style={homeStyles.myStayCardTitle}>Vacate Property</Text>
                  <Text style={homeStyles.myStayCardSub}>
                    {(vacateRequestStatus || "").toLowerCase() === "pending"
                      ? "Vacate request is pending owner approval."
                      : (vacateRequestStatus || "").toLowerCase() === "declined"
                        ? "Last vacate request was declined. You remain in this property."
                        : "Request to vacate your current property."}
                  </Text>
                  <View style={[homeStyles.myStayRequestBtn, { backgroundColor: "#FEF2F2" }]}>
                    <Text style={[homeStyles.myStayRequestBtnText, { color: "#EF4444" }]}>
                      {(vacateRequestStatus || "").toLowerCase() === "pending" ? "Pending Approval" : "Request"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Change Floor Card (Hostel & Apartment) */}
                {((joinedProperty?.property_type || joinedProperty?.type || "").toLowerCase().includes("hostel") ||
                  (joinedProperty?.property_type || joinedProperty?.type || "").toLowerCase().includes("apartment")) && (
                  <TouchableOpacity
                    style={homeStyles.myStayCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setAccommodationType("FLOOR");
                      setAccommodationModalVisible(true);
                    }}
                  >
                    <View style={[homeStyles.myStayIconCircle, { backgroundColor: "#F3E8FF" }]}>
                      <Ionicons name="layers-outline" size={24} color="#7C3AED" />
                    </View>
                    <Text style={homeStyles.myStayCardTitle}>Change Floor</Text>
                    <Text style={homeStyles.myStayCardSub}>Request a floor change in this property.</Text>
                    <View style={[homeStyles.myStayRequestBtn, { backgroundColor: "#F3E8FF" }]}>
                      <Text style={[homeStyles.myStayRequestBtnText, { color: "#7C3AED" }]}>Request</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 3. Change Room Card (Hostel Only) */}
                {(joinedProperty?.property_type || joinedProperty?.type || "").toLowerCase().includes("hostel") && (
                  <TouchableOpacity
                    style={homeStyles.myStayCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setAccommodationType("ROOM");
                      setAccommodationModalVisible(true);
                    }}
                  >
                    <View style={[homeStyles.myStayIconCircle, { backgroundColor: "#DBEAFE" }]}>
                      <Ionicons name="business-outline" size={24} color="#2563EB" />
                    </View>
                    <Text style={homeStyles.myStayCardTitle}>Change Room</Text>
                    <Text style={homeStyles.myStayCardSub}>Request a room change in this property.</Text>
                    <View style={[homeStyles.myStayRequestBtn, { backgroundColor: "#DBEAFE" }]}>
                      <Text style={[homeStyles.myStayRequestBtnText, { color: "#2563EB" }]}>Request</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 4. Change Bed Card (Hostel Only) */}
                {(joinedProperty?.property_type || joinedProperty?.type || "").toLowerCase().includes("hostel") && (
                  <TouchableOpacity
                    style={homeStyles.myStayCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setAccommodationType("BED");
                      setAccommodationModalVisible(true);
                    }}
                  >
                    <View style={[homeStyles.myStayIconCircle, { backgroundColor: "#FFEDD5" }]}>
                      <Ionicons name="bed-outline" size={24} color="#D97706" />
                    </View>
                    <Text style={homeStyles.myStayCardTitle}>Change Bed</Text>
                    <Text style={homeStyles.myStayCardSub}>Request a bed change in this property.</Text>
                    <View style={[homeStyles.myStayRequestBtn, { backgroundColor: "#FFEDD5" }]}>
                      <Text style={[homeStyles.myStayRequestBtnText, { color: "#D97706" }]}>Request</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 5. Check-in Date Card */}
                <View style={[homeStyles.myStayCard, homeStyles.checkInCard]}>
                  <View style={[homeStyles.myStayIconCircle, { backgroundColor: "#D1FAE5" }]}>
                    <Ionicons name="calendar-outline" size={24} color="#059669" />
                  </View>
                  <Text style={homeStyles.dateCardLabel}>CHECK-IN DATE</Text>
                  <Text style={homeStyles.checkInDateValue}>
                    {formatCheckInDate(joinedProperty?.checkIn || joinedProperty?.check_in || joinedProperty?.check_in_date || joinedProperty?.joining_date)}
                  </Text>
                </View>

                {/* 6. Rent Due Card */}
                <View style={[homeStyles.myStayCard, homeStyles.rentDueCard]}>
                  <View style={[homeStyles.myStayIconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={homeStyles.rentDueLabel}>RENT DUE</Text>
                  <Text style={homeStyles.rentDueValue}>
                    {formatDueDate(joinedProperty?.next_due_date || joinedProperty?.due_date || joinedProperty?.rent_due_date)}
                  </Text>
                </View>
              </View>

              {/* Invite Friends Banner */}
              <LinearGradient
                colors={["#7C3AED", "#6D28D9", "#5B21B6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={homeStyles.inviteFriendsBanner}
              >
                <View style={homeStyles.inviteContent}>
                  <Text style={homeStyles.inviteTitle}>Invite Friends</Text>
                  <Text style={homeStyles.inviteSub}>
                    Invite friends to Rennto and earn rewards for your next payment.
                  </Text>
                  <TouchableOpacity
                    style={homeStyles.inviteBtn}
                    activeOpacity={0.9}
                    onPress={handleShareInvite}
                  >
                    <Text style={homeStyles.inviteBtnText}>Invite Now</Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="people-outline" size={72} color="rgba(255, 255, 255, 0.2)" style={homeStyles.inviteBgIcon} />
              </LinearGradient>
            </View>
          ) : null}

          {/* EXPLORE CATEGORIES & PROPERTY LISTINGS (VISIBLE TO ALL / SCROLL DOWN FOR JOINED TENANTS) */}
          <View>
            <View style={{ backgroundColor: "#fff", paddingBottom: 5, marginTop: isJoined && joinedProperty && joinedProperty.property_name !== "N/A" ? 12 : 0 }}>
              <View style={homeStyles.categoryHeadingRow}>
                <Text style={homeStyles.categoryHeading}>
                  {isJoined && joinedProperty && joinedProperty.property_name !== "N/A"
                    ? (t("explore_other_properties") || "Explore Other Properties")
                    : (t("explore_categories") || "Explore by Categories")}
                </Text>
              </View>
              <View style={homeStyles.customCategoryWrapper}>
                <TouchableOpacity
                  style={[homeStyles.customCard, { backgroundColor: "#7c3aed" }]}
                  onPress={() => navigation.navigate("HostelScreen")}
                >
                  <Image
                    source={require("../../../assets/images/hostelLogo.png")}
                    style={homeStyles.customCardImage}
                    resizeMode="contain"
                  />
                  <Text style={homeStyles.customCardTitle}>
                    {t("hostels") || "Hostels"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[homeStyles.customCard, { backgroundColor: "#60a5fa" }]}
                  onPress={() => navigation.navigate("ApartmentScreen")}
                >
                  <Image
                    source={require("../../../assets/images/apartmentLogo.png")}
                    style={homeStyles.customCardImage}
                    resizeMode="contain"
                  />
                  <Text style={homeStyles.customCardTitle}>
                    {t("apartments") || "Apartments"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[homeStyles.customCard, { backgroundColor: "#fb923c" }]}
                  onPress={() => navigation.navigate("CommercialScreen")}
                >
                  <Image
                    source={require("../../../assets/images/commercialLogo.png")}
                    style={homeStyles.customCardImage}
                    resizeMode="contain"
                  />
                  <Text style={homeStyles.customCardTitle}>
                    {t("commercial") || "Commercial"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={homeStyles.propertyGrid}>
              {filteredProperties.map((item) => {
                const normalize = (str) => (str || "").replace(/\s+/g, '').toLowerCase();
                const latestReq = requests.find(r =>
                  normalize(r.propertyName || r.property_name) === normalize(item.name)
                );
                const showBadge = latestReq && latestReq.status && latestReq.status !== 'none';

                return (
                  <TouchableOpacity
                    key={`${item.id}-${item.type}`}
                    activeOpacity={0.9}
                    style={homeStyles.gridItem}
                    onPress={() => handlePress(item)}
                  >
                    <View style={homeStyles.card}>
                      <Image
                        source={{ uri: item.image || item.galleryImages?.[0] }}
                        style={homeStyles.cardImg}
                        resizeMode="cover"
                        onError={() => console.log("Card image failed:", item.image)}
                      />

                      <View style={homeStyles.cardBody}>
                        <View style={homeStyles.row}>
                          <Text style={homeStyles.cardName}>{item.name}</Text>
                          {showBadge ? (
                            <View style={[
                              homeStyles.statusBadge,
                              {
                                backgroundColor:
                                  latestReq.status?.toLowerCase() === "completed" ||
                                    latestReq.status?.toLowerCase() === "joined" ||
                                    latestReq.status?.toLowerCase() === "active"
                                    ? "#27ae60"
                                    : latestReq.status?.toLowerCase() === "accepted" ||
                                      latestReq.status?.toLowerCase() === "allotted"
                                      ? "#3498db"
                                      : latestReq.status?.toLowerCase() === "rejected"
                                        ? "#e74c3c"
                                        : "#f39c12"
                              }
                            ]}>
                              <Text style={homeStyles.statusText}>
                                {
                                  latestReq.status?.toLowerCase() === "completed" ||
                                    latestReq.status?.toLowerCase() === "joined" ||
                                    latestReq.status?.toLowerCase() === "active"
                                    ? (t("joined") || "JOINED").toUpperCase()
                                    : (t(latestReq.status?.toLowerCase()) || latestReq.status)?.toUpperCase()
                                }
                              </Text>
                            </View>
                          ) : (
                            item.isAvailable && (
                              <View style={[homeStyles.statusBadge, { backgroundColor: "#3498db" }]}>
                                <Text style={homeStyles.statusText}>{(t("vacant") || "VACANT").toUpperCase()}</Text>
                              </View>
                            )
                          )}
                        </View>
                        <Text style={homeStyles.cardSub} numberOfLines={2}>
                          {t(item.type?.toLowerCase()) || item.type} • {item.address}
                        </Text>
                        {item.rent ? (
                          <Text style={homeStyles.cardRent}>
                            ₹{item.rent} / {t("month_suffix") || "month"}
                          </Text>
                        ) : null}
                        {item.distance_km != null ? (
                          <Text style={homeStyles.cardDistance}>
                            {item.distance_km} {t("km_away") || "km away"}
                          </Text>
                        ) : item.distance != null ? (
                          <Text style={homeStyles.cardDistance}>
                            {item.distance} {t("km_away") || "km away"}
                          </Text>
                        ) : (
                          <Text style={homeStyles.cardDistance}>
                            0.0 {t("km_away") || "km away"}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {filteredProperties.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={homeStyles.noResults}>No properties found.</Text>
            </View>
          )}
        </ScrollView>

        <FilterBottomSheet
          ref={filterSheetRef}
          onApply={handleApplyFilters}
          onReset={resetAllFilters}
          allProperties={allProperties}
        />

        {/* VACATE PROPERTY CONFIRMATION MODAL */}
        <VacateConfirmationModal
          visible={vacateModalVisible}
          onClose={() => setVacateModalVisible(false)}
          onConfirm={handleVacateConfirm}
          propertyName={joinedProperty?.property_name}
        />

        {/* ACCOMMODATION CHANGE REUSABLE MODAL */}
        <AccommodationChangeModal
          visible={accommodationModalVisible}
          onClose={() => setAccommodationModalVisible(false)}
          onSubmit={handleAccommodationSubmit}
          changeType={accommodationType}
          currentAllocation={{
            floor: joinedProperty?.floor || joinedProperty?.floor_no || "2nd Floor",
            room: joinedProperty?.room || joinedProperty?.room_no || "204",
            bed: joinedProperty?.bed || joinedProperty?.bed_no || "Bed 2",
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export function PropertyDetailsScreen(props) {
  const { t } = useLanguage();
  const { maintenanceMode } = useMaintenance();
  const isReadOnly = maintenanceMode === 'READ_ONLY';
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
  const route = useRoute();
  useEffect(() => {
    const loadPhone = async () => {
      const phone = await AsyncStorage.getItem("tenantPhone");
      console.log("Loaded Tenant Phone:", phone);
    };
    loadPhone();
  }, []);
  const property = props.property || route?.params?.property;
  const onBack = props.onBack || (() => navigation.goBack());
  const fetchTenantRequests = props.fetchTenantRequests || route?.params?.fetchTenantRequests;
  const fetchProperties = props.fetchProperties || route?.params?.fetchProperties;

  const navigation = useNavigation();
  const { tenantEmail, tenantPhone } = useContext(TenantContext);
  const bookingContext = useContext(BookingContext);
  const { requests = [], setRequests, isJoined, joinedProperty } = bookingContext || {};

  // Hostel Change Request States & Hook for PropertyDetailsScreen
  const { checkBookingStatus, createChangeRequest, getAvailableHostels, loading: hcLoading } = useHostelChangeRequest();
  const [bookNowModalVisible, setBookNowModalVisible] = useState(false);
  const [changeFormVisible, setChangeFormVisible] = useState(false);
  const [targetHostelInfo, setTargetHostelInfo] = useState(null);
  const [currentHostelInfo, setCurrentHostelInfo] = useState(null);
  const [availableHostelList, setAvailableHostelList] = useState([]);
  const [hcBookingStatus, setHcBookingStatus] = useState(null);

  const refreshHcBookingStatus = async () => {
    try {
      const storedPhone = await AsyncStorage.getItem("tenantPhone");
      if (storedPhone && property?.id && isJoined) {
        const statusRes = await checkBookingStatus(storedPhone, property.id);
        setHcBookingStatus(statusRes);
      }
    } catch (e) {
      console.log("Error checking hc status:", e);
    }
  };

  useEffect(() => {
    if (isJoined && property?.id) {
      refreshHcBookingStatus();
    }
  }, [property, isJoined]);

  // Find initial status from context to avoid flickering
  const initialStatus = requests.find(r => r.propertyName === property.name)?.status || "none";
  const [requestStatus, setRequestStatus] = useState(initialStatus);

  useEffect(() => {
    let interval;

    const fetchStatus = async () => {
      try {
        const tenantPhone = await AsyncStorage.getItem("tenantPhone");
        if (!tenantPhone || (!property?.contact && !property?.owner_id)) return;

        const res = await fetchWithAuth(
          `${BASE_URL}/api/check_request_status/${encodeURIComponent(tenantPhone)}/${encodeURIComponent(property.owner_id || property.contact)}/${encodeURIComponent(property.name)}/`
        );

        const data = await res.json();

        let finalStatus = data.status;

        // Override with local mock request status if exists (to prevent auto reload for existing tenant mocks)
        if (bookingContext?.requests) {
          const mockReq = bookingContext.requests.find(r => r.is_mock && r.property_name === property?.name);
          if (mockReq) {
            finalStatus = mockReq.status;
          }
        }

        setRequestStatus(prev => {
          if (prev === "withdrawn") return prev; // prevent auto reload from resetting withdrawn state
          return finalStatus;
        });
      } catch (error) {
        console.log("Status fetch error", error);
      }
    };

    fetchStatus(); // initial call

    interval = setInterval(fetchStatus, 5000); // 🔥 poll every 5 sec

    return () => clearInterval(interval);
  }, [property, tenantEmail]);

  // Removed auto-redirect loop to WelcomeScreen for accepted properties

  let buttonText = t("book_now") || "Book Now";
  let buttonAction = "book";
  let buttonDisabled = false;
  let buttonColor = COLORS.PRIMARY;

  const normalizedStatus = (requestStatus || "").toLowerCase();

  if (normalizedStatus === "pending") {
    buttonText = t("withdraw_request") || "Withdraw Request";
    buttonAction = "withdraw";
    buttonDisabled = false;
    buttonColor = "#e74c3c"; // Red color for withdraw
  }
  else if (
    ["completed", "joined", "active", "occupied"].includes(normalizedStatus)
  ) {
    buttonText = t("joined") || "Joined";
    buttonAction = "none";
    buttonDisabled = true;
    buttonColor = "#27ae60";
  }
  else if (["accepted", "allotted"].includes(normalizedStatus)) {
    buttonText = t("accepted") || "Accepted"; // As per prompt requirement
    buttonAction = "status";
    buttonDisabled = false;
    buttonColor = "#2ecc71";
  }
  else if (normalizedStatus === "rejected" || normalizedStatus === "withdrawn" || normalizedStatus === "removed") {
    buttonText = t("book_now_again") || "Book Now Again"; // As per prompt requirement
    buttonAction = "book";
    buttonColor = COLORS.PRIMARY;
    buttonDisabled = false;
  }
  else {
    buttonText = t("book_now") || "Book Now";
    buttonAction = "book";
    buttonColor = COLORS.PRIMARY;
  }
  // const { tenantEmail } = useContext(TenantContext);
  const [reviewImage, setReviewImage] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);

  const [bookingVisible, setBookingVisible] = useState(false);
  const [checkIn, setCheckInInternal] = useState("");

  const setCheckIn = (newVal, reason) => {
    console.log(`\n[DEBUG JOINING DATE] TenantHomeScreen.js | Line ??? | Reason: ${reason}`);
    console.log(`[DEBUG JOINING DATE] Prev: "${checkIn}" | New: "${newVal}"`);
    setCheckInInternal(newVal);
  };

  console.log(`[DEBUG JOINING DATE RENDER] Current checkIn value: "${checkIn}"`);
  const todayStartMinDate = useRef(new Date(new Date().setHours(0,0,0,0))).current;
  const [sharing, setSharing] = useState("");

  const [bhkType, setBhkType] = useState("");
  const [tenantType, setTenantType] = useState("");
  const [officeType, setOfficeType] = useState("");
  const [area, setArea] = useState("");

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");

  const galleryImages =
    property.galleryImages && property.galleryImages.length > 0
      ? property.galleryImages
      : property.image
        ? [property.image]
        : ["https://via.placeholder.com/400"];

  // Add this near your other useState hooks
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [aadharId, setAadharId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBackFile, setSelectedBackFile] = useState(null);
  const [selectedSelfie, setSelectedSelfie] = useState(null);
  const [selectedPaymentScreenshot, setSelectedPaymentScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Tenant Selection Modals State
  const [tenantTypeModalVisible, setTenantTypeModalVisible] = useState(false);
  const [existingTenantModalVisible, setExistingTenantModalVisible] = useState(false);

  // Existing Tenant Structure State
  const [etFloor, setEtFloor] = useState("");
  const [etRoom, setEtRoom] = useState(""); // used for Room, Flat, Unit
  const [etBed, setEtBed] = useState(""); // used for Bed
  const [etSharing, setEtSharing] = useState(""); // used for Sharing in Apartment
  const [propertyStructure, setPropertyStructure] = useState({ floors: {} });

  const fetchPropertyStructure = async (prop) => {
    const ownerId = prop?.owner_id || prop?.contact;
    if (!ownerId) return;
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/details/${encodeURIComponent(ownerId)}/`);
      if (res.ok) {
        const data = await res.json();
        setPropertyStructure(data || { building_layout: [] });
      }
    } catch (e) {
      console.log("Error fetching property structure:", e);
    }
  };

  // New dynamic flow states
  const [occupiedPopupVisible, setOccupiedPopupVisible] = useState(false);
  const [occupiedDetails, setOccupiedDetails] = useState(null);

  // Add Unit Modal States
  const [addUnitModalVisible, setAddUnitModalVisible] = useState(false);
  const [newUnitFloor, setNewUnitFloor] = useState("");
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [newUnitType, setNewUnitType] = useState("");
  const [addedUnits, setAddedUnits] = useState([]);

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
    if (checkReadOnly()) return;
    const activePhone = await AsyncStorage.getItem("tenantPhone");
    if (!activePhone) {
      Alert.alert("Error", "Tenant details not found. Please log in again.");
      return;
    }

    if (!selectedFile || !aadharId) {
      Alert.alert("Error", "Please enter Aadhaar ID and upload Aadhaar image.");
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
        name: selectedFile.name || "aadhar.jpg",
        type: selectedFile.mimeType || "image/jpeg"
      });
      if (selectedBackFile) {
        formData.append("aadhar_back_image", {
          uri: selectedBackFile.uri,
          name: selectedBackFile.name || "aadhar_back.jpg",
          type: selectedBackFile.mimeType || "image/jpeg"
        });
      }
      if (selectedPaymentScreenshot) {
        formData.append("payment_screenshot", {
          uri: selectedPaymentScreenshot.uri,
          name: selectedPaymentScreenshot.name || "payment_proof.jpg",
          type: selectedPaymentScreenshot.mimeType || "image/jpeg"
        });
      }

      const res = await fetchWithAuth(`${BASE_URL}/api/tenant/submit_verification/`, {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();

      if (res.ok) {
        setUploading(false);
        setShowIdModal(false);
        Alert.alert("Success", "Identity proof submitted successfully! You are now joined.");
        if (bookingContext?.setRefreshTrigger) {
          bookingContext.setRefreshTrigger(prev => prev + 1);
        }
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

  const facilityIcons = {
    WiFi: "wifi",
    Food: "silverware-fork-knife",
    AC: "air-conditioner",
    Laundry: "washing-machine",
    Security: "shield-check",
    "24/7 Security": "shield-check",
    Housekeeping: "broom",
    Parking: "parking",
    Lift: "elevator",
    Gym: "dumbbell",
    "Power Backup": "battery-charging",
    Balcony: "home-floor-1",
    "Conference Room": "account-group",
    Reception: "desk",
    CCTV: "cctv",
    "Central AC": "air-conditioner",
  };


  const reviews = [
    {
      id: "1",
      user: "Rahul S.",
      rating: 5,
      comment:
        "Amazing place! The staff is very helpful and the Wi-Fi is fast.",
      date: "2 days ago",
    },
    {
      id: "2",
      user: "Anjali P.",
      rating: 4,
      comment:
        "Very clean rooms and great location. Highly recommended for students.",
      date: "1 week ago",
    },
    {
      id: "3",
      user: "Amit K.",
      rating: 5,
      comment: "Best value for money in this area. Very secure.",
      date: "Oct 2025",
    },
  ];

  if (!property)
    return (
      <View style={styles.center}>
        <Text>No Property Data</Text>
      </View>
    );

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.name}\nLocation: ${property.address || "In the city"}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const zoomImages = galleryImages.map((img) => ({
    url: img,
    props: { resizeMode: "contain" },
  }));

  const handleReviewSubmit = () => {
    if (userRating === 0) {
      alert("Please select a rating!");
      return;
    }
    alert(`Thank you! Review submitted with ${userRating} stars!`);
    setModalVisible(false);
    setUserComment("");
    setUserRating(5); // Reset to default
  };

  const makeCall = () => Linking.openURL(`tel:${property.contact}`);
  const openWhatsApp = () =>
    Linking.openURL(
      `whatsapp://send?phone=${property.contact}&text=Hi, I am interested in ${property.name}`,
    );

  const openInGoogleMaps = () => {
    const latitude = property.latitude;
    const longitude = property.longitude;
    const address = property.address;

    if (!latitude && !longitude && !address) {
      alert("Location not available");
      return;
    }

    const destination = (latitude && longitude)
      ? `${latitude},${longitude}`
      : encodeURIComponent(address);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url);
  };

  const confirmBooking = async () => {
    if (checkReadOnly()) return;
    try {
      if (isJoined && (!joinedProperty || joinedProperty.property_name?.trim() !== property.name?.trim())) {
        const storedPhone = await AsyncStorage.getItem("tenantPhone");
        if (storedPhone && property.id) {
          try {
            const statusRes = await checkBookingStatus(storedPhone, property.id);
            if (statusRes.status === "already_staying") {
              setCurrentHostelInfo(statusRes.current_hostel || { name: joinedProperty?.property_name || "Current Hostel", location: "" });
              setTargetHostelInfo({ id: property.id, name: property.name, location: property.address });
              setBookNowModalVisible(true);
              return;
            } else if (statusRes.status === "pending_request") {
              Alert.alert("Request Pending ⏳", statusRes.message || "You have a pending hostel change request for this property.");
              return;
            } else if (statusRes.status === "approved_request") {
              Alert.alert("Request Approved ✅", "Your hostel change request has been approved! Proceeding with room/bed selection.");
            }
          } catch (e) {
            console.log("Check booking status error:", e);
            setCurrentHostelInfo({ name: joinedProperty?.property_name || "Current Hostel", location: "" });
            setTargetHostelInfo({ id: property.id, name: property.name, location: property.address });
            setBookNowModalVisible(true);
            return;
          }
        } else {
          setCurrentHostelInfo({ name: joinedProperty?.property_name || "Current Hostel", location: "" });
          setTargetHostelInfo({ id: property.id, name: property.name, location: property.address });
          setBookNowModalVisible(true);
          return;
        }
      }
      // --- 1. Date Validation ---
      if (!checkIn.trim()) {
        alert("Please enter a Check-in date");
        return;
      }
      
      const checkInDate = new Date(checkIn);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of today

      if (checkInDate < today) {
        alert("Please select today or a future date for Check-in.");
        return;
      }

      // --- 2. Property Type Validation ---
      if (property.type === "Hostel") {
        const sharingNum = Number(sharing);
        if (!sharing || isNaN(sharingNum) || sharingNum <= 0 || sharingNum > 8) {
          alert("Please enter a valid sharing preference (1 to 8 persons)");
          return;
        }
      }

      if (property.type === "Apartment") {
        if (!bhkType.trim()) {
          alert("Please specify BHK type (e.g., 2BHK)");
          return;
        }
        if (!tenantType) {
          alert("Please select Tenant Type (Family or Bachelor)");
          return;
        }
      }

      if (property.type === "Commercial") {
        const areaNum = Number(area);
        if (!officeType.trim()) {
          alert("Please enter the Office Type");
          return;
        }
        if (!area || isNaN(areaNum) || areaNum <= 0) {
          alert("Please enter a valid area in sq.ft");
          return;
        }
      }

      // --- 3. Booking JSON ---
      const bookingData = {
        propertyId: property.id,
        propertyName: property.name,
        propertyType: property.type,
        address: property.address,
        contact: property.contact,
        checkInDate: checkIn,
        sharing: property.type === "Hostel" ? sharing : null,
        bhk: property.type === "Apartment" ? bhkType : null,
        tenantType: property.type === "Apartment" ? tenantType : null,
        officeType: property.type === "Commercial" ? officeType : null,
        area: property.type === "Commercial" ? area : null,
        bookingTime: new Date().toISOString(),
      };

      console.log("Booking JSON:", bookingData);

      // --- 4. Send Join Request ---
      const tenantPhone = await AsyncStorage.getItem("tenantPhone");

      if (!tenantPhone) {
        alert("Tenant phone missing. Please login again.");
        return;
      }

      if (!property.contact) {
        alert("Owner phone missing");
        return;
      }

      console.log("Tenant Phone:", tenantPhone);
      console.log("Owner Phone:", property.contact);

      const response = await fetchWithAuth(
        `${BASE_URL}/api/send_request/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_phone: tenantPhone,
            owner_id: property.owner_id || "",
            owner_phone: property.contact,

            property_name: property.name,
            property_type: property.type,

            check_in: checkIn || "N/A",
            check_out: "N/A",

            sharing: sharing || "",

            flat: bhkType || "",

            section: officeType || area || "",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // alert(`Booking Request Sent! 🎉\nWe will contact you shortly regarding ${property.name}.`);
        console.log("Server Response:", data);
        setRequestStatus("pending");
      } else {
        alert(data.error || data.message || "Failed to send booking request");
        console.log("Server Error:", data);
      }

      // --- 5. Reset States ---
      setCheckIn("", "Resetting form after booking request attempt");
      setSharing("");
      setBhkType("");
      setOfficeType("");
      setArea("");
      setTenantType("");
      setBookingVisible(false);

    } catch (error) {
      console.log("Booking Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const performWithdraw = async () => {
    if (checkReadOnly()) return;
    try {
      const activePhone = await AsyncStorage.getItem("tenantPhone");
      if (!activePhone) {
        alert("Tenant phone missing. Please login again.");
        return;
      }

      const normalize = (str) => (str || "").replace(/\s+/g, '').toLowerCase();
      // Optimistic update for immediate feedback in the list
      console.log("--- WITHDRAW ACTION START ---");
      console.log("Property Name:", property.name);
      console.log("Owner Email:", property.contact);
      console.log("Tenant Phone:", activePhone);

      // Intercept local mock requests for Existing Tenant flow
      if (bookingContext?.requests && bookingContext?.updateOwnerRequestStatus) {
        const mockReq = bookingContext.requests.find(r => r.is_mock && r.property_name === property?.name);
        if (mockReq) {
          bookingContext.updateOwnerRequestStatus(mockReq.id, "withdrawn");
          setRequestStatus("withdrawn");
          setStatusModalVisible(false);
          
          return; // Skip real backend call for mock requests
        }
      }

      // Optimistic update for immediate feedback in the list
      if (setRequests) {
        console.log("Performing Optimistic Sync...");
        setRequests(prev => {
          return prev.map(r => {
            const rName = normalize(r.propertyName || r.property_name);
            const pName = normalize(property.name);
            const rOwner = normalize(r.contact || r.owner_phone);
            const pOwner = normalize(property.contact);

            const nameMatch = rName === pName;
            const ownerMatch = rOwner === pOwner;

            if (nameMatch && ownerMatch && ["pending", "accepted", "allotted"].includes(r.status)) {
              console.log(`Optimistic Match Found! Updating request ${r.id} to withdrawn`);
              return { ...r, status: "withdrawn" };
            }
            return r;
          });
        });
      }

      const res = await fetchWithAuth(`${BASE_URL}/api/withdraw_request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_phone: activePhone,
          owner_id: property.owner_id || "",
          owner_phone: property.contact,
          property_name: property.name,
        }),
      });
      const data = await res.json();
      console.log("Withdraw API Response:", data);

      // Final sync from backend
      if (fetchTenantRequests) {
        console.log("Re-fetching tenant requests for final sync...");
        await fetchTenantRequests();
      }
      if (fetchProperties) fetchProperties();
      if (bookingContext?.setRefreshTrigger) {
        bookingContext.setRefreshTrigger(prev => prev + 1);
      }

      setStatusModalVisible(false);
      setRequestStatus("withdrawn");

      if (data.updated_count === 0) {
        console.warn("API reported 0 records updated. Possibly no matching active request.");
        alert("This request was already withdrawn or could not be found.");
        if (fetchTenantRequests) fetchTenantRequests();
      } else {
        console.log(`Successfully withdrawn ${data.updated_count} records.`);
        
      }
    } catch (error) {
      console.error("Withdraw Error:", error);
      alert("Failed to withdraw request.");
      if (fetchTenantRequests) fetchTenantRequests();
    }
  };

  const handleBookingAction = async () => {
    try {
      // 👉 OPEN FORM
      if (buttonAction === "book") {
        if (
          isJoined && 
          (!joinedProperty || joinedProperty.property_name?.trim() !== property.name?.trim())
        ) {
          const storedPhone = await AsyncStorage.getItem("tenantPhone");
          if (storedPhone && property.id) {
            try {
              const statusRes = await checkBookingStatus(storedPhone, property.id);
              setHcBookingStatus(statusRes);
              if (statusRes.status === "already_staying") {
                setCurrentHostelInfo(statusRes.current_hostel || { name: joinedProperty?.property_name || "Current Hostel", location: "" });
                setTargetHostelInfo({ id: property.id, name: property.name, location: property.address });
                setBookNowModalVisible(true);
                return;
              } else if (statusRes.status === "pending_request") {
                Alert.alert("Request Pending ⏳", statusRes.message || "Your hostel change request is currently pending owner response.");
                return;
              } else if (statusRes.status === "approved_request") {
                Alert.alert("Request Approved ✅", "Your hostel change request has been approved by the owner! Please select your floor, room, and bed.");
                setTenantTypeModalVisible(true);
                return;
              }
            } catch (e) {
              console.log("Check booking status error:", e);
              setCurrentHostelInfo({ name: joinedProperty?.property_name || "Current Hostel", location: "" });
              setTargetHostelInfo({ id: property.id, name: property.name, location: property.address });
              setBookNowModalVisible(true);
              return;
            }
          } else {
            setCurrentHostelInfo({ name: joinedProperty?.property_name || "Current Hostel", location: "" });
            setTargetHostelInfo({ id: property.id, name: property.name, location: property.address });
            setBookNowModalVisible(true);
            return;
          }
        }
        setTenantTypeModalVisible(true);
        return;
      }

      // 👉 WITHDRAW REQUEST
      if (buttonAction === "withdraw") {
        Alert.alert(
          "Withdraw Request",
          "Are you sure you want to withdraw your booking request?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Withdraw", style: "destructive", onPress: performWithdraw }
          ]
        );
        return;
      }

      // 👉 OPEN STATUS MODAL (For Accepted/Joined)
      if (requestStatus === "accepted" || requestStatus === "completed" || requestStatus === "allotted") {
        if (requestStatus === "completed") {
          setStatusModalVisible(true);
        } else {
          setShowIdModal(true);
        }
        return;
      }
    } catch (error) {
      console.log("Booking action error:", error);
    }
  };
  const pickReviewImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        alert("Permission denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;

        // Get file name
        const fileName = uri.split("/").pop();
        const extension = fileName.split(".").pop().toLowerCase();

        // Check file type
        if (!["jpg", "jpeg", "pdf"].includes(extension)) {
          alert("Only JPG, JPEG or PDF files are allowed");
          return;
        }

        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const sizeInKb = fileInfo.size / 1024;

        console.log("File size:", sizeInKb);

        if (sizeInKb > 100) {
          alert("File must be under 100KB");
          return;
        }

        setReviewImage(uri);
      }
    } catch (error) {
      console.log("Image Picker Error:", error);
      alert("Something went wrong while picking image.");
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={onShare} style={styles.backBtn}>
            <Ionicons name="share-outline" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <Image
          source={{ uri: property.image || property.galleryImages?.[0] }}
          style={styles.mainImage}
          onError={() => console.log("Main image failed:", property.image)}
        />

        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.name}>
              {requestStatus === "accepted" ? `${t("welcome_to") || "Welcome to"} ${property.name}` : property.name}
            </Text>
            <View style={[
              styles.statusBadge,
              (requestStatus === "completed" ||
                requestStatus === "joined" ||
                requestStatus === "active") && {
                backgroundColor: "#27ae60"
              },

              (requestStatus === "accepted" ||
                requestStatus === "allotted") && {
                backgroundColor: "#3498db"
              },
              requestStatus === "pending" && { backgroundColor: "#f39c12" },
              requestStatus === "rejected" && { backgroundColor: "#e74c3c" }
            ]}>
              <Text style={[
                styles.statusText,
                (requestStatus === "accepted" || requestStatus === "completed" || requestStatus === "allotted" || requestStatus === "pending" || requestStatus === "rejected") && { color: "#fff" }
              ]}>
                {
                  requestStatus === "completed" ||
                    requestStatus === "joined" ||
                    requestStatus === "active"
                    ? (t("joined") || "Joined")

                    : requestStatus === "accepted" ||
                      requestStatus === "allotted"
                      ? (t("accepted") || "Accepted")

                      : requestStatus === "pending"
                        ? (t("pending") || "Pending")

                        : requestStatus === "rejected"
                          ? (t("rejected") || "Rejected")

                          : (property.isAvailable ? (t("vacant") || "Vacant") : (t("full") || "Full"))
                }
              </Text>
            </View>
          </View>

          <Text style={styles.typeText}>
            {property.type}
          </Text>

          <Text style={{ fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 4, fontWeight: "700" }}>
            Owned by {property.ownerName || "Owner"}
          </Text>

          {property.rent ? (
            <Text style={{ fontSize: 18, color: COLORS.PRIMARY, marginTop: 10, fontWeight: "800" }}>
              ₹{property.rent} / month
            </Text>
          ) : null}
          {property.type === "Apartment" && property.floors && property.floors.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>{t("available_units") || "Available Units"}</Text>
              {property.floors.map((floorData, idx) => (
                <View key={`floor-${idx}`} style={{
                  backgroundColor: "#f8f9fa",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#eee"
                }}>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: "#333", marginBottom: 8 }}>
                    {t("floor") || "Floor"} {floorData.floor}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {Object.entries(floorData.units).map(([unitType, count], uIdx) => (
                      <View key={`unit-${uIdx}`} style={{
                        backgroundColor: COLORS.PRIMARY + "15",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: COLORS.PRIMARY + "30",
                      }}>
                        <Text style={{ color: COLORS.PRIMARY, fontWeight: "600", fontSize: 13 }}>
                          {unitType}  ({count} {count === 1 ? (t("flat") || 'Flat') : (t("flats") || 'Flats')})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>{t("facilities") || "Facilities"}</Text>

          <View style={styles.amenitiesGrid}>
            {property.facilities?.map((facility, index) => {
              const formatted =
                facility.charAt(0).toUpperCase() + facility.slice(1);

              return (
                <View key={`${facility}-${index}`} style={styles.amenityItem}>
                  <MaterialCommunityIcons
                    name={facilityIcons[formatted] || "check-circle"}
                    size={22}
                    color={COLORS.PRIMARY}
                  />
                  <Text style={styles.amenityLabel}>{t(facility.toLowerCase()) || formatted}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.sectionTitle}>{t("location") || "Location"}</Text>

          {((property.latitude && property.longitude) || property.address) ? (
            <View style={styles.mapContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={openInGoogleMaps}
                style={styles.map}
              >
                <View pointerEvents="none" style={styles.map}>
                  <Image
                    source={require("../../../assets/images/map.png")}
                    style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                  />
                </View>
              </TouchableOpacity>
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  right: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  padding: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#333",
                    }}
                    numberOfLines={2}
                  >
                    {property.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                  onPress={openInGoogleMaps}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 11,
                    }}
                  >
                    {t("open_maps") || "Open Maps"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#f5f5f5",
                padding: 20,
                borderRadius: 15,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="location"
                size={50}
                color={COLORS.PRIMARY}
              />

              <Text
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  color: "#555",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                {property.address}
              </Text>

              <TouchableOpacity
                style={{
                  marginTop: 15,
                  backgroundColor: COLORS.PRIMARY,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
                onPress={openInGoogleMaps}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {t("open_in_google_maps") || "Open in Google Maps"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.sectionTitle}>{t("property_gallery") || "Property Gallery"}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
          >
            {galleryImages.map((img, index) => (
              <TouchableOpacity
                key={`${img}-${index}`}
                onPress={() => {
                  setViewerIndex(index);
                  setSelectedGalleryIndex(index);
                }}
              >

                <Image
                  source={{ uri: img }}
                  style={styles.galleryImage}
                  onError={() => console.log("Gallery image failed:", img)}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

        </View>
      </ScrollView>

      {/* --- REVIEW MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate your experience</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setReviewImage(null); // Clear image on close
                }}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingSubtitle}>Tap a star to rate</Text>

            <View style={styles.starRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setUserRating(star)}
                  style={styles.starWrapper}
                >
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={40}
                    color={star <= userRating ? "#FFD700" : "#ccc"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="How was the stay? The facilities? The location?"
              multiline
              numberOfLines={4}
              value={userComment}
              onChangeText={setUserComment}
            />

            {/* --- NEW: IMAGE UPLOAD SECTION --- */}
            <Text
              style={[
                styles.ratingSubtitle,
                { textAlign: "left", marginBottom: 5 },
              ]}
            >
              Add file (JPG / JPEG / PDF • Max 100KB)
            </Text>
            <View style={styles.uploadContainer}>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={pickReviewImage}
              >
                {reviewImage ? (
                  <Image
                    source={{ uri: reviewImage }}
                    style={styles.previewThumbnail}
                  />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="camera" size={24} color={COLORS.PRIMARY} />
                    <Text style={styles.uploadText}>Upload</Text>
                  </View>
                )}
              </TouchableOpacity>

              {reviewImage && (
                <TouchableOpacity
                  style={styles.removeImgBtn}
                  onPress={() => setReviewImage(null)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
                  <Text style={{ color: "#ff4d4d", fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    userComment.length > 0 ? COLORS.PRIMARY : "#aab8ff",
                },
              ]}
              onPress={() => {
                handleReviewSubmit();
                setReviewImage(null); // Reset image after submit
              }}
            >
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- BOOKING MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bookingVisible}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  {
                    paddingBottom: Platform.OS === "android" ? 30 : 20,
                    marginTop: -20,
                    height: "auto",
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Book Property</Text>
                  <TouchableOpacity onPress={() => setBookingVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                {/* Check-in & Check-out */}
                {/* CHECK-IN DATE */}
                {Platform.OS === "web" ? (
                  <TextInput
                    style={{
                      backgroundColor: "#ffffff",
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: "#111827",
                      marginTop: 12,
                    }}
                    placeholder="Check-in (DD/MM/YYYY)"
                    value={checkIn}
                    onChangeText={(val) => setCheckIn(val, "Web TextInput onChangeText")}
                  />
                ) : (
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#ffffff",
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 15,
                      color: "#111827",
                      marginTop: 12,
                    }}
                    onPress={() => {
                      setShowCheckInPicker(true);
                    }}
                  >
                    <Text>{checkIn || "Select Check-in Date"}</Text>
                  </TouchableOpacity>
                )}

                {showCheckInPicker && (
                  <DateTimePicker
                    value={checkIn ? new Date(parseInt(checkIn.split('-')[0], 10), parseInt(checkIn.split('-')[1], 10) - 1, parseInt(checkIn.split('-')[2], 10)) : todayStartMinDate}
                    mode="date"
                    display="default"
                    minimumDate={todayStartMinDate}
                    onChange={(event, selectedDate) => {
                      setShowCheckInPicker(false);
                      
                      if (event.type === 'set' && selectedDate) {
                        const formatted =
                          selectedDate.getFullYear() +
                          "-" +
                          (selectedDate.getMonth() + 1).toString().padStart(2, "0") +
                          "-" +
                          selectedDate.getDate().toString().padStart(2, "0");
                        setCheckIn(formatted, "DateTimePicker onChange event (type: set)");
                      }
                    }}
                  />
                )}



                {/* HOSTEL SPECIFIC */}
                {property.type === "Hostel" && (
                  <View>
<TextInput
                      style={{
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: "#111827",
                        marginTop: 12,
                      }}
                      placeholder="Sharing (1-8 Persons) *"
                      keyboardType="number-pad"
                      value={sharing}
                      onChangeText={setSharing}
                    />
                  </View>
)}

                {/* APARTMENT */}
                {property.type === "Apartment" && (
                  <View>
<Text style={{ fontWeight: "600", marginBottom: 10, marginTop: 12 }}>
                      Apartment Types
                    </Text>
                    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 15 }}>
                      {["1 BHK", "2 BHK", "3 BHK"].map(t => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setBhkType(t)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: bhkType === t ? COLORS.PRIMARY : "#f1f5f9"
                          }}
                        >
                          <Text style={{ color: bhkType === t ? "#fff" : "#475569", fontWeight: "700" }}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={{ fontWeight: "600", marginBottom: 10 }}>
                      Tenant Type
                    </Text>

                    <View
                      style={{ flexDirection: "row", gap: 15, marginBottom: 20 }}
                    >
                      {/* FAMILY BUTTON */}
                      <TouchableOpacity
                        disabled={property.allowedTenants === "BachelorsOnly"}
                        style={[
                          styles.tenantBtn,
                          tenantType === "Family" && styles.activeTenantBtn,
                          property.allowedTenants === "BachelorsOnly" && {
                            opacity: 0.4,
                          },
                        ]}
                        onPress={() => setTenantType("Family")}
                      >
                        <Text
                          style={[
                            styles.tenantText,
                            tenantType === "Family" && styles.activeTenantText,
                          ]}
                        >
                          Family
                        </Text>
                      </TouchableOpacity>

                      {/* BACHELOR BUTTON */}
                      <TouchableOpacity
                        disabled={property.allowedTenants === "FamilyOnly"}
                        style={[
                          styles.tenantBtn,
                          tenantType === "Bachelor" && styles.activeTenantBtn,
                          property.allowedTenants === "FamilyOnly" && {
                            opacity: 0.4,
                          },
                        ]}
                        onPress={() => setTenantType("Bachelor")}
                      >
                        <Text
                          style={[
                            styles.tenantText,
                            tenantType === "Bachelor" && styles.activeTenantText,
                          ]}
                        >
                          Bachelor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
)}

                {/* COMMERCIAL */}
                {property.type === "Commercial" && (
                  <View>
<TextInput
                      style={{
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: "#111827",
                        marginTop: 12,
                      }}
                      placeholder="Office Type (IT / Shop / Startup)"
                      value={officeType}
                      onChangeText={setOfficeType}
                    />

                    <TextInput
                      style={{
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 15,
                        color: "#111827",
                        marginTop: 12,
                      }}
                      placeholder="Required Area (in sq.ft)"
                      keyboardType="numeric"
                      value={area}
                      onChangeText={setArea}
                    />
                  </View>
)}

                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 20 }]}
                  onPress={confirmBooking}
                >
                  <Text style={styles.submitBtnText}>
                    Request to Join
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.smallBtn} onPress={makeCall}>
          <Ionicons name="call" size={22} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </TouchableOpacity>

        {normalizedStatus === "pending" ? (
          <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
            <View style={{ marginBottom: 6 }}>
              <Text style={{ color: "#f39c12", fontSize: 13, fontWeight: "700", textAlign: "center", textTransform: "uppercase" }}>
                PENDING APPROVAL
              </Text>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600", textAlign: "center" }}>
                Waiting for Owner Response
              </Text>
            </View>
            <TouchableOpacity
              disabled={buttonDisabled}
              onPress={handleBookingAction}
              style={{
                backgroundColor: buttonColor,
                height: 46,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: buttonDisabled ? 0.7 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
                {buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            disabled={buttonDisabled || hcBookingStatus?.status === "pending_request"}
            onPress={handleBookingAction}
            style={{
              backgroundColor: hcBookingStatus?.status === "pending_request"
                ? "#F59E0B"
                : hcBookingStatus?.status === "approved_request"
                ? "#10B981"
                : buttonColor,
              flex: 1,
              height: 50,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: (buttonDisabled && requestStatus !== "accepted") || hcBookingStatus?.status === "pending_request" ? 0.85 : 1,
            }}
          >
            <Text
              style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
            >
              {hcBookingStatus?.status === "pending_request"
                ? "Request Pending ⏳"
                : hcBookingStatus?.status === "approved_request"
                ? "Select Room & Bed"
                : isJoined && property?.type === "Hostel" && (!joinedProperty || joinedProperty.property_name?.trim() !== property.name?.trim())
                ? "Request Hostel Change"
                : buttonText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* --- STATUS MODAL (POP-UP) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginVertical: 20 }}>
              {requestStatus === "accepted" || requestStatus === "completed" || requestStatus === "allotted" ? (
                <View>
<MaterialCommunityIcons name="party-popper" size={60} color="#0a9516ff" />
                  <Text style={[styles.modalTitle, { fontSize: 24, marginTop: 15, textAlign: "center" }]}>
                    Welcome to {property.name}! 🎉
                  </Text>
                  <Text style={{ color: "#666", textAlign: "center", marginTop: 10, fontSize: 16 }}>
                    {"Your request has been accepted by the owner. We're excited to have you!"}
                  </Text>
                </View>
) : (
                <View>
<Ionicons name="time-outline" size={60} color="#f39c12" />
                  <Text style={[styles.modalTitle, { fontSize: 22, marginTop: 15, textAlign: "center" }]}>
                    Request Sent! ⏳
                  </Text>
                  <Text style={{ color: "#666", textAlign: "center", marginTop: 10, fontSize: 15 }}>
                    The owner has received your request and will review it soon. Please check back later.
                  </Text>
                </View>
)}
            </View>

            <View style={{ gap: 12, marginTop: 10 }}>
              <TouchableOpacity
                onPress={performWithdraw}
                style={[styles.submitBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ff4d4d" }]}
              >
                <Text style={{ color: "#ff4d4d", fontWeight: "bold", fontSize: 16 }}>
                  Withdraw Request
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                style={[styles.submitBtn, { backgroundColor: "#f5f5f5" }]}
              >
                <Text style={{ color: "#333", fontWeight: "bold", fontSize: 16 }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- IDENTITY VERIFICATION MODAL --- */}
      <Modal
        visible={showIdModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!uploading) setShowIdModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 34,
            maxHeight: "85%",
          }}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Identity Verification</Text>
              <TouchableOpacity
                disabled={uploading}
                onPress={() => setShowIdModal(false)}
                style={{
                  padding: 6,
                  backgroundColor: "#F5F3FF",
                  borderRadius: 999,
                }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* INFO BOX */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5F3FF",
                borderRadius: 16,
                padding: 16,
                gap: 12,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.1)",
              }}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.PRIMARY} />
                <Text style={{ flex: 1, fontSize: 14, color: "#1E293B", lineHeight: 20, fontWeight: "500" }}>
                  Please enter your 12-digit Aadhaar ID and upload a screenshot proof to verify and join the property.
                </Text>
              </View>

              {/* AADHAAR ID INPUT */}
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 10 }}>
                Aadhaar ID *
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FAF9FF",
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.15)",
                borderRadius: 16,
                paddingHorizontal: 16,
                marginBottom: 20,
                height: 52,
              }}>
                <Ionicons name="card-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: "#1E293B", fontWeight: "600" }}
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
              {/* AADHAAR IMAGE */}
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 10 }}>
                Aadhaar Card Front Image *
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={uploading}
                onPress={() => handlePickDocument("front")}
                style={{
                  backgroundColor: "#FAF9FF",
                  borderWidth: 2,
                  borderStyle: selectedFile ? "solid" : "dashed",
                  borderColor: selectedFile ? COLORS.PRIMARY : "rgba(139, 92, 246, 0.3)",
                  borderRadius: 20,
                  padding: 20,
                  minHeight: 100,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                {selectedFile ? (
                  <View style={{ flexDirection: "row", alignItems: "center", width: "100%", gap: 12 }}>
                    <Image source={{ uri: selectedFile.uri }} style={{ width: 60, height: 60, borderRadius: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }} numberOfLines={1}>
                        {selectedFile.name || "aadhar_front.jpg"}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Image selected</Text>
                    </View>
                    <TouchableOpacity
                      style={{ padding: 8, backgroundColor: "#FEE2E2", borderRadius: 12 }}
                      disabled={uploading}
                      onPress={() => setSelectedFile(null)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="image-outline" size={24} color={COLORS.PRIMARY} />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E293B", marginTop: 8 }}>
                      Choose Aadhaar Front
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* AADHAAR BACK */}
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 10 }}>
                Aadhaar Card Back Image *
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={uploading}
                onPress={() => handlePickDocument("back")}
                style={{
                  backgroundColor: "#FAF9FF",
                  borderWidth: 2,
                  borderStyle: selectedBackFile ? "solid" : "dashed",
                  borderColor: selectedBackFile ? COLORS.PRIMARY : "rgba(139, 92, 246, 0.3)",
                  borderRadius: 20,
                  padding: 20,
                  minHeight: 100,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                {selectedBackFile ? (
                  <View style={{ flexDirection: "row", alignItems: "center", width: "100%", gap: 12 }}>
                    <Image source={{ uri: selectedBackFile.uri }} style={{ width: 60, height: 60, borderRadius: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B" }} numberOfLines={1}>
                        {selectedBackFile.name || "aadhar_back.jpg"}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Image selected</Text>
                    </View>
                    <TouchableOpacity
                      style={{ padding: 8, backgroundColor: "#FEE2E2", borderRadius: 12 }}
                      disabled={uploading}
                      onPress={() => setSelectedBackFile(null)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="image-outline" size={24} color={COLORS.PRIMARY} />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E293B", marginTop: 8 }}>
                      Choose Aadhaar Back
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* GUIDELINES */}
              <View style={{
                backgroundColor: "#FAF9FF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(139, 92, 246, 0.05)",
              }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 8 }}>
                  Upload Guidelines:
                </Text>
                <Text style={{ fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 4 }}>
                  • Document must be clearly visible and not blurry.
                </Text>
                <Text style={{ fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 4 }}>
                  • Ensure all four edges of the document are captured.
                </Text>
                <Text style={{ fontSize: 13, color: "#64748B", lineHeight: 18 }}>
                  • High resolution JPG, PNG formats are accepted.
                </Text>
              </View>
            </ScrollView>

            {/* ACTION BUTTONS */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <TouchableOpacity
                disabled={uploading}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#F1F5F9",
                }}
                onPress={() => setShowIdModal(false)}
              >
                <Text style={{ color: "#1E293B", fontWeight: "700", fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!selectedFile || !selectedBackFile || !aadharId || uploading}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: (!selectedFile || !selectedBackFile || !aadharId || uploading)
                    ? "rgba(139, 92, 246, 0.4)"
                    : COLORS.PRIMARY,
                }}
                onPress={submitIdentityProof}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                  {uploading ? "Submitting..." : "Get Started"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      <Modal
        visible={selectedGalleryIndex !== null}
        transparent={true}
        onRequestClose={() => setSelectedGalleryIndex(null)}
      >
        <View style={{ flex: 1 }}>

          {/* CLOSE BUTTON */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              padding: 8,
              borderRadius: 20,
            }}
            onPress={() => setSelectedGalleryIndex(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {/* IMAGE VIEWER */}
          <ImageViewer
            imageUrls={zoomImages}
            index={viewerIndex}
            enableSwipeDown
            resetImageByChange={true}
            onChange={(index) => setViewerIndex(index)}
            onSwipeDown={() => setSelectedGalleryIndex(null)}
            saveToLocalByLongPress={false}
          />

        </View>
      </Modal>

      {/* --- TENANT TYPE SELECTION MODAL --- */}
      <Modal visible={tenantTypeModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "80%", backgroundColor: "#fff", borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#1e293b", marginBottom: 20, textAlign: "center" }}>{t("select_tenant_type") || "Select Tenant Type"}</Text>

            <TouchableOpacity
              onPress={() => {
                setTenantTypeModalVisible(false);
                setBookingVisible(true);
              }}
              style={{ backgroundColor: COLORS.PRIMARY, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t("new_tenant") || "New Tenant"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setTenantTypeModalVisible(false);
                if (property?.type === "Hostel") {
                  setEtFloor(""); setEtRoom(""); setEtBed("");
                } else if (property?.type === "Apartment") {
                  setEtFloor(""); setEtRoom(""); setEtSharing("");
                } else if (property?.type === "Commercial") {
                  setEtFloor(""); setEtRoom("");
                }
                fetchPropertyStructure(property);
                setExistingTenantModalVisible(true);
              }}
              style={{ backgroundColor: "#f1f5f9", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#cbd5e1" }}
            >
              <Text style={{ color: COLORS.PRIMARY, fontWeight: "700", fontSize: 16 }}>{t("existing_tenant") || "Existing Tenant"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTenantTypeModalVisible(false)} style={{ alignItems: "center" }}>
              <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 16, marginTop: 20 }}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EXISTING TENANT SELECTION MODAL (DYNAMIC UI) --- */}
      <Modal visible={existingTenantModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#1e293b" }}>{t("existing_tenant_selection") || "Existing Tenant Selection"}</Text>
              <TouchableOpacity onPress={() => setExistingTenantModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, color: "#64748b", fontWeight: "700", marginBottom: 16 }}>{t("building") || "Building"}: {property?.name || t("selected_property") || "Selected Property"}</Text>

              <View style={{ gap: 20 }}>
                {/* 1. FLOOR SELECTION */}
                <View>
                  <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "800", marginBottom: 10, textTransform: "uppercase" }}>{t("select_floor") || "1. Select Floor"}</Text>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    {(propertyStructure?.building_layout || []).map(floorObj => {
                      const floorKey = `Floor ${floorObj.floorNo}`;
                      const floorStr = `${t("floor") || "Floor"} ${floorObj.floorNo}`;
                      return (
                        <TouchableOpacity key={floorKey} onPress={() => { setEtFloor(floorKey); setEtRoom(""); setEtBed(""); setEtSharing(""); }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: etFloor === floorKey ? COLORS.PRIMARY : "#f1f5f9" }}>
                          <Text style={{ color: etFloor === floorKey ? "#fff" : "#475569", fontWeight: "700" }}>{floorStr}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>

                {/* 2. ROOM SELECTION (Depends on Floor) */}
                {etFloor !== "" && (
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>{t("select") || "2. Select"} {property?.type === "Hostel" ? (t("room") || "Room") : property?.type === "Apartment" ? (t("flat") || "Flat") : (t("unit") || "Unit")}</Text>
                      {property?.type === "Apartment" && (
                        <TouchableOpacity onPress={() => setAddUnitModalVisible(true)} style={{ backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#475569" }}>+ {t("add_unit") || "ADD UNIT"}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                      {(() => {
                        const floorObj = (propertyStructure?.building_layout || []).find(f => `Floor ${f.floorNo}` === etFloor);
                        if (floorObj) {
                          let units = [];
                          if (property?.type === "Hostel") units = floorObj.rooms || [];
                          else if (property?.type === "Apartment") units = floorObj.flats || [];
                          else if (property?.type === "Commercial") units = floorObj.sections || [];

                          if (units.length > 0) {
                            return units.map(unit => {
                              let rStr = "";
                              let unitId = "";

                              if (property?.type === "Hostel") {
                                unitId = `${unit.roomNo}`;
                                rStr = unitId.includes("-") ? unitId : `${etFloor.replace("Floor ", "")}-${unitId.padStart(2, '0')}`;
                              } else if (property?.type === "Apartment") {
                                unitId = `${unit.flatNo}`;
                                rStr = unitId.includes(etFloor.replace("Floor ", "")) ? unitId : `${etFloor.replace("Floor ", "")}${unitId.padStart(2, '0')}`;
                              } else if (property?.type === "Commercial") {
                                unitId = `${unit.sectionNo}`;
                                rStr = unitId.startsWith("C-") ? unitId : `C-${etFloor.replace("Floor ", "")}0${unitId}`;
                              }

                              return (
                                <TouchableOpacity
                                  key={rStr}
                                  onPress={() => {
                                    setEtRoom(rStr);
                                    setEtBed("");
                                    setEtSharing(property?.type === "Apartment" ? (unit.bhk || "") : "");
                                  }}
                                  style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    backgroundColor: etRoom === rStr ? COLORS.PRIMARY : "#f1f5f9",
                                  }}
                                >
                                  <Text style={{ color: etRoom === rStr ? "#fff" : "#475569", fontWeight: "700" }}>
                                    {property?.type === "Hostel" ? `${t("room") || "Room"} ${rStr}` : property?.type === "Apartment" ? `${t("flat") || "Flat"} ${rStr}` : `${t("unit") || "Unit"} ${rStr}`}
                                  </Text>
                                </TouchableOpacity>
                              );
                            });
                          }
                        }
                        return <Text style={{ fontSize: 12, color: "#94a3b8" }}>{t("no_units_available") || "No units available for this floor."}</Text>;
                      })()}
                      {/* Render dynamically added units for this floor */}
                      {addedUnits.filter(u => `Floor ${u.floor}` === etFloor).map((u, i) => (
                        <TouchableOpacity key={`added-${i}`} onPress={() => { setEtRoom(u.unit); setEtSharing(u.type); }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: etRoom === u.unit ? COLORS.PRIMARY : "#f1f5f9", borderWidth: 1, borderColor: COLORS.PRIMARY }}>
                          <Text style={{ color: etRoom === u.unit ? "#fff" : "#475569", fontWeight: "700" }}>{u.unit} ({u.type})</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* 3. BED / SHARING SELECTION (Depends on Room) */}
                {etFloor !== "" && etRoom !== "" && property?.type === "Hostel" && (
                  <View>
                    <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "800", marginBottom: 10, textTransform: "uppercase" }}>{t("select_bed") || "3. Select Bed"}</Text>
                    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                      {(() => {
                        const floorObj = (propertyStructure?.building_layout || []).find(f => `Floor ${f.floorNo}` === etFloor);
                        if (floorObj && property?.type === "Hostel") {
                          const room = (floorObj.rooms || []).find(r => {
                            let testStr = `${r.roomNo}`;
                            if (!testStr.includes("-")) testStr = `${etFloor.replace("Floor ", "")}-${testStr.padStart(2, '0')}`;
                            return testStr === etRoom;
                          });

                          if (room && room.beds > 0) {
                            return Array.from({ length: room.beds }, (_, i) => i + 1).map(b => {
                              const bKey = `Bed ${b}`;
                              const bStr = `${t("bed") || "Bed"} ${b}`;
                              return (
                                <TouchableOpacity
                                  key={bKey}
                                  onPress={() => setEtBed(bKey)}
                                  style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    backgroundColor: etBed === bKey ? COLORS.PRIMARY : "#f1f5f9",
                                  }}
                                >
                                  <Text style={{ color: etBed === bKey ? "#fff" : "#475569", fontWeight: "700" }}>{bStr}</Text>
                                </TouchableOpacity>
                              );
                            });
                          }
                        }
                        return <Text style={{ fontSize: 12, color: "#94a3b8" }}>{t("no_beds_available") || "No beds available for this room."}</Text>;
                      })()}
                    </View>
                  </View>
                )}
                {etFloor !== "" && etRoom !== "" && property?.type === "Apartment" && (
                  <View>
                    <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "800", marginBottom: 10, textTransform: "uppercase" }}>{t("select_type") || "3. Select Type"}</Text>
                    <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                      {["1BHK", "2BHK", "3BHK"].map(t => (
                        <TouchableOpacity key={t} onPress={() => setEtSharing(t)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: etSharing === t ? COLORS.PRIMARY : "#f1f5f9" }}>
                          <Text style={{ color: etSharing === t ? "#fff" : "#475569", fontWeight: "700" }}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                {etFloor !== "" && etRoom !== "" && (
                  <View style={{ gap: 16, marginTop: 10, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 20 }}>
                    <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "800", textTransform: "uppercase" }}>{t("upload_identity_payment") || "4. Upload Identity & Payment Proof"}</Text>
                    {/* Aadhaar ID */}
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b" }}>{t("aadhaar_id") || "Aadhaar ID *"}</Text>
                    <TextInput
                      style={{
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderColor: "#cbd5e1",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        fontSize: 14,
                        color: "#1e293b",
                      }}
                      placeholder={t("enter_aadhaar") || "Enter 12-digit Aadhaar ID"}
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      maxLength={12}
                      value={aadharId}
                      onChangeText={(text) => setAadharId(text.replace(/[^0-9]/g, ''))}
                    />
                    {/* Aadhaar Image */}
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b" }}>{t("aadhaar_image") || "Aadhaar Card Image *"}</Text>
                    <TouchableOpacity
                      onPress={() => handlePickDocument("front")}
                      style={{
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderStyle: selectedFile ? "solid" : "dashed",
                        borderColor: selectedFile ? COLORS.PRIMARY : "#cbd5e1",
                        borderRadius: 10,
                        padding: 14,
                        alignItems: "center",
                      }}
                    >
                      {selectedFile ? (
                        <Text style={{ color: COLORS.PRIMARY, fontWeight: "600" }} numberOfLines={1}>
                          ✓ {selectedFile.name || t("aadhaar_image_selected") || "Aadhaar Card Image Selected"}
                        </Text>
                      ) : (
                        <Text style={{ color: "#64748b" }}>{t("choose_aadhaar") || "Choose Aadhaar Card Image"}</Text>
                      )}
                    </TouchableOpacity>
                    {/* Payment Screenshot */}
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b" }}>{t("payment_proof") || "Payment Proof / Screenshot *"}</Text>
                    <TouchableOpacity
                      onPress={() => handlePickDocument("payment")}
                      style={{
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderStyle: selectedPaymentScreenshot ? "solid" : "dashed",
                        borderColor: selectedPaymentScreenshot ? COLORS.PRIMARY : "#cbd5e1",
                        borderRadius: 10,
                        padding: 14,
                        alignItems: "center",
                      }}
                    >
                      {selectedPaymentScreenshot ? (
                        <Text style={{ color: COLORS.PRIMARY, fontWeight: "600" }} numberOfLines={1}>
                          ✓ {selectedPaymentScreenshot.name || "Payment Proof Selected"}
                        </Text>
                      ) : (
                        <Text style={{ color: "#64748b" }}>{t("choose_payment_proof") || "Choose Payment Proof / Screenshot"}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <TouchableOpacity
                disabled={
                  (property?.type === "Hostel" && (!etFloor || !etRoom || !etBed)) ||
                  (property?.type === "Apartment" && (!etFloor || !etRoom || !etSharing)) ||
                  (property?.type === "Commercial" && (!etFloor || !etRoom)) ||
                  !aadharId || !selectedFile || !selectedPaymentScreenshot
                }
                onPress={async () => {
                  try {
                    const tenantPhone = await AsyncStorage.getItem("tenantPhone");
                    if (!tenantPhone) {
                      alert("Tenant phone missing. Please login again.");
                      return;
                    }
                    if (!property.contact) {
                      alert("Owner phone missing");
                      return;
                    }
                    if (!aadharId || !selectedFile || !selectedPaymentScreenshot) {
                      alert("Please enter Aadhaar ID and upload Aadhaar Card Image and Payment Screenshot.");
                      return;
                    }
                    if (aadharId.length !== 12) {
                      alert("Aadhaar ID must be exactly 12 numeric digits.");
                      return;
                    }
                    // 1. Upload Identity and Payment Proofs first
                    const formData = new FormData();
                    formData.append("phone", tenantPhone);
                    formData.append("aadhar_id", aadharId);
                    formData.append("aadhar_image", {
                      uri: selectedFile.uri,
                      name: selectedFile.name || "aadhar.jpg",
                      type: selectedFile.mimeType || "image/jpeg"
                    });
                    if (selectedBackFile) {
                      formData.append("aadhar_back_image", {
                        uri: selectedBackFile.uri,
                        name: selectedBackFile.name || "aadhar_back.jpg",
                        type: selectedBackFile.mimeType || "image/jpeg"
                      });
                    }
                    formData.append("payment_screenshot", {
                      uri: selectedPaymentScreenshot.uri,
                      name: selectedPaymentScreenshot.name || "payment_proof.jpg",
                      type: selectedPaymentScreenshot.mimeType || "image/jpeg"
                    });
                    const uploadRes = await fetchWithAuth(`${BASE_URL}/api/tenant/submit_verification/`, {
                      method: "POST",
                      body: formData,
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadRes.ok) {
                      alert("Failed to upload proofs: " + (uploadData.error || "Unknown error"));
                      return;
                    }
                    // 2. Submit Existing Tenant Request
                    const reqData = {
                      tenant_phone: tenantPhone,
                      owner_id: property.owner_id || "",
                      owner_phone: property.contact,
                      property_name: property.name,
                      property_type: property.type,
                      check_in: new Date().toISOString().split("T")[0],
                      check_out: "N/A",
                      sharing: property?.type === "Apartment" ? etSharing : "",
                      flat: property?.type === "Apartment" ? etRoom : "",
                      section: "",
                      is_existing_tenant: true,
                      requested_floor: etFloor.replace("Floor ", ""),
                      requested_room: (property?.type === "Hostel" || property?.type === "Commercial") ? etRoom.replace("Room ", "").replace("Unit ", "") : (property?.type === "Apartment" ? etRoom : ""),
                      requested_bed: property?.type === "Hostel" ? etBed.replace("Bed ", "") : "",
                    };
                    const response = await fetchWithAuth(
                      `${BASE_URL}/api/existing_tenant_request/`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(reqData),
                      }
                    );
                    const textData = await response.text();
                    console.log("Raw Response Data:", textData);
                    let data;
                    try {
                      data = JSON.parse(textData);
                    } catch (e) {
                      console.log("JSON Parse Error on Response:", e);
                      data = { error: textData };
                    }
                    if (response.ok) {
                      alert(`Existing Tenant Request Sent! 🎉\nWe will contact you shortly regarding ${property.name}.`);
                      setRequestStatus("pending");
                      if (bookingContext?.setRefreshTrigger) {
                        bookingContext.setRefreshTrigger(prev => prev + 1);
                      }
                    } else {
                      alert("Failed to send booking request: " + (data.error || data.message || "Unknown error"));
                      console.log("Server Error:", data);
                    }
                    setExistingTenantModalVisible(false);
                    if (typeof setStatusModalVisible === "function") {
                      setStatusModalVisible(true);
                    }
                  } catch (error) {
                    console.log("Booking Error:", error);
                    alert("Something went wrong. Please try again.");
                  }
                }}
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                  marginTop: 30,
                  opacity: 1
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>{buttonText}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>


      {/* OCCUPIED POPUP MODAL */}
      <Modal visible={occupiedPopupVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10 }}>
            <View style={{ backgroundColor: "#fee2e2", padding: 16, borderRadius: 50, marginBottom: 16 }}>
              <Ionicons name="lock-closed" size={32} color="#ef4444" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#ef4444", marginBottom: 20, letterSpacing: 0.5 }}>STATUS: OCCUPIED</Text>

            <View style={{ width: "100%", backgroundColor: "#f8fafc", padding: 16, borderRadius: 12, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontWeight: "600" }}>Name:</Text>
                <Text style={{ color: "#1e293b", fontWeight: "700" }}>{occupiedDetails?.name}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontWeight: "600" }}>Phone:</Text>
                <Text style={{ color: "#1e293b", fontWeight: "700" }}>{occupiedDetails?.phone}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontWeight: "600" }}>Floor:</Text>
                <Text style={{ color: "#1e293b", fontWeight: "700" }}>{occupiedDetails?.floor}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontWeight: "600" }}>Room:</Text>
                <Text style={{ color: "#1e293b", fontWeight: "700" }}>{occupiedDetails?.room}</Text>
              </View>
              {occupiedDetails?.bed && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#64748b", fontWeight: "600" }}>Bed:</Text>
                  <Text style={{ color: "#1e293b", fontWeight: "700" }}>{occupiedDetails?.bed}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setOccupiedPopupVisible(false)}
              style={{ marginTop: 24, backgroundColor: "#ef4444", width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HOSTEL CHANGE REQUEST MODALS */}
      <BookNowModal
        visible={bookNowModalVisible}
        onClose={() => setBookNowModalVisible(false)}
        currentHostel={currentHostelInfo}
        targetHostel={targetHostelInfo}
        onBookNowPress={async () => {
          setBookNowModalVisible(false);
          try {
            const hostels = await getAvailableHostels();
            setAvailableHostelList(hostels);
          } catch (e) {
            console.log("Error loading hostels:", e);
          }
          setChangeFormVisible(true);
        }}
      />

      <ChangeHostelRequestForm
        visible={changeFormVisible}
        onClose={() => setChangeFormVisible(false)}
        currentHostel={currentHostelInfo}
        targetHostel={targetHostelInfo}
        availableHostels={availableHostelList}
        loading={hcLoading}
        onSubmit={async (formData) => {
          try {
            const storedPhone = await AsyncStorage.getItem("tenantPhone");
            const res = await createChangeRequest(
              storedPhone,
              formData.target_hostel_id || targetHostelInfo?.id || property?.id,
              formData.expectedJoiningDate,
              formData.message,
              formData
            );
            setChangeFormVisible(false);
            if (res.success) {
              Alert.alert("Request Sent! 🎉", "Your hostel change request has been sent successfully. Waiting for owner approval.");
              refreshHcBookingStatus();
            } else {
              Alert.alert("Notice", res.message || "Failed to send request.");
            }
          } catch (err) {
            Alert.alert("Error", err.message || "Could not send hostel change request.");
          }
        }}
      />

      {/* ADD UNIT MODAL */}
      <Modal visible={addUnitModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "90%", backgroundColor: "#fff", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#1e293b" }}>Add New Unit</Text>
              <TouchableOpacity onPress={() => setAddUnitModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: "700", color: "#64748b", marginBottom: 8 }}>Floor Number</Text>
            <TextInput
              style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}
              placeholder="e.g. 5"
              keyboardType="number-pad"
              value={newUnitFloor}
              onChangeText={setNewUnitFloor}
            />

            <Text style={{ fontWeight: "700", color: "#64748b", marginBottom: 8 }}>Floor Number</Text>
            <TextInput
              style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}
              placeholder="e.g. 504"
              value={newUnitFloor}
              onChangeText={setNewUnitFloor}
            />

            <Text style={{ fontWeight: "700", color: "#64748b", marginBottom: 8 }}>Type</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              {["1BHK", "2BHK", "3BHK"].map(t => (
                <TouchableOpacity key={t} onPress={() => setNewUnitType(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: newUnitType === t ? COLORS.PRIMARY : "#f1f5f9", alignItems: "center" }}>
                  <Text style={{ color: newUnitType === t ? "#fff" : "#475569", fontWeight: "700" }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              disabled={!newUnitFloor || !newUnitNumber || !newUnitType}
              onPress={() => {
                setAddedUnits([...addedUnits, { floor: newUnitFloor, unit: newUnitNumber, type: newUnitType }]);
                setEtFloor(`Floor ${newUnitFloor}`);
                setEtRoom(newUnitNumber);
                setEtSharing(newUnitType);
                setAddUnitModalVisible(false);
                setNewUnitFloor("");
                setNewUnitNumber("");
                setNewUnitType("");
              }}
              style={{ backgroundColor: (!newUnitFloor || !newUnitNumber || !newUnitType) ? "#94a3b8" : COLORS.PRIMARY, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Unit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
const isWeb = Platform.OS === "web";

const homeStyles = StyleSheet.create({
  /* MY STAY DASHBOARD & COMPACT EXPLORE CARD STYLES */
  exploreMoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  exploreMoreSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  exploreMorePillBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  exploreMorePillBtnText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "700",
  },

  myStayContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  myStayHeaderRow: {
    marginBottom: 14,
  },
  myStayTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: -0.3,
  },
  myStayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  myStayCard: {
    width: (width - 48) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "space-between",
    minHeight: 160,
  },
  myStayIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  myStayCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  myStayCardSub: {
    fontSize: 11.5,
    color: "#6B7280",
    lineHeight: 15,
    marginBottom: 12,
  },
  myStayRequestBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  myStayRequestBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  checkInCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
  },
  dateCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: 0.8,
    marginTop: 6,
  },
  checkInDateValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#065F46",
    marginTop: 4,
  },
  rentDueCard: {
    backgroundColor: "#7C3AED",
    borderColor: "#6D28D9",
    borderWidth: 1,
  },
  rentDueLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#E9D5FF",
    letterSpacing: 0.8,
    marginTop: 6,
  },
  rentDueValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },

  inviteFriendsBanner: {
    borderRadius: 24,
    padding: 20,
    marginTop: 4,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  inviteContent: {
    zIndex: 2,
    maxWidth: "80%",
  },
  inviteTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  inviteSub: {
    fontSize: 12.5,
    color: "#E9D5FF",
    lineHeight: 18,
    marginBottom: 16,
  },
  inviteBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 30,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteBtnText: {
    color: "#7C3AED",
    fontSize: 13.5,
    fontWeight: "800",
  },
  inviteBgIcon: {
    position: "absolute",
    right: 12,
    bottom: 12,
    zIndex: 1,
  },

  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  locationText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 5,
    maxWidth: 220,
  },

  stickyWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#fff",
    paddingTop: 45,
    paddingBottom: 8,
    paddingHorizontal: 14,
    elevation: 12,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  stickySearchBar: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 46,
  },

  stickyCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  stickyCategoryBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  activeStickyBtn: {
    backgroundColor: "#6C63FF",
  },

  stickyCategoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  customCategoryWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 14,
  },

  customCard: {
    width: "30.5%",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 4,
    height: 108,
    overflow: "hidden",
  },

  customCardImage: {
    width: "100%",
    height: 88,
    alignSelf: "center",
  },

  customCardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: -9,
    textAlign: "center",
  },

  subSection: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  categoryHeadingRow: {
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
  },

  categoryHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  heroContent: {
    marginTop: 12,
    width: "58%",
  },
  heroSection: {
    paddingHorizontal: 20,

    paddingTop: 40,
    paddingBottom: 18,

    overflow: "hidden",

    minHeight: 220,
  },

  heroBgImage: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  joinedHeroSection: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    overflow: "hidden",
    minHeight: 310,
    justifyContent: "space-between",
  },
  joinedHeroBgImage: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  joinedStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 99, 255, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  joinedStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  joinedHeroContent: {
    marginTop: 15,
  },
  joinedPropertyType: {
    color: "#DCDDFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  joinedPropertyName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  joinedLocationWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinedLocationText: {
    color: "#f3f4f6",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroIconBtn: {
    marginLeft: 12,
    position: "relative",
  },

  heroBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  heroTitle: {
    color: "#fff",
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 38,
  },

  heroSubtitle: {
    color: "#f3f3f3",

    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    width: "95%",
  },

  newSearchBar: {
    marginTop: 25,
    backgroundColor: "#fff",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 58,
  },

  newSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingLeft: 12,
  },

  filterText: {
    color: "#6C63FF",
    marginLeft: 5,
    fontWeight: "600",
  },
  notifContainer: {
    position: "relative",
    marginRight: 12,
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ff3b30",
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },

  headerIcons: { flexDirection: "row", gap: 10 },

  headerTitle: { fontSize: 22, fontWeight: "bold" },

  headerSub: { fontSize: 12, color: "gray" },

  notifBtn: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
    elevation: 1,
  },

  searchWrapper: { paddingHorizontal: 20, marginBottom: 15 },

  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    alignItems: "center",
    height: 50,
    elevation: 3,
  },

  input: { flex: 1, paddingHorizontal: 10 },

  filterTrigger: {
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingLeft: 10,
  },

  promoWrapper: { marginBottom: 20 },

  promoCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    borderRadius: 20,
    padding: 20,
    height: 120,
    overflow: "hidden",
  },

  promoTextContainer: {
    flex: 1,
    justifyContent: "center",
  },

  promoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  promoDesc: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },

  promoIcon: {
    position: "absolute",
    right: -10,
    bottom: -10,
  },

  categoryWrapper: { marginBottom: 20 },

  categoryScroll: { paddingHorizontal: 15 },

  categoryItem: {
    alignItems: "center",
    marginRight: 20,
    width: 70,
  },

  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginBottom: 5,
  },

  activeIconBox: { backgroundColor: COLORS.PRIMARY },

  categoryLabel: { fontSize: 11, color: "#999" },

  activeCategoryLabel: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  listTitle: { fontSize: 16, fontWeight: "bold" },

  countText: { color: COLORS.PRIMARY, fontSize: 12 },


  gridItem: {
    width: "100%",
    marginBottom: 18,
  },
  propertyGrid: {
    flexDirection: "column",
    paddingHorizontal: 16,
    width: "100%",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: "100%",
  },

  cardImg: {
    width: "100%",
    height: 185,
    backgroundColor: "#f0f0f0",
  },

  cardBody: {
    padding: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },

  cardSub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  cardRent: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6C63FF",
    marginTop: 6,
  },

  cardDistance: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },

  noResults: {
    textAlign: "center",
    marginTop: 10,
    color: "gray",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 120,
    height: "35%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  applyBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },

  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },

  subLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 5,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 15,
    paddingVertical: 10,

    borderRadius: 22,

    backgroundColor: "#fafafa",

    borderWidth: 1,
    borderColor: "#ececec",

    marginRight: 10,
    marginBottom: 10,
  },
  activeChip: {
    backgroundColor: "#6C63FF15",
    borderColor: "#6C63FF",
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },

  activeChipText: {
    color: "#6C63FF",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  categoryTabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  categoryTab: {
    flex: 1,

    height: 72,

    justifyContent: "center",
    alignItems: "center",

    borderRadius: 16,

    borderWidth: 1,

    backgroundColor: "#fff",

    marginHorizontal: 4,

    paddingVertical: 8,
  },

  categoryTabText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: isWeb ? 900 : "100%",
    alignSelf: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: { padding: 10, backgroundColor: "#f0f2ff", borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 15 },
  mainImage: { width: "100%", height: 280 },
  content: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 22, fontWeight: "bold", flex: 1 },
  statusBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { color: COLORS.PRIMARY, fontWeight: "bold", fontSize: 11 },
  typeText: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
    marginBottom: 15,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
  },
  descriptionText: { color: "#777", lineHeight: 20, fontSize: 14 },
  seeAllText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: "600" },

  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    padding: 10,
    borderRadius: 12,
    gap: 5,
  },
  amenityLabel: { fontSize: 12, color: "#555" },

  reviewScroll: { marginTop: 5 },
  reviewCard: {
    width: 220,
    backgroundColor: "#f8f9ff",
    padding: 15,
    borderRadius: 20,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  reviewUser: { fontWeight: "bold", fontSize: 14 },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  starText: { fontSize: 10, fontWeight: "bold" },
  reviewComment: { fontSize: 12, color: "#666", marginTop: 8, lineHeight: 18 },
  reviewDate: { fontSize: 10, color: "#bbb", marginTop: 10 },

  mapContainer: {
    height: 220,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  map: { ...StyleSheet.absoluteFillObject },
  galleryScroll: { marginTop: 5 },

  footer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
    gap: 8,
  },
  smallBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#f8f9ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  requestBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  requestBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },

  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  mapButton: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },

  input: {
    backgroundColor: "#120d0d",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    fontSize: 16,
  },

  tenantBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  activeTenantBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },

  tenantText: {
    fontWeight: "600",
    color: "#333",
  },

  activeTenantText: {
    color: "#fff",
  },

  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)", // Dark backdrop
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  closeImageBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  galleryImage: {
    width: 220,
    height: 140,
    borderRadius: 15,
    marginRight: 12,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#eee",
  },

  ratingSubtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
    fontSize: 14,
  },
  starRatingRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  starWrapper: {
    padding: 5, // Increases touch area
  },
  textInput: {
    backgroundColor: "#f8f9ff",
    borderRadius: 15,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  // ... existing styles ...
  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  uploadBox: {
    width: 80,
    height: 80,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderStyle: "dashed",
    backgroundColor: "#f8f9ff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadText: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    fontWeight: "bold",
    marginTop: 2,
  },
  previewThumbnail: {
    width: "100%",
    height: "100%",
  },
  removeImgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 10,
    backgroundColor: "#fff0f0",
    borderRadius: 10,
  },

  rulesContainer: {
    backgroundColor: "#fdfdff",
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#f0f2ff",
    marginTop: 5,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ruleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ruleText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },

  offerScroll: {
    marginVertical: 10,
    marginLeft: -20, // Negative margin to bleed to screen edge
    paddingLeft: 20,
  },
  offerCard: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
    borderWidth: 1.5,
    // Soft shadow
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    position: "relative",
    overflow: "hidden",
    height: 90,
    justifyContent: "center",
  },
  offerBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 15,
  },
  offerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  offerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  offerDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  modernPromoCard: {
    width: 280,
    height: 160,
    borderRadius: 24,
    padding: 20,
    marginRight: 15,
    overflow: "hidden", // Clips the decorative circles
    elevation: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  // Decorative abstract circles for professional look
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitlePromo: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  premiumOfferCard: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 15,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  colorAccent: {
    width: 6,
    height: "100%",
  },
  offerInnerContent: {
    flex: 1,
    padding: 15,
  },
  offerMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  offerTitleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  offerSubtitleText: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  offerSeparator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  offerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  couponPill: {
    backgroundColor: "#f8f9ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e5ff",
    borderStyle: "dashed",
  },
  couponPillText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    letterSpacing: 0.5,
  },
  applyOfferBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyOfferText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  notifContainer: {
    position: "relative",
    marginRight: 12,
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ff3b30",
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    marginTop: 16,
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  proofImagePreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  fileSize: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  deleteFileBtn: {
    padding: 8,
  },
  uploadPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  guidelinesBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  guidelineTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
  },
  guidelineItem: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalActionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  cancelBtnText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "700",
  },
  submitBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  modalCloseBtn: {
    padding: 4,
  },
  verificationUploadContainer: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    marginBottom: 8,
  },
  verificationUploadContainerActive: {
    borderStyle: "solid",
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#F5F3FF",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
});

