import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import THEME from "../../theme/colors";
import { useLanguage } from "../../utils/LanguageContext";






const { width, height } = Dimensions.get("window");

const COLORS = {
  navy: THEME.PRIMARY,
  lightPurple: THEME.PRIMARY_LIGHT,
  bg: "#FFFFFF",
  gray: THEME.TEXT_SECONDARY,
  lightGray: THEME.CARD,
};

const AUTO_SLIDE_INTERVAL = 3000;

export default function OnboardingScreen() {
  const navigation = useNavigation();

  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef(null);
  const intervalRef = useRef(null);


  const { t, loading } = useLanguage();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;



  const DATA = [
    {
      id: "1",
      title: t("stay_smart"),
      subtitle: t("stay_smart_desc"),
      image: require("../../../assets/images/step16.jpg"),
    },
    {
      id: "2",
      title: t("stay_control"),
      subtitle: t("stay_control_desc"),
      image: require("../../../assets/images/step2.jpg"),
    },
    {
      id: "3",
      title: t("stay_connected"),
      subtitle: t("stay_connected_desc"),
      image: require("../../../assets/images/step34.jpg"),
    },
  ];

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPage, fadeAnim, slideAnim]);

  const startAutoSlide = useCallback(() => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      setCurrentPage((prev) => {
        if (prev < DATA.length - 1) {
          const nextPage = prev + 1;
          pagerRef.current?.setPage(nextPage);
          return nextPage;
        } else {
          stopAutoSlide();
          return prev;
        }
      });
    }, AUTO_SLIDE_INTERVAL);
  }, [stopAutoSlide]);

  const stopAutoSlide = useCallback(() => {
    intervalRef.current && clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  const handleNext = () => {
    if (currentPage < DATA.length - 1) {
      const nextPage = currentPage + 1;
      pagerRef.current?.setPage(nextPage);
      setCurrentPage(nextPage);
    }
  };

  const handleSkip = () => {
    const lastPage = DATA.length - 1;
    pagerRef.current?.setPage(lastPage);
    setCurrentPage(lastPage);
  };



const handleGetStarted = async () => {
  await AsyncStorage.setItem("onboardingCompleted", "true");
  navigation.replace("RoleSection");
};

  if (loading) return null;


  return (
    <SafeAreaProvider>
      {/* PERFECT WHITE FIX: Added backgroundColor: "#FFFFFF" everywhere */}
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        
          <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* ===== Onboarding Pager ===== */}
            <PagerView
              style={{ flex: 1, backgroundColor: "#FFFFFF" }}
              initialPage={0}
              ref={pagerRef}
              onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
              onTouchStart={stopAutoSlide}
              onTouchEnd={startAutoSlide}
            >
              {DATA.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <View style={{ width, height: height * 0.65 }}>
                    <Animated.Image
                      source={item.image}
                      style={{
                        width: "100%",
                        height: "100%",
                        opacity: fadeAnim,
                      }}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={["rgba(0,0,0,0.4)", "transparent", "#FFFFFF"]}
                      locations={[0, 0.5, 0.9]}
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                      }}
                    />
                  </View>
                  <Animated.View
                    style={{
                      paddingHorizontal: 40,
                      alignItems: "center",
                      marginTop: -60,
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 36,
                        fontWeight: "900",
                        color: COLORS.navy,
                        textAlign: "center",
                        marginBottom: 12,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        color: COLORS.gray,
                        textAlign: "center",
                        lineHeight: 26,
                      }}
                    >
                      {item.subtitle}
                    </Text>
                  </Animated.View>
                </View>
              ))}
            </PagerView>

            {/* ===== Footer navigation ===== */}
            <View
              style={{
                paddingHorizontal: 25,
                paddingTop: 10,
                paddingBottom: 40,
                backgroundColor: "#FFFFFF",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  marginBottom: 25,
                }}
              >
                {DATA.map((_, i) => {
                  const scale = currentPage === i ? 1.4 : 1;
                  return (
                    <Animated.View
                      key={i}
                      style={{
                        height: 6,
                        width: 6,
                        borderRadius: 3,
                        backgroundColor:
                          currentPage === i ? COLORS.navy : "#E0E0E0",
                        marginHorizontal: 4,
                        transform: [{ scale }],
                      }}
                    />
                  );
                })}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 60,
                }}
              >
                {currentPage === DATA.length - 1 ? (
                  <TouchableOpacity
                    style={{
                      width: "100%",
                      height: 60,
                      borderRadius: 16,
                      overflow: "hidden",
                    }}
                    onPress={handleGetStarted}
                  >
                    <LinearGradient
                      colors={[THEME.PRIMARY, THEME.PRIMARY_LIGHT]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: THEME.WHITE,
                          fontSize: 18,
                          fontWeight: "bold",
                        }}
                      >
                        {t("get_started")}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={handleSkip}>
                      <Text
                        style={{
                          color: THEME.TEXT_SECONDARY,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {t("skip")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            color: THEME.PRIMARY,
                            fontSize: 13,
                            fontWeight: "600",
                            marginRight: 4,
                          }}
                        >
                          {t("next")}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={THEME.PRIMARY}
                        />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        
      </SafeAreaView>
    </SafeAreaProvider>
  );
}