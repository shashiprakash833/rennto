import React, { useEffect } from "react";
import { StyleSheet, Dimensions, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Mask, Image as SvgImage, Rect, G } from "react-native-svg";

const LOGO_SOURCE = require("../../assets/images/EnhancedImage1.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Sizing and Proportions ---
const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.65, 260);
const SCALE_FACTOR = LOGO_SIZE / 3000;

const ROOF_TOP = 478 * SCALE_FACTOR;
const ROOF_HEIGHT = (1192 - 478) * SCALE_FACTOR;

const HOUSE_TOP = 1192 * SCALE_FACTOR;
const HOUSE_HEIGHT = (1787 - 1192) * SCALE_FACTOR;

const TEXT_TOP = 1865 * SCALE_FACTOR;
const TEXT_HEIGHT = (2126 - 1865) * SCALE_FACTOR;

const LOGO_CONTENT_HEIGHT = (2126 - 478) * SCALE_FACTOR;
const GLOW_SIZE = SCREEN_WIDTH * 1.3;

const AnimatedG = Animated.createAnimatedComponent(G);

// --- Sub-component: Radial Glow Background ---
function GlowEffect({ opacity, scale }) {
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.glowContainer, glowStyle]} pointerEvents="none">
      <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
        <Defs>
          <RadialGradient
            id="purple-glow"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.85" />
            <Stop offset="35%" stopColor="#A855F7" stopOpacity="0.4" />
            <Stop offset="70%" stopColor="#A855F7" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={GLOW_SIZE / 2}
          cy={GLOW_SIZE / 2}
          r={GLOW_SIZE / 2}
          fill="url(#purple-glow)"
        />
      </Svg>
    </Animated.View>
  );
}

// --- Sub-component: Cropped Logo Segment Layers ---
function LogoLayers({ roofStyle, houseStyle, textStyle }) {
  return (
    <>
      {/* 1. ROOF LAYER */}
      <Animated.View
        style={[
          styles.layerWrapper,
          {
            top: 0,
            height: ROOF_HEIGHT,
          },
          roofStyle,
        ]}
      >
        <Image
          source={LOGO_SOURCE}
          style={[styles.imageStyle, { top: -ROOF_TOP }]}
        />
      </Animated.View>

      {/* 2. HOUSE BODY LAYER */}
      <Animated.View
        style={[
          styles.layerWrapper,
          {
            top: HOUSE_TOP - ROOF_TOP,
            height: HOUSE_HEIGHT,
          },
          houseStyle,
        ]}
      >
        <Image
          source={LOGO_SOURCE}
          style={[styles.imageStyle, { top: -HOUSE_TOP }]}
        />
      </Animated.View>

      {/* 3. TEXT LAYER */}
      <Animated.View
        style={[
          styles.layerWrapper,
          {
            top: TEXT_TOP - ROOF_TOP,
            height: TEXT_HEIGHT,
          },
          textStyle,
        ]}
      >
        <Image
          source={LOGO_SOURCE}
          style={[styles.imageStyle, { top: -TEXT_TOP }]}
        />
      </Animated.View>
    </>
  );
}

// --- Sub-component: Diagonal Glass Sweep ---
function LightSweep({ sweepX, opacity }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: sweepX.value },
        { rotate: "-25deg" },
      ],
    };
  });

  return (
    <Svg
      width={LOGO_SIZE}
      height={LOGO_CONTENT_HEIGHT}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>

        <Mask id="logo-mask">
          <SvgImage
            href={LOGO_SOURCE}
            x="0"
            y={-ROOF_TOP}
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            preserveAspectRatio="xMidYMid meet"
          />
        </Mask>
      </Defs>

      <AnimatedG mask="url(#logo-mask)" style={animatedStyle}>
        <Rect
          x={-60}
          y={-100}
          width={120}
          height={LOGO_CONTENT_HEIGHT + 200}
          fill="url(#sweep-grad)"
        />
      </AnimatedG>
    </Svg>
  );
}

