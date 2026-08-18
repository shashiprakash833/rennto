import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import COLORS from "../../theme/colors";
 
const { width, height } = Dimensions.get("window");
 
export default function WelcomeScreen({ route, navigation }) {
  const propertyName = route?.params?.propertyName || "Your Property";
  const requestId = route?.params?.requestId;
 
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const imageFloatAnim = useRef(new Animated.Value(0)).current;
 
  useEffect(() => {
    // Main entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
 
    // Subtle floating animation for the image
    Animated.loop(
      Animated.sequence([
        Animated.timing(imageFloatAnim, {
          toValue: -15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(imageFloatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
 
  const handleGetStarted = async () => {
    try {
      const welcomeKey = requestId ? `welcomeSeen_${requestId}` : "welcomeSeen";
      await AsyncStorage.setItem(welcomeKey, "true");
      navigation.replace("TenantNavigation");
    } catch (error) {
      console.error("Error saving welcome status:", error);
      navigation.replace("TenantNavigation");
    }
  };
 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
 
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        {/* Glassmorphism Card */}
        <View style={styles.glassCard}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={16} color={COLORS.GOLD} />
            <Text style={styles.badgeText}>CONGRATULATIONS</Text>
          </View>
 
          <Text style={styles.title}>
            Welcome to{"\n"}
            <Text style={styles.propertyName}>{propertyName}</Text>
          </Text>
 
          <Text style={styles.subtitle}>
            Your request has been accepted. You're now a verified member of this premium community.
          </Text>
 
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY_LIGHT, COLORS.PRIMARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.WHITE} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
 
        {/* Footer subtle text */}
        <Text style={styles.footerText}>Ready to start your journey?</Text>
      </Animated.View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  glassCard: {
    width: "100%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 32,
    padding: 30,
    borderWidth: 1,
    borderColor: "rgba(95, 37, 159, 0.1)",
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  badgeText: {
    color: COLORS.GOLD,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    textAlign: "center",
    lineHeight: 38,
  },
  propertyName: {
    color: COLORS.GOLD,
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  button: {
    width: "100%",
    marginTop: 40,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerText: {
    color: COLORS.TEXT_LIGHT,
    marginTop: 30,
    fontSize: 14,
    fontWeight: "600",
  },
});
 
 
