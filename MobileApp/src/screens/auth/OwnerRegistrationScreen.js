import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import COLORS from "@/src/theme/colors";
import { WebView } from "react-native-webview";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "../../utils/NotificationsProxy";
import Constants from "expo-constants";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
import { useLanguage } from "../../utils/LanguageContext";
// import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { OwnerAccountContext } from "../../context/OwnerAccountContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const NAVY = "#1E293B"; // Slate 800
const LIGHT_PURPLE = "#8B5CF6"; // Violet 500
const WHITE = "#FFFFFF";
const GRAY = "#64748B"; // Slate 500
const LIGHT_GRAY = "#F8FAFC"; // Slate 50
const DOT_INACTIVE = "#E2E8F0"; // Slate 200
let MapView, Marker, PROVIDER_GOOGLE;
try {
  if (Platform.OS !== "web") {
    const RNMaps = require("react-native-maps");
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  } else {
    MapView = View;
    Marker = function Marker() {
      return null;
    };
    PROVIDER_GOOGLE = undefined;
  }
} catch (_e) {
  MapView = View;
  Marker = function Marker() {
    return null;
  };
  PROVIDER_GOOGLE = undefined;
}

const INDIAN_BANKS = [
  "State Bank of India ",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IDFC FIRST Bank",
  "Yes Bank",
  "IndusInd Bank",
  "Federal Bank",
  "South Indian Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Other",
];



