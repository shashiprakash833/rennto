import React, { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
 
// Screens
import TenantHomeScreen, { PropertyDetailsScreen } from "../screens/tenant/TenantHomeScreen";
import HostelScreen from "../screens/tenant/HostelScreen";
import ApartmentScreen from "../screens/tenant/ApartmentScreen";
import CommercialScreen from "../screens/tenant/CommercialScreen";
 
import IssuesScreen1 from "../screens/tenant/IssuesScreen1";
import TenantIssuesScreen from "../screens/tenant/TenantIssuesScreen";
import PaymentScreen from "../screens/tenant/PaymentScreen";
import TenantPaymentScreen from "../screens/tenant/TenantPaymentScreen";
import ProfileScreen from "../screens/tenant/TenantProfileScreen";
 
// Context
import { BookingContext } from "../context/BookingContext";
import COLORS from "../theme/colors";
import { useLanguage } from "../utils/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { fetchWithAuth } from "../config/Api";
import BlinkingBadge from "../components/BlinkingBadge";
import { View } from "react-native";
 
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
 
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TenantHome" component={TenantHomeScreen} />
      <Stack.Screen name="HostelScreen" component={HostelScreen} />
      <Stack.Screen name="ApartmentScreen" component={ApartmentScreen} />
      <Stack.Screen name="CommercialScreen" component={CommercialScreen} />
      <Stack.Screen name="PropertyDetailsScreen" component={PropertyDetailsScreen} />
    </Stack.Navigator>
  );
}
function IssuesWrapper({ navigation }) {
  const { isJoined } = useContext(BookingContext);
  return isJoined ? <TenantIssuesScreen navigation={navigation} /> : <IssuesScreen1 navigation={navigation} />;
}

function PaymentWrapper({ navigation }) {
  const { isJoined } = useContext(BookingContext);
  return isJoined ? <TenantPaymentScreen navigation={navigation} /> : <PaymentScreen navigation={navigation} />;
}

export default function TenantNavigation() {
  const { t } = useLanguage();
  const [activePhone, setActivePhone] = React.useState('');
  const [hasPendingIssues, setHasPendingIssues] = React.useState(false);
  const [hasPendingPayments, setHasPendingPayments] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('tenantPhone').then(phone => {
      if (phone) setActivePhone(phone);
    });
  }, []);

  React.useEffect(() => {
    if (!activePhone) return;

    const checkPending = async () => {
      try {
        const issuesRes = await fetchWithAuth(`${BASE_URL}/api/tenant-issues/${encodeURIComponent(activePhone)}/`);
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          setHasPendingIssues(issuesData.some(issue => issue.status?.toLowerCase() === 'pending' || issue.status?.toLowerCase() === 'open'));
        }

        const paymentsRes = await fetchWithAuth(`${BASE_URL}/api/payment-details/${encodeURIComponent(activePhone)}/`);
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const payments = paymentsData.payments || (Array.isArray(paymentsData) ? paymentsData : []);
          setHasPendingPayments(payments.some(pay => pay.status?.toLowerCase() === 'pending'));
        }
      } catch (err) {}
    };

    checkPending();
    const interval = setInterval(checkPending, 10000);
    return () => clearInterval(interval);
  }, [activePhone]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          let showBadge = false;

          if (route.name === "Home") iconName = "home";
          else if (route.name === "Issues") {
            iconName = "alert-circle";
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
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen
        name="Issues"
        component={IssuesWrapper}
        options={{ tabBarLabel: t("issues") }}
      />
      <Tab.Screen
        name="Payment"
        component={PaymentWrapper}
        options={{ tabBarLabel: t("payments") }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile') }} />
    </Tab.Navigator>
  );
}