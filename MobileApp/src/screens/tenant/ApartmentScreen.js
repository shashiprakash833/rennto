import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
import * as Location from "expo-location";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import COLORS from "../../theme/colors";
import { TenantContext } from "@/src/context/TenantContext";
import { BookingContext } from "@/src/context/BookingContext";
import FilterBottomSheet from "../../../components/FilterBottomScreen";
import { useLanguage } from "../../utils/LanguageContext";

const { width } = Dimensions.get("window");

const CITY_ALIASES = {
  hyderabad: ["hyderabad","hyderabd","hyderad","hydrabad","hydarabad","hyderbaad","hiderabad","hyd"],
  bengaluru: ["bengaluru","bangalore","banglore","banglor","benglor","bangalor","bengalore","blr"],
  mumbai: ["mumbai","bombay","mumbay","bomby","bom"],
  delhi: ["delhi","new delhi","newdelhi","nd","dilli"],
  chennai: ["chennai","madras","chenai"],
  kolkata: ["kolkata","calcutta","kolkatta","kolkota","cal"],
  pune: ["pune","poona","puna"],
  ahmedabad: ["ahmedabad","ahemdabad","ahmadabad","amdavad"],
  jaipur: ["jaipur","jaipure","jaypur"],
  surat: ["surat"],
  lucknow: ["lucknow","lko"],
  nagpur: ["nagpur","nagpure"],
  visakhapatnam: ["visakhapatnam","vizag","vishakhapatnam","visakhapatanam"],
  bhopal: ["bhopal"],
  indore: ["indore"],
  vadodara: ["vadodara","baroda"],
  coimbatore: ["coimbatore","coimbatur","covai"],
  kochi: ["kochi","cochin","ernakulam"],
  thiruvananthapuram: ["thiruvananthapuram","trivandrum","tvm"],
  chandigarh: ["chandigarh","chd"],
  noida: ["noida"],
  gurugram: ["gurugram","gurgaon","grg"],
  varanasi: ["varanasi","banaras","benares","kashi"],
  mysuru: ["mysuru","mysore"],
  mangaluru: ["mangaluru","mangalore"],
  hubli: ["hubli","hubballi"],
  belagavi: ["belagavi","belgaum"],
  vijayawada: ["vijayawada","vijayavada","bezawada"],
  tirupati: ["tirupati","tirupathi"],
  warangal: ["warangal"],
  nellore: ["nellore"],
  guntur: ["guntur"],
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

const NEIGHBORHOOD_CITY_MAP = {
  "durgam charuvu":"hyderabad","durgam cheruvu":"hyderabad","hitec city":"hyderabad","hitech city":"hyderabad",
  "madhapur":"hyderabad","gachibowli":"hyderabad","kondapur":"hyderabad","kukatpally":"hyderabad",
  "secunderabad":"hyderabad","jubilee hills":"hyderabad","banjara hills":"hyderabad","ameerpet":"hyderabad",
  "charminar":"hyderabad","miyapur":"hyderabad","begumpet":"hyderabad","dilshuknagar":"hyderabad",
  "lb nagar":"hyderabad","uppal":"hyderabad","kphb":"hyderabad","manikonda":"hyderabad",
  "whitefield":"bengaluru","marathahalli":"bengaluru","indiranagar":"bengaluru","koramangala":"bengaluru",
  "jayanagar":"bengaluru","electronic city":"bengaluru","hebbal":"bengaluru","byatarayanapura":"bengaluru",
  "yelahanka":"bengaluru","banashankari":"bengaluru","jp nagar":"bengaluru","hsr layout":"bengaluru",
  "sarjapur":"bengaluru","bellandur":"bengaluru","btm layout":"bengaluru","malleshwaram":"bengaluru",
  "andheri":"mumbai","bandra":"mumbai","dadar":"mumbai","borivali":"mumbai","powai":"mumbai","juhu":"mumbai",
  "connaught place":"delhi","lajpat nagar":"delhi","rohini":"delhi","dwarka":"delhi","hauz khas":"delhi",
  "t nagar":"chennai","adyar":"chennai","anna nagar":"chennai","velachery":"chennai","porur":"chennai",
  "hinjewadi":"pune","baner":"pune","kothrud":"pune","hadapsar":"pune","wakad":"pune","viman nagar":"pune",
};

// For the search QUERY: if user typed a prefix of a known city alias, resolve to canonical
const resolveQueryCity = (query) => {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return q;
  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (alias === q || alias.startsWith(q) || q === canonical) {
        return canonical;
      }
    }
  }
  return q;
};

