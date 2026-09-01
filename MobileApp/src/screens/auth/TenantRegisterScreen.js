import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../utils/LanguageContext";
import * as Notifications from "../../utils/NotificationsProxy";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import COLORS from "@/src/theme/colors";

const WHITE = COLORS.WHITE;
const NAVY = COLORS.PRIMARY;
const LIGHT_PURPLE = COLORS.PRIMARY_LIGHT;


export default function TenantRegisterScreen({ navigation }) {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpInputs = useRef([]);

  const [showOTPField, setShowOTPField] = useState(false);
  const [showNameField, setShowNameField] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [loadingOTP, setLoadingOTP] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  /* ---------------- VALIDATION ---------------- */

  const removeEmojis = (text) =>
    text.replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
      .replace(/[\u2600-\u27BF]/g, "");

  const validateName = (name) => {
    const regex = /^[A-Za-z ]{3,30}$/;
    return regex.test(name) && name.trim().length >= 3;
  };

  const validatePhone = (phone) => /^[6-9][0-9]{9}$/.test(phone);

  /* ---------------- SEND OTP ---------------- */

  const handleGetOTP = async () => {

    if (!validatePhone(phone)) {
      setErrors((prev) => ({
        ...prev,
        phone: "Enter valid 10-digit number",
      }));
      return;
    }

    try {

      setLoadingOTP(true);

     const response = await fetchWithAuth(
  `${BASE_URL}/api/send-otp/`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: phone,
      role: "tenant",
    }),
  }
);

const data = await response.json();
console.log("OTP Response:", data);

if (response.ok) {
  setShowOTPField(true);
  setOtp(["", "", "", ""]);
  setErrors({});

  console.log("Success", data.message);
} else {
  console.log("Error", data.error || "Failed to send OTP");
} 

    } catch (error) {

      console.log(error);
      console.log("Error", "Something went wrong");

    } finally {

      setLoadingOTP(false);

    }
  };

  /* ---------------- RESEND OTP ---------------- */
const handleResendOTP = async () => {
  setOtp(["", "", "", ""]);
  setErrors({});

  await handleGetOTP();
};
  /* ---------------- VERIFY OTP ---------------- */

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 4) {
      setErrors((prev) => ({
        ...prev,
        otp: "Enter valid 4-digit OTP",
      }));
      return;
    }

    try {

      setLoadingVerify(true);

      const response = await fetchWithAuth(
  `${BASE_URL}/api/verify-otp/`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: phone,
      otp: otpString,
      role: "tenant",
    }),
  }
);

const data = await response.json();

console.log("VERIFY OTP RESPONSE:", data);

