import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";

const LOGO_SOURCE = require("../../../assets/images/EnhancedImage1.png");

const LOGO_SIZE = 160;
const MIN_DISPLAY_MS = 1500;
const DOT_SIZE = 10;

/**
 * RenntoLoadingScreen
 *
 * Professional branded loading screen displayed during existing user login.
 * Clean white background with centered logo, animated dots, and loading text.
 *
 * Route params:
 *   - destination: string ("OwnerNavigation" | "TenantNavigation")
 *   - destinationParams: object (optional params forwarded to the destination)
 */
export default function RenntoLoadingScreen({ navigation, route }) {
  const { destination, destinationParams = {} } = route.params || {};
  const hasNavigated = useRef(false);

  // --- Animation shared values ---
  const screenOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);

  // Dot animation values
  const dot1Scale = useSharedValue(0.6);
  const dot2Scale = useSharedValue(0.6);
  const dot3Scale = useSharedValue(0.6);
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  // Fade-out
  const exitOpacity = useSharedValue(1);

  useEffect(() => {
    // Trigger system maintenance mode check immediately after login/refresh
    if (global.triggerMaintenanceCheck) {
      global.triggerMaintenanceCheck();
    }

    // 1. Screen fade-in
    screenOpacity.value = withTiming(1, { duration: 400 });

    // 2. Logo fade-in + scale
    logoOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );
    logoScale.value = withDelay(
      150,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // 3. Loading text fade-in
    textOpacity.value = withDelay(
      450,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    textTranslateY.value = withDelay(
      450,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // 4. Dot animations — staggered pulse loop
    const dotPulse = (dotScale, dotOpacity, delay) => {
      dotScale.value = withDelay(
        500 + delay,
        withRepeat(
          withSequence(
            withTiming(1.0, { duration: 350, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.6, { duration: 350, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          false
        )
      );
      dotOpacity.value = withDelay(
        500 + delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 350, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          false
        )
      );
    };

    dotPulse(dot1Scale, dot1Opacity, 0);
    dotPulse(dot2Scale, dot2Opacity, 150);
    dotPulse(dot3Scale, dot3Opacity, 300);

    // 5. Navigate after minimum display time
    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      // Fade out before navigating
      exitOpacity.value = withTiming(0, { duration: 300 });

      // Navigate after fade-out completes
      setTimeout(() => {
        if (!destination) return;
        navigation.reset({
          index: 0,
          routes: [
            {
              name: destination,
              params: destinationParams,
            },
          ],
        });
      }, 320);
    }, MIN_DISPLAY_MS);

    return () => clearTimeout(timer);
  }, []);

  // --- Animated styles ---
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value * exitOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
    transform: [{ scale: dot1Scale.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
    transform: [{ scale: dot2Scale.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
    transform: [{ scale: dot3Scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Logo */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={LOGO_SOURCE}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>

      {/* Loading text */}
      <Animated.Text style={[styles.loadingText, textStyle]}>
        Loading your dashboard...
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    gap: 12,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#8B5CF6",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 0.3,
  },
});
