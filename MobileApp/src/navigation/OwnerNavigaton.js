import React, { useContext, useRef, useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OwnerHomeScreen from "../screens/owner/OwnerHomeScreen";
import OwnerIssuesScreen from "../screens/owner/OwnerIssuesScreen";
import OwnerPaymentScreen from "../screens/owner/OwnerPaymentScreen";
import OwnerProfileScreen from "../screens/owner/OwnerProfileScreen";
import AccountSwitcherSheet from "../components/AccountSwitcherSheet";
import { BookingContext } from "../context/BookingContext";
import { OwnerAccountContext } from "../context/OwnerAccountContext";
import { useLanguage } from "../utils/LanguageContext";
import BASE_URL, { fetchWithAuth } from "../config/Api";
import BlinkingBadge from "../components/BlinkingBadge";
import { WS_BASE_URL } from "../config/Api";
import COLORS from "../theme/colors";
import { useAudioPlayer } from "expo-audio";
import * as Notifications from "../utils/NotificationsProxy";

const Tab = createBottomTabNavigator();

export default function OwnerNavigation({ route, navigation }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { requests } = useContext(BookingContext);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const player = useAudioPlayer(require("../../assets/notification.wav"));

  async function playSound() {
    try {
      if (player) {
        player.play();
      }
    } catch (error) {
      // error playing sound
    }
  }

  // --- Account Switcher State ---
  const bottomSheetRef = useRef(null);
  const { accounts: loggedInAccounts, selectedAccount, switchAccount, refreshAccounts } = useContext(OwnerAccountContext);
  const activePhone = selectedAccount ? selectedAccount.id : (route.params?.phone || '');
  const [hasPendingIssues, setHasPendingIssues] = useState(false);
  const [hasPendingPayments, setHasPendingPayments] = useState(false);

  // Remove local loadLoggedInAccounts because it is managed by context

  const handleSwitchAccount = async (account) => {
    try {
      const targetId = String(account.id);
      bottomSheetRef.current?.close();
      const res = await switchAccount(targetId);
      if (res.success) {
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'OwnerNavigation', params: { phone: targetId } }],
          });
        }, 350);
      } else {
        Alert.alert(t("error") || "Error", res.error || t("failed_to_switch_account") || "Failed to switch account");
      }
    } catch (e) {
      console.log('Switch account error:', e);
    }
  };

  const handleAddAccount = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      const currentAcc = loggedInAccounts?.find(a => a.id === activePhone);
      navigation.navigate('OwnerRegistrationScreen', {
        initialStep: 1,
        phone: activePhone,
        name: currentAcc?.name || "Owner",
        isAddingAccount: true
      });
    }, 350);
  };

  const openAccountSwitcher = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshAccounts(); // Refresh before showing using context
    bottomSheetRef.current?.snapToIndex(0);
  };

  // Listen for suspension events and incoming requests
  useEffect(() => {
    if (!activePhone) return;
        // PUSH NOTIFICATION LISTENER

    const notificationListener =
      Notifications.addNotificationReceivedListener(
        (notification) => {

          console.log(
            "NOTIFICATION RECEIVED:",
            notification
          );

        }
      );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {

          console.log(
            "NOTIFICATION CLICKED:",
            response
          );

        }
      );

    const checkPending = async () => {
      try {
        const issuesRes = await fetchWithAuth(`${BASE_URL}/api/owner-issues/${encodeURIComponent(activePhone)}/`);
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          setHasPendingIssues(issuesData.some(issue => issue.status?.toLowerCase() === 'pending' || issue.status?.toLowerCase() === 'open'));
        }

        const paymentsRes = await fetchWithAuth(`${BASE_URL}/api/owner-payments/${encodeURIComponent(activePhone)}/`);
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const payments = paymentsData.payments || (Array.isArray(paymentsData) ? paymentsData : []);
          setHasPendingPayments(payments.some(pay => pay.status?.toLowerCase() === 'pending'));
        }
      } catch (err) { }
    };

    checkPending();
    const interval = setInterval(checkPending, 10000); // 10s poll

    const wsUrl = `${WS_BASE_URL}/ws/owner-status/${encodeURIComponent(activePhone)}/`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "new_issue" || msg.type === "issue_update") {
          checkPending();
        }
        if (msg.type === "new_payment" || msg.type === "payment_update") {
          checkPending();
        }

        if (msg.type === "account_status" && msg.status === "suspend") {
          let reasonText = msg.message || "Your account has been suspended by admin.";
          try {
            const res = await fetchWithAuth(`${BASE_URL}/api/get_suspension_reason/${encodeURIComponent(activePhone)}/`);
            if (res.ok) {
              const data = await res.json();
              if (data.reason) reasonText = data.reason;
            }
          } catch (err) { }

          Alert.alert(
            t("account_suspended") || "Account Suspended",
            reasonText,
            [
              {
                text: t("ok") || "OK",
                onPress: async () => {
                  await AsyncStorage.multiRemove(["userToken", "ownerPhone"]);
                  navigation.reset({ index: 0, routes: [{ name: "OwnerLoginScreen" }] });
                }
              }
            ],
            { cancelable: false }
          );
        } else if (
          msg.type === "incoming_request" ||
          msg.type === "incoming_vacate_request" ||
          msg.type === "hostel_change_request" ||
          msg.type === "ISSUE" ||
          msg.type === "PAYMENT"
        ) {
          // BookingContext already shows a single in-app popup for these events.
          checkPending();
        }
      } catch (err) { }
    };

   return () => {

  clearInterval(interval);

  ws.close();

  notificationListener.remove();

  responseListener.remove();

};
  }, [activePhone, navigation, t]);

  if (!activePhone) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.PRIMARY,
          tabBarInactiveTintColor: "gray",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
          },
          tabBarStyle: {
            backgroundColor: "#ffffff",
            height: Platform.OS === "ios" ? 84 : 64 + insets.bottom,
            paddingBottom: Platform.OS === "ios" ? 24 : 10 + insets.bottom,
            paddingTop: 8,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
            borderTopWidth: 1,
            borderTopColor: "#EEF2F6",
          },
          tabBarIcon: ({ color, size }) => {
            let iconName = "";
            let showBadge = false;

            if (route.name === "Home") iconName = "home";
            else if (route.name === "Issues") {
              iconName = "construct";
              showBadge = hasPendingIssues;
            }
            else if (route.name === "Payment") {
              iconName = "card";
              showBadge = hasPendingPayments;
            }
            else if (route.name === "Profile") iconName = "person";

            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <BlinkingBadge visible={showBadge} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={OwnerHomeScreen}
          initialParams={{ phone: activePhone }}
          options={{ tabBarLabel: t('dashboard') }}
        />
        <Tab.Screen name="Issues" component={OwnerIssuesScreen} initialParams={{ phone: activePhone }} options={{ tabBarLabel: t('issues') }} />
        <Tab.Screen name="Payment" component={OwnerPaymentScreen} initialParams={{ phone: activePhone }} options={{ tabBarLabel: t('payments') }} />
        <Tab.Screen
          name="Profile"
          component={OwnerProfileScreen}
          initialParams={{ phone: activePhone }}
          options={{
            tabBarLabel: t('account') || t('Account'),
            tabBarButton: (props) => (
              <Pressable
                {...props}
                onLongPress={openAccountSwitcher}
                delayLongPress={500}
                android_ripple={{ color: 'rgba(124, 58, 237, 0.1)', borderless: true }}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Account Switcher Bottom Sheet - renders above tabs */}
      <AccountSwitcherSheet
        ref={bottomSheetRef}
        accounts={loggedInAccounts}
        activePhone={activePhone}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={handleAddAccount}
        onClose={() => { }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "red",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});



