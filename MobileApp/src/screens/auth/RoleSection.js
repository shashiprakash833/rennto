// import React, { useEffect } from "react";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { LinearGradient } from "expo-linear-gradient";
// import {
//   Dimensions,
//   Pressable,
//   StatusBar,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// import AnimatedRN, {
//   Easing,
//   useAnimatedStyle,
//   useSharedValue,
//   withDelay,
//   withRepeat,
//   withSpring,
//   withTiming,
// } from "react-native-reanimated";

// import THEME from "../../theme/colors";
// import { useLanguage } from "../../utils/LanguageContext";

// const { height } = Dimensions.get("window");

// export default function RoleSection() {
//   const navigation = useNavigation();
//   const { t } = useLanguage();
//   const line1Opacity = useSharedValue(0);
//   const line2Opacity = useSharedValue(0);
//   const line1Translate = useSharedValue(30);
//   const line2Translate = useSharedValue(30);
//   const accentHeight = useSharedValue(0);
//   const heroFloat = useSharedValue(0);
//   const cardOpacity = useSharedValue(0);
//   const cardTranslate = useSharedValue(80);
//   const bubbleLeftY = useSharedValue(height);
//   const bubbleRightY = useSharedValue(height);

//   useEffect(() => {
//     line1Opacity.value = withTiming(1, { duration: 600 });
//     line1Translate.value = withTiming(0, { duration: 700 });
//     line2Opacity.value = withDelay(300, withTiming(1, { duration: 600 }));
//     line2Translate.value = withDelay(300, withTiming(0, { duration: 700 }));
//     accentHeight.value = withDelay(200, withTiming(70, { duration: 800 }));
//     heroFloat.value = withRepeat(
//       withTiming(-6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
//       -1,
//       true,
//     );
//     cardOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
//     cardTranslate.value = withDelay(800, withSpring(0));
//     // Bubble animation
//     bubbleLeftY.value = withDelay(
//       300,
//       withTiming(-80, { duration: 6000, easing: Easing.out(Easing.exp) }),
//     );

//     bubbleRightY.value = withDelay(
//       500,
//       withTiming(60, { duration: 6500, easing: Easing.out(Easing.exp) }),
//     );
//   }, []);

//   const line1Style = useAnimatedStyle(() => ({
//     opacity: line1Opacity.value,
//     transform: [{ translateX: line1Translate.value }],
//   }));
//   const line2Style = useAnimatedStyle(() => ({
//     opacity: line2Opacity.value,
//     transform: [{ translateX: line2Translate.value }],
//   }));
//   const accentStyle = useAnimatedStyle(() => ({ height: accentHeight.value }));
//   const heroFloatStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: heroFloat.value }],
//   }));
//   const cardStyle = useAnimatedStyle(() => ({
//     opacity: cardOpacity.value,
//     transform: [{ translateY: cardTranslate.value }],
//   }));
//   const bubbleLeftStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: bubbleLeftY.value }],
//   }));

//   const bubbleRightStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: bubbleRightY.value }],
//   }));

//  const SelectCard = ({ title, onPress, colors, icon }) => {
//     const scale = useSharedValue(1);

//     const animatedStyle = useAnimatedStyle(() => ({
//       transform: [{ scale: scale.value }],
//     }));

//     return (
//       <Pressable
//         onPressIn={() => {
//           scale.value = withTiming(0.96, { duration: 100 });
//         }}
//         onPressOut={() => {
//           scale.value = withSpring(1);
//           onPress();
//         }}
//         style={{ width: "100%" }}
//       >
//         <AnimatedRN.View style={animatedStyle}>
//           <LinearGradient
//             colors={colors}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={styles.gradientButton}
//           >
//             <View style={styles.buttonContent}>
//   <MaterialCommunityIcons
//     name={icon}
//     size={24}
//     color="#FFFFFF"
//     style={{ marginRight: 12 }}
//   />

//   <Text style={styles.selectCardTitle}>{title}</Text>
// </View>
//           </LinearGradient>
//         </AnimatedRN.View>
//       </Pressable>
//     );
//   };