const normalizeSearchText = (text, isSearchableText = false) => {
  if (!text) return "";
  let t = text.toLowerCase();

  for (const [canonical, aliases] of Object.entries(CITY_ALIASES)) {
    for (const alias of aliases) {
      if (t.includes(alias)) {
        t = t.split(alias).join(canonical);
      }
    }
  }

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

const normalizeFacility = (name) => {
  if (!name) return "";
  let clean = name.toLowerCase().trim();
  if (clean === "elevator" || clean === "lift") return "lift";
  if (clean === "power backup" || clean === "powerbackup") return "power_backup";
  if (clean === "play area" || clean === "playarea") return "play_area";
  return clean.replace(/\s+/g, '_');
};

export default function ApartmentScreen() {
  const { t } = useLanguage();
  const { isConnected } = useNetwork();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);

  // New filter state variables
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [maxRent, setMaxRent] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const { requests = [] } = useContext(BookingContext);

  const [selectedBHK, setSelectedBHK] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [nearBy, setNearBy] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasFetchedLocationRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshLocation = async () => {
    setRefreshing(true);
    hasFetchedLocationRef.current = false;
    await fetchApartments();
    await getUserLocation();
    setRefreshing(false);
  };

  const { tenantEmail } = useContext(TenantContext);

  // Ref for the filter bottom sheet
  const filterSheetRef = useRef(null);

  // Handlers for applying and resetting filters
  const handleApplyFilters = (filters) => {
    setFilterState(filters.state || '');
    setFilterCity(filters.city || '');
    setFilterArea(filters.area || '');
    setNearBy(filters.distance || 0);
    setSelectedBHK(filters.bhkType || '');
    setSelectedFacilities(filters.amenities || []);
    setMaxRent(filters.maxPrice || 100000);
    setSortBy(filters.sortBy || 'Recommended');
  };

  const resetAllFilters = () => {
    setFilterState('');
    setFilterCity('');
    setFilterArea('');
    setNearBy(0);
    setSelectedBHK('');
    setSelectedFacilities([]);
    setMaxRent(100000);
    setSortBy('Recommended');
  };

  useEffect(() => {
    fetchApartments();
    if (isConnected && !hasFetchedLocationRef.current) {
      hasFetchedLocationRef.current = true;
      getUserLocation();
    }
  }, [isConnected]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserCoords(coords);
      fetchApartments(coords);
    } catch (err) {
      console.log("Location Error:", err);
    }
  };

  const fetchApartments = async (coords = null) => {
    try {
      setLoading(true);
      // Build query parameters for location-based filtering
      let url = `${BASE_URL}/api/owner_props/`;
      const query = [];
      const currentCoords = coords || userCoords;
      if (currentCoords) {
        query.push(`latitude=${currentCoords.latitude}`);
        query.push(`longitude=${currentCoords.longitude}`);
      }
      if (nearBy > 0) {
        query.push(`radius=${nearBy}`);
      }
      if (query.length) {
        url += `?${query.join('&')}`;
      }
      const response = await fetchWithAuth(url);
      if (!response.ok) {
        setProperties([]);
        return;
      }
      const result = await response.json();
      const MEDIA_URL = `${BASE_URL}/media/`;

      const formattedData = (result.data || [])
        .filter((item) => item.type === "Apartment")
        .map((item) => {
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
            type: item.type || "Apartment",

            name: item.name || "Unnamed Apartment",
            address: item.address || "No Address",

            image: mainImage || "https://via.placeholder.com/400",
            galleryImages: galleryImages,

           

            facilities: item.facilities || [],

            price: item.rent || "",
            bhk: item.bhk || "2BHK",

            ownerName: item.owner_name || "Owner",
            contact: item.owner_phone || item.contact || "No Contact",
            ownerPhone: item.owner_phone,
            owner_id: item.owner_id,

            latitude: item.latitude ? parseFloat(item.latitude) : null,
            longitude: item.longitude ? parseFloat(item.longitude) : null,

            isAvailable: item.isAvailable ?? true,
            floors: item.floors || [],
 
          };
        });

      setProperties(formattedData);
    } catch (error) {
      console.log("Fetch Apartments Error:", error);
    } finally {
      setLoading(false);
    }
  };
  const getDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const toRad = (value) =>
    (value * Math.PI) / 180;

  const R = 6371;

  const dLat = toRad(lat2 - lat1);

  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};

