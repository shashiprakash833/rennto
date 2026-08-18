import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
import * as Location from "expo-location";
import {
  View,
  Text,
  StyleSheet,
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import COLORS from "../../theme/colors";
import { TenantContext } from "@/src/context/TenantContext";
import { BookingContext } from "@/src/context/BookingContext";
import FilterBottomSheet from "../../../components/FilterBottomScreen";
import { useLanguage } from "../../utils/LanguageContext";
import { useMemo, useRef } from "react";

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

export default function CommercialScreen() {
  const { t } = useLanguage();
  const { isConnected } = useNetwork();
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
const [isModalVisible, setModalVisible] = useState(false);
const [selectedCategory, setSelectedCategory] = useState("");
const [selectedFacilities, setSelectedFacilities] = useState([]);
const [nearBy, setNearBy] = useState(0);
const [userCoords, setUserCoords] = useState(null);
const [filterState, setFilterState] = useState("");
const [filterCity, setFilterCity] = useState("");
const [filterArea, setFilterArea] = useState("");
const [maxRent, setMaxRent] = useState(100000);
const [sortBy, setSortBy] = useState("Recommended");
const { requests = [] } = useContext(BookingContext);
const filterSheetRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const fetchIdRef = useRef(0);
  const hasFetchedLocationRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshLocation = async () => {
    setRefreshing(true);
    hasFetchedLocationRef.current = false;
    await fetchCommercial();
    await getUserLocation();
    setRefreshing(false);
  };

  const { tenantEmail } = useContext(TenantContext);


  const handleApplyFilters = (filters) => {
  setFilterState(filters.state || "");
  setFilterCity(filters.city || "");
  setFilterArea(filters.area || "");
  setNearBy(filters.distance || 0);
  setSelectedCategory(filters.commercialType || "");
  setSelectedFacilities(filters.amenities || []);
  setMaxRent(filters.maxPrice || 100000);
  setSortBy(filters.sortBy || "Recommended");
};

const resetAllFilters = () => {
  setSelectedCategory("");
  setSelectedFacilities([]);
  setNearBy(0);
  setFilterState("");
  setFilterCity("");
  setFilterArea("");
  setSortBy("Recommended");
  setMaxRent(100000);
};

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        // Always load unfiltered data first so the list is populated immediately.
        await fetchCommercial();

        if (isConnected && !hasFetchedLocationRef.current) {
          // Then refine with location once coordinates are available.
          hasFetchedLocationRef.current = true;
          await getUserLocation();
        }
      };

      init();
    }, [isConnected])
  );

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
      await fetchCommercial(coords);
    } catch (err) {
      console.log("Location Error:", err);
    }
  };

  const fetchCommercial = async (coords = null) => {
    const requestId = ++fetchIdRef.current;
    try {
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
      if (requestId !== fetchIdRef.current) return;
      if (!response.ok) {
        if (requestId !== fetchIdRef.current) return;
        setProperties([]);
        return;
      }
      const result = await response.json();
      const MEDIA_URL = `${BASE_URL}/media/`;

      const formattedData = (result.data || [])
        .filter((item) => item.type === "Commercial")
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

            type: item.type || "Commercial",

            name: item.name || "Unnamed Space",
            address: item.address || "No Address",

            image: mainImage || "https://via.placeholder.com/400",
            galleryImages: galleryImages || [],

          

            facilities: Array.isArray(item.facilities)
              ? item.facilities
              : [],

            price: item.rent || "",

            category: item.category || (
              (item.name || "").toLowerCase().includes("shop") ? "Shop" :
              (item.name || "").toLowerCase().includes("coworking") ? "Coworking" :
              (item.name || "").toLowerCase().includes("warehouse") ? "Warehouse" :
              "Office"
            ),

            ownerName: item.owner_name || "Owner",

            contact: item.contact || "",
            ownerPhone: item.owner_phone || "",
            owner_id: item.owner_id || "",

            latitude: item.latitude
              ? parseFloat(item.latitude)
              : null,

            longitude: item.longitude
              ? parseFloat(item.longitude)
              : null,

            isAvailable:
              item.isAvailable !== undefined
                ? item.isAvailable
                : true,
          };
        });

      if (requestId !== fetchIdRef.current) return;
      setProperties(formattedData);
    } catch (error) {
      console.log("Fetch Commercial Error:", error);
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

const filteredCommercial = useMemo(() => {
  const filtered = properties.filter((h) => {
    const normalizedAddress = normalizeSearchText(h.address || "", true);

    const matchesState = !filterState || normalizedAddress.includes(filterState.toLowerCase().trim());
    const matchesCity = !filterCity || normalizedAddress.includes(filterCity.toLowerCase().trim());
    const matchesArea = !filterArea || normalizedAddress.includes(filterArea.toLowerCase().trim());

    const rawSearch = search.trim();
    const resolvedCity = resolveQueryCity(rawSearch);
    const searchText = resolvedCity !== rawSearch.toLowerCase().trim()
      ? resolvedCity
      : normalizeSearchText(rawSearch, false);

    const searchableText = normalizeSearchText(`
      ${h.name || ""} ${h.address || ""} ${h.category || ""}
      ${h.ownerName || ""} ${h.contact || ""}
      ${(h.facilities || []).join(" ")}
    `, true).replace(/,/g, " ").replace(/\s+/g, " ");

    const matchesSearch =
      rawSearch === "" ||
      searchableText.includes(searchText) ||
      searchableText.includes(rawSearch.toLowerCase());

    const matchesCategory = selectedCategory === "" ||
      (h.category || "").toLowerCase() === selectedCategory.toLowerCase();

    const matchesFacilities = selectedFacilities.length === 0 ||
      selectedFacilities.every((f) => {
        const normF = normalizeFacility(f);
        return h.facilities?.some((itemFac) => normalizeFacility(itemFac) === normF);
      });

    let matchesDistance = true;
    if (nearBy > 0) {
      if (!userCoords || !h.latitude || !h.longitude) {
        matchesDistance = false;
      } else {
        const distance = getDistance(userCoords.latitude, userCoords.longitude, h.latitude, h.longitude);
        matchesDistance = distance <= nearBy;
      }
    }

    let matchesRent = true;
    if (maxRent && maxRent < 100000) {
      const r = parseFloat(h.price);
      if (!isNaN(r)) matchesRent = r <= maxRent;
    }

    return matchesState && matchesCity && matchesArea && matchesSearch &&
      matchesCategory && matchesFacilities && matchesDistance && matchesRent && h.isAvailable;
  });

  return filtered.sort((a, b) => {
    const normalize = (str) => (str || "").replace(/\s+/g, '').toLowerCase();
    const latestA = requests.find(r => normalize(r.propertyName || r.property_name) === normalize(a.name));
    const isAcceptedA = ["accepted","completed","allotted"].includes(latestA?.status?.toLowerCase());
    const latestB = requests.find(r => normalize(r.propertyName || r.property_name) === normalize(b.name));
    const isAcceptedB = ["accepted","completed","allotted"].includes(latestB?.status?.toLowerCase());
    if (isAcceptedA && !isAcceptedB) return -1;
    if (!isAcceptedA && isAcceptedB) return 1;
    if (sortBy === "Price Low-High") return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    if (sortBy === "Price High-Low") return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    // Default behavior (no explicit sort chosen) now also sorts nearest-first
    // whenever we know the user's location — matching real-world rental apps.
    if ((sortBy === "Nearest First" || sortBy === "Recommended") && userCoords) {
      if (!a.latitude || !a.longitude) return 1;
      if (!b.latitude || !b.longitude) return -1;
      return getDistance(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude) -
             getDistance(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude);
    }
    return 0;
  });
}, [properties, search, filterState, filterCity, filterArea, selectedCategory, selectedFacilities, nearBy, userCoords, maxRent, sortBy, requests]);


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
          colors={["#f97316", "#fb923c"]}
          style={styles.hero}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{t("commercial") || "Commercial"}</Text>
              <Text style={styles.heroSubtitle}>{t("commercial_subtitle") || "Grow Your Business"}</Text>
            </View>
            <Image
              source={require("../../../assets/images/commercialLogo.png")}
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
              <Ionicons name="options-outline" size={20} color="#f97316" />
              <Text style={styles.filterText}>{t("filter") || "Filters"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t("popular_commercial_spaces") || "Popular Commercial Spaces"}</Text>

          {filteredCommercial.map((item) => (
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
                    <Text style={styles.tagText}>{t(item.category?.toLowerCase()) || item.category}</Text>
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

          {filteredCommercial.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t("no_commercial_spaces_found") || "No commercial spaces found"}</Text>
            </View>
          )}
        </View>
      </ScrollView>
<FilterBottomSheet
  ref={filterSheetRef}
  screenType="Commercial"
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
    color: "#f97316",
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
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: "#f97316",
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
    color: "#f97316",
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
  backgroundColor: "#f9731615",
  borderColor: "#f97316",
},

chipText: {
  color: "#555",
  fontWeight: "600",
},

activeChipText: {
  color: "#f97316",
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
  backgroundColor: "#f97316",
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