//   return (
//     <LinearGradient
//       colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={{ flex: 1 }}
//     >
//       <StatusBar barStyle="light-content" backgroundColor={THEME.PRIMARY} />
//       <AnimatedRN.View style={[styles.bubbleLeft, bubbleLeftStyle]} />
//       <AnimatedRN.View style={[styles.bubbleRight, bubbleRightStyle]} />
//       <AnimatedRN.View
//         style={[
//           { flex: 1.2, justifyContent: "center", paddingHorizontal: 32 },
//           heroFloatStyle,
//         ]}
//       >
//         <View style={{ flexDirection: "row", alignItems: "center" }}>
//           <AnimatedRN.View
//             style={[
//               {
//                 width: 5,
//                 backgroundColor: "#FFFFFF",
//                 marginRight: 20,
//                 borderRadius: 6,
//               },
//               accentStyle,
//             ]}
//           />
//           <View>
//             <AnimatedRN.Text
//               style={[
//                 {
//                   fontSize: 34,
//                   fontWeight: "600",
//                   color: "#F8F9FA",
//                   letterSpacing: 1.5,
//                 },
//                 line1Style,
//               ]}
//             >
//               {t("find_your")}
//             </AnimatedRN.Text>
//             <AnimatedRN.Text
//               style={[
//                 {
//                   fontSize: 44,
//                   fontWeight: "800",
//                   color: "#FFFFFF",
//                   marginTop: 6,
//                   letterSpacing: 2,
//                 },
//                 line2Style,
//               ]}
//             >
//               {t("perfect_stay")}
//             </AnimatedRN.Text>
//           </View>
//         </View>
//         <Text
//           style={{
//             marginTop: 24,
//             fontSize: 15,
//             color: "#F3E8FF",
//             lineHeight: 24,
//             maxWidth: "85%",
//           }}
//         >
//           {t("hero_desc")}
//         </Text>
//       </AnimatedRN.View>

//       <AnimatedRN.View
//         style={[
//           {
//             flex: 1,
//             backgroundColor: "#FFFFFF", // Made this pure white too for consistency
//             paddingHorizontal: 30,
//             paddingTop: 60,
//             borderTopLeftRadius: 50,
//             borderTopRightRadius: 50,
//           },
//           cardStyle,
//         ]}
//       >
//         <Text
//           style={{
//             fontSize: 18,
//             fontWeight: "700",
//             textAlign: "center",
//             color: THEME.PRIMARY,
//             marginBottom: 12,
//           }}
//         >
//           {t("get_started_caps")}
//         </Text>
//         <Text
//           style={{
//             textAlign: "center",
//             color: THEME.TEXT_SECONDARY,
//             marginBottom: 35,
//             fontSize: 14,
//             lineHeight: 22,
//           }}
//         >
//           {t("role_desc")}
//         </Text>

//         <SelectCard
//   title={t("continue_owner")}
//   icon="shield-home"
//   colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
//   onPress={() => navigation.navigate("OwnerLoginScreen")}
// />

//         <SelectCard
//   title={t("continue_tenant")}
//   icon="account"
//   colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
//   onPress={() => navigation.navigate("TenantRegisterScreen")}
// />

//         <Text
//           style={{
//             marginTop: 20,
//             textAlign: "center",
//             fontSize: 12,
//             color: THEME.TEXT_SECONDARY,
//           }}
//         >
//           {t("trust_footer")}
//         </Text>
//       </AnimatedRN.View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   selectCard: {
//     paddingVertical: 20,
//     paddingHorizontal: 24,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 18,
//   },
  
//   primaryCard: { backgroundColor: THEME.PRIMARY, elevation: 8 },
//   secondaryCard: {
//     borderWidth: 2,
//     borderColor: THEME.PRIMARY,
//     backgroundColor: "#FFFFFF",
//   },
// //   selectCardTitle: { fontSize: 16, fontWeight: "600" },
//   gradientButton: {
//     paddingVertical: 20,
//     paddingHorizontal: 24,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 18,
//     elevation: 8,
//   },
//   buttonContent: {
//   flexDirection: "row",
//   alignItems: "center",
//   justifyContent: "center",
// },

//   selectCardTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#FFFFFF",
//   },
//   bubbleLeft: {
//     position: "absolute",
//     width: 260,
//     height: 260,
//     borderRadius: 130,
//     backgroundColor: "rgba(255,255,255,0.18)",
//     left: -100,
//     top: -80,
//   },
//   bubbleRight: {
//     position: "absolute",
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     backgroundColor: "rgba(255,255,255,0.15)",
//     right: -100,
//     top: 150, // slightly downward
//   },
// });






























































































