import BASE_URL, { fetchWithAuth } from "@/src/config/Api";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OwnerAccountContext } from "../../context/OwnerAccountContext";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../utils/LanguageContext";

import {
  ActivityIndicator,
  Alert,
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

import COLORS from "../../theme/colors";

const WHITE = COLORS.WHITE;
const NAVY = COLORS.PRIMARY;
const LIGHT_PURPLE = COLORS.PRIMARY_LIGHT;



export default function OwnerLoginScreen({ navigation, route }) {
  const { refreshAccounts } = useContext(OwnerAccountContext);
  const { t } = useLanguage();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpInputs = useRef([]);

  const [showOTPField, setShowOTPField] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const PRIMARY = LIGHT_PURPLE;

  // VALIDATE PHONE
  const validatePhone = (phone) => {
    return /^[6-9][0-9]{9}$/.test(phone);
  };

  // SEND OTP
const handleSendOTP = async () => {

  if (!validatePhone(phone)) {
    setErrors({ phone: t("enter_valid_mobile_err") || "Enter valid mobile number" });
    return;
  }

  try {
    setLoading(true);

    const response = await fetchWithAuth(
      `${BASE_URL}/api/send-otp/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phone,
          role: "owner",  
        }),
      }
    );

    const data = await response.json();

    console.log("SEND OTP RESPONSE:", data);

    if (response.ok) {
      setShowOTPField(true);
      setOtp(["", "", "", ""]);
      setErrors({});
      console.log(t("success") || "Success", t("otp_sent_success") || "OTP Sent Successfully");
    } else {
      console.log(t("error") || "Error", data.error || t("failed_to_send_otp") || "Failed To Send OTP");
    }

  } catch (error) {
    console.log("SEND OTP ERROR:", error);
    console.log(t("error") || "Error", t("something_went_wrong") || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  // VERIFY OTP
const handleVerifyOTP = async () => {
  const otpString = otp.join("");

  if (otpString.length !== 4) {
    setErrors({ otp: t("enter_valid_otp_err") || "Enter valid 4-digit OTP" });
    return;
  }

  try {
    setLoading(true);

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
          role: "owner",
        }),
      }
    );

    const data = await response.json();

    console.log("VERIFY OTP RESPONSE:", data);

    if (response.ok && data.verified) {

      // EXISTING OWNER
      if (data.exists && data.role === "owner") {

        if (data.token) {
          await AsyncStorage.setItem("userToken", data.token);
        }
await AsyncStorage.setItem("userRole", "owner");
        await AsyncStorage.setItem(
          "ownerPhone",
          String(data.user.phone)
        );
        await AsyncStorage.setItem(
          "selectedAccountId",
          String(data.user.phone)
        );

        if (refreshAccounts) {
          await refreshAccounts();
        }

        // Check if owner has at least one active account — do not block login
        // just because one of their properties is suspended/pending
        const cachedAccountsRaw = await AsyncStorage.getItem("owner_accounts_cache");
        const cachedAccounts = cachedAccountsRaw ? JSON.parse(cachedAccountsRaw) : [];
        const hasActiveAccount = cachedAccounts.some(a => a.status === "active");

        const raw = await AsyncStorage.getItem("loggedInOwnerAccounts");
        let accounts = raw ? JSON.parse(raw) : [];
        if (!accounts.find(a => a.phone === data.user.phone)) {
          accounts.push({
            phone: data.user.phone,
            name: data.user.name,
          });
          await AsyncStorage.setItem("loggedInOwnerAccounts", JSON.stringify(accounts));
        }

        if (hasActiveAccount) {
          // Owner has at least one active property — go to home
          if (global.triggerMaintenanceCheck) {
            global.triggerMaintenanceCheck();
          }
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "RenntoLoadingScreen",
                params: {
                  destination: "OwnerNavigation",
                  destinationParams: { phone: data.user.phone },
                },
              },
            ],
          });
        } else if (data.status === "pending" || data.status === "suspend") {
          // All accounts are pending/suspended
          navigation.replace("WaitingScreen", { phone: data.user.phone });
        } else {
          if (global.triggerMaintenanceCheck) {
            global.triggerMaintenanceCheck();
          }
          navigation.reset({
            index: 0,
            routes: [
              {
                name: "RenntoLoadingScreen",
                params: {
                  destination: "OwnerNavigation",
                  destinationParams: { phone: data.user.phone },
                },
              },
            ],
          });
        }
      }

      // NEW OWNER
      else if (!data.exists) {
  navigation.navigate("OwnerRegistrationScreen", {
    phone: phone,
  });
} else {
  console.log(
    t("access_denied_title") || "Access Denied",
    t("registered_as_tenant_err") || "This mobile number is registered as a tenant."
  );
}

    } else {
      setOtp(["", "", "", ""]);
      otpInputs.current[0]?.focus();
      setErrors({
        otp: data.error || t("invalid_otp_err") || "Invalid OTP",
      });
    }

  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);
    console.log(
      t("error") || "Error",
      t("otp_verification_failed_err") || "OTP Verification Failed"
    );
  } finally {
    setLoading(false);
  }
};

  // RESEND OTP HANDLER
const handleResendOTP = () => {
  setOtp(["", "", "", ""]);
  setErrors({});
  setShowOTPField(false);
};

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
            <Text style={styles.headerTitle}>{t("welcome_owner") || "Welcome Owner"}</Text>
            <Text style={styles.headerSubtitle}>
              {t("owner_intro_subtitle") || "Let's get you started with your property management"}
            </Text>
          </View>

          {/* ── WHITE CARD ── */}
          <View style={styles.card}>

            {/* Shield-checkmark icon */}
            <View style={styles.cardIconContainer}>
              <View style={styles.cardIconCircle}>
                <Ionicons name="shield-checkmark" size={32} color={NAVY} />
              </View>
            </View>

            {/* TITLE */}
            <Text style={styles.title}>{t("get_started") || "Get Started"}</Text>
            <Text style={styles.subtitle}>{t("enter_mobile_continue") || "Enter your mobile number to continue"}</Text>

            {/* PHONE INPUT */}
            <View style={[
              styles.inputContainer,
              showOTPField && styles.inputDisabled,
            ]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={showOTPField ? COLORS.TEXT_SECONDARY : PRIMARY}
              />
              <TextInput
                placeholder={t("enter_mobile_placeholder") || "Enter Mobile Number"}
                placeholderTextColor="#8A8F98"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={10}
                editable={!showOTPField}
                value={phone}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9]/g, "");
                  setPhone(clean);
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }}
              />
            </View>

            {errors.phone ? (
              <Text style={styles.error}>{errors.phone}</Text>
            ) : null}

            {/* OTP INPUT */}
            {showOTPField && (
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
                        console.log(`[OTP DEBUG] index: ${index}, value received: "${value}"`);
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

                {/* RESEND OTP BUTTON */}
                <TouchableOpacity
                  onPress={handleResendOTP}
                  style={styles.resendBtn}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>
                    {t("otp_wrong_resend") || "Wrong number or didn't receive OTP? "}
                    <Text style={styles.resendLink}>{t("resend") || "Resend"}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MAIN BUTTON — deep purple gradient matching RoleSection */}
            <TouchableOpacity
              style={[styles.buttonWrapper, loading && styles.buttonDisabled]}
              onPress={showOTPField ? handleVerifyOTP : handleSendOTP}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#4A00E0", "#6A1FD8", "#8E2DE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color={WHITE} size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {showOTPField ? (t("verify_otp_btn") || "Verify OTP") : (t("get_otp") || "Get OTP")}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>

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
