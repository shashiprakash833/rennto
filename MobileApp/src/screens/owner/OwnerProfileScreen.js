import React, { useRef, useState, useCallback, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { useMaintenance } from "../../context/MaintenanceContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNetwork } from "../../hooks/useNetwork";
import OfflineView from "../../components/OfflineView";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../../utils/LanguageContext";
import LanguageSelector from "../../components/LanguageSelector";
import { OwnerAccountContext } from "@/src/context/OwnerAccountContext";
import PropertyImagesUpload from "../../components/PropertyImagesUpload";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  PanResponder,
  KeyboardAvoidingView,
  TextInput,
  Platform
} from "react-native";

export default function OwnerProfile({ navigation }) {
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
  const { t } = useLanguage();
  const {
    accounts,
    selectedAccount,
    loadAccounts,
    switchAccount,
    addAccount
  } = useContext(OwnerAccountContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const totalCollected = (Array.isArray(payments) ? payments : []).filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalIncome = totalCollected;
  const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((sum, item) => sum + Number(item.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPropertyImagesModal, setShowPropertyImagesModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  React.useEffect(() => {
    setAiMessages([
      { id: '1', text: t("ai_assistant_greeting_owner") || "Hello! I am your Rennto AI Assistant. Ask me anything about managing your project (e.g., adding tenants, editing building, payments).", sender: 'ai' }
    ]);
  }, [t]);
  const [aiInputText, setAiInputText] = useState("");



  const initialOwner = {
    name: "",
    role: "Property Owner",
    phone: "",
    propertyName: "",
    location: ""
  };

  const [editableOwner, setEditableOwner] = useState(initialOwner);
  const [property, setProperty] = useState({
    totalBeds: 0,
    occupied: 0,
    baseIncome: 0,
    structure: [],
  });
  const [profileImage, setProfileImage] = useState(null);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // --- AI Assistant Draggable State ---
  const aiPan = useRef(new Animated.ValueXY()).current;
  const aiPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        // Only trigger drag if it's a real drag, not a tap
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        aiPan.setOffset({
          x: aiPan.x._value,
          y: aiPan.y._value
        });
        aiPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: aiPan.x, dy: aiPan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        aiPan.flattenOffset();
      }
    })
  ).current;

  const scrollRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYVal = useRef(0);

  React.useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollYVal.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  // --- Guided Financial Flow Animation State & Refs ---
  const [financeRowLayout, setFinanceRowLayout] = useState(null);
  const [incomeLayout, setIncomeLayout] = useState(null);
  const [expensesLayout, setExpensesLayout] = useState(null);
  const [profitLayout, setProfitLayout] = useState(null);
  const [animationFinished, setAnimationFinished] = useState(false);

  const profitPulseAnim = useRef(new Animated.Value(1)).current;
  const profitGlowOpacity = useRef(new Animated.Value(0)).current;

  const numCoins = 6;
  const coinsAnim = useRef(Array.from({ length: numCoins }).map(() => ({
    anim: new Animated.ValueXY({ x: 0, y: 0 }),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.3),
    rot: new Animated.Value(0),
  }))).current;

  const isAnimatingRef = useRef(false);

  React.useEffect(() => {
    // Check if layouts and financial data are ready and animation has not yet finished
    if (
      incomeLayout &&
      expensesLayout &&
      profitLayout &&
      financeRowLayout &&
      !animationFinished &&
      !isAnimatingRef.current &&
      (totalIncome > 0 || totalExpenses > 0)
    ) {
      isAnimatingRef.current = true;

      const pIncome = {
        x: incomeLayout.x + incomeLayout.width / 2 - 20,
        y: financeRowLayout.y + incomeLayout.y + incomeLayout.height / 2 - 12
      };
      const pExpenses = {
        x: expensesLayout.x + expensesLayout.width / 2 - 20,
        y: financeRowLayout.y + expensesLayout.y + expensesLayout.height / 2 - 12
      };
      const pProfit = {
        x: profitLayout.x + profitLayout.width / 2 - 20,
        y: profitLayout.y + profitLayout.height / 2 - 12
      };

      const peak1Y = Math.min(pIncome.y, pExpenses.y) - 20;
      const peak2Y = Math.min(pExpenses.y, pProfit.y) - 15;

      const animations = coinsAnim.map((coin, i) => {
        coin.anim.setValue({ x: pIncome.x, y: pIncome.y });
        coin.scale.setValue(0.3);
        coin.opacity.setValue(0);
        coin.rot.setValue(0);

        const startDelay = i * 95;
        const isExpenseDeduction = i < 2; // First 2 particles represent deducted expenses

        if (isExpenseDeduction) {
          // --- EXPENSE DEDUCTION FLOW: Income ➡️ Expenses ➡️ Dissolve into Expenses ---
          return Animated.sequence([
            Animated.delay(startDelay),

            // 1. Emerge at Income Card
            Animated.parallel([
              Animated.timing(coin.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
              Animated.timing(coin.scale, { toValue: 1.0, duration: 250, useNativeDriver: true }),
              Animated.timing(coin.rot, { toValue: 0.2, duration: 250, useNativeDriver: true }),
            ]),

            // 2. Smooth Arc to Expenses Card
            Animated.parallel([
              Animated.timing(coin.anim.x, {
                toValue: pExpenses.x + (Math.random() - 0.5) * 16,
                duration: 650,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(coin.anim.y, {
                  toValue: peak1Y,
                  duration: 280,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(coin.anim.y, {
                  toValue: pExpenses.y + (Math.random() - 0.5) * 10,
                  duration: 370,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(coin.rot, { toValue: 0.7, duration: 650, useNativeDriver: true }),
            ]),

            // 3. Land on Expenses & Dissolve (Expenses Deducted)
            Animated.parallel([
              Animated.timing(coin.scale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
              Animated.timing(coin.rot, { toValue: 0.85, duration: 80, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(coin.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
              Animated.timing(coin.scale, { toValue: 0.15, duration: 300, useNativeDriver: true }),
            ]),
          ]);
        } else {
          // --- NET PROFIT FLOW: Income ➡️ Expenses ➡️ Net Profit with Success Pulse ---
          return Animated.sequence([
            Animated.delay(startDelay),

            // 1. Emerge at Income Card
            Animated.parallel([
              Animated.timing(coin.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
              Animated.timing(coin.scale, { toValue: 1.0, duration: 250, useNativeDriver: true }),
              Animated.timing(coin.rot, { toValue: 0.2, duration: 250, useNativeDriver: true }),
            ]),

            // 2. Smooth Arc to Expenses Card
            Animated.parallel([
              Animated.timing(coin.anim.x, {
                toValue: pExpenses.x + (Math.random() - 0.5) * 16,
                duration: 620,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(coin.anim.y, {
                  toValue: peak1Y,
                  duration: 270,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(coin.anim.y, {
                  toValue: pExpenses.y + (Math.random() - 0.5) * 10,
                  duration: 350,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(coin.rot, { toValue: 0.6, duration: 620, useNativeDriver: true }),
            ]),

            // 3. Quick Touchdown & Arc Downward to Net Profit
            Animated.timing(coin.scale, { toValue: 1.15, duration: 80, useNativeDriver: true }),

            // 4. Smooth Curve Downward to Net Profit Card
            Animated.parallel([
              Animated.timing(coin.anim.x, {
                toValue: pProfit.x + (Math.random() - 0.5) * 30,
                duration: 720,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(coin.anim.y, {
                  toValue: peak2Y,
                  duration: 300,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(coin.anim.y, {
                  toValue: pProfit.y + (Math.random() - 0.5) * 12,
                  duration: 420,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(coin.rot, { toValue: 1.3, duration: 720, useNativeDriver: true }),
            ]),

            // 5. Land inside Net Profit & Absorb
            Animated.parallel([
              Animated.timing(coin.scale, { toValue: 1.35, duration: 80, useNativeDriver: true }),
              Animated.timing(coin.rot, { toValue: 1.45, duration: 80, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(coin.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
              Animated.timing(coin.scale, { toValue: 0.15, duration: 300, useNativeDriver: true }),
            ]),
          ]);
        }
      });

      // Subtle Glow & Scale Pulse in Net Profit Card when coins finish
      const profitPulseSequence = Animated.sequence([
        Animated.delay(1550),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(profitPulseAnim, { toValue: 1.035, duration: 180, useNativeDriver: true }),
            Animated.spring(profitPulseAnim, { toValue: 1.0, friction: 6, tension: 40, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(profitGlowOpacity, { toValue: 0.8, duration: 180, useNativeDriver: true }),
            Animated.timing(profitGlowOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
          ]),
        ]),
      ]);

      Animated.parallel([
        ...animations,
        profitPulseSequence
      ]).start(() => {
        setAnimationFinished(true);
        isAnimatingRef.current = false;
      });
    }
  }, [incomeLayout, expensesLayout, profitLayout, financeRowLayout, animationFinished, totalIncome, totalExpenses]);
  // ----------------------------------------------------

  // --- Multi-Account Storage Helper ---
  const upsertCurrentAccount = async (phoneOrId, name, profileImg, actualPhone) => {
    try {
      const raw = await AsyncStorage.getItem('loggedInOwnerAccounts');
      let accounts = raw ? JSON.parse(raw) : [];
      const existingIndex = accounts.findIndex(a => a.id === phoneOrId || a.phone === phoneOrId);
      const accountData = {
        id: phoneOrId,
        phone: actualPhone || phoneOrId,
        name: name || 'Owner',
        profileImage: profileImg || null,
        lastLogin: new Date().toISOString(),
      };
      if (existingIndex >= 0) {
        accounts[existingIndex] = { ...accounts[existingIndex], ...accountData };
      } else {
        accounts.unshift(accountData);
      }
      await AsyncStorage.setItem('loggedInOwnerAccounts', JSON.stringify(accounts));
    } catch (e) {
      console.log('Upsert account error:', e);
    }
  };

  // ------------------------------------

  useFocusEffect(
    useCallback(() => {
      if (isConnected !== undefined) {
        setAnimationFinished(false);
        isAnimatingRef.current = false;
        loadAccounts();
        fetchOwnerProfile();
        fetchPayments();
        fetchExpenses();
      }
    }, [isConnected])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setAnimationFinished(false);
    isAnimatingRef.current = false;
    // loadAccounts() re-fetches account statuses from server so admin
    // suspend/approve changes are reflected immediately on pull-to-refresh.
    await Promise.all([loadAccounts(), fetchOwnerProfile(), fetchPayments(), fetchExpenses()]);
    setRefreshing(false);
  }, []);

  const resolveOwnerPhone = async () => {
    const selectedId = await AsyncStorage.getItem('selectedAccountId');
    let storedId = selectedId || await AsyncStorage.getItem('ownerPhone');
    if (!storedId) return null;
    let phoneToUse = storedId.trim();
    const rawAccounts = await AsyncStorage.getItem('loggedInOwnerAccounts');
    if (rawAccounts) {
      const accounts = JSON.parse(rawAccounts);
      const account = accounts.find(a => String(a.id) === String(storedId) || String(a.phone) === String(storedId));
      if (account && account.phone) {
        phoneToUse = account.phone;
      }
    }
    return phoneToUse;
  };

  const resolveOwnerId = async () => {
    const selectedId = await AsyncStorage.getItem('selectedAccountId');
    if (selectedId) return selectedId.trim();
    
    let storedId = await AsyncStorage.getItem('ownerPhone');
    if (!storedId) return null;
    let idToUse = storedId.trim();
    const rawAccounts = await AsyncStorage.getItem('loggedInOwnerAccounts');
    if (rawAccounts) {
      const accounts = JSON.parse(rawAccounts);
      const account = accounts.find(a => String(a.id) === String(storedId) || String(a.phone) === String(storedId));
      if (account && account.id) {
        idToUse = String(account.id);
      }
    }
    return idToUse;
  };

  const fetchOwnerProfile = async () => {
    try {
      const ownerId = await resolveOwnerId();
      if (!ownerId) return;
      const response = await fetchWithAuth(`${BASE_URL}/api/owner_data/${encodeURIComponent(ownerId)}/`);
      const data = await response.json();
      if (response.ok) {
        const propDetails = data.step2?.property_details || {};
        const pName = propDetails.property_name || propDetails.hostelName || propDetails.apartmentName || propDetails.commercialName || data.step1?.property_name;
        const pLoc = propDetails.location || propDetails.address || propDetails.area || data.step1?.area;
        const pType = data.property_type ? (data.property_type.charAt(0).toUpperCase() + data.property_type.slice(1)) : (selectedAccount?.property_type || "Hostel");
        const gallery = propDetails.gallery_images || [];
        const propImg = (gallery && gallery.length > 0) ? gallery[0] : (propDetails.cover_image || selectedAccount?.property_image || null);

        setEditableOwner({
          name: data.step1?.name || selectedAccount?.owner_name || selectedAccount?.name || "Owner",
          role: `${pType} Owner`,
          phone: data.step1?.phone || selectedAccount?.phone || "",
          propertyName: pName || selectedAccount?.property_name || selectedAccount?.name || "",
          location: pLoc || selectedAccount?.location || "",
          propertyImage: propImg,
        });
        setProfileImage(data.step1?.owner_img_field ? `${data.step1.owner_img_field}?t=${new Date().getTime()}` : null);

        // Upsert into multi-account storage
        upsertCurrentAccount(ownerId, data.step1?.name, data.step1?.owner_img_field, data.step1?.phone);

        const stats = data.stats || { total_beds: 0, occupied_beds: 0, total_rent: 0 };
        setProperty({
          totalBeds: stats.total_beds || 0,
          occupied: stats.occupied_beds || 0,
          baseIncome: stats.total_rent || 0,
          structure: data.step3?.building_layout || [],
        });
      }
    } catch (e) { console.log("Fetch owner profile error:", e); }
    finally { setLoading(false); }
  };

  const fetchPayments = async () => {
    try {
      const ownerId = await resolveOwnerId();
      if (!ownerId) return;
      const response = await fetchWithAuth(`${BASE_URL}/api/owner-payments/${encodeURIComponent(ownerId)}/`);
      const data = await response.json();
      if (response.ok) {
        setPayments(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (e) {
      console.log("Fetch payments error:", e);
      setPayments([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      const ownerId = await resolveOwnerId();
      if (!ownerId) return;
      const response = await fetchWithAuth(`${BASE_URL}/api/owner-expenses/${encodeURIComponent(ownerId)}/`);
      const data = await response.json();
      if (response.ok) {
        setExpenses(data.expenses || []);
      }
    } catch (e) {
      console.log("Fetch expenses error:", e);
      setExpenses([]);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri) => {
    if (checkReadOnly()) return;
    try {
      const ownerId = await resolveOwnerId();
      if (!ownerId) return;

      const formData = new FormData();
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("owner_img_field", {
        uri: uri,
        name: filename,
        type: type,
      });

      const response = await fetchWithAuth(
        `${BASE_URL}/api/owner_profile_update/${encodeURIComponent(ownerId)}/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        fetchOwnerProfile();
        Alert.alert(t("success") || "Success", t("profile_picture_updated") || "Profile picture updated successfully");
      } else {
        Alert.alert(t("error") || "Error", `${t("failed_upload") || "Failed to upload image"}: ${response.status}`);
      }
    } catch (error) {
      console.log("Upload error:", error);
      Alert.alert(t("error") || "Error", `${t("failed_upload") || "Failed to upload image"}: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t("logout") || "Logout", t("logout_confirm") || "Are you sure you want to logout?", [
      { text: t("cancel") || "Cancel", style: "cancel" },
     { text: t("logout") || "Logout", onPress: async () => { await AsyncStorage.multiRemove(["ownerPhone", "userToken", "userRole", "loggedInOwnerAccounts"]); navigation.reset({ index: 0, routes: [{ name: 'RoleSection', params: { skipSplash: true } }] }) } }
    ]);
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };



  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#7A3FC4" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  const handleSendAiMessage = () => {
    if (!aiInputText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      text: aiInputText.trim(),
      sender: "user",
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInputText("");

    setTimeout(() => {
      let aiReply = "I can help with tenants, payments, expenses, building management, blocked tenants, and support. Please ask your question.";

      const lowerQ = userMsg.text.toLowerCase();

      if (
        lowerQ === "hi" ||
        lowerQ === "hello" ||
        lowerQ === "hey" ||
        lowerQ === "hii"
      ) {
        aiReply =
          "Hello! 👋 How can I help you manage your property today?";
      }

      else if (lowerQ.includes("how are you")) {
        aiReply =
          "I'm doing great, thank you! Ready to help you with Rennto. What do you need assistance with?";
      }

      else if (
        lowerQ.includes("tenant") ||
        lowerQ.includes("add tenant")
      ) {
        aiReply =
          "To add a tenant, go to the Home tab and tap on an empty bed or room marked with a green '+' icon.";
      }

      else if (
        lowerQ.includes("edit") ||
        lowerQ.includes("layout") ||
        lowerQ.includes("building")
      ) {
        aiReply =
          "You can edit your building layout by tapping 'Edit Building' under Quick Actions or the pencil icon on the Home screen.";
      }

      else if (
        lowerQ.includes("payment") ||
        lowerQ.includes("pay") ||
        lowerQ.includes("cash")
      ) {
        aiReply =
          "Go to the Payments tab, select the tenant, and tap 'Mark as Paid'. Tenants can also upload payment screenshots from their app.";
      }

      else if (
        lowerQ.includes("expense") ||
        lowerQ.includes("spend")
      ) {
        aiReply =
          "You can view expenses in the Profile tab and use 'Add Expense' under Quick Actions to record new expenses.";
      }

      else if (
        lowerQ.includes("issue") ||
        lowerQ.includes("complain") ||
        lowerQ.includes("problem")
      ) {
        aiReply =
          "Open the Issues section from Quick Actions to view and resolve tenant complaints.\n\nNeed additional help?\n📞 Support: +91 9542704244";
      }

      else if (
        lowerQ.includes("remove") ||
        lowerQ.includes("delete") ||
        lowerQ.includes("vacate")
      ) {
        aiReply =
          "To vacate a tenant, tap the occupied bed and select the remove/vacate option.";
      }

      else if (
        lowerQ.includes("block tenant") ||
        lowerQ.includes("blocked tenant")
      ) {
        aiReply =
          "You can block a tenant from the Vacant Tenant section. Select the tenant, tap Block Tenant, choose a reason, and confirm. Blocked tenants cannot join properties until unblocked.";
      }

      else if (
        lowerQ.includes("support") ||
        lowerQ.includes("help") ||
        lowerQ.includes("contact") ||
        lowerQ.includes("customer care") ||
        lowerQ.includes("phone number") ||
        lowerQ.includes("call")
      ) {
        aiReply =
          "Rennto Support\n\n📞 +91 9542704244\n📧 support@rennto.com\n\nWe are here to help you.";
      }

      else if (
        lowerQ.includes("thank") ||
        lowerQ.includes("thanks")
      ) {
        aiReply =
          "You're welcome! 😊 Let me know if you need anything else.";
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: aiReply,
          sender: "ai",
        },
      ]);
    }, 800);
  };

  if (isConnected === false && !editableOwner) {
    return <OfflineView />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" backgroundColor="#5F259F" translucent={false} />
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7A3FC4"]} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={["#5F259F", "#7C3AED", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTopRow} />

          <View style={styles.profileCardContainer}>
            <TouchableOpacity
              style={styles.profileImageWrapper}
              onPress={() => setShowProfileModal(true)}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={styles.profileImageLetter}>{editableOwner.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.profileImageEditBtn}>
                <Ionicons name="camera" size={18} color="white" />
              </View>
            </TouchableOpacity>
            <View style={styles.nameContainer}>
              <Text style={[styles.profileName, { color: '#FFFFFF' }]}>{editableOwner.name}</Text>

            </View>
            <Text style={[styles.profileRole, { color: 'rgba(255,255,255,0.8)' }]}>
              {editableOwner.role === "Hostel Owner" ? t("hostel_owner") : editableOwner.role === "Apartment Owner" ? t("apartment_owner") : editableOwner.role === "Commercial Owner" ? t("commercial_owner") : (t(editableOwner.role) || editableOwner.role)}
            </Text>
          </View>
        </LinearGradient>

        {/* Financial Overview */}
        <View style={[styles.section, { position: 'relative', overflow: 'hidden' }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("financial_summary") || "Financial Overview"}</Text>
          </View>
          <View
            style={styles.financeRow}
            onLayout={(e) => setFinanceRowLayout(e.nativeEvent.layout)}
          >
            <FinanceCard
              onLayout={(e) => setIncomeLayout(e.nativeEvent.layout)}
              title={t("income") || "Total Income"}
              value={`₹${formatNumber(totalIncome)}`}
              color="#2563EB"
              icon="trending-up"
              bg="#EFF6FF"
            />
            <FinanceCard
              onLayout={(e) => setExpensesLayout(e.nativeEvent.layout)}
              title={t("expenses") || "Total Expenses"}
              value={`₹${formatNumber(totalExpenses)}`}
              color="#DC2626"
              icon="trending-down"
              bg="#FEF2F2"
            />
          </View>
          <Animated.View
            collapsable={false}
            onLayout={(e) => setProfitLayout(e.nativeEvent.layout)}
            style={{ transform: [{ scale: profitPulseAnim }] }}
          >
            <LinearGradient
              colors={netProfit >= 0 ? ["#ECFDF5", "#D1FAE5"] : ["#FFF1F2", "#FFE4E6"]}
              style={styles.profitCard}
            >
              <View style={styles.profitContent}>
                <View>
                  <Text style={[styles.profitLabel, { color: netProfit >= 0 ? "#065F46" : "#991B1B" }]}>
                    {t("net_profit") || "Net Profit"}
                  </Text>
                  <Text style={[styles.profitValue, { color: netProfit >= 0 ? "#059669" : "#DC2626" }]}>
                    ₹{formatNumber(Math.abs(netProfit))}
                  </Text>
                  <View style={styles.profitGrowthRow}>
                    <Ionicons
                      name={netProfit >= 0 ? "arrow-up-circle" : "arrow-down-circle"}
                      size={16}
                      color={netProfit >= 0 ? "#059669" : "#DC2626"}
                    />
                    <Text style={[styles.profitGrowthText, { color: netProfit >= 0 ? "#059669" : "#DC2626" }]}>
                      {netProfit >= 0 ? t("profitable") || "Active Balance" : t("loss") || "Loss"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.profitIconContainer, { backgroundColor: netProfit >= 0 ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)" }]}>
                  <Ionicons
                    name={netProfit >= 0 ? "cash-outline" : "trending-down-outline"}
                    size={40}
                    color={netProfit >= 0 ? "#059669" : "#DC2626"}
                  />
                </View>
              </View>

              {/* Subtle Success Glow Overlay on Net Profit */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    opacity: profitGlowOpacity,
                  }
                ]}
                pointerEvents="none"
              />
            </LinearGradient>
          </Animated.View>

          {/* Guided Financial Flow Animation Layer (Clipped inside this section) */}
          {!animationFinished && (
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
              {coinsAnim.map((coin, index) => {
                const isNote = index % 2 !== 0;

                if (isNote) {
                  // RENDER MINI TEAL/GREEN INDIAN RUPEE NOTE (₹500 style)
                  return (
                    <Animated.View
                      key={index}
                      style={{
                        position: 'absolute',
                        width: 44,
                        height: 24,
                        shadowColor: '#10B981',
                        shadowOpacity: 0.7,
                        shadowRadius: 5,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4,
                        opacity: coin.opacity,
                        transform: [
                          { translateX: coin.anim.x },
                          { translateY: coin.anim.y },
                          { scale: coin.scale },
                          { rotate: coin.rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                          { rotateY: coin.rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) }
                        ],
                        zIndex: 99
                      }}
                    >
                      <LinearGradient
                        colors={["#A7F3D0", "#34D399", "#059669"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 3,
                          borderWidth: 0.8,
                          borderColor: '#ECFDF5',
                          padding: 2,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 1.5,
                          borderWidth: 0.5,
                          borderColor: 'rgba(255, 255, 255, 0.45)',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingHorizontal: 2
                        }}>
                          <View style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            borderWidth: 0.5,
                            borderColor: 'rgba(255, 255, 255, 0.35)'
                          }} />
                          <Text style={{
                            color: '#FFF',
                            fontWeight: '900',
                            fontSize: 8,
                            letterSpacing: -0.3,
                            textShadowColor: 'rgba(0, 0, 0, 0.3)',
                            textShadowOffset: { width: 0.5, height: 0.5 },
                            textShadowRadius: 1
                          }}>₹500</Text>
                          <View style={{
                            width: 1.2,
                            height: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.55)',
                            position: 'absolute',
                            left: 14
                          }} />
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  );
                } else {
                  // RENDER SHINY 3D GOLD COIN
                  return (
                    <Animated.View
                      key={index}
                      style={{
                        position: 'absolute',
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        shadowColor: '#FF9800',
                        shadowOpacity: 0.8,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 5,
                        opacity: coin.opacity,
                        transform: [
                          { translateX: coin.anim.x },
                          { translateY: coin.anim.y },
                          { scale: coin.scale },
                          { rotate: coin.rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
                          { rotateY: coin.rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] }) }
                        ],
                        zIndex: 99
                      }}
                    >
                      <LinearGradient
                        colors={["#FFE082", "#FFB300", "#FF8F00"]}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          borderWidth: 1.2,
                          borderColor: '#FFF8E1',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: 1,
                        }}
                      >
                        <View style={{
                          width: 19,
                          height: 19,
                          borderRadius: 9.5,
                          borderWidth: 0.8,
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Text style={{
                            color: '#FFF',
                            fontWeight: '900',
                            fontSize: 11,
                            textShadowColor: 'rgba(0, 0, 0, 0.35)',
                            textShadowOffset: { width: 0.5, height: 1 },
                            textShadowRadius: 1.5
                          }}>₹</Text>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  );
                }
              })}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("quick_actions") || "Quick Actions"}</Text>
            <TouchableOpacity>
              <Text style={styles.viewReportText}>{t("see_all") || "See All"}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.quickActionsGrid, { gap: 10 }]}>
            <QuickActionBtn
              icon="business-outline"
              label={t("edit_building") || "Edit Building"}
              color="#7C3AED"
              bg="#F5F3FF"
              onPress={() => navigation.navigate('Home', { editMode: true, ts: Date.now() })}
            />
            <QuickActionBtn
              icon="people-outline"
              label={t("tenants") || "Tenants"}
              color="#059669"
              bg="#ECFDF5"
              onPress={() => navigation.navigate('Tenants')}
            />
            <QuickActionBtn
              icon="receipt-outline"
              label={t("add_expense") || "Add Expense"}
              color="#DC2626"
              bg="#FEF2F2"
              onPress={() => navigation.navigate('AddExpense')}
            />
            <QuickActionBtn
              icon="images-outline"
              label={t("upload_images") || "Upload Images"}
              color="#0284C7"
              bg="#F0F9FF"
              onPress={() => setShowPropertyImagesModal(true)}
            />
          </View>
        </View>



        {/* Manage Accounts Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>{t("manage_accounts") || "Manage Accounts"}</Text>
            <TouchableOpacity
              onPress={async () => {
                await loadAccounts();
                setShowAccountSwitcher(true);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F5F3FF',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#EDE9FE',
                gap: 5,
              }}
            >
              <Ionicons name="swap-horizontal" size={16} color="#7C3AED" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#7C3AED' }}>
                {accounts.length > 1
                  ? `${t("switch_account") || "Switch Account"} (${accounts.length})`
                  : (t("switch_account") || "Switch Account")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Single Combined Manage Accounts Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: '#EDE9FE',
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Top Right: ● CURRENT PROPERTY */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED', marginRight: 5 }} />
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '800',
                  color: '#7C3AED',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {t("current_property") || "CURRENT PROPERTY"}
              </Text>
            </View>

            {/* Current Active Property Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: '#F5F3FF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                  borderWidth: 1,
                  borderColor: '#EDE9FE',
                  overflow: 'hidden',
                }}
              >
                {(editableOwner.propertyImage || selectedAccount?.property_image) ? (
                  <Image
                    source={{ uri: editableOwner.propertyImage || selectedAccount?.property_image }}
                    style={{ width: '100%', height: '100%', borderRadius: 15 }}
                  />
                ) : (
                  <Ionicons name="business" size={28} color="#7C3AED" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: '#1F2937',
                    marginBottom: 4,
                  }}
                  numberOfLines={1}
                >
                  {editableOwner.propertyName || selectedAccount?.property_name || selectedAccount?.name || "Property Name"}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="location-sharp" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 13, color: '#6B7280', flex: 1 }} numberOfLines={1}>
                    {editableOwner.location || selectedAccount?.location || selectedAccount?.area || "Location not set"}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="person-outline" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12.5, color: '#7C3AED', fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {editableOwner.role || (selectedAccount?.property_type ? `${selectedAccount.property_type.charAt(0).toUpperCase() + selectedAccount.property_type.slice(1)} Owner` : "Property Owner")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider Line */}
            <View
              style={{
                height: 1,
                backgroundColor: '#F1F5F9',
                marginVertical: 14,
              }}
            />

            {/* Add Another Property Action Row */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={async () => {
                await loadAccounts();
                setShowAddAccountModal(true);
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: '#F5F3FF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                  borderWidth: 1,
                  borderColor: '#EDE9FE',
                }}
              >
                <Ionicons name="person-add-outline" size={24} color="#7C3AED" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                  {t("add_another_Property") || "Add Another Property"}
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  {t("login_with_different") || "Login with Different Account"}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={22} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account_settings") || "Account Settings"}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="exit-outline"
              label={t("vacate_requests") || "Vacate Requests"}
              color="#F59E0B"
              onPress={() => navigation.navigate('OwnerVacateRequests')}
            />
            <SettingsRow
              icon="receipt-outline"
              label={t("expenses") || "Expenses"}
              color="#DC2626"
              onPress={() => navigation.navigate('OwnerExpenseHistory')}
            />
            <SettingsRow
              icon="time-outline"
              label={t("payment_history") || "Payment History"}
              color="#7C3AED"
              onPress={() => navigation.navigate('OwnerPaymentHistory', { phone: editableOwner.phone })}
            />
            <SettingsRow
              icon="globe-outline"
              label={t("languages") || "Languages"}
              color="#10B981"
              onPress={() => setShowLangModal(true)}
            />

            <SettingsRow
              icon="log-out-outline"
              label={t("logout") || "Logout"}
              color="#EF4444"
              onPress={handleLogout}
              isLast
            />
          </View>
        </View>
      </Animated.ScrollView>

      {/* Instagram-style Account Switcher Bottom Sheet */}
      <Modal
        visible={showAccountSwitcher}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountSwitcher(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccountSwitcher(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.dragHandle} />
              <Text style={styles.bottomSheetTitle}>{t("switch_account") || "Switch Account"}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.bottomSheetList} style={{ maxHeight: 350 }}>
              {accounts.map((acc) => {
                const isSelected = selectedAccount && selectedAccount.id === acc.id;
                const isSuspended = acc.status === "suspend";
                const isPending = acc.status === "pending";
                const isDisabled = isSuspended || isPending;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountItem,
                      isSelected && styles.accountItemSelected,
                      isDisabled && { opacity: 0.5, backgroundColor: "#F5F5F5" }
                    ]}
                    onPress={async () => {
                      if (isSuspended) {
                        Alert.alert(
                          "Account Suspended",
                          acc.suspension_reason
                            ? `This property is suspended.\n\nReason: ${acc.suspension_reason}`
                            : "This property has been suspended by the admin.",
                          [{ text: "OK" }]
                        );
                        return;
                      }
                      if (isPending) {
                        Alert.alert(
                          "Approval Pending",
                          "This property registration is currently pending admin approval.",
                          [{ text: "OK" }]
                        );
                        return;
                      }
                      setShowAccountSwitcher(false);
                      setLoading(true);
                      const res = await switchAccount(acc.id);
                      if (res.success) {
                        await fetchOwnerProfile();
                        await fetchPayments();
                        await fetchExpenses();
                      } else {
                        Alert.alert("Error", res.error || "Failed to switch account");
                      }
                      setLoading(false);
                    }}
                  >
                    <View style={styles.accountAvatarBox}>
                      {acc.property_image ? (
                        <Image source={{ uri: acc.property_image }} style={styles.accountAvatar} />
                      ) : (
                        <View style={[styles.accountAvatarFallback, isDisabled && { backgroundColor: "#E5E5E5" }]}>
                          <Ionicons name={isSuspended ? "ban" : isPending ? "time-outline" : "business"} size={24} color={isDisabled ? "#9CA3AF" : "#7C3AED"} />
                        </View>
                      )}
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountPropertyName, isDisabled && { color: "#9CA3AF" }]} numberOfLines={1}>
                        {acc.property_name || "Unnamed Property"}
                      </Text>
                      <Text style={[styles.accountOwnerName, isDisabled && { color: "#9CA3AF" }]} numberOfLines={1}>
                        {acc.owner_name}
                        {(acc.property_type || acc.propertyType) && !/n[\/\\]a/i.test(acc.property_type || acc.propertyType) ? ` • ${acc.property_type || acc.propertyType}` : ''}
                      </Text>
                      {isSuspended && (
                        <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "600", marginTop: 2 }}>
                          🔒 Suspended{acc.suspension_reason ? ` — ${acc.suspension_reason}` : ""}
                        </Text>
                      )}
                      {isPending && (
                        <Text style={{ fontSize: 11, color: "#D97706", fontWeight: "600", marginTop: 2 }}>
                          ⏳ Pending Admin Approval
                        </Text>
                      )}
                    </View>
                    {isSelected && !isDisabled && (
                      <View style={styles.selectedCheckmark}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                    )}
                    {isDisabled && (
                      <View style={{ marginLeft: "auto" }}>
                        <Ionicons name="lock-closed" size={20} color="#EF4444" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.addAccountButton}
              onPress={() => {
                setShowAccountSwitcher(false);
                setTimeout(() => {
                  setShowAddAccountModal(true);
                }, 100);
              }}
            >
              <View style={styles.addAccountIconBox}>
                <Ionicons name="add" size={24} color="#7C3AED" />
              </View>
              <Text style={styles.addAccountText}>{t("add_another_account") || "Add Another Account"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Settings Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("profile_settings") || "Profile Settings"}</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowProfileModal(false);
                takePhoto();
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="camera-outline" size={24} color="#0369A1" />
              </View>
              <Text style={styles.optionLabel}>{t("take_photo") || "Take Photo"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowProfileModal(false);
                pickImage();
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="image-outline" size={24} color="#7A3FC4" />
              </View>
              <Text style={styles.optionLabel}>{t("choose_gallery") || "Choose from Gallery"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowProfileModal(false);
                navigation.navigate('OwnerEditProfile');
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="create-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.optionLabel}>{t("edit_profile_details") || "Edit"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.modalCancelText}>{t("cancel") || "Cancel"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Property Images Modal */}
      <Modal
        visible={showPropertyImagesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPropertyImagesModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPropertyImagesModal(false)}
        >
          <View style={[styles.modalContent, { maxHeight: '80%', paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("property_images") || "Property Images"}</Text>
              <TouchableOpacity onPress={() => setShowPropertyImagesModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <PropertyImagesUpload ownerPhone={editableOwner.phone} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <LanguageSelector
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
      />



      {/* Draggable AI Assistant FAB */}
      <Animated.View
        {...aiPanResponder.panHandlers}
        style={[
          styles.aiFab,
          {
            transform: [
              { translateX: aiPan.x },
              { translateY: aiPan.y }
            ]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAiModal(true)}
          style={{ width: '100%', height: '100%' }}
        >
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6', '#D946EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiFabGradient}
          >
            <MaterialIcons name="support-agent" size={26} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* AI Assistant Modal */}
      <Modal
        visible={showAiModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAiModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAiModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { height: '80%', padding: 0 }]}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="support-agent" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFF' }}>{t("support_agent") || "Support Agent"}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </LinearGradient>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                {aiMessages.map(msg => (
                  <View key={msg.id} style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#3B82F6' : '#F3F4F6',
                    padding: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 16,
                    marginBottom: 12,
                    maxWidth: '85%'
                  }}>
                    <Text style={{ fontSize: 15, color: msg.sender === 'user' ? '#FFF' : '#1F2937', lineHeight: 22 }}>
                      {msg.text}
                    </Text>
                  </View>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: '#1F2937' }}
                  placeholder={t("ask_a_question") || "Ask a question..."}
                  placeholderTextColor="#9CA3AF"
                  value={aiInputText}
                  onChangeText={setAiInputText}
                  multiline
                />
                <TouchableOpacity
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}
                  onPress={handleSendAiMessage}
                >
                  <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* --- Beautiful Custom Add Account Modal --- */}
      <Modal visible={showAddAccountModal} transparent animationType="fade" onRequestClose={() => setShowAddAccountModal(false)}>
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContainer}>
            <LinearGradient colors={["#5F259F", "#7C3AED", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.customModalHeader}>
              <View style={styles.customModalIconContainer}>
                <Ionicons name="add-circle" size={32} color="#FFF" />
              </View>
              <Text style={styles.customModalTitle}>Add Account</Text>
              <Text style={styles.customModalSubtitle}>Expand your portfolio by registering a new property account.</Text>
            </LinearGradient>
            
            <View style={styles.customModalContent}>
              <TouchableOpacity
                style={styles.customModalOptionBtn}
                onPress={() => {
                  setShowAddAccountModal(false);
                  setTimeout(() => {
                    navigation.navigate('OwnerRegistrationScreen', {
                      initialStep: 1,
                      phone: editableOwner.phone,
                      name: editableOwner.name,
                      isAddingAccount: true
                    });
                  }, 300);
                }}
              >
                <LinearGradient colors={["#F0FDF4", "#DCFCE7"]} style={styles.customModalOptionIconBg}>
                  <Ionicons name="business" size={24} color="#10B981" />
                </LinearGradient>
                <View style={styles.customModalOptionTextContainer}>
                  <Text style={styles.customModalOptionTitle}>Register New Property</Text>
                  <Text style={styles.customModalOptionSubtitle}>Create a brand new property account.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customModalCancelBtn}
                onPress={() => setShowAddAccountModal(false)}
              >
                <Text style={styles.customModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const FinanceCard = ({ title, value, color, icon, bg, cardRef, onLayout }) => (
  <View ref={cardRef} collapsable={false} onLayout={onLayout} style={[styles.financeCard, { backgroundColor: bg }]}>
    <View style={styles.financeHeader}>
      <View style={[styles.financeIcon, { backgroundColor: 'white' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
    </View>
    <Text style={styles.financeTitle}>{title}</Text>
    <Text style={[styles.financeValue, { color }]}>{value}</Text>
  </View>
);

const QuickActionBtn = ({ icon, label, color, bg, onPress }) => (
  <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: 'white' }]} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const SettingsRow = ({ icon, label, color, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.settingsRowItem, isLast && { borderBottomWidth: 0 }]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.settingsRowLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  aiFab: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  aiFabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#5F259F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardContainer: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileImageLetter: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  profileImageEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7C3AED',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileRole: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '600',
    opacity: 0.8,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewReportText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    marginRight: 4,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  financeCard: {
    flex: 0.48,
    padding: 16,
    borderRadius: 20,
  },
  financeHeader: {
    marginBottom: 12,
  },
  financeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  financEmptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 24,
    fontSize: 14,
  },
  customModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  customModalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  customModalHeader: {
    padding: 24,
    alignItems: "center",
    paddingTop: 32,
  },
  customModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  customModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  customModalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  customModalContent: {
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  customModalOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  customModalOptionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  customModalOptionTextContainer: {
    flex: 1,
  },
  customModalOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  customModalOptionSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  customModalCancelBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  customModalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  financeTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  financeValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  profitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  profitValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profitGrowthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profitGrowthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  profitIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
  },
  expensesCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    overflow: 'hidden',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    // Card stack effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseCategory: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  expenseDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  settingsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 14,
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalCancelBtn: {
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  faqItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  bottomSheetList: {
    paddingBottom: 10,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountItemSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  accountAvatarBox: {
    marginRight: 12,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  accountAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountPropertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  accountOwnerName: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedCheckmark: {
    marginLeft: 12,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addAccountIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  }
});