import React, { useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AnimatedRN, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import THEME from "../../theme/colors";
import { useLanguage } from "../../utils/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height } = Dimensions.get("window");

export default function RoleSection() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const line1Opacity = useSharedValue(0);
  const line2Opacity = useSharedValue(0);
  const line1Translate = useSharedValue(30);
  const line2Translate = useSharedValue(30);
  const accentHeight = useSharedValue(0);
  const heroFloat = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(80);
  const bubbleLeftY = useSharedValue(height);
  const bubbleRightY = useSharedValue(height);

  useEffect(() => {
    line1Opacity.value = withTiming(1, { duration: 600 });
    line1Translate.value = withTiming(0, { duration: 700 });
    line2Opacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    line2Translate.value = withDelay(300, withTiming(0, { duration: 700 }));
    accentHeight.value = withDelay(200, withTiming(70, { duration: 800 }));
    heroFloat.value = withRepeat(
      withTiming(-6, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    cardOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    cardTranslate.value = withDelay(800, withSpring(0));
    // Bubble animation
    bubbleLeftY.value = withDelay(
      300,
      withTiming(-80, { duration: 6000, easing: Easing.out(Easing.exp) }),
    );

    bubbleRightY.value = withDelay(
      500,
      withTiming(60, { duration: 6500, easing: Easing.out(Easing.exp) }),
    );
  }, []);

  const line1Style = useAnimatedStyle(() => ({
    opacity: line1Opacity.value,
    transform: [{ translateX: line1Translate.value }],
  }));
  const line2Style = useAnimatedStyle(() => ({
    opacity: line2Opacity.value,
    transform: [{ translateX: line2Translate.value }],
  }));
  const accentStyle = useAnimatedStyle(() => ({ height: accentHeight.value }));
  const heroFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: heroFloat.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));
  const bubbleLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bubbleLeftY.value }],
  }));

  const bubbleRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bubbleRightY.value }],
  }));

 const SelectCard = ({ title, onPress, colors, icon }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
          onPress();
        }}
        style={{ width: "100%" }}
      >
        <AnimatedRN.View style={animatedStyle}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <View style={styles.buttonContent}>
  <MaterialCommunityIcons
    name={icon}
    size={24}
    color="#FFFFFF"
    style={{ marginRight: 12 }}
  />

  <Text style={styles.selectCardTitle}>{title}</Text>
</View>
          </LinearGradient>
        </AnimatedRN.View>
      </Pressable>
    );
  };

  return (
    <LinearGradient
      colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor={THEME.PRIMARY} />
      <AnimatedRN.View style={[styles.bubbleLeft, bubbleLeftStyle]} />
      <AnimatedRN.View style={[styles.bubbleRight, bubbleRightStyle]} />
      <AnimatedRN.View
        style={[
          { flex: 1.2, justifyContent: "center", paddingHorizontal: 32 },
          heroFloatStyle,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <AnimatedRN.View
            style={[
              {
                width: 5,
                backgroundColor: "#FFFFFF",
                marginRight: 20,
                borderRadius: 6,
              },
              accentStyle,
            ]}
          />
          <View>
            <AnimatedRN.Text
              style={[
                {
                  fontSize: 34,
                  fontWeight: "600",
                  color: "#F8F9FA",
                  letterSpacing: 1.5,
                },
                line1Style,
              ]}
            >
              {t("find_your")}
            </AnimatedRN.Text>
            <AnimatedRN.Text
              style={[
                {
                  fontSize: 44,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  marginTop: 6,
                  letterSpacing: 2,
                },
                line2Style,
              ]}
            >
              {t("perfect_stay")}
            </AnimatedRN.Text>
          </View>
        </View>
        <Text
          style={{
            marginTop: 24,
            fontSize: 15,
            color: "#F3E8FF",
            lineHeight: 24,
            maxWidth: "85%",
          }}
        >
          {t("hero_desc")}
        </Text>
      </AnimatedRN.View>

      <AnimatedRN.View
        style={[
          {
            flex: 1,
            backgroundColor: "#FFFFFF", // Made this pure white too for consistency
            paddingHorizontal: 30,
            paddingTop: 60,
            borderTopLeftRadius: 50,
            borderTopRightRadius: 50,
          },
          cardStyle,
        ]}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
            color: THEME.PRIMARY,
            marginBottom: 12,
          }}
        >
          {t("get_started_caps")}
        </Text>
        <Text
          style={{
            textAlign: "center",
            color: THEME.TEXT_SECONDARY,
            marginBottom: 35,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          {t("role_desc")}
        </Text>

        <SelectCard
  title={t("continue_owner")}
  icon="shield-home"
  colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
  onPress={() => navigation.navigate("OwnerLoginScreen")}
/>

        <SelectCard
  title={t("continue_tenant")}
  icon="account"
  colors={["#4A00E0", "#8E2DE2", "#6A5ACD"]}
  onPress={() => navigation.navigate("TenantRegisterScreen")}
/>

<Text
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 12,
            color: THEME.TEXT_SECONDARY,
          }}
        >
          {t("trust_footer")}
        </Text>

        {__DEV__ && (
          <Pressable
            onPress={async () => {
              await AsyncStorage.clear();
              console.log("Storage cleared! Reload the app now.");
            }}
            style={{ marginTop: 20, alignItems: "center" }}
          >
            <Text style={{ color: "red", fontWeight: "700" }}>
              [DEV] Clear Storage (Simulate Uninstall)
            </Text>
          </Pressable>
        )}
      </AnimatedRN.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  selectCard: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  
  primaryCard: { backgroundColor: THEME.PRIMARY, elevation: 8 },
  secondaryCard: {
    borderWidth: 2,
    borderColor: THEME.PRIMARY,
    backgroundColor: "#FFFFFF",
  },
//   selectCardTitle: { fontSize: 16, fontWeight: "600" },
  gradientButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    elevation: 8,
  },
  buttonContent: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

  selectCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bubbleLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.18)",
    left: -100,
    top: -80,
  },
  bubbleRight: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.15)",
    right: -100,
    top: 150, // slightly downward
  },
});
