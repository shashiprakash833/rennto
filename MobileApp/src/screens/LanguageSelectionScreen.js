import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/LanguageContext';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────
//  Floating particle (same as SplashScreen)
// ─────────────────────────────────────────────
function Particle({ delay, startX, duration, size, opacity }) {
  const translateY = useSharedValue(0);
  const fadeVal = useSharedValue(0);

  useEffect(() => {
    fadeVal.value = withDelay(
      delay,
      withSequence(
        withTiming(opacity, { duration: 600 }),
        withDelay(duration - 1200, withTiming(0, { duration: 600 }))
      )
    );
    translateY.value = withDelay(
      delay,
      withTiming(-height * 0.55, { duration, easing: Easing.linear })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: fadeVal.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        particleStyle,
        {
          left: startX,
          bottom: height * 0.08,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────
//  Glow ring (same as SplashScreen)
// ─────────────────────────────────────────────
function GlowRing({ delay, ringSize, duration }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.6, { duration, easing: Easing.linear }), -1, false)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration, easing: Easing.linear }), -1, false)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        glowRingStyle,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────
//  Language data
// ─────────────────────────────────────────────
const languages = [
  { id: 'en', name: 'English', subName: 'Default' },
  { id: 'hi', name: 'हिन्दी', subName: 'Hindi' },
  { id: 'te', name: 'తెలుగు', subName: 'Telugu' },
  { id: 'kn', name: 'ಕನ್ನಡ', subName: 'Kannada' },
  { id: 'ta', name: 'தமிழ்', subName: 'Tamil' },
  { id: 'ml', name: 'മലയാളം', subName: 'Malayalam' },
  { id: 'mr', name: 'मराठी', subName: 'Marathi' },
  { id: 'bn', name: 'বাংলা', subName: 'Bengali' },
  { id: 'gu', name: 'ગુજરાતી', subName: 'Gujarati' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ', subName: 'Punjabi' },
  { id: 'or', name: 'ଓଡ଼ିଆ', subName: 'Odia' },
];

const PARTICLES = [
  { delay: 800, startX: width * 0.15, duration: 4000, size: 4, opacity: 0.7 },
  { delay: 1200, startX: width * 0.30, duration: 5000, size: 3, opacity: 0.5 },
  { delay: 600, startX: width * 0.50, duration: 3800, size: 5, opacity: 0.6 },
  { delay: 1500, startX: width * 0.65, duration: 4500, size: 3, opacity: 0.4 },
  { delay: 900, startX: width * 0.80, duration: 4200, size: 4, opacity: 0.65 },
  { delay: 300, startX: width * 0.42, duration: 5200, size: 2, opacity: 0.5 },
];

// ─────────────────────────────────────────────
//  Main screen
// ─────────────────────────────────────────────
export default function LanguageSelectionScreen({ onFinish }) {
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState(language);

  // shimmer on the icon circle
  const shimmerX = useSharedValue(-80);
  const headerOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    footerOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));

    shimmerX.value = withDelay(
      600,
      withRepeat(
        withTiming(80, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      )
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const handleContinue = () => {
    changeLanguage(selected);
    if (onFinish) onFinish();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../../assets/images/starting.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark scrim — same value as SplashScreen */}
        <View style={styles.scrim} />

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* ── Header: icon + title ── */}
        <Animated.View style={[styles.header, headerStyle]}>
          {/* Glow rings behind the icon */}
          <View style={styles.ringContainer}>
            <GlowRing delay={800} ringSize={130} duration={2600} />
            <GlowRing delay={1400} ringSize={130} duration={2600} />
          </View>

          {/* Icon circle with shimmer */}
          <View style={styles.iconWrapper}>
            <Ionicons name="globe" size={42} color="#fff" />
            {/* shimmer sweep */}
            <View style={styles.shimmerClip} pointerEvents="none">
              <Animated.View style={[styles.shimmerBar, shimmerStyle]} />
            </View>
          </View>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(700)}
            style={styles.title}
          >
            Choose Your Language
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(500).duration(700)}
            style={styles.subtitle}
          >
            Select your preferred language to continue
          </Animated.Text>
        </Animated.View>

        {/* ── Language cards ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {languages.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(500 + index * 90).duration(550)}
            >
              <TouchableOpacity
                style={[
                  styles.langCard,
                  selected === item.id && styles.selectedCard,
                ]}
                onPress={() => setSelected(item.id)}
                activeOpacity={0.75}
              >
                {/* left: emoji + names */}
                <View style={styles.cardInfo}>
                  <Text style={styles.emojiIcon}>{item.icon}</Text>
                  <View>
                    <Text style={[styles.langName, selected === item.id && styles.selectedText]}>
                      {item.name}
                    </Text>
                    <Text style={styles.langSubName}>{item.subName}</Text>
                  </View>
                </View>

                {/* right: radio */}
                <View style={[styles.radio, selected === item.id && styles.radioSelected]}>
                  {selected === item.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* ── Continue button ── */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <View style={styles.btnInner}>
              <Text style={styles.btnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

// ─────────────────────────────────────────────
//  Inline styles for Particle / GlowRing (must be plain objects)
// ─────────────────────────────────────────────
const particleStyle = { position: 'absolute' };

const glowRingStyle = {
  position: 'absolute',
  borderWidth: 1.5,
  borderColor: 'rgba(180, 140, 255, 0.55)',
  backgroundColor: 'transparent',
};

// ─────────────────────────────────────────────
//  StyleSheet
// ─────────────────────────────────────────────
const ICON_SIZE = 90;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    width,
    height,
  },

  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 6, 30, 0.58)',
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 20,
  },

  ringContainer: {
    position: 'absolute',
    top: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: 'rgba(122, 63, 196, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(180, 140, 255, 0.4)',
  },

  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: ICON_SIZE / 2,
  },

  shimmerBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '20deg' }],
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(140, 100, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  subtitle: {
    fontSize: 14,
    color: 'rgba(210, 190, 255, 0.85)',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // ── Scroll / Cards ──
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 12,
  },

  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  selectedCard: {
    borderColor: 'rgba(180, 140, 255, 0.85)',
    backgroundColor: 'rgba(122, 63, 196, 0.28)',
  },

  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  emojiIcon: {
    fontSize: 26,
  },

  langName: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
  },

  selectedText: {
    color: '#d4b4ff',
  },

  langSubName: {
    fontSize: 12,
    color: 'rgba(210, 190, 255, 0.6)',
    marginTop: 2,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioSelected: {
    borderColor: '#b48cff',
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b48cff',
  },

  // ── Footer / Button ──
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
  },

  button: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#7A3FC4',
    shadowColor: '#7A3FC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(180, 140, 255, 0.45)',
  },

  btnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