export default function OwnerCommercialSection({
  route,
}) {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { refreshAccounts, switchAccount } = useContext(OwnerAccountContext);
  const phone =
    route.params?.phone || "";
  const isAddingAccount = route.params?.isAddingAccount || false;
  const [screen, setScreen] = useState("register");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [customFacilities, setCustomFacilities] = useState([]);
  const [newFacilityText, setNewFacilityText] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [lineProgress] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Step indicator shrink animations based on scroll
  const stepCardPadding = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [30, 15],
    extrapolate: "clamp",
  });
  const stepCircleSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [56, 40],
    extrapolate: "clamp",
  });
  const stepCircleRadius = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [28, 20],
    extrapolate: "clamp",
  });
  const stepIconScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.75],
    extrapolate: "clamp",
  });
  const stepLabelOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const stepLabelHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [36, 0],
    extrapolate: "clamp",
  });
  const stepLineLength = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 40],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (step > 1) {
      Animated.timing(lineProgress[0], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(lineProgress[0], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    if (step > 2) {
      Animated.timing(lineProgress[1], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(lineProgress[1], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  const initialForm = {
    name: "",
    idProofType: "",
    idProofNumber: "",
    stayType: "",
    hostelType: "",
    hostelName: "",
    location: "",
    wifi: "",
    parking: "",
    lift: "",
    apartmentName: "",
    bhk: "",
    tenantType: "",
    commercialName: "",
    usage: "",
    bankName: "",
    upiId: "",
    flatArea: "",
    bedrooms: "",
    bathrooms: "",
    cost: "",
    carParking: "",
    negotiable: "",
    rent: "",
    furnishingType: "",
    documents: { property: null, identityProof: null, homePics: [], coverImage: null },
    floorsData: [],
  };
  const [isLoading, setIsLoading] = useState(false);

  const [isCheckingIdProof, setIsCheckingIdProof] = useState(false);
  const [idProofError, setIdProofError] = useState("");
  const idProofCheckTimeout = useRef(null);

  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState(null);


  //added code
  const [form, setForm] = useState(initialForm);
  const [step3Summary, setStep3Summary] = useState("");
  const handleUpdateFloors = useCallback((floors) => {
    setForm((prev) => ({ ...prev, floorsData: floors }));

    const summary = `Total Floors: ${floors.length}`;
    setStep3Summary(summary);
  }, []);

  const [mapRegion, setMapRegion] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const geocodeTimerRef = useRef(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedPlaceName, setSelectedPlaceName] = useState("");
  const [mapType, setMapType] = useState("standard");

  useEffect(() => {
    if (selectedFacilities.length > 0 && errors.facilities) {
      const newErrors = { ...errors };
      delete newErrors.facilities;
      setErrors(newErrors);
    }
  }, [selectedFacilities, errors]);

  const DEFAULT_REGION = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  const handleStayTypeChange = (nextType) => {
    if (nextType === form.stayType) return;

    const cleared = {
      ...form,
      stayType: nextType,
      // common
      location: "",
      // hostel
      hostelName: "",
      hostelType: "",
      // apartment
      apartmentName: "",
      bhk: "",
      tenantType: "",
      rent: "",
      // commercial
      commercialName: "",
      usage: "",
      // bank details
      bankName: "",
      upiId: "",
      // property related documents (keep identityProof as it's part of registration)
      documents: {
        ...form.documents,
        property: null,
        homePics: [],
        coverImage: null,
      },
      furnishingType: "",
      // clear floor data since it's type-specific
      floorsData: [],
    };
    setForm(cleared);
    setMapRegion(null);
    setSelectedPlaceName("");
    setLocationSuggestions([]);
    setSelectedFacilities([]);
    setCustomFacilities([]);
    setErrors({});
  };
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
    })();
  }, []);

  useEffect(() => {
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }
    const input = form.location.trim();
    if (!input) {
      setMapRegion(null);
      setLocationSuggestions([]);
      setSelectedPlaceName("");
      return;
    }
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const timeoutMs = 6000;
        if (Platform.OS === "android") {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(input)}`;
          const fetchPromise = fetchWithAuth(url, {
            headers: { Accept: "application/json" },
          }).then((r) => r.json());
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Geocode timeout")), timeoutMs),
          );
          const items = await Promise.race([fetchPromise, timeoutPromise]);
          if (Array.isArray(items) && items.length > 0) {
            const { lat, lon } = items[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            if (isFinite(latitude) && isFinite(longitude)) {
              setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            } else {
              setMapRegion(null);
            }
            setLocationSuggestions(items);
          } else {
            setMapRegion(null);
            setLocationSuggestions([]);
          }
        } else {
          if (locationPermission !== "granted") return;
          const geocodePromise = Location.geocodeAsync(input);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Geocode timeout")), timeoutMs),
          );
          const result = await Promise.race([geocodePromise, timeoutPromise]);
          if (Array.isArray(result) && result.length > 0) {
            const { latitude, longitude } = result[0];
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          } else {
            setMapRegion(null);
          }
          setLocationSuggestions([]);
        }
      } catch (_err) {
        setMapRegion(null);
        setLocationSuggestions([]);
      }
    }, 600);
    return () => {
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = null;
      }
    };
  }, [form.location, locationPermission]);

  useEffect(() => {
    if (step === 2) {
      Animated.timing(lineProgress[0], {
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else if (step === 3) {
      Animated.timing(lineProgress[1], {
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [step, lineProgress]);

  // Validation functions
  const containsEmoji = (s) => {
    if (!s) return false;
    return /[\uD83C-\uDBFF][\uDC00-\uDFFF]|\u200D|\uFE0F|[\u2600-\u27BF]/.test(
      s,
    );
  };
  const validateName = (name) => {
    if (!name || name.length === 0) {
      return t("name_required");
    }
    if (containsEmoji(name)) {
      return t("invalid_name");
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return t("invalid_name");
    }
    if (name.trim().length < 3 || name.trim().length > 30) {
      return t("invalid_name");
    }
    if (!/^[A-Z][a-z\s]*$|^[a-z\s]+$/.test(name)) {
      return t("invalid_name");
    }
    return "";
  };

  const checkIdProofUniqueness = async (idNumber) => {
    if (!idNumber) return;
    setIsCheckingIdProof(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/api/check-id-proof/${idNumber}/`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.exists) {
          setIdProofError("This ID proof number is already registered.");
        } else {
          setIdProofError("");
        }
      }
    } catch (error) {
      console.log("Error checking ID proof:", error);
    } finally {
      setIsCheckingIdProof(false);
    }
  };

  const getScreen1Errors = () => {
    const newErrors = {};

    const nameError = validateName(form.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    if (!form.idProofType) {
      newErrors.idProofType = "Please select identity proof type";
    }
    if (!form.idProofNumber || !form.idProofNumber.trim()) {
      newErrors.idProofNumber = "Enter ID number";
    } else {
      const idNum = form.idProofNumber.trim();
      if (form.idProofType === "Aadhaar Card") {
        if (!/^\d{12}$/.test(idNum)) {
          newErrors.idProofNumber = "Aadhaar must be  12 digits";
        }
      } else if (form.idProofType === "PAN Card") {
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNum.toUpperCase())) {
          newErrors.idProofNumber = "Invalid PAN card format";
        }
      } else if (form.idProofType === "Voter ID") {
        if (!/^[A-Z0-9]{10}$/i.test(idNum)) {
          newErrors.idProofNumber = "Voter ID must be exactly 10 alphanumeric characters";
        }
      }
    }

    if (idProofError) {
      newErrors.idProofNumber = idProofError;
    }

    // Stay type must be selected
    const stayTypeError = validateRequired(form.stayType, "Stay type");
    if (stayTypeError) {
      newErrors.stayType = stayTypeError;
    }

    // Validate based on stay type
    if (form.stayType === "hostel") {
      const hostelNameError = validatePropertyName(form.hostelName);
      const locationError = validateLocation(form.location);
      const hostelTypeError = validateRequired(
        form.hostelType,
        t("hostel_type"),
      );
      if (hostelNameError) newErrors.hostelName = hostelNameError;
      if (locationError) newErrors.location = locationError;
      if (hostelTypeError) newErrors.hostelType = hostelTypeError;
    } else if (form.stayType === "apartment") {
      const apartmentNameError = validatePropertyName(form.apartmentName);
      const locationError = validateLocation(form.location);
      const tenantTypeError = validateRequired(
        form.tenantType,
        t("tenant_type"),
      );
      if (apartmentNameError) newErrors.apartmentName = apartmentNameError;
      if (locationError) newErrors.location = locationError;
      if (tenantTypeError) newErrors.tenantType = tenantTypeError;
    } else if (form.stayType === "commercial") {
      const commercialNameError = validatePropertyName(form.commercialName);
      const locationError = validateLocation(form.location);
      const usageError = validateRequired(form.usage, t("usage"));
      if (commercialNameError) newErrors.commercialName = commercialNameError;
      if (locationError) newErrors.location = locationError;
      if (usageError) newErrors.usage = usageError;
    }

    // Validate facilities and files
    if (form.stayType) {
      if ((!selectedFacilities || selectedFacilities.length === 0) && (!customFacilities || customFacilities.length === 0)) {
        newErrors.facilities = t("at_least_one_facility");
      }

      if (
        !form.documents.homePics ||
        !Array.isArray(form.documents.homePics) ||
        form.documents.homePics.length === 0
      ) {
        newErrors.document_homePics = t("property_images_required");
      }
      if (!form.documents.coverImage) {
        newErrors.document_coverImage = "Cover image is required";
      }

      if (!form.rent || isNaN(Number(form.rent)) || Number(form.rent) <= 0) {
        newErrors.rent = "Valid rent amount is required";
      }

      if (form.stayType === "apartment" && !form.furnishingType) {
        newErrors.furnishingType = "Furnishing type is required";
      }
    }

    return newErrors;
  };

  const validateStep1 = () => {
    const newErrors = getScreen1Errors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation Functions
  const validatePropertyName = (value) => {
    if (!value || value.trim().length === 0) {
      return t("field_required");
    }

    if (value.trim().length < 2) {
      return t("min_2_chars");
    }

    return "";
  };

  const validateLocation = (value) => {
    if (!value || value.trim().length === 0) {
      return t("location_required");
    }

    if (value.trim().length < 2) {
      return t("min_location_chars");
    }

    return "";
  };

  const validateRequired = (value, fieldName) => {
    if (!value || value === "") {
      return t("is_required").replace("{field}", fieldName);
    }
    return "";
  };

  const validateStep2 = () => {
    // Stay type must be selected
    if (!form.stayType) return false;

    let isValid = true;

    // Validate cover image
    if (!form.documents.coverImage) {
      isValid = false;
      setErrors((prev) => ({ ...prev, document_coverImage: "Cover image is required" }));
    }

    // Validate rent
    if (!form.rent || isNaN(Number(form.rent)) || Number(form.rent) <= 0) {
      isValid = false;
      setErrors((prev) => ({ ...prev, rent: "Valid rent amount is required" }));
    }

    // Validate furnishing type for apartment
    if (form.stayType === "apartment" && !form.furnishingType) {
      isValid = false;
      setErrors((prev) => ({ ...prev, furnishingType: "Furnishing type is required" }));
    }

    // Validate based on stay type
    if (form.stayType === "hostel") {
      if (validatePropertyName(form.hostelName)) isValid = false;
      if (validateLocation(form.location)) isValid = false;
      if (validateRequired(form.hostelType, t("hostel_type"))) isValid = false;
    } else if (form.stayType === "apartment") {
      if (validatePropertyName(form.apartmentName)) isValid = false;
      if (validateLocation(form.location)) isValid = false;
      // if (validateRequired(form.bhk, "BHK")) isValid = false;
      if (validateRequired(form.tenantType, t("tenant_type"))) isValid = false;
    } else if (form.stayType === "commercial") {
      if (validatePropertyName(form.commercialName)) isValid = false;
      if (validateLocation(form.location)) isValid = false;
      if (validateRequired(form.usage, t("usage"))) isValid = false;
    }

    // Validate facilities
    if ((!selectedFacilities || selectedFacilities.length === 0) && (!customFacilities || customFacilities.length === 0)) {
      isValid = false;
      setErrors((prev) => ({ ...prev, facilities: t("at_least_one_facility") }));
    }

    if (
      !form.documents.homePics ||
      !Array.isArray(form.documents.homePics) ||
      form.documents.homePics.length === 0
    ) {
      isValid = false;
      setErrors((prev) => ({ ...prev, document_homePics: t("property_images_required") }));
    }

    return isValid;
  };

  const onCoordinatePick = async (coord) => {
    const region = {
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setMapRegion(region);
    try {
      const res = await Location.reverseGeocodeAsync({
        latitude: coord.latitude,
        longitude: coord.longitude,
      });
      if (Array.isArray(res) && res[0]) {
        const p = res[0];
        const line = [
          p.name,
          p.street,
          p.city,
          p.region,
          p.postalCode,
          p.country,
        ]
          .filter(Boolean)
          .join(", ");
        setSelectedPlaceName(line || t("dropped_pin") || "Dropped pin");
        setForm({ ...form, location: line });
        setErrors({ ...errors, location: "" });
      } else {
        setSelectedPlaceName(t("dropped_pin") || "Dropped pin");
      }
    } catch {
      setSelectedPlaceName(t("dropped_pin") || "Dropped pin");
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permission_denied") || "Permission Denied", t("allow_location_message") || "Allow location access to use this feature.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      if (pos?.coords) {
        onCoordinatePick(pos.coords);
      }
    } catch (err) {
      Alert.alert(t("error"), t("could_not_get_location") || "Could not get current location.");
    }
  };

  const openInGoogleMaps = () => {
    const q = mapRegion
      ? `${mapRegion.latitude},${mapRegion.longitude}`
      : (form.location || "").trim();
    if (!q) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      q,
    )}`;
    Linking.openURL(url).catch(() => { });
  };

  const openDirections = async () => {
    if (!mapRegion) return;
    let origin = "Current+Location";
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        if (pos?.coords) {
          origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        }
      }
    } catch { }
    const dest = `${mapRegion.latitude},${mapRegion.longitude}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(dest)}`
        : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    Linking.openURL(url).catch(() => { });
  };

  const staticMapUrl = (lat, lon) =>
    `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=640x240&markers=${lat},${lon},red-pushpin`;

  async function registerForPushNotificationsAsync() {

    try {

      let token;

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {

        const { status } =
          await Notifications.requestPermissionsAsync();

        finalStatus = status;
      }

      if (finalStatus !== "granted") {

        alert("Notification permission not granted");

        return null;
      }

      // ANDROID CHANNEL
      if (Platform.OS === "android") {

        await Notifications.setNotificationChannelAsync(
          "default",
          {
            name: "default",
            importance:
              Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          }
        );

      }

      // PROJECT ID
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      console.log("EXPO PUSH TOKEN:", token);

      return token;

    } catch (error) {

      console.log(
        "REGISTER PUSH ERROR:",
        error
      );

      return null;
    }
  }
  const zoomIn = () => {
    if (!mapRegion) return;
    setMapRegion({
      ...mapRegion,
      latitudeDelta: Math.max(mapRegion.latitudeDelta / 1.5, 0.001),
      longitudeDelta: Math.max(mapRegion.longitudeDelta / 1.5, 0.001),
    });
  };
  const zoomOut = () => {
    if (!mapRegion) return;
    setMapRegion({
      ...mapRegion,
      latitudeDelta: Math.min(mapRegion.latitudeDelta * 1.5, 80),
      longitudeDelta: Math.min(mapRegion.longitudeDelta * 1.5, 80),
    });
  };

  const openImagePicker = (key) => {
    setImagePickerTarget(key);
    setShowImagePickerModal(true);
  };

  const handleImageSelection = async (source) => {
    setShowImagePickerModal(false);
    const isMultiple = imagePickerTarget === "homePics";

    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera permissions to make this work!");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: isMultiple,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newErrors = { ...errors };
      let hasSizeError = false;

      if (imagePickerTarget === "coverImage") {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5242880) {
          newErrors.document_coverImage = "Image must be under 5MB";
          setErrors(newErrors);
          return;
        }
        delete newErrors.document_coverImage;
        // Mock a mimeType if missing
        if (!asset.mimeType) asset.mimeType = "image/jpeg";
        setForm({ ...form, documents: { ...form.documents, coverImage: asset } });
        setErrors(newErrors);
        return;
      }

      if (isMultiple) {
        const validAssets = [];
        result.assets.forEach((asset) => {
          if (asset.fileSize && asset.fileSize > 5242880) {
            hasSizeError = true;
            newErrors[`document_${imagePickerTarget}`] = t("image_size_limit");
          } else if (asset) {
            if (!asset.mimeType) asset.mimeType = "image/jpeg";
            validAssets.push(asset);
          }
        });

        if (validAssets.length > 0) {
          const current = Array.isArray(form.documents.homePics) ? form.documents.homePics : [];
          const updated = [...current, ...validAssets];
          setForm({ ...form, documents: { ...form.documents, homePics: updated } });
          if (!hasSizeError) {
            delete newErrors[`document_${imagePickerTarget}`];
            delete newErrors.documents;
          }
        }
      }

      setErrors(newErrors);
    }
  };

  const validateAndShowErrors = () => {
    if (step === 1) {
      const newErrors = getScreen1Errors();
      setErrors(newErrors);
    }
  };

  const next = () => {
    validateAndShowErrors();

    if (step === 1) {
      if (!validateStep1()) {
        return;
      }
    } else if (step === 2) {
      if (!validateStep2()) {
        return;
      }
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    // Check floor rooms validation based on stay type
    if (form.floorsData && form.floorsData.length > 0) {
      let invalidFloor;
      if (form.stayType === "hostel") {
        invalidFloor = form.floorsData.find(floor => !floor.rooms || floor.rooms.length === 0);
      } else if (form.stayType === "apartment") {
        invalidFloor = form.floorsData.find(floor => !floor.flats || floor.flats.length === 0);
      } else if (form.stayType === "commercial") {
        invalidFloor = form.floorsData.find(floor => !floor.sections || floor.sections.length === 0);
      }
      if (invalidFloor) {
        const errorMsg = form.stayType === "hostel" 
          ? "Each floor must contain at least one room." 
          : (form.stayType === "apartment" ? "Each floor must contain at least one flat." : "Each floor must contain at least one section.");
        Alert.alert(t("error") || "Error", errorMsg);
        return;
      }
    }

    // ✅ Normalize facilities (VERY IMPORTANT)
    const normalize = (arr) => arr.map(f => f.toLowerCase().trim());
    const normalizedSelected = normalize(selectedFacilities);
    const normalizedCustom = normalize(customFacilities);
    const allFacilities = [...normalizedSelected, ...normalizedCustom];
    const hasFacility = (label) => normalizedSelected.includes(label);

    // --- Geocoding fallback ---
    let finalLat = mapRegion ? mapRegion.latitude : null;
    let finalLon = mapRegion ? mapRegion.longitude : null;

    if (!finalLat || !finalLon) {
      try {
        console.log("Geocoding address before submission...");
        const geo = await Location.geocodeAsync(form.location);
        if (geo && geo.length > 0) {
          finalLat = geo[0].latitude;
          finalLon = geo[0].longitude;
        }
      } catch (e) {
        console.log("Pre-submit geocode error:", e);
      }
    }

    const submitData = {
      name: form.name,
      phone_number: phone,
      id_proof_type: form.idProofType,
      id_proof_number: form.idProofNumber,

      stayType: form.stayType,
      hostelName: form.stayType === "hostel" ? form.hostelName : null,
      hostelType: form.stayType === "hostel" ? form.hostelType : null,
      apartmentName: form.stayType === "apartment" ? form.apartmentName : null,
      bhk: form.stayType === "apartment" ? form.bhk : null,
      tenantType: form.stayType === "apartment" ? form.tenantType : null,
      commercialName: form.stayType === "commercial" ? form.commercialName : null,
      usage: form.stayType === "commercial" ? form.usage : null,
      location: form.location,
      latitude: finalLat ? parseFloat(finalLat.toFixed(10)) : null,
      longitude: finalLon ? parseFloat(finalLon.toFixed(10)) : null,
      facilities: JSON.stringify([...new Set(allFacilities)]),
      wifi: hasFacility("wifi"),
      parking: hasFacility("parking"),
      food: hasFacility("food"),
      lift: hasFacility("lift"),
      power_backup: hasFacility("power backup"),
      security: hasFacility("security"),
      play_area: hasFacility("play area"),
      mess: hasFacility("mess"),
      laundry: hasFacility("laundry"),
      water: hasFacility("water"),
      ac: hasFacility("ac"),
      non_ac: hasFacility("non ac"),
      floors_info: JSON.stringify(form.floorsData || []),
      property_type: form.stayType,
    };

    console.log("SUBMIT DATA:", submitData);

    Alert.alert(t("confirm_registration"), null, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("submit"),
        onPress: async () => {
          try {
            setIsLoading(true);
            const formData = new FormData();
            Object.entries(submitData).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== "") {
                formData.append(key, String(value));
              }
            });

            formData.append("building_layout", JSON.stringify(form.floorsData || []));
            formData.append("rent_amount", form.rent || "");
            formData.append("furnishing_type", form.furnishingType || "");

            if (form.documents.coverImage) {
              formData.append("cover_image", {
                uri: form.documents.coverImage.uri,
                name: form.documents.coverImage.name || "cover.jpg",
                type: form.documents.coverImage.mimeType || "image/jpeg",
              });
            }

            if (Array.isArray(form.documents?.homePics) && form.documents.homePics.length > 0) {
              form.documents.homePics.forEach((img, index) => {
                if (img?.uri) {
                  formData.append("gallery_images", {
                    uri: img.uri,
                    name: img.name || `gallery_${index}.jpg`,
                    type: img.mimeType || "image/jpeg",
                  });
                }
              });
            }

            if (isAddingAccount) {
              formData.append("action", "register");
            }

            const endpoint = isAddingAccount 
              ? `${BASE_URL}/api/owner/accounts/add/`
              : `${BASE_URL}/api/owner/`;

            const response = await fetchWithAuth(endpoint, {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              console.log("OWNER REGISTER RESPONSE:", data);

              // SAVE JWT TOKEN
              if (data.token) {
                await AsyncStorage.setItem("userToken", data.token);
              }

              // =========================
              // PUSH NOTIFICATION CODE
              // =========================

              try {
                const expoPushToken =
                  await registerForPushNotificationsAsync();

                console.log("OWNER PUSH TOKEN:", expoPushToken);

                if (expoPushToken) {
                  await fetchWithAuth(
                    `${BASE_URL}/api/save-push-token/`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        phone: phone,
                        role: "owner",
                        push_token: expoPushToken,
                      }),
                    }
                  );

                  console.log("Push token saved successfully");
                }
              } catch (pushError) {
                console.log(
                  "Push token error:",
                  pushError
                );
              }

              // =========================

              setIsLoading(false);

              if (data.status === "active") {
                const targetPhone = data.owner_id || phone;

                await AsyncStorage.setItem("ownerPhone", String(targetPhone));
                await AsyncStorage.setItem("selectedAccountId", String(targetPhone));

                if (refreshAccounts) {
                  await refreshAccounts();
                }
                if (switchAccount) {
                  await switchAccount(String(targetPhone));
                }

                Alert.alert(t("success"), t("registration_successful"), [
                  {
                    text: t("ok") || "OK",
                    onPress: () =>
                      navigation.reset({
                        index: 0,
                        routes: [
                          {
                            name: "RenntoLoadingScreen",
                            params: {
                              destination: "OwnerNavigation",
                              destinationParams: { phone: targetPhone },
                            },
                          },
                        ],
                      }),
                  },
                ]);
              } else {
                Alert.alert(t("success"), t("registration_successful"), [
                  {
                    text: t("ok") || "OK",
                    onPress: () =>
                      navigation.replace("WaitingScreen", {
                        phone: data.owner_id || phone,
                      }),
                  },
                ]);
              }

            } else {
              setIsLoading(false);
              Alert.alert(t("error"), t("registration_failed"));
            }
          } catch (error) {
            setIsLoading(false);
            Alert.alert(t("error"), (t("network_error") || "Network error") + ": " + error.message);
          }
        },
      },
    ]);
  };

  const submit = () => handleSubmit();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={{ flex: 1 }}>
          <Modal transparent visible={isLoading} animationType="fade">
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={NAVY} />
                <Text style={styles.loadingText}>{t("submitting_registration")}</Text>
              </View>
            </View>
          </Modal>
          <Modal transparent visible={showImagePickerModal} animationType="slide" onRequestClose={() => setShowImagePickerModal(false)}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(15,15,30,0.55)", justifyContent: "flex-end" }}
              activeOpacity={1}
              onPress={() => setShowImagePickerModal(false)}
            >
              <TouchableWithoutFeedback>
                <View style={{
                  backgroundColor: "#FFFFFF",
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingBottom: Platform.OS === "ios" ? 40 : 24,
                  paddingTop: 12,
                  paddingHorizontal: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 20,
                }}>
                  {/* Drag Handle */}
                  <View style={{ width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 4, alignSelf: "center", marginBottom: 16 }} />

                  {/* Header Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <TouchableOpacity onPress={() => setShowImagePickerModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Upload Image</Text>
                    <TouchableOpacity onPress={() => setShowImagePickerModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#EF4444" }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Illustration */}
                  <View style={{ alignItems: "center", marginBottom: 24 }}>
                    <View style={{
                      width: 60, height: 60, borderRadius: 30,
                      backgroundColor: "#F5F3FF",
                      justifyContent: "center", alignItems: "center",
                      marginBottom: 14,
                    }}>
                      <Ionicons name="image-outline" size={28} color="#7C3AED" />
                      <View style={{ position: 'absolute', bottom: 12, right: 10, backgroundColor: '#FFFFFF', borderRadius: 10 }}>
                        <Ionicons name="add-circle" size={16} color="#7C3AED" />
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>Choose an option to upload your image</Text>
                  </View>

                  {/* Take Photo */}
                  <TouchableOpacity
                    onPress={() => handleImageSelection("camera")}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row", alignItems: "center",
                      padding: 16, borderRadius: 16,
                      borderWidth: 1, borderColor: "#E9E1FF",
                      backgroundColor: "#FAFAFF",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center",
                      marginRight: 16,
                      shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
                    }}>
                      <Ionicons name="camera-outline" size={24} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 2 }}>Take Photo</Text>
                      <Text style={{ fontSize: 13, color: "#6B7280" }}>Open camera and take a new photo</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                  </TouchableOpacity>

                  {/* Choose from Gallery */}
                  <TouchableOpacity
                    onPress={() => handleImageSelection("gallery")}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row", alignItems: "center",
                      padding: 16, borderRadius: 16,
                      borderWidth: 1, borderColor: "#E5E7EB",
                      backgroundColor: "#FFFFFF",
                      marginBottom: 24,
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: "#F5F3FF", justifyContent: "center", alignItems: "center",
                      marginRight: 16
                    }}>
                      <Ionicons name="image-outline" size={24} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 2 }}>Choose from Gallery</Text>
                      <Text style={{ fontSize: 13, color: "#6B7280" }}>Select an image from your device</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>

          <View style={styles.page}>
            {/* Custom Header */}
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>
                    {step === 1 ? t("registration_step") || "Registration" : t("floor_details") || "Floor Details"}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {step === 1 ? "Provide owner information" : "Manage building floors and layout"}
                  </Text>
                </View>
                <View style={styles.headerIconContainer}>
                  <Image source={require("../../../assets/images/rent1.png")} style={{ width: 60, height: 70 }} resizeMode="contain" />
                </View>
              </View>
            </View>

            <Animated.ScrollView
              style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 15 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1 }}>
                  {/* STEP INDICATOR CARD */}
                  <View style={[styles.sectionCard, { paddingVertical: 10, paddingHorizontal: 16, marginBottom: 10 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                      {[1, 2].map((i) => {
                        const isActive = step === i;
                        const isCompleted = step > i;
                        const isInactive = step < i;

                        return (
                          <React.Fragment key={i}>
                            <View style={{ alignItems: "center" }}>
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  overflow: "hidden",
                                  backgroundColor: isInactive ? "#E5E7EB" : LIGHT_PURPLE,
                                }}
                              >
                                {isActive ? (
                                  <LinearGradient
                                    colors={["#8B5CF6", "#6D28D9"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                                  >
                                    <FontAwesome name={i === 1 ? "user" : "home"} size={18} color={WHITE} />
                                  </LinearGradient>
                                ) : (
                                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                    {isCompleted ? (
                                      <FontAwesome name="check" size={18} color={WHITE} />
                                    ) : (
                                      <FontAwesome name={i === 1 ? "user" : "home"} size={18} color="#9CA3AF" />
                                    )}
                                  </View>
                                )}
                              </View>
                              <Text style={{ fontSize: 11, fontWeight: "600", color: isActive ? LIGHT_PURPLE : (isCompleted ? "#10B981" : "#9CA3AF"), marginTop: 5, textAlign: "center" }}>
                                {i === 1 ? "Owner Info" : "Floor Layout"}
                              </Text>
                            </View>
                            {i < 2 && (
                              <View style={{ flex: 1, height: 3, backgroundColor: "#E5E7EB", borderRadius: 2, marginHorizontal: 10, marginBottom: 14 }}>
                                <Animated.View
                                  style={{
                                    height: "100%",
                                    backgroundColor: LIGHT_PURPLE,
                                    borderRadius: 2,
                                    width: lineProgress[i - 1].interpolate({
                                      inputRange: [0, 1],
                                      outputRange: ["0%", "100%"]
                                    }),
                                  }}
                                />
                              </View>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </View>
                  </View>

                  {/* ---------- STEP 1 ---------- */}


                  {/* ---------- STEP 2 ---------- */}
                  {step === 1 && (
                    <>
                      {/* Owner Details Card */}
                      <View style={styles.sectionCard}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                          <View style={{ width: 44, height: 44, backgroundColor: "#F5F3FF", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 }}>
                            <FontAwesome name="user-o" size={20} color={LIGHT_PURPLE} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>Owner Details</Text>
                            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Provide the owner information</Text>
                          </View>
                        </View>

                        <Text style={[styles.label, { color: "#111827", fontWeight: "600" }]}>
                          Owner Full Name <Text style={{ color: "#EF4444" }}>*</Text>
                        </Text>

                        <View
                          style={[
                            styles.inputContainer,
                            styles.inputContainerStep2,
                            { paddingLeft: 6 }
                          ]}
                        >
                          <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                            <FontAwesome name="user-o" size={18} color={LIGHT_PURPLE} />
                          </View>

                          <TextInput
                            style={[
                              styles.input,
                              errors.name && styles.inputError,
                              { flex: 1 },
                            ]}
                            placeholder="Enter owner full name"
                            placeholderTextColor="gray"
                            value={form.name}
                            onChangeText={(v) => {

                              let filtered =
                                v.replace(/[^A-Za-z\s]/g, "");

                              if (filtered.length > 30) {
                                filtered = filtered.slice(0, 30);
                              }

                              setForm({
                                ...form,
                                name: filtered,
                              });

                              setErrors({
                                ...errors,
                                name: "",
                              });

                            }}
                          />
                        </View>

                        {errors.name ? (
                          <Text style={styles.errorText}>
                            {errors.name}
                          </Text>
                        ) : null}

                        <Text style={[styles.label, { color: "#111827", fontWeight: "600" }]}>
                          Identity Proof Type <Text style={{ color: "#EF4444" }}>*</Text>
                        </Text>
                        <View style={[styles.inputContainer, styles.inputContainerStep2, { paddingLeft: 6 }, errors.idProofType && styles.inputError]}>
                          <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                            <FontAwesome name="id-card-o" size={18} color={LIGHT_PURPLE} />
                          </View>
                          <Picker
                            selectedValue={form.idProofType}
                            onValueChange={(v) => {
                              setForm({
                                ...form,
                                idProofType: v,
                                idProofNumber: "",
                              });
                              setErrors({
                                ...errors,
                                idProofType: "",
                                idProofNumber: "",
                              });
                            }}
                            style={[
                              styles.picker,
                              { flex: 1, marginLeft: -10 },
                            ]}
                          >
                            <Picker.Item label="Select ID type" value="" color="gray" />
                            <Picker.Item label="Aadhaar Card" value="Aadhaar Card" />
                            <Picker.Item label="PAN Card" value="PAN Card" />
                            <Picker.Item label="Voter ID" value="Voter ID" />
                          </Picker>
                        </View>
                        {errors.idProofType ? (
                          <Text style={styles.errorText}>
                            {errors.idProofType}
                          </Text>
                        ) : null}

                        {form.idProofType !== "" && (
                          <>
                            <Text style={[styles.label, { color: "#111827", fontWeight: "600" }]}>
                              {form.idProofType === "Aadhaar Card"
                                ? "Aadhaar Number"
                                : form.idProofType === "PAN Card"
                                  ? "PAN Card Number"
                                  : "Voter ID Number"}
                            </Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                                { paddingLeft: 6 }
                              ]}
                            >
                              <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                                <FontAwesome name="id-card-o" size={18} color={LIGHT_PURPLE} />
                              </View>
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.idProofNumber && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder={
                                  form.idProofType === "Aadhaar Card"
                                    ? "Enter Aadhaar number"
                                    : form.idProofType === "PAN Card"
                                      ? "Enter PAN number"
                                      : "Enter Voter ID"
                                }
                                placeholderTextColor="gray"
                                keyboardType={
                                  form.idProofType === "Aadhaar Card"
                                    ? "numeric"
                                    : "default"
                                }
                                autoCapitalize={
                                  form.idProofType === "PAN Card" || form.idProofType === "Voter ID"
                                    ? "characters"
                                    : "none"
                                }
                                maxLength={
                                  form.idProofType === "Aadhaar Card"
                                    ? 12
                                    : 10
                                }
                                value={form.idProofNumber}
                                onChangeText={(v) => {
                                  let formatted = v;
                                  if (form.idProofType === "Aadhaar Card") {
                                    formatted = v.replace(/[^0-9]/g, "");
                                  } else if (form.idProofType === "PAN Card" || form.idProofType === "Voter ID") {
                                    formatted = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                                  }
                                  setForm({
                                    ...form,
                                    idProofNumber: formatted,
                                  });
                                  setErrors({
                                    ...errors,
                                    idProofNumber: "",
                                  });
                                  setIdProofError("");

                                  if (idProofCheckTimeout.current) clearTimeout(idProofCheckTimeout.current);
                                  idProofCheckTimeout.current = setTimeout(() => {
                                    const expectedLength = form.idProofType === "Aadhaar Card" ? 12 : 10;
                                    if (formatted.length === expectedLength) {
                                      checkIdProofUniqueness(formatted);
                                    }
                                  }, 500);
                                }}
                              />
                              {isCheckingIdProof && <ActivityIndicator size="small" color="#7A3FC4" style={{ marginRight: 10 }} />}
                            </View>
                            {errors.idProofNumber ? (
                              <Text style={styles.errorText}>
                                {errors.idProofNumber}
                              </Text>
                            ) : null}
                          </>
                        )}
                      </View>

                      {/* Stay Details Card */}
                      <View style={styles.sectionCard}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                          <View style={{ width: 44, height: 44, backgroundColor: "#F5F3FF", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 }}>
                            <FontAwesome name="building-o" size={20} color={LIGHT_PURPLE} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>Stay Details</Text>
                            <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Provide the stay information</Text>
                          </View>
                        </View>

                        <Text style={[styles.label, { color: "#111827", fontWeight: "600" }]}>
                          Stay Type <Text style={{ color: "#EF4444" }}>*</Text>
                        </Text>
                        <View style={[styles.inputContainer, styles.inputContainerStep2, { paddingLeft: 6 }, errors.stayType && styles.inputError]}>
                          <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                            <FontAwesome name="building-o" size={18} color={LIGHT_PURPLE} />
                          </View>
                          <Picker
                            selectedValue={form.stayType}
                            onValueChange={(v) => {
                              handleStayTypeChange(v);
                            }}
                            style={[
                              styles.picker,
                              { flex: 1, marginLeft: -10 },
                            ]}
                          >
                            <Picker.Item label={t("select_stay_type")} value="" color="gray" />
                            <Picker.Item label={t("hostel")} value="hostel" />
                            <Picker.Item label={t("apartment")} value="apartment" />
                            <Picker.Item label={t("commercial")} value="commercial" />
                          </Picker>
                        </View>
                        {errors.stayType ? (
                          <Text style={styles.errorText}>{errors.stayType}</Text>
                        ) : null}

                        {/* HOSTEL */}
                        {form.stayType === "hostel" && (
                          <>
                            <Text style={styles.label}>{t("hostel_name")}</Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.hostelName && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder={t("enter_hostel_name")}
                                placeholderTextColor="gray"
                                value={form.hostelName}
                                onChangeText={(v) => {
                                  setForm({ ...form, hostelName: v });
                                }}
                                onBlur={() =>
                                  setErrors({
                                    ...errors,
                                    hostelName: validatePropertyName(
                                      form.hostelName,
                                    ),
                                  })
                                }
                              />
                            </View>
                            {errors.hostelName ? (
                              <Text style={styles.errorText}>
                                {errors.hostelName}
                              </Text>
                            ) : null}

                            <Text style={[styles.label, { color: "#111827", fontWeight: "600" }]}>Location <Text style={{ color: "#EF4444" }}>*</Text></Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                                { paddingLeft: 6 }
                              ]}
                            >
                              <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                                <Ionicons name="location-outline" size={18} color={LIGHT_PURPLE} />
                              </View>
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.location && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder="Property Location"
                                placeholderTextColor="gray"
                                value={form.location}
                                onChangeText={(v) => {
                                  setForm({ ...form, location: v });
                                  if (errors.location) {
                                    setErrors({ ...errors, location: '' });
                                  }
                                }}
                                onBlur={() =>
                                  setErrors({
                                    ...errors,
                                    location: validateLocation(form.location),
                                  })
                                }
                              />
                              <TouchableOpacity
                                onPress={handleGetCurrentLocation}
                                style={{ padding: 8 }}
                              >
                                <MaterialIcons
                                  name='my-location'
                                  size={24}
                                  color='#2563eb'
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={openInGoogleMaps}
                                style={{ padding: 8 }}
                              >
                                <MaterialIcons
                                  name="map"
                                  size={24}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            </View>
                            {errors.location ? (
                              <Text style={styles.errorText}>
                                {errors.location}
                              </Text>
                            ) : null}

                            {Platform.OS === 'android' &&
                              locationSuggestions.length > 0 && (
                                <View style={{ marginBottom: 10 }}>
                                  {locationSuggestions
                                    .slice(0, 5)
                                    .map((item, idx) => (
                                      <TouchableOpacity
                                        key={`${item.place_id || idx}`}
                                        style={styles.suggestionItem}
                                        onPress={() => {
                                          const lat = parseFloat(item.lat);
                                          const lon = parseFloat(item.lon);
                                          if (isFinite(lat) && isFinite(lon)) {
                                            setMapRegion({
                                              latitude: lat,
                                              longitude: lon,
                                              latitudeDelta: 0.0922,
                                              longitudeDelta: 0.0421,
                                            });
                                          }
                                          if (item.display_name) {
                                            setSelectedPlaceName(
                                              item.display_name,
                                            );
                                            setForm({
                                              ...form,
                                              location: item.display_name,
                                            }); setErrors({ ...errors, location: "" });
                                            setErrors({ ...errors, location: "" });
                                          }
                                        }}
                                      >
                                        <Text
                                          style={styles.suggestionText}
                                          numberOfLines={1}
                                        >
                                          {item.display_name}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                </View>
                              )}

                            {selectedPlaceName ? (
                              <Text
                                style={{
                                  color: "#374151",
                                  fontSize: 12,
                                  marginBottom: 6,
                                }}
                                numberOfLines={1}
                              >
                                {t("selected")}: {selectedPlaceName}
                              </Text>
                            ) : null}


                            {mapRegion && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  marginTop: 8,
                                  marginBottom: 10,
                                }}
                              >
                                <TouchableOpacity
                                  style={styles.mapActionBtn}
                                  onPress={async () => {
                                    try {
                                      const { status } =
                                        await Location.requestForegroundPermissionsAsync();
                                      if (status !== "granted") return;
                                      const pos =
                                        await Location.getCurrentPositionAsync(
                                          {},
                                        );
                                      if (pos?.coords) {
                                        setMapRegion({
                                          latitude: pos.coords.latitude,
                                          longitude: pos.coords.longitude,
                                          latitudeDelta: 0.0922,
                                          longitudeDelta: 0.0421,
                                        });
                                        setSelectedPlaceName(t("current_location") || "Current location");
                                      }
                                    } catch { }
                                  }}
                                >
                                  <Text style={styles.mapActionText}>
                                    {t("use_current_location")}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.mapActionBtn, { marginLeft: 8 }]}
                                  onPress={openDirections}
                                >
                                  <Text style={styles.mapActionText}>
                                    {t("navigate")}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}

                            <Text style={styles.label}>{t("hostel_type")}</Text>
                            <View style={[styles.inputContainer, styles.inputContainerStep2, { paddingHorizontal: 0 }, errors.hostelType && styles.inputError]}>
                              <Picker
                                selectedValue={form.hostelType}
                                onValueChange={(v) => {
                                  setForm({ ...form, hostelType: v });
                                  setErrors({
                                    ...errors,
                                    hostelType: validateRequired(v, t("hostel_type")),
                                  });
                                }}
                                style={[
                                  styles.picker,
                                  { flex: 1 },
                                ]}
                              >
                                <Picker.Item label={t("select_type")} value="" />
                                <Picker.Item label={t("boys")} value="boys" />
                                <Picker.Item label={t("girls")} value="girls" />
                                <Picker.Item label={t("coliving")} value="coliving" />
                              </Picker>
                            </View>
                            {errors.hostelType ? (
                              <Text style={styles.errorText}>
                                {errors.hostelType}
                              </Text>
                            ) : null}

                            <Text style={styles.label}>{t("facilities")}</Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <View
                                style={[
                                  styles.inputContainer,
                                  { flex: 1, marginBottom: 0 },
                                ]}
                              >
                                <TextInput
                                  style={[styles.input, { flex: 1 }]}
                                  placeholder={t("add_new_facility")}
                                  placeholderTextColor="gray"
                                  value={newFacilityText}
                                  onChangeText={setNewFacilityText}
                                />
                              </View>
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => {
                                  if (newFacilityText.trim()) {
                                    setCustomFacilities([
                                      ...customFacilities,
                                      newFacilityText.trim(),
                                    ]);
                                    setNewFacilityText("");
                                  }
                                }}
                              >
                                <Text style={styles.addButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {customFacilities.map((facility, index) => (
                                <View key={index} style={styles.facilityTag}>
                                  <Text style={styles.facilityText}>
                                    {facility}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                      setCustomFacilities(
                                        customFacilities.filter(
                                          (_, i) => i !== index,
                                        ),
                                      );
                                    }}
                                  >
                                    <Text style={styles.removeButtonText}>-</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {[
                                t("WiFi") || "WiFi",
                                t("Mess") || "Mess",
                                t("Laundry") || "Laundry",
                                t("Security") || "Security",
                                t("Parking") || "Parking",
                                t("AC") || "AC",
                                t("Gym") || "Gym",
                                t("TV") || "TV",
                                t("Hot Water") || "Hot Water",
                              ].map((label) => {
                                const isSelected =
                                  selectedFacilities.includes(label);
                                return (
                                  <TouchableOpacity
                                    key={label}
                                    style={[
                                      styles.facilityTag,
                                      isSelected && styles.presetSelected,
                                    ]}
                                    onPress={() => {
                                      const exists =
                                        selectedFacilities.includes(label);
                                      setSelectedFacilities(
                                        exists
                                          ? selectedFacilities.filter(
                                            (f) => f !== label,
                                          )
                                          : [...selectedFacilities, label],
                                      );
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.facilityText,
                                        isSelected && { color: "#ffffff" },
                                      ]}
                                    >
                                      {label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {errors.facilities ? (
                              <Text style={styles.errorText}>
                                {errors.facilities}
                              </Text>
                            ) : null}
                            {/* Rent Amount */}
                            <Text style={styles.label}>Basic Rent / Basic Property Amount</Text>
                            <View style={[styles.inputContainer, styles.inputContainerStep2]}>
                              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 18, marginRight: 8 }}>₹</Text>
                              <TextInput
                                style={[styles.input, errors.rent && styles.inputError, { flex: 1 }]}
                                placeholder="Enter amount"
                                placeholderTextColor="gray"
                                keyboardType="numeric"
                                value={form.rent}
                                onChangeText={(v) => {
                                  const cleaned = v.replace(/[^0-9]/g, "");
                                  setForm({ ...form, rent: cleaned });
                                  if (cleaned && Number(cleaned) > 0) {
                                    setErrors({ ...errors, rent: "" });
                                  }
                                }}
                              />
                            </View>
                            {errors.rent ? <Text style={styles.errorText}>{errors.rent}</Text> : null}

                          </>
                        )}

                        {/* APARTMENT */}
                        {form.stayType === "apartment" && (
                          <>
                            <Text style={styles.label}>{t("apartment_name")}</Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.apartmentName && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder={t("enter_apartment_name")}
                                placeholderTextColor="gray"
                                value={form.apartmentName}
                                onChangeText={(v) => {
                                  setForm({ ...form, apartmentName: v });
                                }}
                                onBlur={() =>
                                  setErrors({
                                    ...errors,
                                    apartmentName: validatePropertyName(
                                      form.apartmentName,
                                    ),
                                  })
                                }
                              />
                            </View>
                            {errors.apartmentName ? (
                              <Text style={styles.errorText}>
                                {errors.apartmentName}
                              </Text>
                            ) : null}

                            <Text style={styles.label}>{t("location")}</Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.location && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder={t("enter_location")}
                                placeholderTextColor="gray"
                                value={form.location}
                                onChangeText={(v) => {
                                  setForm({ ...form, location: v });
                                  if (errors.location) {
                                    setErrors({ ...errors, location: '' });
                                  }
                                }}
                                onBlur={() =>
                                  setErrors({
                                    ...errors,
                                    location: validateLocation(form.location),
                                  })
                                }
                              />
                              <TouchableOpacity
                                onPress={handleGetCurrentLocation}
                                style={{ padding: 8 }}
                              >
                                <MaterialIcons
                                  name='my-location'
                                  size={24}
                                  color='#2563eb'
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={openInGoogleMaps}
                                style={{ padding: 8 }}
                              >
                                <MaterialIcons
                                  name="map"
                                  size={24}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            </View>
                            {errors.location ? (
                              <Text style={styles.errorText}>
                                {errors.location}
                              </Text>
                            ) : null}

                            {Platform.OS === "android" &&
                              locationSuggestions.length > 0 && (
                                <View style={{ marginBottom: 10 }}>
                                  {locationSuggestions
                                    .slice(0, 5)
                                    .map((item, idx) => (
                                      <TouchableOpacity
                                        key={`${item.place_id || idx}`}
                                        style={styles.suggestionItem}
                                        onPress={() => {
                                          const lat = parseFloat(item.lat);
                                          const lon = parseFloat(item.lon);
                                          if (isFinite(lat) && isFinite(lon)) {
                                            setMapRegion({
                                              latitude: lat,
                                              longitude: lon,
                                              latitudeDelta: 0.0922,
                                              longitudeDelta: 0.0421,
                                            });
                                          }
                                          if (item.display_name) {
                                            setSelectedPlaceName(
                                              item.display_name,
                                            );
                                            setForm({
                                              ...form,
                                              location: item.display_name,
                                            }); setErrors({ ...errors, location: "" });
                                          }
                                        }}
                                      >
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <Text
                                            style={styles.suggestionText}
                                            numberOfLines={1}
                                          >
                                            {item.display_name}
                                          </Text>
                                          <TouchableOpacity
                                            style={{
                                              paddingHorizontal: 8,
                                              paddingVertical: 4,
                                            }}
                                            onPress={() => {
                                              const q =
                                                item.lat && item.lon
                                                  ? `${item.lat},${item.lon}`
                                                  : item.display_name || "";
                                              if (!q) return;
                                              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                q,
                                              )}`;
                                              Linking.openURL(url).catch(
                                                () => { },
                                              );
                                            }}
                                          >
                                            <Text
                                              style={{
                                                color: "#2563eb",
                                                fontWeight: "600",
                                              }}
                                            >
                                              {t("open") || "Open"}
                                            </Text>
                                          </TouchableOpacity>
                                        </View>
                                      </TouchableOpacity>
                                    ))}
                                </View>
                              )}


                            {mapRegion && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  marginTop: 8,
                                  marginBottom: 10,
                                }}
                              >
                                <TouchableOpacity
                                  style={styles.mapActionBtn}
                                  onPress={async () => {
                                    try {
                                      const { status } =
                                        await Location.requestForegroundPermissionsAsync();
                                      if (status !== "granted") return;
                                      const pos =
                                        await Location.getCurrentPositionAsync(
                                          {},
                                        );
                                      if (pos?.coords) {
                                        setMapRegion({
                                          latitude: pos.coords.latitude,
                                          longitude: pos.coords.longitude,
                                          latitudeDelta: 0.0922,
                                          longitudeDelta: 0.0421,
                                        });
                                        setSelectedPlaceName(t("current_location") || "Current location");
                                      }
                                    } catch { }
                                  }}
                                >
                                  <Text style={styles.mapActionText}>
                                    {t("use_current_location")}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.mapActionBtn, { marginLeft: 8 }]}
                                  onPress={openDirections}
                                >
                                  <Text style={styles.mapActionText}>
                                    {t("navigate")}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}

                            <Text style={styles.label}>{t("tenant_type")}</Text>
                            <View style={[styles.inputContainer, styles.inputContainerStep2, { paddingHorizontal: 0 }, errors.tenantType && styles.inputError]}>
                              <Picker
                                selectedValue={form.tenantType}
                                onValueChange={(v) => {
                                  setForm({ ...form, tenantType: v });
                                }}
                                style={[
                                  styles.picker,
                                  { flex: 1 },
                                ]}
                              >
                                <Picker.Item label={t("select")} value="" />
                                <Picker.Item label={t("family")} value="family" />
                                <Picker.Item label={t("bachelors")} value="bachelors" />
                              </Picker>
                            </View>
                            {errors.tenantType ? (
                              <Text style={styles.errorText}>
                                {errors.tenantType}
                              </Text>
                            ) : null}

                            <Text style={styles.label}>{t("facilities")}</Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <View
                                style={[
                                  styles.inputContainer,
                                  { flex: 1, marginBottom: 0 },
                                ]}
                              >
                                <TextInput
                                  style={[styles.input, { flex: 1 }]}
                                  placeholder={t("add_new_facility")}
                                  placeholderTextColor="gray"
                                  value={newFacilityText}
                                  onChangeText={setNewFacilityText}
                                />
                              </View>
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => {
                                  if (newFacilityText.trim()) {
                                    setCustomFacilities([
                                      ...customFacilities,
                                      newFacilityText.trim(),
                                    ]);
                                    setNewFacilityText("");
                                  }
                                }}
                              >
                                <Text style={styles.addButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {customFacilities.map((facility, index) => (
                                <View key={index} style={styles.facilityTag}>
                                  <Text style={styles.facilityText}>
                                    {facility}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                      setCustomFacilities(
                                        customFacilities.filter(
                                          (_, i) => i !== index,
                                        ),
                                      );
                                    }}
                                  >
                                    <Text style={styles.removeButtonText}>-</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {[
                                t("Parking") || "Parking",
                                t("Lift") || "Lift",
                                t("Power Backup") || "Power Backup",
                                t("Security") || "Security",
                                t("Play Area") || "Play Area",
                                t("Gym") || "Gym",
                                t("Swimming Pool") || "Swimming Pool",
                                t("Club House") || "Club House",
                              ].map((label) => {
                                const isSelected =
                                  selectedFacilities.includes(label);
                                return (
                                  <TouchableOpacity
                                    key={label}
                                    style={[
                                      styles.facilityTag,
                                      isSelected && styles.presetSelected,
                                    ]}
                                    onPress={() => {
                                      const exists =
                                        selectedFacilities.includes(label);
                                      setSelectedFacilities(
                                        exists
                                          ? selectedFacilities.filter(
                                            (f) => f !== label,
                                          )
                                          : [...selectedFacilities, label],
                                      );
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.facilityText,
                                        isSelected && { color: "#ffffff" },
                                      ]}
                                    >
                                      {label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {errors.facilities ? (
                              <Text style={styles.errorText}>
                                {errors.facilities}
                              </Text>
                            ) : null}
                            {/* Rent Amount */}
                            <Text style={styles.label}>Basic Rent / Basic Property Amount</Text>
                            <View style={[styles.inputContainer, styles.inputContainerStep2]}>
                              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 18, marginRight: 8 }}>₹</Text>
                              <TextInput
                                style={[styles.input, errors.rent && styles.inputError, { flex: 1 }]}
                                placeholder="Enter amount"
                                placeholderTextColor="gray"
                                keyboardType="numeric"
                                value={form.rent}
                                onChangeText={(v) => {
                                  const cleaned = v.replace(/[^0-9]/g, "");
                                  setForm({ ...form, rent: cleaned });
                                  if (cleaned && Number(cleaned) > 0) {
                                    setErrors({ ...errors, rent: "" });
                                  }
                                }}
                              />
                            </View>
                            {errors.rent ? <Text style={styles.errorText}>{errors.rent}</Text> : null}
                            {/* Furnishing Type - Apartment only */}
                            <Text style={styles.label}>Furnishing Type</Text>
                            <View style={{ flexDirection: "row", marginBottom: 10, gap: 8 }}>
                              {["Fully Furnished", "Semi Furnished", "Unfurnished"].map((option) => (
                                <TouchableOpacity
                                  key={option}
                                  style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderColor: form.furnishingType === option ? LIGHT_PURPLE : "#e5e7eb",
                                    backgroundColor: form.furnishingType === option ? "#f5f3ff" : "#fff",
                                    alignItems: "center",
                                    elevation: form.furnishingType === option ? 3 : 1,
                                  }}
                                  onPress={() => {
                                    setForm({ ...form, furnishingType: option });
                                    setErrors({ ...errors, furnishingType: "" });
                                  }}
                                >
                                  <Text style={{
                                    fontSize: 11,
                                    fontWeight: "700",
                                    color: form.furnishingType === option ? LIGHT_PURPLE : GRAY,
                                    textAlign: "center",
                                  }}>
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            {errors.furnishingType ? <Text style={styles.errorText}>{errors.furnishingType}</Text> : null}
                          </>
                        )}

                        {/* COMMERCIAL */}
                        {form.stayType === "commercial" && (
                          <>
                            <Text style={styles.label}>{t("property_name")}</Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.commercialName && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder={t("enter_property_name")}
                                placeholderTextColor="gray"
                                value={form.commercialName}
                                onChangeText={(v) => {
                                  setForm({ ...form, commercialName: v });
                                }}
                                onBlur={() =>
                                  setErrors({
                                    ...errors,
                                    commercialName: validatePropertyName(
                                      form.commercialName,
                                    ),
                                  })
                                }
                              />
                            </View>
                            {errors.commercialName ? (
                              <Text style={styles.errorText}>
                                {errors.commercialName}
                              </Text>
                            ) : null}

                            <Text style={styles.label}>{t("location")}</Text>
                            <View
                              style={[
                                styles.inputContainer,
                                styles.inputContainerStep2,
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.input,
                                  errors.location && styles.inputError,
                                  { flex: 1 },
                                ]}
                                placeholder={t("enter_location")}
                                placeholderTextColor="gray"
                                value={form.location}
                                onChangeText={(v) => {
                                  setForm({ ...form, location: v });
                                  if (errors.location) {
                                    setErrors({ ...errors, location: '' });
                                  }
                                }}
                                onBlur={() =>
                                  setErrors({
                                    ...errors,
                                    location: validateLocation(form.location),
                                  })
                                }
                              />
                              <TouchableOpacity
                                onPress={handleGetCurrentLocation}
                                style={{ padding: 8 }}
                              >
                                <MaterialIcons
                                  name='my-location'
                                  size={24}
                                  color='#2563eb'
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={openInGoogleMaps}
                                style={{ padding: 8 }}
                              >
                                <MaterialIcons
                                  name="map"
                                  size={24}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            </View>
                            {errors.location ? (
                              <Text style={styles.errorText}>
                                {errors.location}
                              </Text>
                            ) : null}

                            {Platform.OS === "android" &&
                              locationSuggestions.length > 0 && (
                                <View style={{ marginBottom: 10 }}>
                                  {locationSuggestions
                                    .slice(0, 5)
                                    .map((item, idx) => (
                                      <TouchableOpacity
                                        key={`${item.place_id || idx}`}
                                        style={styles.suggestionItem}
                                        onPress={() => {
                                          const lat = parseFloat(item.lat);
                                          const lon = parseFloat(item.lon);
                                          if (isFinite(lat) && isFinite(lon)) {
                                            setMapRegion({
                                              latitude: lat,
                                              longitude: lon,
                                              latitudeDelta: 0.0922,
                                              longitudeDelta: 0.0421,
                                            });
                                          }
                                          if (item.display_name) {
                                            setSelectedPlaceName(
                                              item.display_name,
                                            );
                                          }
                                        }}
                                      >
                                        <Text
                                          style={styles.suggestionText}
                                          numberOfLines={1}
                                        >
                                          {item.display_name}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                </View>
                              )}


                            {mapRegion && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  marginTop: 8,
                                  marginBottom: 10,
                                }}
                              >
                                <TouchableOpacity
                                  style={styles.mapActionBtn}
                                  onPress={async () => {
                                    try {
                                      const { status } =
                                        await Location.requestForegroundPermissionsAsync();
                                      if (status !== "granted") return;
                                      const pos =
                                        await Location.getCurrentPositionAsync(
                                          {},
                                        );
                                      if (pos?.coords) {
                                        setMapRegion({
                                          latitude: pos.coords.latitude,
                                          longitude: pos.coords.longitude,
                                          latitudeDelta: 0.0922,
                                          longitudeDelta: 0.0421,
                                        });
                                        setSelectedPlaceName(t("current_location") || "Current location");
                                      }
                                    } catch { }
                                  }}
                                >
                                  <Text style={styles.mapActionText}>
                                    {t("use_current_location")}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.mapActionBtn, { marginLeft: 8 }]}
                                  onPress={openDirections}
                                >
                                  <Text style={styles.mapActionText}>
                                    {t("navigate")}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {selectedPlaceName ? (
                              <Text
                                style={{
                                  color: "#374151",
                                  fontSize: 12,
                                  marginBottom: 6,
                                }}
                                numberOfLines={1}
                              >
                                {t("selected")}: {selectedPlaceName}
                              </Text>
                            ) : null}

                            <Text style={styles.label}>{t("usage")}</Text>
                            <View style={[styles.inputContainer, styles.inputContainerStep2, { paddingHorizontal: 0 }, errors.usage && styles.inputError]}>
                              <Picker
                                selectedValue={form.usage}
                                onValueChange={(v) => {
                                  setForm({ ...form, usage: v });
                                }}
                                style={[
                                  styles.picker,
                                  { flex: 1 },
                                ]}
                              >
                                <Picker.Item label={t("select")} value="" />
                                <Picker.Item label={t("lease")} value="lease" />
                                <Picker.Item label={t("rent")} value="rent" />
                              </Picker>
                            </View>
                            {errors.usage ? (
                              <Text style={styles.errorText}>{errors.usage}</Text>
                            ) : null}

                            <Text style={styles.label}>{t("facilities")}</Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <View
                                style={[
                                  styles.inputContainer,
                                  { flex: 1, marginBottom: 0 },
                                ]}
                              >
                                <TextInput
                                  style={[styles.input, { flex: 1 }]}
                                  placeholder={t("add_new_facility")}
                                  placeholderTextColor="gray"
                                  value={newFacilityText}
                                  onChangeText={setNewFacilityText}
                                />
                              </View>
                              <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => {
                                  if (newFacilityText.trim()) {
                                    setCustomFacilities([
                                      ...customFacilities,
                                      newFacilityText.trim(),
                                    ]);
                                    setNewFacilityText("");
                                  }
                                }}
                              >
                                <Text style={styles.addButtonText}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {customFacilities.map((facility, index) => (
                                <View key={index} style={styles.facilityTag}>
                                  <Text style={styles.facilityText}>
                                    {facility}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                      setCustomFacilities(
                                        customFacilities.filter(
                                          (_, i) => i !== index,
                                        ),
                                      );
                                    }}
                                  >
                                    <Text style={styles.removeButtonText}>-</Text>
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                marginBottom: 10,
                              }}
                            >
                              {[
                                t("Water") || "Water",
                                t("Parking") || "Parking",
                                t("Lift") || "Lift",
                                t("AC") || "AC",
                                t("Non AC") || "Non AC",
                                t("Power Backup") || "Power Backup",
                                t("Security") || "Security",
                                t("CCTV") || "CCTV",
                                t("Cafeteria") || "Cafeteria",
                              ].map((label) => {
                                const isSelected =
                                  selectedFacilities.includes(label);
                                return (
                                  <TouchableOpacity
                                    key={label}
                                    style={[
                                      styles.facilityTag,
                                      isSelected && styles.presetSelected,
                                    ]}
                                    onPress={() => {
                                      const exists =
                                        selectedFacilities.includes(label);
                                      setSelectedFacilities(
                                        exists
                                          ? selectedFacilities.filter(
                                            (f) => f !== label,
                                          )
                                          : [...selectedFacilities, label],
                                      );
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.facilityText,
                                        isSelected && { color: "#ffffff" },
                                      ]}
                                    >
                                      {label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {errors.facilities ? (
                              <Text style={styles.errorText}>
                                {errors.facilities}
                              </Text>
                            ) : null}
                            {/* Rent Amount */}
                            <Text style={styles.label}>Basic Rent / Basic Property Amount</Text>
                            <View style={[styles.inputContainer, styles.inputContainerStep2]}>
                              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 18, marginRight: 8 }}>₹</Text>
                              <TextInput
                                style={[styles.input, errors.rent && styles.inputError, { flex: 1 }]}
                                placeholder="Enter amount"
                                placeholderTextColor="gray"
                                keyboardType="numeric"
                                value={form.rent}
                                onChangeText={(v) => {
                                  const cleaned = v.replace(/[^0-9]/g, "");
                                  setForm({ ...form, rent: cleaned });
                                  if (cleaned && Number(cleaned) > 0) {
                                    setErrors({ ...errors, rent: "" });
                                  }
                                }}
                              />
                            </View>
                            {errors.rent ? <Text style={styles.errorText}>{errors.rent}</Text> : null}
                          </>
                        )}

                        {/* ===== COVER IMAGE UPLOAD ===== */}
                        {form.stayType !== "" && (
                          <View style={{ marginTop: 8, marginBottom: 4 }}>
                            {/* Section Header */}
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F5F3FF", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                                <Ionicons name="image" size={18} color="#7C3AED" />
                              </View>
                              <View>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Cover Image</Text>
                                <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 1 }}>Used as the main thumbnail</Text>
                              </View>
                            </View>

                            {form.documents.coverImage ? (
                              <View style={{
                                borderRadius: 20, overflow: "hidden",
                                borderWidth: 1.5, borderColor: "#DDD6FE",
                                shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
                                marginBottom: 8,
                              }}>
                                <Image
                                  source={{ uri: form.documents.coverImage.uri }}
                                  style={{ width: "100%", height: 180 }}
                                  resizeMode="cover"
                                />
                                {/* Overlay bar */}
                                <View style={{
                                  position: "absolute", bottom: 0, left: 0, right: 0,
                                  backgroundColor: "rgba(0,0,0,0.45)",
                                  flexDirection: "row", alignItems: "center",
                                  paddingVertical: 10, paddingHorizontal: 14,
                                }}>
                                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                                    <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                                    <Text style={{ fontSize: 13, color: "#FFFFFF", marginLeft: 6, fontWeight: "600" }}>Cover image uploaded</Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => openImagePicker("coverImage")}
                                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 }}
                                  >
                                    <Ionicons name="pencil" size={14} color="#FFF" />
                                    <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600", marginLeft: 4 }}>Change</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={{
                                  borderRadius: 20,
                                  borderWidth: 2,
                                  borderStyle: "dashed",
                                  borderColor: errors.document_coverImage ? "#EF4444" : "#C4B5FD",
                                  backgroundColor: "#FAFAFF",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  paddingVertical: 32,
                                  marginBottom: 8,
                                  shadowColor: "#7C3AED",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.06,
                                  shadowRadius: 8,
                                  elevation: 1,
                                }}
                                onPress={() => openImagePicker("coverImage")}
                                activeOpacity={0.8}
                              >
                                <View style={{
                                  width: 68, height: 68, borderRadius: 34,
                                  backgroundColor: "#F5F3FF",
                                  justifyContent: "center", alignItems: "center",
                                  marginBottom: 14,
                                  shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 3 },
                                  shadowOpacity: 0.14, shadowRadius: 8, elevation: 4,
                                }}>
                                  <Ionicons name="cloud-upload-outline" size={32} color="#7C3AED" />
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E1B4B", marginBottom: 4 }}>Upload Cover Image</Text>
                                <Text style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>Recommended: 16:9 ratio</Text>
                                <Text style={{ fontSize: 11, color: "#C4B5FD", fontWeight: "500" }}>JPG, PNG • Max 5 MB</Text>
                              </TouchableOpacity>
                            )}
                            {errors.document_coverImage ? (
                              <Text style={styles.errorText}>{errors.document_coverImage}</Text>
                            ) : null}
                          </View>
                        )}
                        {/* ===== PROPERTY GALLERY ===== */}
                        {form.stayType !== "" && (
                          <View style={{ marginTop: 8, marginBottom: 8 }}>
                            {/* Section Header */}
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F5F3FF", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                                  <Ionicons name="images" size={18} color="#7C3AED" />
                                </View>
                                <View>
                                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Property Gallery</Text>
                                  <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 1 }}>Upload room & property photos</Text>
                                </View>
                              </View>
                              {/* Photo count badge */}
                              {Array.isArray(form.documents.homePics) && form.documents.homePics.length > 0 && (
                                <View style={{ backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{form.documents.homePics.length}/10</Text>
                                </View>
                              )}
                            </View>

                            {/* Upload Card */}
                            <TouchableOpacity
                              style={{
                                borderRadius: 20,
                                borderWidth: 2,
                                borderStyle: "dashed",
                                borderColor: errors.document_homePics ? "#EF4444" : "#DDD6FE",
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
                              }}
                              onPress={() => openImagePicker("homePics")}
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
                                <Ionicons name="images-outline" size={30} color="#7C3AED" />
                              </View>
                              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E1B4B", marginBottom: 4 }}>Upload Property Gallery</Text>
                              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>Maximum 10 Photos • JPG, PNG</Text>
                            </TouchableOpacity>

                            {errors.document_homePics ? (
                              <Text style={styles.errorText}>{errors.document_homePics}</Text>
                            ) : null}

                            {/* Uploaded Images Grid */}
                            {Array.isArray(form.documents.homePics) && form.documents.homePics.length > 0 && (
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                {form.documents.homePics.map((img, idx) => (
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
                                        onPress={() => {
                                          const current = form.documents.homePics || [];
                                          const updated = current.filter((_, i) => i !== idx);
                                          const newErrors = { ...errors };
                                          if (updated.length === 0) newErrors.document_homePics = t("property_images_required");
                                          else delete newErrors.document_homePics;
                                          setForm({ ...form, documents: { ...form.documents, homePics: updated } });
                                          setErrors(newErrors);
                                        }}
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
                                {form.documents.homePics.length < 10 && (
                                  <TouchableOpacity
                                    style={{
                                      width: "30.8%", aspectRatio: 1,
                                      borderRadius: 14, borderWidth: 2, borderStyle: "dashed",
                                      borderColor: "#DDD6FE", backgroundColor: "#FAFAFF",
                                      justifyContent: "center", alignItems: "center",
                                    }}
                                    onPress={() => openImagePicker("homePics")}
                                  >
                                    <Ionicons name="add" size={24} color="#7C3AED" />
                                    <Text style={{ fontSize: 10, color: "#7C3AED", fontWeight: "600", marginTop: 3 }}>Add More</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                        )}


                        {/* Secure & Safe Banner */}
                        <View style={{ marginTop: 20, backgroundColor: "#F5F3FF", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E9D5FF" }}>
                          <View style={{ width: 44, height: 44, backgroundColor: LIGHT_PURPLE, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 15 }}>
                            <FontAwesome name="shield" size={20} color="#FFFFFF" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 4 }}>Secure Registration</Text>
                            <Text style={{ fontSize: 13, color: "#6B7280", lineHeight: 18 }}>Your information is protected with bank-level encryption.</Text>
                          </View>
                        </View>

                      </View>
                    </>
                  )}


                  {/* ---------- STEP 3 ---------- */}
                  {step === 2 && (
                    <Step3 form={form} onUpdateFloors={handleUpdateFloors} />
                  )}
                  {/* ===== PREMIUM STICKY BOTTOM ACTION BAR ===== */}
                  <View style={{
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: Platform.OS === "ios" ? 28 : 18,
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#F0EEFF",
                    shadowColor: "#7C3AED",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 16,
                  }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {/* Back Button */}
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          height: 58,
                          borderRadius: 18,
                          borderWidth: 2,
                          borderColor: "#8B5CF6",
                          backgroundColor: "#FAFAFF",
                          justifyContent: "center",
                          alignItems: "center",
                          flexDirection: "row",
                          gap: 6,
                        }}
                        onPress={() => {
                          if (step > 1) {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setStep(step - 1);
                          } else {
                            navigation.goBack();
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="arrow-back" size={18} color="#7C3AED" />
                        <Text style={{ color: "#7C3AED", fontWeight: "700", fontSize: 15 }}>{t("back") || "Back"}</Text>
                      </TouchableOpacity>

                      {/* Next / Submit Button */}
                      <TouchableOpacity
                        disabled={isLoading}
                        style={{
                          flex: 1, borderRadius: 18, overflow: "hidden",
                          shadowColor: "#6D28D9", shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                          opacity: isLoading ? 0.6 : 1,
                        }}
                        onPress={() => {
                          if (step < 2) {
                            next();
                          } else {
                            const floors = form.floorsData || [];
                            if (floors.length < 1) {
                              Alert.alert(t("error"), t("add_at_least_1_floor"));
                              return;
                            }
                            if (form.stayType === "hostel") {
                              const totalRooms = floors.reduce((sum, floor) => sum + (floor.rooms ? floor.rooms.length : 0), 0);
                              if (totalRooms < 1) { Alert.alert(t("error"), t("add_at_least_1_room")); return; }
                            }
                            if (form.stayType === "apartment") {
                              const totalFlats = floors.reduce((sum, floor) => sum + (floor.flats ? floor.flats.length : 0), 0);
                              if (totalFlats < 1) { Alert.alert(t("error"), t("add_at_least_1_flat")); return; }
                            }
                            if (form.stayType === "commercial") {
                              const totalSections = floors.reduce((sum, floor) => sum + (floor.sections ? floor.sections.length : 0), 0);
                              if (totalSections < 1) { Alert.alert(t("error"), t("add_at_least_1_section")); return; }
                              for (const floor of floors) {
                                for (const section of floor.sections || []) {
                                  if (!section.area) {
                                    Alert.alert(t("error"), `${t("enter_area_sqft").replace("{floor}", floor.floorNo).replace("{section}", section.sectionNo)}`);
                                    return;
                                  }
                                }
                              }
                            }
                            if (!form.name.trim()) { Alert.alert(t("error"), "Please enter Owner Full Name"); return; }
                            submit();
                          }
                        }}
                        activeOpacity={0.88}
                      >
                        <LinearGradient
                          colors={["#8B5CF6", "#6D28D9"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            height: 58,
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 }}>
                            {step < 2 ? (t("next") || "Next") : (t("submit") || "Submit")}
                          </Text>
                          {step < 2
                            ? <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.9)" />
                            : <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
                          }
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    {/* Security Footer */}
                    {step < 2 && (
                      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12 }}>
                        <Ionicons name="shield-checkmark" size={12} color="#A78BFA" />
                        <Text style={{ fontSize: 11, color: "#A78BFA", marginLeft: 5, fontWeight: "500" }}>256-bit encrypted · Your data is safe</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function Step3({ form, onUpdateFloors }) {
  const { t } = useLanguage();
  const stayType = form?.stayType || "";
  const [floorInput, setFloorInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [floors, setFloors] = useState(form?.floorsData || []);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsOpen, setRoomsOpen] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const [roomSelectionMode, setRoomSelectionMode] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomBatchModalOpen, setRoomBatchModalOpen] = useState(false);

  const [sharingModalVisible, setSharingModalVisible] = useState(false);
  const [sharingModalInput, setSharingModalInput] = useState('');
  const [sharingModalRoomIndex, setSharingModalRoomIndex] = useState(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const roomSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);
  useEffect(() => {
    if (buildingOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [buildingOpen, slideAnim]);

  useEffect(() => {
    if (roomsOpen) {
      Animated.timing(roomSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      roomSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [roomsOpen, roomSlideAnim]);

  useEffect(() => {
    if (typeof onUpdateFloors === "function") {
      onUpdateFloors(floors);
    }
  }, [floors, onUpdateFloors]);

  const generateFloors = () => {
    Keyboard.dismiss();
    const num = parseInt(floorInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(60, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_floors"));
    }
    setFloors((prevFloors) => {
      const currentCount = prevFloors.length;
      if (capped === currentCount) return prevFloors;
      if (capped > currentCount) {
        const newFloors = Array.from(
          { length: capped - currentCount },
          (_, i) => ({
            floorNo: currentCount + i + 1,
            rooms: [],
          }),
        );
        return [...prevFloors, ...newFloors];
      }
      return prevFloors.slice(0, capped);
    });
    setBuildingOpen(true);
  };

  const addFloorManually = () => {
    setFloors((prevFloors) => {
      if (prevFloors.length >= 60) {
        Alert.alert(t("limit") || "Limit", t("limit_floors"));
        return prevFloors;
      }

      return [
        ...prevFloors,
        {
          floorNo: prevFloors.length + 1,
          rooms: [],
        },
      ];
    });
  };

  const handleLongPress = (index) => {
    setSelectionMode(true);
    setSelectedFloors([index]);
  };

  const handlePress = (index) => {
    if (selectionMode) {
      if (selectedFloors.includes(index)) {
        const next = selectedFloors.filter((i) => i !== index);
        setSelectedFloors(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedFloors([...selectedFloors, index]);
      }
    } else {
      setSelectedFloor(index);
      setSelectedRoom(null);
      setRoomsOpen(true);
    }
  };

  const deleteSelectedFloors = () => {
    Alert.alert(t("delete") + " " + t("floors"), t("delete_floors_confirm").replace("{count}", selectedFloors.length), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const remaining = floors.filter(
            (_, idx) => !selectedFloors.includes(idx),
          );
          setFloors(remaining.map((f, i) => ({ ...f, floorNo: i + 1 })));
          setSelectionMode(false);
          setSelectedFloors([]);
        },
      },
    ]);
  };

  const applyBatchRooms = () => {
    const num = parseInt(roomInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(30, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_rooms"));
    }
    const updated = [...floors];
    selectedFloors.forEach((idx) => {
      updated[idx].rooms = Array.from({ length: capped }, (_, i) => ({
        roomNo: i + 1,
        beds: 1,
      }));
    });
    setFloors(updated);
    setRoomInput("");
    setBatchModalOpen(false);
    setSelectionMode(false);
    setSelectedFloors([]);
  };

  const addRoomManually = () => {
    if (selectedFloor === null) return;
    const updated = [...floors];
    const currentRooms = updated[selectedFloor].rooms;
    if (currentRooms.length >= 30) {
      Alert.alert(t("limit") || "Limit", t("limit_rooms"));
      return;
    }
    const newRoom = { roomNo: currentRooms.length + 1, beds: 1 };
    updated[selectedFloor].rooms = [...currentRooms, newRoom];
    setFloors(updated);
  };

  const handleRoomLongPress = (index) => {
    setRoomSelectionMode(true);
    setSelectedRooms([index]);
  };

  const handleRoomPress = (index) => {
    if (roomSelectionMode) {
      if (selectedRooms.includes(index)) {
        const next = selectedRooms.filter((i) => i !== index);
        setSelectedRooms(next);
        if (next.length === 0) setRoomSelectionMode(false);
      } else {
        setSelectedRooms([...selectedRooms, index]);
      }
    } else {
      const room = floors[selectedFloor].rooms[index];
      setSharingModalRoomIndex(index);
      setSharingModalInput(String(room.beds || ''));
      setSharingModalVisible(true);
    }
  };

  const handleSaveSharing = () => {
    const num = parseInt(sharingModalInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    updated[selectedFloor].rooms[sharingModalRoomIndex].beds = num;
    setFloors(updated);
    setSharingModalVisible(false);
    setSharingModalInput('');
    setSharingModalRoomIndex(null);
  };

  const deleteSelectedRooms = () => {
    Alert.alert(t("delete") + " " + t("rooms"), t("delete_rooms_confirm").replace("{count}", selectedRooms.length), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const updated = [...floors];
          const remainingRooms = updated[selectedFloor].rooms.filter(
            (_, idx) => !selectedRooms.includes(idx),
          );
          updated[selectedFloor].rooms = remainingRooms.map((r, i) => ({
            ...r,
            roomNo: i + 1,
          }));
          setFloors(updated);
          setRoomSelectionMode(false);
          setSelectedRooms([]);
        },
      },
    ]);
  };

  const applyBatchSharing = () => {
    const num = parseInt(roomInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    selectedRooms.forEach((idx) => {
      updated[selectedFloor].rooms[idx].beds = Math.min(8, num);
    });
    setFloors(updated);
    setRoomInput("");
    setRoomBatchModalOpen(false);
    setRoomSelectionMode(false);
    setSelectedRooms([]);
  };

  const updateBeds = (change) => {
    const updated = [...floors];
    const room = updated[selectedFloor].rooms[selectedRoom];
    room.beds = Math.max(1, Math.min(8, room.beds + change));
    setFloors(updated);
  };

  const generateRoomsForFloor = () => {
    const num = parseInt(roomInput);
    if (isNaN(num) || num <= 0 || selectedFloor === null) return;
    const capped = Math.min(30, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_rooms"));
    }
    const updated = [...floors];
    updated[selectedFloor].rooms = Array.from({ length: capped }, (_, i) => ({
      roomNo: i + 1,
      beds: 1,
    }));
    setFloors(updated);
    setRoomInput("");
  };

  const totalRoomsCount = floors.reduce((acc, f) => acc + (f.rooms?.length || 0), 0);
  const currentFloorRooms =
    selectedFloor !== null ? (floors[selectedFloor]?.rooms?.length || 0) : 0;
  const currentFloorBeds =
    selectedFloor !== null
      ? floors[selectedFloor]?.rooms.reduce((sum, r) => sum + r.beds, 0)
      : 0;

  return stayType === "apartment" ? (
    <ApartmentLayout form={form} onUpdateFloors={onUpdateFloors} />
  ) : stayType === "commercial" ? (
    <CommercialLayout form={form} onUpdateFloors={onUpdateFloors} />
  ) : (
    <View style={step3Styles.container}>
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Total Floors</Text>
        <Text style={{ color: "#6B7280", marginBottom: 15, fontSize: 13 }}>
          Update the total number of floors in your building.
        </Text>
        <View style={[step3Styles.row, { alignItems: "center" }]}>
          <View style={{
            width: 44, height: 44, backgroundColor: "#F3F4F6", borderRadius: 8,
            justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 1, borderColor: "#E5E7EB"
          }}>
            <Ionicons name="business" size={20} color={LIGHT_PURPLE} />
          </View>
          <TextInput
            placeholder={t("no_of_floors")}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={floorInput}
            onChangeText={setFloorInput}
            style={[step3Styles.input, { flex: 1, marginHorizontal: 0, paddingHorizontal: 15 }]}
          />
          <TouchableOpacity style={[step3Styles.setBtn, { marginLeft: 10, flexDirection: "row", alignItems: "center" }]} onPress={generateFloors}>
            <Ionicons name="create-outline" size={16} color={WHITE} style={{ marginRight: 6 }} />
            <Text style={step3Styles.btnText}>
              {t("add")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {floors.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#EDE9FE", paddingVertical: 25 }]}>
          <View style={{ alignItems: "center" }}>
            <View style={[step3Styles.iconCircle, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="business" size={40} color={LIGHT_PURPLE} />
            </View>

            <Text style={{ color: LIGHT_PURPLE, fontWeight: "800", fontSize: 20 }}>
              {floors.length} {t("floors")}
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 4, marginBottom: 15 }}>
              {totalRoomsCount} {t("rooms")} {t("total") || "Total"}
            </Text>

            <View style={{ height: 1, width: "80%", backgroundColor: "#E5E7EB", marginVertical: 10 }} />

            <Text style={{ color: "#111827", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>
              Configure Your Building Layout
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 20, paddingHorizontal: 20 }}>
              Add rooms, set dimensions, and organize your building structure.
            </Text>

            <TouchableOpacity
              style={[styles.btn, { width: "100%", flexDirection: "row", justifyContent: "center" }]}
              onPress={() => setBuildingOpen(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.btnText}>{t("open_layout_editor")}</Text>
              <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Bottom Summary Bar */}
      {floors.length > 0 && (
        <View style={[styles.sectionCard, { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Ionicons name="layers-outline" size={20} color={LIGHT_PURPLE} />
            </View>
            <View>
              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 16 }}>{floors.length}</Text>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>Floors</Text>
            </View>
          </View>

          <View style={{ width: 1, backgroundColor: "#E5E7EB", marginHorizontal: 10 }} />

          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Ionicons name="bed-outline" size={20} color={LIGHT_PURPLE} />
            </View>
            <View>
              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 16 }}>{totalRoomsCount}</Text>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>Rooms</Text>
            </View>
          </View>
        </View>
      )}

      <Modal visible={buildingOpen} transparent animationType="fade">
        <View style={step3Styles.overlay}>
          <Animated.View
            style={[
              step3Styles.modalBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={step3Styles.modalHeader}>
              <Text style={step3Styles.sectionTitle}>
                {selectionMode
                  ? `${selectedFloors.length} ${t("selected")}`
                  : t("select_a_floor")}
              </Text>
              {selectionMode && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                    {t("cancel")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              contentContainerStyle={step3Styles.gridContainer}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    step3Styles.gridCard,
                    selectedFloors.includes(index) && step3Styles.selectedCard,
                  ]}
                  onLongPress={() => handleLongPress(index)}
                  onPress={() => handlePress(index)}
                >
                  {selectionMode && (
                    <View
                      style={[
                        step3Styles.checkCircle,
                        selectedFloors.includes(index) &&
                        step3Styles.checkCircleActive,
                      ]}
                    >
                      {selectedFloors.includes(index) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      step3Styles.gridCardTitle,
                      selectedFloors.includes(index) && { color: "#7209B7" },
                    ]}
                  >
                    {t("floor")} {floor.floorNo}
                  </Text>
                  <Text style={step3Styles.cardSub}>
                    {floor.rooms?.length || 0} {t("rooms")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionMode ? (
              <View style={step3Styles.selectionFooter}>
                <TouchableOpacity
                  style={step3Styles.smallActionBtn}
                  onPress={() => setSelectedFloors(floors.map((_, i) => i))}
                >
                  <Text style={step3Styles.smallBtnText}>{t("all")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    step3Styles.smallActionBtn,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                  onPress={deleteSelectedFloors}
                >
                  <Text
                    style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                  >
                    {t("delete")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={step3Styles.primaryBtn}
                  onPress={() => setBatchModalOpen(true)}
                >
                  <Text style={step3Styles.btnText}>{t("apply_rooms")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>

                <TouchableOpacity
                  style={[step3Styles.primaryBtn, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
                  onPress={addFloorManually}
                >
                  <Ionicons name="add-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
                  <Text style={step3Styles.btnText}>{t("add_floor")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[step3Styles.closeBtn, { flex: 1 }]}
                  onPress={() => setBuildingOpen(false)}
                >
                  <Text style={step3Styles.btnText}>{t("done")}</Text>
                </TouchableOpacity>

              </View>
            )}

            {roomsOpen && selectedFloor !== null && (
              <Animated.View
                style={[
                  step3Styles.roomsScreen,
                  { transform: [{ translateY: roomSlideAnim }] },
                ]}
              >
                <View style={step3Styles.roomsHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setRoomsOpen(false);
                      setRoomSelectionMode(false);
                      setSelectedRooms([]);
                    }}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={28}
                      color={LIGHT_PURPLE}
                    />
                  </TouchableOpacity>
                  <Text style={step3Styles.headerTitle}>
                    {roomSelectionMode
                      ? `${selectedRooms.length} ${t("selected")}`
                      : `${t("floor")} ${floors[selectedFloor].floorNo}`}
                  </Text>
                  {roomSelectionMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setRoomSelectionMode(false);
                        setSelectedRooms([]);
                      }}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                        {t("cancel")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!roomSelectionMode && <View style={{ width: 28 }} />}
                </View>

                <View style={step3Styles.row}>
                  <TextInput
                    placeholder={t("rooms_count")}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={roomInput}
                    onChangeText={setRoomInput}
                    style={[step3Styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    style={[step3Styles.setBtn, { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }]}
                    onPress={generateRoomsForFloor}
                  >
                    <Text style={step3Styles.btnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                <View style={step3Styles.counterBox}>
                  <Text style={step3Styles.counterText}>
                    {t("rooms")}: {currentFloorRooms} | {t("total")} {t("beds")}: {currentFloorBeds}
                  </Text>
                </View>

                <ScrollView
                  contentContainerStyle={step3Styles.gridContainer}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {floors[selectedFloor].rooms.map((room, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        step3Styles.gridCard,
                        (selectedRoom === index ||
                          selectedRooms.includes(index)) &&
                        step3Styles.selectedCard,
                      ]}
                      onLongPress={() => handleRoomLongPress(index)}
                      onPress={() => handleRoomPress(index)}
                    >
                      {roomSelectionMode && (
                        <View
                          style={[
                            step3Styles.checkCircle,
                            selectedRooms.includes(index) &&
                            step3Styles.checkCircleActive,
                          ]}
                        >
                          {selectedRooms.includes(index) && (
                            <Ionicons
                              name="checkmark"
                              size={12}
                              color="white"
                            />
                          )}
                        </View>
                      )}
                      <Text
                        style={[
                          step3Styles.gridCardTitle,
                          (selectedRoom === index ||
                            selectedRooms.includes(index)) && {
                            color: "#2F80ED",
                          },
                        ]}
                      >
                        {floors[selectedFloor].floorNo * 100 + room.roomNo}
                      </Text>
                      <Text style={step3Styles.cardSub}>
                        {room.beds} {t("sharing")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {roomSelectionMode ? (
                  <View style={step3Styles.selectionFooter}>
                    <TouchableOpacity
                      style={step3Styles.smallActionBtn}
                      onPress={() =>
                        setSelectedRooms(
                          floors[selectedFloor].rooms.map((_, i) => i),
                        )
                      }
                    >
                      <Text style={step3Styles.smallBtnText}>{t("all")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        step3Styles.smallActionBtn,
                        { backgroundColor: "#FEE2E2" },
                      ]}
                      onPress={deleteSelectedRooms}
                    >
                      <Text
                        style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                      >
                        {t("delete")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={step3Styles.primaryBtn}
                      onPress={() => setRoomBatchModalOpen(true)}
                    >
                      <Text style={step3Styles.btnText}>{t("apply_sharing")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={[step3Styles.closeBtn, { width: "100%" }]}
                      onPress={() => setRoomsOpen(false)}
                    >
                      <Text style={step3Styles.btnText}>{t("done")}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sharing Modal */}
                <Modal
                  visible={sharingModalVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setSharingModalVisible(false)}
                >
                  <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.45)',
                  }}>
                    <View style={{
                      width: '82%',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 20,
                      paddingVertical: 28,
                      paddingHorizontal: 24,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.18,
                      shadowRadius: 24,
                      elevation: 12,
                    }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: '#1F2937',
                        textAlign: 'center',
                        marginBottom: 20,
                      }}>
                        {sharingModalRoomIndex !== null
                          ? `${t("room") || "Room"} ${floors[selectedFloor]?.floorNo * 100 + floors[selectedFloor]?.rooms[sharingModalRoomIndex]?.roomNo} ${t("sharing")}`
                          : ''}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: '#6B7280',
                        marginBottom: 8,
                      }}>
                        Enter Number of Sharing
                      </Text>
                      <TextInput
                        placeholder="e.g. 2"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={sharingModalInput}
                        onChangeText={setSharingModalInput}
                        autoFocus
                        style={{
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: 14,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          backgroundColor: '#F9FAFB',
                          fontSize: 16,
                          color: '#111827',
                          marginBottom: 24,
                        }}
                      />
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSharingModalVisible(false);
                            setSharingModalInput('');
                            setSharingModalRoomIndex(null);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 14,
                            backgroundColor: '#F3F4F6',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 15 }}>{t("cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveSharing}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 14,
                            backgroundColor: '#7C3AED',
                            alignItems: 'center',
                            shadowColor: '#7C3AED',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{t("save") || "Save"}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>

                {roomBatchModalOpen && (
                  <View style={step3Styles.batchPopup}>
                    <Text style={step3Styles.popupTitle}>
                      {t("apply_sharing")} {t("to")} {selectedRooms.length} {t("rooms")}
                    </Text>
                    <TextInput
                      placeholder={t("no") || "No."}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={roomInput}
                      onChangeText={setRoomInput}
                      autoFocus
                      style={step3Styles.batchInput}
                    />
                    <View style={step3Styles.row}>
                      <TouchableOpacity
                        style={step3Styles.secondaryBtn}
                        onPress={() => setRoomBatchModalOpen(false)}
                      >
                        <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                        onPress={applyBatchSharing}
                      >
                        <Text style={step3Styles.btnText}>{t("apply")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {batchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  {t("add")} {t("rooms")} {t("for")} {selectedFloors.length} {t("floors")}
                </Text>
                <TextInput
                  placeholder={t("rooms_per_floor")}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={roomInput}
                  onChangeText={setRoomInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />
                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchRooms}
                  >
                    <Text style={step3Styles.btnText}>{t("apply")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function ApartmentLayout({ form, onUpdateFloors }) {
  const { t } = useLanguage();
  const [floorInput, setFloorInput] = useState("");
  const [flatInput, setFlatInput] = useState("");
  const [bhkInput, setBhkInput] = useState("");
  const [floors, setFloors] = useState(form?.floorsData || []);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [flatsOpen, setFlatsOpen] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const [flatSelectionMode, setFlatSelectionMode] = useState(false);
  const [selectedFlats, setSelectedFlats] = useState([]);
  const [bhkBatchModalOpen, setBhkBatchModalOpen] = useState(false);

  const [flatSharingModalVisible, setFlatSharingModalVisible] = useState(false);
  const [flatSharingModalInput, setFlatSharingModalInput] = useState('');
  const [flatSharingModalIndex, setFlatSharingModalIndex] = useState(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const flatSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);

  useEffect(() => {
    if (buildingOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [buildingOpen, slideAnim]);

  useEffect(() => {
    if (flatsOpen) {
      Animated.timing(flatSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      flatSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [flatsOpen, flatSlideAnim]);

  const generateFloors = () => {
    const num = parseInt(floorInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(60, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_floors"));
    }
    setFloors((prevFloors) => {
      const currentCount = prevFloors.length;
      if (capped === currentCount) return prevFloors;
      if (capped > currentCount) {
        const newFloors = Array.from(
          { length: capped - currentCount },
          (_, i) => ({
            floorNo: currentCount + i + 1,
            flats: [],
          }),
        );
        return [...prevFloors, ...newFloors];
      }
      return prevFloors.slice(0, capped);
    });
    setBuildingOpen(true);
  };
  const addFloorManually = () => {
    setFloors((prevFloors) => {
      if (prevFloors.length >= 60) {
        Alert.alert(t("limit") || "Limit", t("limit_floors"));
        return prevFloors;
      }

      return [
        ...prevFloors,
        {
          floorNo: prevFloors.length + 1,
          flats: [],
        },
      ];
    });
  };

  const handleLongPress = (index) => {
    setSelectionMode(true);
    setSelectedFloors([index]);
  };
  const handlePress = (index) => {
    if (selectionMode) {
      if (selectedFloors.includes(index)) {
        const next = selectedFloors.filter((i) => i !== index);
        setSelectedFloors(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedFloors([...selectedFloors, index]);
      }
    } else {
      setSelectedFloor(index);
      setSelectedFlat(null);
      setFlatsOpen(true);
    }
  };

  const deleteSelectedFloors = () => {
    Alert.alert(t("delete") + " " + t("floors"), t("delete_floors_confirm").replace("{count}", selectedFloors.length), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const remaining = floors.filter(
            (_, idx) => !selectedFloors.includes(idx),
          );
          setFloors(remaining.map((f, i) => ({ ...f, floorNo: i + 1 })));
          setSelectionMode(false);
          setSelectedFloors([]);
        },
      },
    ]);
  };

  const applyBatchFlats = () => {
    const num = parseInt(flatInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(20, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_flats"));
    }
    const updated = [...floors];
    selectedFloors.forEach((idx) => {
      updated[idx].flats = Array.from({ length: capped }, (_, i) => ({
        flatNo: i + 1,
        bhk: 1,
      }));
    });
    setFloors(updated);
    setFlatInput("");
    setBatchModalOpen(false);
    setSelectionMode(false);
    setSelectedFloors([]);
  };

  const addFlatManually = () => {
    if (selectedFloor === null) return;
    const updated = [...floors];
    const currentFlats = updated[selectedFloor].flats;
    if (currentFlats.length >= 20) {
      Alert.alert(t("limit") || "Limit", t("limit_flats"));
      return;
    }
    const newFlat = { flatNo: currentFlats.length + 1, bhk: 1 };
    updated[selectedFloor].flats = [...currentFlats, newFlat];
    setFloors(updated);
  };

  const handleFlatLongPress = (index) => {
    setFlatSelectionMode(true);
    setSelectedFlats([index]);
  };
  const handleFlatPress = (index) => {
    if (flatSelectionMode) {
      if (selectedFlats.includes(index)) {
        const next = selectedFlats.filter((i) => i !== index);
        setSelectedFlats(next);
        if (next.length === 0) setFlatSelectionMode(false);
      } else {
        setSelectedFlats([...selectedFlats, index]);
      }
    } else {
      const flat = floors[selectedFloor].flats[index];
      setFlatSharingModalIndex(index);
      setFlatSharingModalInput(String(flat.bhk || ''));
      setFlatSharingModalVisible(true);
    }
  };

  const handleSaveFlatSharing = () => {
    const num = parseInt(flatSharingModalInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    updated[selectedFloor].flats[flatSharingModalIndex].bhk = num;
    setFloors(updated);
    setFlatSharingModalVisible(false);
    setFlatSharingModalInput('');
    setFlatSharingModalIndex(null);
  };

  const deleteSelectedFlats = () => {
    Alert.alert(t("delete") + " " + t("flats"), t("delete_flats_confirm").replace("{count}", selectedFlats.length), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const updated = [...floors];
          const remainingFlats = updated[selectedFloor].flats.filter(
            (_, idx) => !selectedFlats.includes(idx),
          );
          updated[selectedFloor].flats = remainingFlats.map((r, i) => ({
            ...r,
            flatNo: i + 1,
          }));
          setFloors(updated);
          setFlatSelectionMode(false);
          setSelectedFlats([]);
        },
      },
    ]);
  };

  const applyBatchBhk = () => {
    const num = parseInt(bhkInput);
    if (isNaN(num) || num <= 0) return;
    const updated = [...floors];
    selectedFlats.forEach((idx) => {
      updated[selectedFloor].flats[idx].bhk = Math.min(6, Math.max(1, num));
    });
    setFloors(updated);
    setBhkInput("");
    setBhkBatchModalOpen(false);
    setFlatSelectionMode(false);
    setSelectedFlats([]);
  };

  const updateBhk = (change) => {
    const updated = [...floors];
    const flat = updated[selectedFloor].flats[selectedFlat];
    flat.bhk = Math.max(1, Math.min(6, flat.bhk + change));
    setFloors(updated);
  };

  const generateFlatsForFloor = () => {
    const num = parseInt(flatInput);
    if (isNaN(num) || num <= 0 || selectedFloor === null) return;
    const capped = Math.min(20, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_flats"));
    }
    const updated = [...floors];
    updated[selectedFloor].flats = Array.from({ length: capped }, (_, i) => ({
      flatNo: i + 1,
      bhk: 1,
    }));
    setFloors(updated);
    setFlatInput("");
  };

  const totalFlatsCount = floors.reduce((acc, f) => acc + (f.flats?.length || 0), 0);

  useEffect(() => {
    if (typeof onUpdateFloors === "function") {
      onUpdateFloors(floors);
    }
  }, [floors, onUpdateFloors]);

  return (
    <View style={step3Styles.container}>
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Total Floors</Text>
        <Text style={{ color: "#6B7280", marginBottom: 15, fontSize: 13 }}>
          Update the total number of floors in your building.
        </Text>
        <View style={[step3Styles.row, { alignItems: "center" }]}>
          <View style={{
            width: 44, height: 44, backgroundColor: "#F3F4F6", borderRadius: 8,
            justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 1, borderColor: "#E5E7EB"
          }}>
            <Ionicons name="business" size={20} color={LIGHT_PURPLE} />
          </View>
          <TextInput
            placeholder={t("no_of_floors")}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={floorInput}
            onChangeText={setFloorInput}
            style={[step3Styles.input, { flex: 1, marginHorizontal: 0, paddingHorizontal: 15 }]}
          />
          <TouchableOpacity
            style={[step3Styles.setBtn, { marginLeft: 10, flexDirection: "row", alignItems: "center" }]}
            onPress={() => {
              Keyboard.dismiss();
              generateFloors();
            }}
          >
            <Ionicons name="create-outline" size={16} color={WHITE} style={{ marginRight: 6 }} />
            <Text style={step3Styles.btnText}>
              {t("add")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {floors.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#EDE9FE", paddingVertical: 25 }]}>
          <View style={{ alignItems: "center" }}>
            <View style={[step3Styles.iconCircle, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="business" size={40} color={LIGHT_PURPLE} />
            </View>

            <Text style={{ color: LIGHT_PURPLE, fontWeight: "800", fontSize: 20 }}>
              {floors.length} {t("floors")}
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 4, marginBottom: 15 }}>
              {totalFlatsCount} {t("flats")} {t("total") || "Total"}
            </Text>

            <View style={{ height: 1, width: "80%", backgroundColor: "#E5E7EB", marginVertical: 10 }} />

            <Text style={{ color: "#111827", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>
              Configure Your Building Layout
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 20, paddingHorizontal: 20 }}>
              Add flats, set dimensions, and organize your building structure.
            </Text>

            <TouchableOpacity
              style={[styles.btn, { width: "100%", flexDirection: "row", justifyContent: "center" }]}
              onPress={() => setBuildingOpen(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.btnText}>{t("open_layout_editor")}</Text>
              <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Summary Bar */}
      {floors.length > 0 && (
        <View style={[styles.sectionCard, { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Ionicons name="layers-outline" size={20} color={LIGHT_PURPLE} />
            </View>
            <View>
              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 16 }}>{floors.length}</Text>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>Floors</Text>
            </View>
          </View>

          <View style={{ width: 1, backgroundColor: "#E5E7EB", marginHorizontal: 10 }} />

          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Ionicons name="apps-outline" size={20} color={LIGHT_PURPLE} />
            </View>
            <View>
              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 16 }}>{totalFlatsCount}</Text>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>Flats</Text>
            </View>
          </View>
        </View>
      )}

      <Modal visible={buildingOpen} transparent animationType="fade">
        <View style={step3Styles.overlay}>
          <Animated.View
            style={[
              step3Styles.modalBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={step3Styles.modalHeader}>
              <Text style={step3Styles.sectionTitle}>
                {selectionMode
                  ? `${selectedFloors.length} ${t("selected")}`
                  : t("select_a_floor")}
              </Text>
              {selectionMode && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                    {t("cancel")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              contentContainerStyle={step3Styles.gridContainer}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    step3Styles.gridCard,
                    selectedFloors.includes(index) && step3Styles.selectedCard,
                  ]}
                  onLongPress={() => handleLongPress(index)}
                  onPress={() => handlePress(index)}
                >
                  {selectionMode && (
                    <View
                      style={[
                        step3Styles.checkCircle,
                        selectedFloors.includes(index) &&
                        step3Styles.checkCircleActive,
                      ]}
                    >
                      {selectedFloors.includes(index) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      step3Styles.gridCardTitle,
                      selectedFloors.includes(index) && { color: "#7209B7" },
                    ]}
                  >
                    {t("floor")} {floor.floorNo}
                  </Text>
                  <Text style={step3Styles.cardSub}>
                    {floor.flats?.length || 0} {t("flats")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionMode ? (
              <View style={step3Styles.selectionFooter}>
                <TouchableOpacity
                  style={step3Styles.smallActionBtn}
                  onPress={() => setSelectedFloors(floors.map((_, i) => i))}
                >
                  <Text style={step3Styles.smallBtnText}>{t("all")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    step3Styles.smallActionBtn,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                  onPress={deleteSelectedFloors}
                >
                  <Text
                    style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                  >
                    {t("delete")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={step3Styles.primaryBtn}
                  onPress={() => setBatchModalOpen(true)}
                >
                  <Text style={step3Styles.btnText}>{t("apply_flats")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>

                <TouchableOpacity
                  style={[step3Styles.primaryBtn, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
                  onPress={addFloorManually}
                >
                  <Ionicons name="add-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
                  <Text style={step3Styles.btnText}>{t("add_floor")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[step3Styles.closeBtn, { flex: 1 }]}
                  onPress={() => setBuildingOpen(false)}
                >
                  <Text style={step3Styles.btnText}>{t("done")}</Text>
                </TouchableOpacity>

              </View>
            )}

            {flatsOpen && selectedFloor !== null && (
              <Animated.View
                style={[
                  step3Styles.roomsScreen,
                  { transform: [{ translateY: flatSlideAnim }] },
                ]}
              >
                <View style={step3Styles.roomsHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setFlatsOpen(false);
                      setFlatSelectionMode(false);
                      setSelectedFlats([]);
                    }}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={28}
                      color={LIGHT_PURPLE}
                    />
                  </TouchableOpacity>
                  <Text style={step3Styles.headerTitle}>
                    {flatSelectionMode
                      ? `${selectedFlats.length} ${t("selected")}`
                      : `${t("floor")} ${floors[selectedFloor].floorNo}`}
                  </Text>
                  {flatSelectionMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setFlatSelectionMode(false);
                        setSelectedFlats([]);
                      }}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                        {t("cancel")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!flatSelectionMode && <View style={{ width: 28 }} />}
                </View>

                <View style={step3Styles.row}>
                  <TextInput
                    placeholder={t("flats_count")}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={flatInput}
                    onChangeText={setFlatInput}
                    style={step3Styles.input}
                  />
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={generateFlatsForFloor}
                  >
                    <Text style={step3Styles.btnText}>{t("add")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={addFlatManually}
                  >
                    <Ionicons name="add" size={18} color={WHITE} />
                    <Text style={step3Styles.btnText}> {t("add")}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={step3Styles.gridContainer}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {floors[selectedFloor].flats.map((flat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        step3Styles.gridCard,
                        (selectedFlat === index ||
                          selectedFlats.includes(index)) &&
                        step3Styles.selectedCard,
                      ]}
                      onLongPress={() => handleFlatLongPress(index)}
                      onPress={() => handleFlatPress(index)}
                    >
                      {flatSelectionMode && (
                        <View
                          style={[
                            step3Styles.checkCircle,
                            selectedFlats.includes(index) &&
                            step3Styles.checkCircleActive,
                          ]}
                        >
                          {selectedFlats.includes(index) && (
                            <Ionicons
                              name="checkmark"
                              size={12}
                              color="white"
                            />
                          )}
                        </View>
                      )}
                      <Text
                        style={[
                          step3Styles.gridCardTitle,
                          (selectedFlat === index ||
                            selectedFlats.includes(index)) && {
                            color: "#7209B7",
                          },
                        ]}
                      >
                        {floors[selectedFloor].floorNo * 100 + flat.flatNo}
                      </Text>
                      <Text style={step3Styles.cardSub}>{flat.bhk} BHK</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {flatSelectionMode ? (
                  <View style={step3Styles.selectionFooter}>
                    <TouchableOpacity
                      style={step3Styles.smallActionBtn}
                      onPress={() =>
                        setSelectedFlats(
                          floors[selectedFloor].flats.map((_, i) => i),
                        )
                      }
                    >
                      <Text style={step3Styles.smallBtnText}>{t("all")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        step3Styles.smallActionBtn,
                        { backgroundColor: "#FEE2E2" },
                      ]}
                      onPress={deleteSelectedFlats}
                    >
                      <Text
                        style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                      >
                        {t("delete")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={step3Styles.primaryBtn}
                      onPress={() => setBhkBatchModalOpen(true)}
                    >
                      <Text style={step3Styles.btnText}>{t("apply_bhk")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={[step3Styles.closeBtn, { width: "100%" }]}
                      onPress={() => setFlatsOpen(false)}
                    >
                      <Text style={step3Styles.btnText}>{t("done")}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Flat Sharing Modal */}
                <Modal
                  visible={flatSharingModalVisible}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setFlatSharingModalVisible(false)}
                >
                  <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.45)',
                  }}>
                    <View style={{
                      width: '82%',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 20,
                      paddingVertical: 28,
                      paddingHorizontal: 24,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.18,
                      shadowRadius: 24,
                      elevation: 12,
                    }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: '#1F2937',
                        textAlign: 'center',
                        marginBottom: 20,
                      }}>
                        {flatSharingModalIndex !== null
                          ? `${t("flat") || "Flat"} ${floors[selectedFloor]?.floorNo * 100 + floors[selectedFloor]?.flats[flatSharingModalIndex]?.flatNo} ${t("sharing")}`
                          : ''}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: '#6B7280',
                        marginBottom: 8,
                      }}>
                        Enter Number of Sharing
                      </Text>
                      <TextInput
                        placeholder="e.g. 2"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={flatSharingModalInput}
                        onChangeText={setFlatSharingModalInput}
                        autoFocus
                        style={{
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: 14,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          backgroundColor: '#F9FAFB',
                          fontSize: 16,
                          color: '#111827',
                          marginBottom: 24,
                        }}
                      />
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setFlatSharingModalVisible(false);
                            setFlatSharingModalInput('');
                            setFlatSharingModalIndex(null);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 14,
                            backgroundColor: '#F3F4F6',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 15 }}>{t("cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveFlatSharing}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 14,
                            backgroundColor: '#7C3AED',
                            alignItems: 'center',
                            shadowColor: '#7C3AED',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{t("save") || "Save"}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>

                {bhkBatchModalOpen && (
                  <View style={step3Styles.batchPopup}>
                    <Text style={step3Styles.popupTitle}>
                      {t("apply_bhk")} {t("to")} {selectedFlats.length} {t("flats")}
                    </Text>
                    <TextInput
                      placeholder={t("no") || "No."}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      value={bhkInput}
                      onChangeText={setBhkInput}
                      autoFocus
                      style={step3Styles.batchInput}
                    />
                    <View style={step3Styles.row}>
                      <TouchableOpacity
                        style={step3Styles.secondaryBtn}
                        onPress={() => setBhkBatchModalOpen(false)}
                      >
                        <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                        onPress={applyBatchBhk}
                      >
                        <Text style={step3Styles.btnText}>{t("apply")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            )}

            {batchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  {t("add")} {t("flats")} {t("for")} {selectedFloors.length} {t("floors")}
                </Text>
                <TextInput
                  placeholder={t("flats_per_floor")}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={flatInput}
                  onChangeText={setFlatInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />
                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchFlats}
                  >
                    <Text style={step3Styles.btnText}>{t("apply")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function CommercialLayout({ form, onUpdateFloors }) {
  const { t } = useLanguage();
  const [floorInput, setFloorInput] = useState("");
  const [floors, setFloors] = useState(form?.floorsData || []);
  const [buildingOpen, setBuildingOpen] = useState(false);

  const [sectionSelectionMode, setSectionSelectionMode] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);




  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const sectionSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);

  const [selectedFloors, setSelectedFloors] = useState([]);
  const [areaBatchModalOpen, setAreaBatchModalOpen] = useState(false);
  const [areaInput, setAreaInput] = useState("");


  const [sectionOpen, setSectionOpen] = useState(false);
  const [sectionInput, setSectionInput] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);


  const [sectionBatchModalOpen, setSectionBatchModalOpen] = useState(false);

  const [areaPopupOpen, setAreaPopupOpen] = useState(false);


  useEffect(() => {
    if (buildingOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [buildingOpen, slideAnim]);




  useEffect(() => {
    if (sectionOpen) {
      Animated.timing(sectionSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      sectionSlideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [sectionOpen]);

  const handleSectionLongPress = (index) => {
    setSectionSelectionMode(true);
    setSelectedSections([index]);
  };

  const handleSectionPress = (index) => {
    if (sectionSelectionMode) {
      if (selectedSections.includes(index)) {
        const next = selectedSections.filter(i => i !== index);
        setSelectedSections(next);
        if (next.length === 0) setSectionSelectionMode(false);
      } else {
        setSelectedSections([...selectedSections, index]);
      }
    } else {
      setSelectedSection(index);
      setAreaInput("");
      setAreaPopupOpen(true);
    }
  };



  const addSectionManually = () => {
    if (selectedFloor === null) return;

    const updated = [...floors];
    const currentSections = updated[selectedFloor].sections;

    if (currentSections.length >= 20) {
      Alert.alert(t("limit") || "Limit", t("limit_sections"));
      return;
    }

    const newSection = {
      sectionNo: currentSections.length + 1,
      area: null,
    };

    updated[selectedFloor].sections = [...currentSections, newSection];

    setFloors(updated);
  };


  const generateFloors = () => {
    const num = parseInt(floorInput);
    if (isNaN(num) || num <= 0) return;
    const capped = Math.min(60, num);
    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_floors"));
    }
    setFloors((prevFloors) => {
      const currentCount = prevFloors.length;
      if (capped === currentCount) return prevFloors;
      if (capped > currentCount) {
        const newFloors = Array.from(
          { length: capped - currentCount },
          (_, i) => ({
            floorNo: currentCount + i + 1,
            sections: [], // NEW
          }),
        );
        return [...prevFloors, ...newFloors];
      }
      return prevFloors.slice(0, capped);
    });
    setBuildingOpen(true);
  };







  const addFloorManually = () => {
    setFloors((prevFloors) => {
      if (prevFloors.length >= 60) {
        Alert.alert(t("limit") || "Limit", t("limit_floors"));
        return prevFloors;
      }

      return [
        ...prevFloors,
        {
          floorNo: prevFloors.length + 1,
          sections: [],
        },
      ];
    });
  };




  const generateSectionsForFloor = () => {
    const num = parseInt(sectionInput);
    if (isNaN(num) || num <= 0 || selectedFloor === null) return;

    const capped = Math.min(20, num);

    if (capped !== num) {
      Alert.alert(t("limit") || "Limit", t("limit_sections"));
    }

    const updated = [...floors];

    updated[selectedFloor].sections = Array.from({ length: capped }, (_, i) => ({
      sectionNo: i + 1,
      area: null,
    }));

    setFloors(updated);
    setSectionInput("");
  };



  const configuredCount = floors.reduce(
    (sum, floor) => sum + (floor.sections ? floor.sections.length : 0),
    0
  );

  const handleLongPress = (index) => {
    setSelectionMode(true);
    setSelectedFloors([index]);
  };

  const handlePress = (index) => {
    if (selectionMode) {
      if (selectedFloors.includes(index)) {
        const next = selectedFloors.filter((i) => i !== index);
        setSelectedFloors(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedFloors([...selectedFloors, index]);
      }
    } else {
      setSelectedFloor(index);
      setSectionOpen(true);
    }
  };

  const deleteSelectedFloors = () => {
    Alert.alert(t("delete") + " " + t("floors"), t("delete_floors_confirm").replace("{count}", selectedFloors.length), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const remaining = floors.filter(
            (_, idx) => !selectedFloors.includes(idx),
          );
          setFloors(remaining.map((f, i) => ({ ...f, floorNo: i + 1 })));
          setSelectionMode(false);
          setSelectedFloors([]);
        },
      },
    ]);
  };

  const applyBatchArea = () => {
    Alert.alert(
      t("not_available") || "Not Available",
      t("area_inside_sections") || "Area must be applied inside sections, not floors."
    );
    setAreaBatchModalOpen(false);
  };

  const applyBatchAreaToSections = () => {
    const num = parseInt(areaInput);

    if (isNaN(num) || num <= 0) return;

    const updated = [...floors];

    selectedSections.forEach((secIndex) => {
      updated[selectedFloor].sections[secIndex].area = num;
    });

    setFloors(updated);
    setAreaBatchModalOpen(false);
    setAreaInput("");
    setSelectedSections([]);
    setSectionSelectionMode(false);
  };

  const applyBatchSections = () => {
    const num = parseInt(sectionInput);

    if (isNaN(num) || num <= 0) return;

    const capped = Math.min(20, num);

    const updated = [...floors];

    selectedFloors.forEach((floorIndex) => {
      updated[floorIndex].sections = Array.from({ length: capped }, (_, i) => ({
        sectionNo: i + 1,
        area: null,
      }));
    });

    setFloors(updated);

    setSectionBatchModalOpen(false);
    setSectionInput("");
    setSelectionMode(false);
    setSelectedFloors([]);
  };



  useEffect(() => {
    if (typeof onUpdateFloors === "function") {
      onUpdateFloors(floors);
    }
  }, [floors, onUpdateFloors]);


  return (
    <View style={step3Styles.container}>
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Total Floors</Text>
        <Text style={{ color: "#6B7280", marginBottom: 15, fontSize: 13 }}>
          Update the total number of floors in your building.
        </Text>
        <View style={[step3Styles.row, { alignItems: "center" }]}>
          <View style={{
            width: 44, height: 44, backgroundColor: "#F3F4F6", borderRadius: 8,
            justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 1, borderColor: "#E5E7EB"
          }}>
            <Ionicons name="business" size={20} color={LIGHT_PURPLE} />
          </View>
          <TextInput
            placeholder={t("no_of_floors")}
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={floorInput}
            onChangeText={setFloorInput}
            style={[step3Styles.input, { flex: 1, marginHorizontal: 0, paddingHorizontal: 15 }]}
          />
          <TouchableOpacity
            style={[step3Styles.setBtn, { marginLeft: 10, flexDirection: "row", alignItems: "center" }]}
            onPress={() => {
              Keyboard.dismiss();
              generateFloors();
            }}
          >
            <Ionicons name="create-outline" size={16} color={WHITE} style={{ marginRight: 6 }} />
            <Text style={step3Styles.btnText}>
              {t("add")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {floors.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#EDE9FE", paddingVertical: 25 }]}>
          <View style={{ alignItems: "center" }}>
            <View style={[step3Styles.iconCircle, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="business" size={40} color={LIGHT_PURPLE} />
            </View>

            <Text style={{ color: LIGHT_PURPLE, fontWeight: "800", fontSize: 20 }}>
              {floors.length} {t("floors")}
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 4, marginBottom: 15 }}>
              {configuredCount} {t("configured") || "Configured"}
            </Text>

            <View style={{ height: 1, width: "80%", backgroundColor: "#E5E7EB", marginVertical: 10 }} />

            <Text style={{ color: "#111827", fontWeight: "bold", fontSize: 16, marginTop: 10 }}>
              Configure Your Building Layout
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 20, paddingHorizontal: 20 }}>
              Add sections, set dimensions, and organize your building structure.
            </Text>

            <TouchableOpacity
              style={[styles.btn, { width: "100%", flexDirection: "row", justifyContent: "center" }]}
              onPress={() => setBuildingOpen(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.btnText}>{t("open_layout_editor")}</Text>
              <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Summary Bar */}
      {floors.length > 0 && (
        <View style={[styles.sectionCard, { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Ionicons name="layers-outline" size={20} color={LIGHT_PURPLE} />
            </View>
            <View>
              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 16 }}>{floors.length}</Text>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>Floors</Text>
            </View>
          </View>

          <View style={{ width: 1, backgroundColor: "#E5E7EB", marginHorizontal: 10 }} />

          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#F5F3FF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 }}>
              <Ionicons name="grid-outline" size={20} color={LIGHT_PURPLE} />
            </View>
            <View>
              <Text style={{ color: LIGHT_PURPLE, fontWeight: "bold", fontSize: 16 }}>{configuredCount}</Text>
              <Text style={{ color: "#6B7280", fontSize: 11 }}>Sections</Text>
            </View>
          </View>
        </View>
      )}

      <Modal visible={buildingOpen} transparent animationType="fade">
        <View style={step3Styles.overlay}>
          <Animated.View
            style={[
              step3Styles.modalBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={step3Styles.modalHeader}>
              {/* Back arrow — closes modal or exits selection */}
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  } else {
                    setBuildingOpen(false);
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color={LIGHT_PURPLE} />
              </TouchableOpacity>

              {/* Centered title */}
              <Text style={step3Styles.sectionTitle}>
                {selectionMode
                  ? `${selectedFloors.length} ${t("selected")}`
                  : t("select_a_floor")}
              </Text>

              {/* Cancel — only visible in selection mode; spacer otherwise */}
              {selectionMode ? (
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedFloors([]);
                  }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "bold", fontSize: 15 }}>
                    {t("cancel")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 24 }} />
              )}
            </View>

            <ScrollView
              contentContainerStyle={step3Styles.gridContainer}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {floors.map((floor, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    step3Styles.gridCard,
                    selectedFloors.includes(index) && step3Styles.selectedCard,
                  ]}
                  onLongPress={() => handleLongPress(index)}
                  onPress={() => handlePress(index)}
                >
                  {selectionMode && (
                    <View
                      style={[
                        step3Styles.checkCircle,
                        selectedFloors.includes(index) &&
                        step3Styles.checkCircleActive,
                      ]}
                    >
                      {selectedFloors.includes(index) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  )}
                  <Text
                    style={[
                      step3Styles.gridCardTitle,
                      selectedFloors.includes(index) && { color: "#7209B7" },
                    ]}
                  >
                    {t("floor")} {floor.floorNo}
                  </Text>
                  <Text style={step3Styles.cardSub}>
                    {floor.sections?.length || 0} {t("sections") || "Sections"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectionMode ? (
              <View style={step3Styles.selectionFooter}>
                <TouchableOpacity
                  style={step3Styles.smallActionBtn}
                  onPress={() => setSelectedFloors(floors.map((_, i) => i))}
                >
                  <Text style={step3Styles.smallBtnText}>{t("all")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    step3Styles.smallActionBtn,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                  onPress={deleteSelectedFloors}
                >
                  <Text
                    style={[step3Styles.smallBtnText, { color: "#EF4444" }]}
                  >
                    {t("delete")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={step3Styles.primaryBtn}
                  onPress={() => setSectionBatchModalOpen(true)}
                >
                  <Text style={step3Styles.btnText}>{t("apply_sections")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>

                <TouchableOpacity
                  style={[step3Styles.primaryBtn, { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }]}
                  onPress={addFloorManually}
                >
                  <Ionicons name="add-outline" size={18} color={WHITE} style={{ marginRight: 6 }} />
                  <Text style={step3Styles.btnText}>{t("add_floor")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[step3Styles.closeBtn, { flex: 1 }]}
                  onPress={() => setBuildingOpen(false)}
                >
                  <Text style={step3Styles.btnText}>{t("done")}</Text>
                </TouchableOpacity>

              </View>
            )}




            {sectionOpen && selectedFloor !== null && (
              <Animated.View
                style={[
                  step3Styles.roomsScreen,
                  { transform: [{ translateY: sectionSlideAnim }] },
                ]}
              >
                <View style={step3Styles.roomsHeader}>
                  {/* Back arrow — exits selection mode or closes section panel */}
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => {
                      if (sectionSelectionMode) {
                        setSectionSelectionMode(false);
                        setSelectedSections([]);
                      } else {
                        setSectionOpen(false);
                      }
                    }}
                  >
                    <Ionicons name="arrow-back" size={24} color={LIGHT_PURPLE} />
                  </TouchableOpacity>

                  {/* Centered title */}
                  <Text style={step3Styles.headerTitle}>
                    {sectionSelectionMode
                      ? `${selectedSections.length} ${t("selected")}`
                      : `${t("floor")} ${floors[selectedFloor].floorNo}`}
                  </Text>

                  {/* Cancel — only visible in selection mode; spacer otherwise */}
                  {sectionSelectionMode ? (
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => {
                        setSectionSelectionMode(false);
                        setSelectedSections([]);
                      }}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "bold", fontSize: 15 }}>
                        {t("cancel")}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 24 }} />
                  )}
                </View>

                <View style={step3Styles.row}>
                  <TextInput
                    placeholder={t("no_of_sections") || "No. of Sections"}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={sectionInput}
                    onChangeText={setSectionInput}
                    style={[step3Styles.input, step3Styles.inputCompact]}
                  />

                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={generateSectionsForFloor}
                  >
                    <Text style={step3Styles.btnText}>{t("add")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={step3Styles.setBtn}
                    onPress={addSectionManually}
                  >
                    <Ionicons name="add" size={18} color={WHITE} />
                    <Text style={step3Styles.btnText}> {t("add")}</Text>
                  </TouchableOpacity>
                </View>





                <ScrollView
                  contentContainerStyle={step3Styles.gridContainer}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {floors[selectedFloor].sections?.map((section, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        step3Styles.gridCard,
                        selectedSections.includes(index) && step3Styles.selectedCard
                      ]}
                      onLongPress={() => handleSectionLongPress(index)}
                      onPress={() => handleSectionPress(index)}
                    >
                      {sectionSelectionMode && (
                        <View
                          style={[
                            step3Styles.checkCircle,
                            selectedSections.includes(index) &&
                            step3Styles.checkCircleActive,
                          ]}
                        >
                          {selectedSections.includes(index) && (
                            <Ionicons name="checkmark" size={12} color="white" />
                          )}
                        </View>
                      )}
                      <Text style={step3Styles.gridCardTitle}>
                        {t("section") || "Section"} {section.sectionNo}
                      </Text>

                      <Text style={step3Styles.cardSub}>
                        {section.area ? `${section.area} sq.ft` : t("no_area") || "No area"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {sectionSelectionMode ? (
                  <View style={step3Styles.selectionFooter}>

                    {/* ALL */}
                    <TouchableOpacity
                      style={step3Styles.smallActionBtn}
                      onPress={() =>
                        setSelectedSections(
                          floors[selectedFloor].sections.map((_, i) => i)
                        )
                      }
                    >
                      <Text style={step3Styles.smallBtnText}>{t("all")}</Text>
                    </TouchableOpacity>

                    {/* DELETE */}
                    <TouchableOpacity
                      style={[
                        step3Styles.smallActionBtn,
                        { backgroundColor: "#FEE2E2" },
                      ]}
                      onPress={() => {
                        Alert.alert(t("delete") + " " + (t("sections") || "Sections"), (t("delete_sections_confirm") || `Delete ${selectedSections.length} section(s)?`), [
                          { text: t("cancel"), style: "cancel" },
                          {
                            text: t("delete"),
                            style: "destructive",
                            onPress: () => {
                              const updated = [...floors];
                              const remaining = updated[selectedFloor].sections.filter(
                                (_, idx) => !selectedSections.includes(idx)
                              );

                              updated[selectedFloor].sections = remaining.map((s, i) => ({
                                ...s,
                                sectionNo: i + 1,
                              }));

                              setFloors(updated);
                              setSelectedSections([]);
                              setSectionSelectionMode(false);
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={[step3Styles.smallBtnText, { color: "#EF4444" }]}>
                        {t("delete")}
                      </Text>
                    </TouchableOpacity>

                    {/* ✅ ADD THIS (IMPORTANT) */}
                    <TouchableOpacity
                      style={step3Styles.primaryBtn}
                      onPress={() => setAreaBatchModalOpen(true)}
                    >
                      <Text style={step3Styles.btnText}>{t("apply_area") || "Apply Area"}</Text>
                    </TouchableOpacity>

                  </View>
                ) : (

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={[step3Styles.closeBtn, { width: "100%" }]}
                      onPress={() => setSectionOpen(false)}
                    >
                      <Text style={step3Styles.btnText}>{t("done")}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            )}





            {areaBatchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  {t("apply_area") || "Apply Area"} {t("to")} {selectedSections.length} {t("sections") || "Sections"}
                </Text>
                <TextInput
                  placeholder="sq.ft"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={areaInput}
                  onChangeText={setAreaInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />
                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setAreaBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchAreaToSections}
                  >
                    <Text style={step3Styles.btnText}>{t("apply")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}


            {sectionBatchModalOpen && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  {t("apply_sections") || "Apply Sections"} {t("to")} {selectedFloors.length} {t("floors")}
                </Text>

                <TextInput
                  placeholder={t("no_of_sections") || "No. of Sections"}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={sectionInput}
                  onChangeText={setSectionInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />

                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => setSectionBatchModalOpen(false)}
                  >
                    <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={applyBatchSections}
                  >
                    <Text style={step3Styles.btnText}>{t("apply")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}






            {areaPopupOpen && selectedFloor !== null && selectedSection !== null && (
              <View style={step3Styles.batchPopup}>
                <Text style={step3Styles.popupTitle}>
                  {t("enter_area") || "Enter Area"} {t("for")} {t("section")} {selectedSection + 1}
                </Text>

                <TextInput
                  placeholder="sq.ft"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={areaInput}
                  onChangeText={setAreaInput}
                  autoFocus
                  style={step3Styles.batchInput}
                />

                <View style={step3Styles.row}>
                  <TouchableOpacity
                    style={step3Styles.secondaryBtn}
                    onPress={() => {
                      setAreaPopupOpen(false);
                      setAreaInput("");
                      setSelectedSection(null);
                    }}
                  >
                    <Text style={step3Styles.secondaryBtnText}>{t("cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[step3Styles.primaryBtn, { marginLeft: 10 }]}
                    onPress={() => {
                      const num = parseInt(areaInput);

                      if (isNaN(num) || num <= 0) return;

                      const updated = [...floors];

                      updated[selectedFloor].sections[selectedSection].area = num;

                      setFloors(updated);

                      setAreaPopupOpen(false);
                      setAreaInput("");
                    }}
                  >
                    <Text style={step3Styles.btnText}>{t("save") || "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}


          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const step3Styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
    color: NAVY,
  },
  cardText: {
    fontSize: 14,
    color: GRAY,
  },
  container: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  row: { flexDirection: "row", marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: DOT_INACTIVE,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    fontSize: 16,
    color: NAVY,
    elevation: 1,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  setBtn: {
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 12,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: { color: WHITE, fontWeight: "600" },
  centerContainer: {
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buildingBox: {
    backgroundColor: WHITE,
    width: "100%",
    paddingVertical: 25,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  buildingText: { color: NAVY, fontWeight: "800", fontSize: 18 },
  buildingSubText: { color: GRAY, fontSize: 13, marginTop: 4 },
  manageBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 25,
  },
  manageText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 4,
  },
  emptyState: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
    marginBottom: 20,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    color: GRAY,
    marginTop: 15,
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: LIGHT_GRAY,
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: { color: NAVY, fontSize: 20, fontWeight: "bold" },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingBottom: 20 },
  gridCard: {
    backgroundColor: WHITE,
    width: "30%",
    margin: "1.5%",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  selectedCard: {
    borderColor: LIGHT_PURPLE,
    borderWidth: 2,
    backgroundColor: LIGHT_GRAY,
  },
  gridCardTitle: { color: NAVY, fontWeight: "600", fontSize: 14 },
  cardSub: { color: GRAY, fontSize: 11, marginTop: 4 },
  roomsScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LIGHT_GRAY,
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  roomsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  headerTitle: { color: NAVY, fontSize: 18, fontWeight: "bold" },
  counterBox: {
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  counterText: { color: LIGHT_PURPLE, fontWeight: "700" },
  closeBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1
  },
  sharingBox: {
    backgroundColor: WHITE,
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  sharingTitle: {
    color: GRAY,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  sharingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bedCount: {
    color: NAVY,
    fontSize: 36,
    fontWeight: "bold",
    marginHorizontal: 30,
  },
  checkCircle: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleActive: {
    backgroundColor: LIGHT_PURPLE,
    borderColor: LIGHT_PURPLE,
  },
  selectionFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  smallActionBtn: {
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 12,
    width: 75,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  smallBtnText: { color: LIGHT_PURPLE, fontWeight: "700", fontSize: 12 },
  primaryBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    flex: 1,
  },
  secondaryBtn: {
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  secondaryBtnText: { color: LIGHT_PURPLE, fontWeight: "600" },
  batchPopup: {
    backgroundColor: WHITE,
    padding: 25,
    borderRadius: 25,
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    elevation: 20,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  popupTitle: {
    color: LIGHT_PURPLE,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  batchInput: {
    backgroundColor: LIGHT_GRAY,
    padding: 15,
    borderRadius: 12,
    color: NAVY,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  inputCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    height: 40,
    borderRadius: 8,
    width: "60%",
    alignSelf: "center",
    marginBottom: 8,
  },
});
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  headerContainer: {
    backgroundColor: "#F8F9FC",
    paddingTop: Platform.OS === "ios" ? 40 : 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  card: {
    maxWidth: 720,
    width: Dimensions.get("window").width - 24,
    alignSelf: "center",
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginVertical: 12,
    elevation: 8,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    color: NAVY,
    letterSpacing: 0.3,
  },
  input: {
    color: NAVY,
    fontSize: 15,
    paddingVertical: 12,
    fontWeight: "500",
  },
  inputError: { borderColor: "#EF4444", borderWidth: 1.5, backgroundColor: "#FEF2F2" },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
    fontWeight: "600",
    marginLeft: 4,
  },
  btnDisabled: { backgroundColor: LIGHT_PURPLE, opacity: 0.6 },
  picker: {
    backgroundColor: "transparent",
    color: NAVY,
  },
  btn: {
    backgroundColor: LIGHT_PURPLE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    flex: 1,
  },
  btnText: {
    color: WHITE,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FC",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: DOT_INACTIVE,
    gap: 12,
  },
  stepWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  stepItem: { alignItems: "center", width: 70 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    elevation: 4,
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  circleText: { color: WHITE, fontWeight: "800", fontSize: 16 },
  stepLabel: { marginTop: 8, fontSize: 13, color: LIGHT_PURPLE, fontWeight: "600", textAlign: "center" },
  line: {
    height: 4,
    width: 60,
    marginHorizontal: 5,
    marginTop: -20,
    backgroundColor: "#E5E7EB",
    position: "relative",
    borderRadius: 2,
    overflow: "hidden",
  },
  lineOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: LIGHT_PURPLE,
  },

  label: { fontWeight: "bold", marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  floorBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 5,
  },
  floorBtnText: {
    color: WHITE,
    fontWeight: "bold",
  },
  roomBtn: {
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  roomBtnText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
  },
  sharingWrap: { marginTop: 5, flexDirection: "row", flexWrap: "wrap" },
  sharingBtn: {
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 3,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  sharingBtnText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 12,
  },
  addFloorBtn: {
    marginTop: 20,
    backgroundColor: LIGHT_PURPLE,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFloorBtnText: {
    color: WHITE,
    fontWeight: "800",
    fontSize: 16,
  },
  addRoomBtn: {
    backgroundColor: LIGHT_PURPLE,
    padding: 14,
    borderRadius: 20,
    marginTop: 8,
    alignItems: "center",
    shadowColor: LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addRoomBtnText: {
    color: WHITE,
    fontWeight: "bold",
  },
  oval: {
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    margin: 4,
    borderWidth: 1.5,
    borderColor: LIGHT_PURPLE,
  },
  ovalText: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 54,
    backgroundColor: WHITE,
    borderColor: DOT_INACTIVE,
    marginBottom: 12,
    elevation: 1,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputContainerStep2: {
    borderColor: DOT_INACTIVE,
    backgroundColor: LIGHT_GRAY,
  },
  inputIcon: {
    marginRight: 8,
  },
  passwordToggle: {
    padding: 5,
  },
  addButton: {
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "bold",
  },
  facilityTag: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  facilityText: {
    color: NAVY,
    marginRight: 5,
  },
  removeButton: {
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "bold",
  },
  presetSelected: {
    backgroundColor: LIGHT_PURPLE,
    borderWidth: 2,
    borderColor: LIGHT_PURPLE,
  },
  mapActionBtn: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  mapActionText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: "600",
  },
  suggestionItem: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  suggestionText: {
    color: GRAY,
    fontSize: 14,
  },
  map: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#000",
  },
  mapWrap: { position: "relative" },
  mapControls: { position: "absolute", right: 8, top: 8, alignItems: "center" },
  zoomBtn: {
    backgroundColor: WHITE,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  zoomText: { color: NAVY, fontSize: 20, fontWeight: "700" },
  mapToggleWrap: { marginTop: 6, flexDirection: "row" },
  mapToggleBtn: {
    backgroundColor: WHITE,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DOT_INACTIVE,
  },
  mapToggleActive: { backgroundColor: LIGHT_PURPLE, borderColor: LIGHT_PURPLE },
  mapToggleText: { color: GRAY, fontWeight: "700", fontSize: 12 },
  mapToggleTextActive: { color: LIGHT_PURPLE },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: WHITE,
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
    color: NAVY,
  },
});