// --- Master SplashScreen Component ---
export default function SplashScreen({ onFinish }) {
  // Screen/Background Fade
  const screenOpacity = useSharedValue(0);

  // Glow shared values
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1.0);

  // Layer shared values
  const roofTranslateY = useSharedValue(-60);
  const roofOpacity = useSharedValue(0);

  const houseScale = useSharedValue(0.82);
  const houseOpacity = useSharedValue(0);

  const textScale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);

  // Sweep shared values
  const sweepX = useSharedValue(-LOGO_SIZE - 60);
  const sweepOpacity = useSharedValue(0);

  // Floating shared values (Scene 5)
  const floatY = useSharedValue(0);
  const floatScale = useSharedValue(1);

  useEffect(() => {
    // 1. SCREEN FADE IN (Scene 1)
    screenOpacity.value = withTiming(1, { duration: 500 });

    // 2. GLOW TIMELINE (Scene 1, 4, 6)
    glowOpacity.value = withSequence(
      // Scene 1: Fade to 0.18
      withTiming(0.18, { duration: 500 }),
      // Hold through Scene 2 & 3
      withDelay(
        1700,
        withSequence(
          // Scene 4: Breathing Glow (2 cycles of 500ms total)
          // Cycle 1
          withTiming(0.5, { duration: 250, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 250, easing: Easing.inOut(Easing.quad) }),
          // Cycle 2
          withTiming(0.5, { duration: 250, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 250, easing: Easing.inOut(Easing.quad) })
        )
      ),
      // Hold during Scene 5, then Fade to 0% (Scene 6)
      withDelay(
        400,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
      )
    );

    // Glow Scale Pulse (Scene 4)
    glowScale.value = withDelay(
      2200,
      withSequence(
        // Cycle 1
        withTiming(1.3, { duration: 250, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 250, easing: Easing.inOut(Easing.quad) }),
        // Cycle 2
        withTiming(1.3, { duration: 250, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 250, easing: Easing.inOut(Easing.quad) })
      )
    );

    // 3. ROOF SLIDE (Scene 2)
    roofTranslateY.value = withDelay(
      500,
      withTiming(0, {
        duration: 650,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      })
    );
    roofOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));

    // 4. HOUSE SPRING SCALE (Scene 2)
    houseScale.value = withDelay(
      500,
      withSpring(1.0, {
        damping: 14,
        stiffness: 160,
      })
    );
    houseOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));

    // 5. TEXT FADE/SCALE (Scene 2, 150ms delay)
    textOpacity.value = withDelay(650, withTiming(1, { duration: 450 }));
    textScale.value = withDelay(
      650,
      withTiming(1.0, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      })
    );

    // 6. GLASS LIGHT SWEEP (Scene 3, starts at 1.4s)
    sweepOpacity.value = withDelay(
      1400,
      withSequence(
        withTiming(1, { duration: 50 }),
        withDelay(600, withTiming(0, { duration: 50 }))
      )
    );
    sweepX.value = withDelay(
      1400,
      withTiming(LOGO_SIZE + 60, {
        duration: 700,
        easing: Easing.linear,
      })
    );

    // 7. FLOATING ANIMATION (Scene 5, 3.1s to 3.7s)
    floatY.value = withDelay(
      3100,
      withSequence(
        withTiming(-8, { duration: 300, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.quad) })
      )
    );
    floatScale.value = withDelay(
      3100,
      withSequence(
        withTiming(1.02, { duration: 300, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.quad) })
      )
    );

    // 8. NAVIGATION TRIGGER (Exactly 4 seconds)
    const timer = setTimeout(() => {
      if (onFinish) {
        runOnJS(onFinish)();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles for Logo Segment Layers
  const roofStyle = useAnimatedStyle(() => {
    return {
      opacity: roofOpacity.value,
      transform: [{ translateY: roofTranslateY.value }],
    };
  });

  const houseStyle = useAnimatedStyle(() => {
    return {
      opacity: houseOpacity.value,
      transform: [{ scale: houseScale.value }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ scale: textScale.value }],
    };
  });

  // Animated style for Logo Container (Float & Scale in Scene 5)
  const containerFloatStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatY.value },
        { scale: floatScale.value },
      ],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: screenOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />

      {/* 1. Behind Logo Radial Glow */}
      <GlowEffect opacity={glowOpacity} scale={glowScale} />

      {/* 2. Interactive Logo Container */}
      <Animated.View style={[styles.logoContainer, containerFloatStyle]}>
        {/* Logo segmented parts */}
        <LogoLayers
          roofStyle={roofStyle}
          houseStyle={houseStyle}
          textStyle={textStyle}
        />

        {/* Masked Glass Reflection Light Sweep */}
        <LightSweep sweepX={sweepX} opacity={sweepOpacity} />
      </Animated.View>
    </Animated.View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Cream White Background
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_CONTENT_HEIGHT,
    position: "relative",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  layerWrapper: {
    position: "absolute",
    width: LOGO_SIZE,
    overflow: "hidden",
  },
  imageStyle: {
    position: "absolute",
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    contentFit: "contain",
  },
  glowContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
  },
});
