
import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import BASE_URL, { fetchWithAuth, WS_BASE_URL } from "@/src/config/Api";
import { useLanguage } from "../../utils/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { OwnerAccountContext } from "../../context/OwnerAccountContext";

export default function WaitingScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { refreshAccounts, switchAccount } = useContext(OwnerAccountContext);
  const phone = route?.params?.phone || global.ownerPhone || "";

  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [wsStatus, setWsStatus] = useState("connecting");

  const [banner, setBanner] = useState(null);
  const bannerAnim = useRef(new Animated.Value(-150)).current;

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const fallbackTimer = useRef(null);
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const MAX_RETRIES = 5;

  const showBanner = (message, color) => {
    if (!isMounted.current) return;
    setBanner({ message, color });
    Animated.spring(bannerAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      if (!isMounted.current) return;
      Animated.timing(bannerAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (isMounted.current) setBanner(null);
      });
    }, 4000);
  };

  const navigateAfterDelay = (screen, delay = 2000) => {
    setTimeout(() => {
      if (isMounted.current) {
        if (wsRef.current) {
          wsRef.current.onclose = null;
          wsRef.current.close();
          wsRef.current = null;
        }
        navigation.replace(screen);
      }
    }, delay);
  };



  const handleActiveApproval = async (data) => {
    try {
      if (data.token) {
        await AsyncStorage.setItem("userToken", data.token);
      }
      if (data.owner_id || phone) {
        const targetPhone = data.owner_id || phone;
        if (data.owner_id) {
            await AsyncStorage.setItem("ownerPhone", String(data.owner_id));
            await AsyncStorage.setItem("selectedAccountId", String(data.owner_id));
        } else {
            await AsyncStorage.setItem("ownerPhone", String(targetPhone));
            await AsyncStorage.setItem("selectedAccountId", String(targetPhone));
        }

        // Refresh account list first so the new account appears
        if (refreshAccounts) {
          await refreshAccounts();
        }

        // Explicitly switch to the newly approved account in context state
        if (switchAccount) {
          await switchAccount(String(data.owner_id || targetPhone));
        }

        // Add to loggedInOwnerAccounts — include id so resolveOwnerId() works
        const raw = await AsyncStorage.getItem("loggedInOwnerAccounts");
        let accounts = raw ? JSON.parse(raw) : [];
        const newId = String(data.owner_id || targetPhone);
        const newPhone = data.owner_phone || targetPhone;
        if (!accounts.find(a => String(a.id) === newId)) {
          accounts.push({ id: newId, phone: newPhone, name: data.owner_name || "" });
          await AsyncStorage.setItem("loggedInOwnerAccounts", JSON.stringify(accounts));
        } else {
          // Ensure existing entry has id field
          accounts = accounts.map(a =>
            String(a.id) === newId || String(a.phone) === newPhone
              ? { ...a, id: newId, phone: newPhone }
              : a
          );
          await AsyncStorage.setItem("loggedInOwnerAccounts", JSON.stringify(accounts));
        }

 navigation.reset({
  index: 0,
  routes: [
    {
      name: "OwnerNavigation",
      params: {
        phone: targetPhone,
      },
    },
  ],
});
      } else {
        navigation.replace("OwnerNavigation");
      }
    } catch (e) {
      console.log("Error during auto-login navigation:", e);
      navigation.replace("OwnerLoginScreen");
    }
  };

  const fetchInitialStatus = async () => {
    try {
      if (!isMounted.current || !phone) return;

      const storedReason = await AsyncStorage.getItem('ACCOUNT_SUSPEND_REASON');
      if (storedReason && isMounted.current) {
        setSuspensionReason(storedReason);
      }

      const res = await fetchWithAuth(`${BASE_URL}/api/check-owner-status/${encodeURIComponent(phone)}/`);
      const data = res.ok ? await res.json() : {};

      if (!isMounted.current) return;

      if (data.status === "active") {
        setStatus("active");
        if (wsRef.current) {
          wsRef.current.onclose = null;
          wsRef.current.close();
          wsRef.current = null;
        }
        await handleActiveApproval(data);
        return;
      }

      if (data.status === "suspend") {
        setStatus("suspend");
        const reason =
          data?.reason ||
          data?.message ||
          route.params?.reason ||
          '';

        console.log('[WaitingScreen] Status:', data.status);
        console.log('[WaitingScreen] Reason:', reason);
        console.log('[WaitingScreen] API Response:', data);

        if (reason) {
          setSuspensionReason(reason);
          await AsyncStorage.setItem('ACCOUNT_SUSPEND_REASON', reason);
        }
      }

      setTimeLeft(176399);
    } catch (err) {
      console.log("[WaitingScreen] fetchInitialStatus error:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!phone || !isMounted.current || wsRef.current) return;

    const socketUrl = `${WS_BASE_URL}/ws/owner-status/${encodeURIComponent(phone)}/`;
    console.log("[WaitingScreen] WS connecting →", socketUrl);

    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WaitingScreen] WS ✅ ✅open");
      if (isMounted.current) {
        setWsStatus("open");
        retryCount.current = 0;
      }
    };

    ws.onmessage = async (e) => {
      try {
        if (!isMounted.current) return;
        const msg = JSON.parse(e.data);
        console.log("[WaitingScreen] WS 📨 message:", msg);

        if (msg.type === "account_status") {
          if (msg.status === "active") {
            setStatus("active");
            showBanner(t("approved_msg") || "🎉 Your account has been Approved!", "#10b981");

            // Fetch status via REST to get token & owner ID
            const freshRes = await fetchWithAuth(`${BASE_URL}/api/check-owner-status/${encodeURIComponent(phone)}/`);
            const freshData = freshRes.ok ? await freshRes.json() : {};

            setTimeout(async () => {
              await handleActiveApproval(freshData);
            }, 2000);
          } else if (msg.status === "suspend") {
            setStatus("suspend");
            const wsReason =
              msg?.reason ||
              msg?.message ||
              route.params?.reason ||
              '';

            if (wsReason) {
              setSuspensionReason(wsReason);
              AsyncStorage.setItem('ACCOUNT_SUSPEND_REASON', wsReason).catch(console.error);
            }
            console.log('[WaitingScreen] Status:', msg.status);
            console.log('[WaitingScreen] Reason:', wsReason);
            console.log('[WaitingScreen] API Response:', msg);
            showBanner(t("suspended_msg") || "⛔ Your account has been Suspended.", "#ef4444");
          }
        }
      } catch (err) {
        console.log("[WaitingScreen] WS parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.log("[WaitingScreen] WS ⚠️ error:", err.message);
      if (isMounted.current) setWsStatus("error");
    };

    ws.onclose = (e) => {
      console.log("[WaitingScreen] WS ❌ closed (code:", e.code, ")");
      wsRef.current = null;
      if (!isMounted.current) return;

      setWsStatus("closed");

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        reconnectTimer.current = setTimeout(() => {
          console.log(`[WaitingScreen] WS 🔄 reconnecting (${retryCount.current}/${MAX_RETRIES})…`);
          connectWebSocket();
        }, 5000);
      } else {
        console.log("[WaitingScreen] ⚠️ Max retries reached. Using REST fallback polling.");
      }
    };
  };

  useEffect(() => {
    isMounted.current = true;
    if (!phone) {
      setLoading(false);
      return;
    }

    fetchInitialStatus();
    connectWebSocket();

    // REST Fallback polling (every 30s)
    fallbackTimer.current = setInterval(() => {
      // Only poll if WebSocket is not open
      if (wsStatus !== "open") {
        console.log("[WaitingScreen] 🕒 Fallback status check...");
        fetchInitialStatus();
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      clearInterval(fallbackTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [phone, wsStatus]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        // Timer expired: auto-extend by 12 hours (43200s).
        // Subtracting 1 immediately so the display shows 11h:59m:59s
        // on this same tick rather than jumping to 12h:00m:00s first.
        return 43200 - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const formatTime = (v) => String(v).padStart(2, "0");
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const handleReRegister = async () => {
    try {
      if (!isMounted.current) return;
      const res = await fetchWithAuth(`${BASE_URL}/api/get_suspension_reason/${encodeURIComponent(phone)}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        navigation.replace("OwnerRegistrationScreen");
      } else {
        console.log(t("error") || "Error", t("clear_suspension_error") || "Failed to clear suspension record. Please try again.");
      }
    } catch {
      console.log(t("error") || "Error", t("network_error") || "Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t("loading") || "Loading..."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {banner && (
        <Animated.View
          style={[
            styles.banner,
            {
              backgroundColor: banner.color,
              transform: [{ translateY: bannerAnim }],
            },
          ]}
        >
          <Text style={styles.bannerText}>{banner.message}</Text>
        </Animated.View>
      )}

      {status === "suspend" ? (
        <View style={styles.reasonContainer}>
          <Text style={styles.suspendIcon}>⛔</Text>
          <Text style={styles.title}>{t("account_suspended") || "Account Suspended"}</Text>
          <Text style={styles.reasonText}>
            {suspensionReason || 'No reason provided by administrator'}
          </Text>
          <TouchableOpacity style={styles.reRegisterButton} onPress={handleReRegister}>
            <Text style={styles.reRegisterButtonText}>{t("re_register") || "Re-Register"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Image
            source={require("../../../assets/images/hourglass.gif")}
            style={styles.image}
            resizeMode="contain"
          />

          <Text style={styles.title}>{t("account_under_review") || "Account Under Review"}</Text>
          <Text style={styles.subtitle}>{t("review_time_message") || "We will get back to you within 2 days"}</Text>

          <Text style={styles.timer}>
            {formatTime(hours)}h : {formatTime(minutes)}m : {formatTime(seconds)}s
          </Text>

          <View style={styles.wsIndicatorRow}>
            <View
              style={[
                styles.wsIndicatorDot,
                { backgroundColor: wsStatus === "open" ? "#10b981" : "#f59e0b" },
              ]}
            />
            <Text style={styles.wsIndicatorText}>
              {wsStatus === "open" ? (t("live_updates_active") || "Live updates active") : (t("connecting_server") || "Connecting to server...")}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 45 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 1000,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bannerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 15,
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  timer: {
    marginTop: 30,
    fontSize: 24,
    color: "#3094c7",
    fontWeight: "bold",
    backgroundColor: "#e0f2fe",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  wsIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
  },
  wsIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  wsIndicatorText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  reasonContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fef2f2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fca5a5",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: "100%",
  },
  suspendIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  reasonText: {
    color: '#B22222',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 24,
    fontWeight: '600',
    marginTop: 12,
  },
  reRegisterButton: {
    marginTop: 35,
    backgroundColor: "#3094c7",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#3094c7",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  reRegisterButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});