if (!response.ok || !data.verified) {

        setOtp(["", "", "", ""]);
otpInputs.current[0]?.focus();

setErrors((prev) => ({
  ...prev,
  otp: data.error || "Invalid OTP",
}));

console.log(
  "Error",
  data.error || "Invalid OTP"
);

return;
      }

      setIsPhoneVerified(true);

     const userData = data;
      console.log("USER CHECK:", userData);

      if (userData.exists) {

        // Save tenant phone number
        await AsyncStorage.setItem("tenantPhone", phone);
        await AsyncStorage.setItem(
  "tenantName",
  userData.user?.name || ""
);
        if (userData.token) {
          await AsyncStorage.setItem("userToken", userData.token);
        }
 await AsyncStorage.setItem("userRole", "tenant");
        // Save tenant email for future API calls
        if (userData.email) {
          await AsyncStorage.setItem("tenantEmail", userData.email);
        }

        // Extract tenant ID from various possible response shapes (prefer userData)
        const id =
          userData.user?.id ||
          userData.id ||
          data?.data?.id ||
          data?.tenant?.id ||
          data?.id ||
          data?.tenant_id;

        if (id) {
          await AsyncStorage.setItem("tenantId", id.toString());
        }

        console.log("SAVED TENANT ID:", id);
        // UPDATE PUSH TOKEN ON LOGIN

try {
  console.log("========== LOGIN PUSH START ==========");
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus === "granted") {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    console.log("LOGIN EXPO TOKEN:", tokenData.data);

    const pushResponse = await fetchWithAuth(
      `${BASE_URL}/api/save-push-token/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          role: "tenant",
          push_token: tokenData.data,
        }),
      }
    );
    const pushResult = await pushResponse.json();
    console.log("LOGIN PUSH SAVE RESPONSE:", pushResult);
  } else {
    console.log("NOTIFICATION PERMISSION NOT GRANTED - SKIPPING PUSH TOKEN");
  }
  console.log("========== LOGIN PUSH END ==========");
} catch (pushError) {
  console.log("❌ LOGIN PUSH TOKEN ERROR:", pushError);
}

        if (global.triggerMaintenanceCheck) {
          global.triggerMaintenanceCheck();
        }
        navigation.reset({
          index: 0,
          routes: [{
            name: "RenntoLoadingScreen",
            params: {
              destination: "TenantNavigation",
              destinationParams: {},
            },
          }],
        });

      } else {

        setShowOTPField(false);
        setShowNameField(true);

      }

    } catch (error) {

      console.log(error);
      Alert.alert(t("error") || "Error", t("something_went_wrong") || "Something went wrong");

    } finally {

      setLoadingVerify(false);

    }
  };

  /* ---------------- REGISTER ---------------- */

  const handleRegister = async () => {
    if (!validateName(name)) {
      setErrors((prev) => ({
        ...prev,
        name: "Name must be 3+ letters",
      }));
      return;
    }

    try {
      setLoadingRegister(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      try {
        console.log("========== REGISTER PUSH START ==========");
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          });
          console.log("REGISTER EXPO TOKEN:", tokenData.data);
          formData.append("push_token", tokenData.data);
          console.log("REGISTER PUSH TOKEN:", tokenData.data);
        } else {
          console.log("NOTIFICATION PERMISSION NOT GRANTED - SKIPPING PUSH TOKEN");
        }
      } catch (pushError) {
        console.log("❌ REGISTER PUSH TOKEN ERROR:", pushError);
      }

      const response = await fetchWithAuth(`${BASE_URL}/api/tenent/`, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log(
  "REGISTER API RESPONSE:",
  responseText
);

console.log(
  "========== REGISTER PUSH END =========="
);
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { message: responseText };
      }

      if (response.status === 201 || response.status === 200) {

        console.log("REGISTER RESPONSE:", data);

        // SAVE PHONE
        await AsyncStorage.setItem("tenantPhone", phone);

        // SAVE TOKEN
        if (data.token) {
          await AsyncStorage.setItem("userToken", data.token);
        }

        // SAVE TENANT ID
        await AsyncStorage.setItem(
          "tenantId",
          data.data.id.toString()
        );

        console.log("SAVED TENANT ID:", data.data.id);

        console.log(
          t("success") || "Success",
          t("registration_success") || "Registration Successful!"
        );

        if (global.triggerMaintenanceCheck) {
          global.triggerMaintenanceCheck();
        }
        navigation.reset({
          index: 0,
          routes: [{ name: "TenantNavigation" }],
        });

      } else {

        console.log("Registration Error:", data);
        console.log(
          t("error") || "Error",
          data.errors
            ? JSON.stringify(data.errors)
            : data.message || t("registration_failed") || "Registration failed"
        );

      }

    } catch (error) {

      console.error("Network Error:", error);
      console.log(
        t("error") || "Error",
        t("server_error") || "Server not reachable. Please check your connection."
      );

    } finally {

      setLoadingRegister(false);

    }
  };

  /* ---------------- UI ---------------- */

  const isLoading = loadingOTP || loadingVerify || loadingRegister;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE9FE" translucent={false} />

      <ImageBackground
        source={require("../../../assets/images/starting.png")}
        style={styles.bgImage}
        resizeMode="cover"
      >
        {/* Light lavender overlay */}
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.innerContainer}
        >
          {/* ── TOP HEADER ── */}
          <View style={styles.headerContainer}>
            <View style={styles.headerIconCircle}>
              <Image
                source={require("../../../assets/images/rent2.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.headerTitle}>{t("welcome_tenant") || "Welcome Tenant"}</Text>
            <Text style={styles.headerSubtitle}>
              {t("tenant_login_subtitle") || "Let&apos;s get you started with your rental search"}
            </Text>
          </View>

          {/* ── WHITE CARD ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >

            {/* Shield-checkmark icon */}
            <View style={styles.cardIconContainer}>
              <View style={styles.cardIconCircle}>
                <Ionicons name="shield-checkmark" size={32} color={NAVY} />
              </View>
            </View>

            {/* TITLE */}
            <Text style={styles.title}>{t("get_started") || "Get Started"}</Text>
            <Text style={styles.subtitle}>{t("enter_mobile_number_to_continue") || "Enter your mobile number to continue"}</Text>

            {/* PHONE INPUT */}
            <View style={[
              styles.inputContainer,
              isPhoneVerified && styles.inputDisabled,
            ]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={isPhoneVerified ? COLORS.TEXT_SECONDARY : LIGHT_PURPLE}
              />
              <TextInput
                placeholder={t("enter_mobile_number") || "Enter Mobile Number"}
                placeholderTextColor="#8A8F98"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={10}
                editable={!isPhoneVerified}
                value={phone}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9]/g, "");
                  setPhone(clean);
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }}
              />
              {/* VERIFIED BADGE */}
              {isPhoneVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="green" />
                  <Text style={styles.verifiedText}>{t("verified") || "Verified"}</Text>
                </View>
              )}
            </View>

            {errors.phone ? (
              <Text style={styles.error}>{errors.phone}</Text>
            ) : null}

            {/* OTP INPUT */}
            {showOTPField && !isPhoneVerified && (
              <View>
                <View style={styles.otpWrapper}>
                  {[0, 1, 2, 3].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpInputs.current[index] = ref)}
                      style={styles.otpBox}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? 4 : 1}
                      value={otp[index]}
                      autoFocus={index === 0}
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      onChangeText={(value) => {
                        console.log(`[OTP DEBUG] TenantRegister index: ${index}, value: "${value}"`);
                        if (value.length > 1) {
                          const pasted = value.slice(0, 4).replace(/[^0-9]/g, "").split("");
                          while (pasted.length < 4) pasted.push("");
                          setOtp(pasted);
                          setErrors((prev) => ({ ...prev, otp: "" }));
                          if (pasted.join("").length === 4) {
                            otpInputs.current[3]?.focus();
                          }
                          return;
                        }
                        setOtp((prevOtp) => {
                          const newOtp = [...prevOtp];
                          newOtp[index] = value;
                          return newOtp;
                        });
                        setErrors((prev) => ({ ...prev, otp: "" }));
                        if (value && index < 3) {
                          otpInputs.current[index + 1]?.focus();
                        }
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
                          otpInputs.current[index - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </View>

                {errors.otp ? (
                  <Text style={styles.error}>{errors.otp}</Text>
                ) : null}

                {/* RESEND BUTTON */}
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={loadingVerify}
                  style={styles.resendBtn}
                >
                  <Text style={styles.resendText}>
                    {"Wrong number or didn't receive OTP? "}
                    <Text style={styles.resendLink}>Resend</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* NAME INPUT — appears after OTP verified */}
            {showNameField && (
              <View>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={LIGHT_PURPLE} />
                  <TextInput
                    placeholder="Enter Full Name"
                    placeholderTextColor="#8A8F98"
                    style={styles.input}
                    maxLength={30}
                    autoFocus
                    value={name}
                    onChangeText={(text) => {
                      const clean = removeEmojis(text).replace(/[^A-Za-z ]/g, "");
                      setName(clean);
                      setErrors((prev) => ({
                        ...prev,
                        name: validateName(clean) ? "" : "Name must be 3+ letters",
                      }));
                    }}
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.error}>{errors.name}</Text>
                ) : null}
              </View>
            )}

            {/* MAIN BUTTON — deep purple gradient matching RoleSection */}
            {!isPhoneVerified ? (
              <TouchableOpacity
                style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
                onPress={showOTPField ? handleVerifyOTP : handleGetOTP}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#4A00E0", "#6A1FD8", "#8E2DE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {isLoading ? (
                    <ActivityIndicator color={WHITE} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {showOTPField ? (t("verify_otp") || "Verify OTP") : (t("get_otp") || "Get OTP")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : showNameField ? (
              <TouchableOpacity
                style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#4A00E0", "#6A1FD8", "#8E2DE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {isLoading ? (
                    <ActivityIndicator color={WHITE} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

          </Animated.View>

          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#6B7280" />
            <Text style={styles.footerText}>  {t("secure_fast_trusted") || "Secure • Fast • Trusted Platform"}</Text>
          </View>

        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({

  bgImage: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(237, 230, 255, 0.72)",
  },

  innerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  // ── HEADER ──
  headerContainer: {
    alignItems: "center",
    marginBottom: 28,
  },

  headerIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  logoImage: {
    width: 64,
    height: 64,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3B0764",
    textAlign: "center",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 19,
  },

  // ── CARD ──
  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 30,
    elevation: 12,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    width: "88%",
    alignSelf: "center",
  },

  // ── SHIELD ICON inside card ──
  cardIconContainer: {
    alignItems: "center",
    marginBottom: 14,
    position: "relative",
  },

  cardIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },

  sparkle: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    opacity: 0.6,
  },
  sparkleTopLeft: { top: 2, left: "28%" },
  sparkleTopRight: { top: 0, right: "28%" },
  sparkleBottomLeft: { bottom: 2, left: "22%" },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0B1F3A",
    marginBottom: 4,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 22,
    color: "#6B7280",
    fontSize: 13,
  },

  // ── INPUT ──
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0D7FF",
  },

  inputDisabled: {
    backgroundColor: "#F0F0F0",
    borderColor: "#DDDDDD",
    opacity: 0.7,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: "#1F2937",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  verifiedText: {
    color: "green",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── OTP ──
  otpWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 15,
    marginTop: 10,
  },

  otpBox: {
    width: 50,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D8D8E0",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "500",
    color: "#1F2937",
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  // ── BUTTON ──
  buttonWrapper: {
    borderRadius: 14,
    marginTop: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#4A00E0",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  button: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  error: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 8,
  },

  resendBtn: {
    alignItems: "center",
    marginBottom: 5,
    marginTop: 2,
  },

  resendText: {
    color: "#6B7280",
    fontSize: 13,
  },

  resendLink: {
    color: LIGHT_PURPLE,
    fontWeight: "bold",
  },

  // ── FOOTER ──
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 16,
  },

  footerText: {
    color: "#6B7280",
    fontSize: 12,
  },

});