const filteredApartments = useMemo(() => {
  const filtered = properties.filter((h) => {
    const normalizedAddress = normalizeSearchText(h.address || "", true);

    // Location matching
    const matchesState = !filterState || normalizedAddress.includes(filterState.toLowerCase().trim());
    const matchesCity = !filterCity || normalizedAddress.includes(filterCity.toLowerCase().trim());
    const matchesArea = !filterArea || normalizedAddress.includes(filterArea.toLowerCase().trim());

    const rawSearch = search.trim();
    const resolvedCity = resolveQueryCity(rawSearch);
    const searchText = resolvedCity !== rawSearch.toLowerCase().trim()
      ? resolvedCity
      : normalizeSearchText(rawSearch, false);

    const searchableText = normalizeSearchText(`
      ${h.name || ""}
      ${h.address || ""}
      ${h.bhk || ""}
      ${(h.facilities || []).join(" ")}
    `, true)
      .replace(/,/g, " ")
      .replace(/\s+/g, " ");

    const matchesSearch =
      rawSearch === "" ||
      searchableText.includes(searchText) ||
      searchableText.includes(rawSearch.toLowerCase());

    const matchesBHK =
      selectedBHK === "" ||
      (h.bhk || "")
        .replace(/\s/g, "")
        .toLowerCase() ===
      selectedBHK
        .replace(/\s/g, "")
        .toLowerCase();

    const matchesFacilities =
      selectedFacilities.length === 0 ||
      selectedFacilities.every((f) => {
        const normF = normalizeFacility(f);
        return h.facilities?.some((itemFac) => normalizeFacility(itemFac) === normF);
      });

    // Distance
    let matchesDistance = true;
    if (nearBy > 0) {
      if (!userCoords || !h.latitude || !h.longitude) {
        matchesDistance = false;
      } else {
        const distance = getDistance(
          userCoords.latitude,
          userCoords.longitude,
          h.latitude,
          h.longitude
        );
        matchesDistance = distance <= nearBy;
      }
    }

    // Rent
    let matchesRent = true;
    if (maxRent && maxRent < 100000) {
      const r = parseFloat(h.price);
      if (!isNaN(r)) {
        matchesRent = r <= maxRent;
      }
    }

    return (
      matchesState &&
      matchesCity &&
      matchesArea &&
      matchesSearch &&
      matchesBHK &&
      matchesFacilities &&
      matchesDistance &&
      matchesRent &&
      h.isAvailable
    );
  });

  // Sort
  return filtered.sort((a, b) => {
    const normalize = (str) => (str || "").replace(/\s+/g, '').toLowerCase();

    // Priority: Accepted properties first (requests context)
    const latestA = requests.find(r => normalize(r.propertyName || r.property_name) === normalize(a.name));
    const isAcceptedA = latestA?.status?.toLowerCase() === "accepted" || latestA?.status?.toLowerCase() === "completed" || latestA?.status?.toLowerCase() === "allotted";

    const latestB = requests.find(r => normalize(r.propertyName || r.property_name) === normalize(b.name));
    const isAcceptedB = latestB?.status?.toLowerCase() === "accepted" || latestB?.status?.toLowerCase() === "completed" || latestB?.status?.toLowerCase() === "allotted";

    if (isAcceptedA && !isAcceptedB) return -1;
    if (!isAcceptedA && isAcceptedB) return 1;

    if (sortBy === "Price Low-High") {
      return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    } else if (sortBy === "Price High-Low") {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    } else if ((sortBy === "Nearest First" || sortBy === "Recommended") && userCoords) {
      if (!a.latitude || !a.longitude) return 1;
      if (!b.latitude || !b.longitude) return -1;
      const distA = getDistance(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude);
      const distB = getDistance(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
      return distA - distB;
    }

    return 0;
  });
}, [
  properties, search, filterState, filterCity, filterArea,
  selectedBHK, selectedFacilities, nearBy, userCoords, maxRent, sortBy, requests
]);

  const shortenAddress = (address) => {
    if (!address) return "No Address";
    const parts = address.split(',').map(s => s.trim());
    if (parts.length > 2) {
      return `${parts[0]}, ${parts[parts.length - 2]}`;
    }
    return address;
  };

  if (isConnected === false && properties.length === 0) {
    return <OfflineView />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshLocation} />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={["#2563eb", "#60a5fa"]}
          style={styles.hero}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{t("apartments") || "Apartments"}</Text>
              <Text style={styles.heroSubtitle}>{t("apartments_subtitle") || "Modern & Spacious"}</Text>
            </View>
            <Image
              source={require("../../../assets/images/apartmentLogo.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Search Bar Container */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder={t("search_property_owner_placeholder") || "Search location, property or owner..."}
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity
  style={styles.filterBtn}
  onPress={() => filterSheetRef.current?.present()}
>
              <Ionicons name="options-outline" size={20} color="#2563eb" />
              <Text style={styles.filterText}>{t("filter") || "Filters"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t("modern_living_spaces") || "Modern Living Spaces"}</Text>

          {filteredApartments.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate("PropertyDetailsScreen", { property: item })}
            >
              <Image source={{ uri: item.image || item.galleryImages?.[0] }} style={styles.cardImage} />
              <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardAddress} numberOfLines={1}>{shortenAddress(item.address)}</Text>

                

                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.bhk}</Text>
                  </View>
                  {item.facilities.slice(0, 2).map((fac, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{t(fac.toLowerCase()) || fac}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{item.price}</Text>
                  <Text style={styles.pricePeriod}>/{t("month_suffix") || "month"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredApartments.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t("no_apartments_found") || "No apartments found"}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <FilterBottomSheet
        ref={filterSheetRef}
        screenType="Apartment"
        allProperties={properties}
        onApply={handleApplyFilters}
        onReset={resetAllFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },
  hero: {
    height: 240,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  heroImage: {
    width: 120,
    height: 120,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 60,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
    paddingLeft: 12,
    marginLeft: 10,
  },
  filterText: {
    color: "#2563eb",
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 12,
    flexDirection: "row",
    marginBottom: 15,
    minHeight: 135,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: 110,
    height: 110,
    borderRadius: 20,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardAddress: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  tagRow: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#999",
    marginTop: 10,
    fontSize: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
  },
  pricePeriod: {
    fontSize: 12,
    color: "#777",
    marginLeft: 2,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "flex-end",
},

modalContent: {
  backgroundColor: "#fff",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  padding: 20,
  maxHeight: "78%",
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
  color: "#111",
},

filterLabel: {
  fontSize: 15,
  fontWeight: "700",
  marginBottom: 12,
  marginTop: 10,
},

filterRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 10,
},

chip: {
  paddingHorizontal: 16,
  paddingVertical: 11,
  borderRadius: 22,
  backgroundColor: "#fafafa",
  marginRight: 10,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#ececec",
},

activeChip: {
  backgroundColor: "#2563eb15",
  borderColor: "#2563eb",
},

chipText: {
  color: "#555",
  fontWeight: "600",
},

activeChipText: {
  color: "#2563eb",
  fontWeight: "700",
},

actionRow: {
  flexDirection: "row",
  marginTop: 30,
  gap: 10,
},

resetBtn: {
  flex: 1,
  height: 50,
  borderRadius: 14,
  backgroundColor: "#f3f4f6",
  justifyContent: "center",
  alignItems: "center",
},

applyBtn: {
  flex: 2,
  height: 50,
  borderRadius: 14,
  backgroundColor: "#2563eb",
  justifyContent: "center",
  alignItems: "center",
},

resetText: {
  fontWeight: "700",
  color: "#444",
},

applyText: {
  fontWeight: "700",
  color: "#fff",
},
});
