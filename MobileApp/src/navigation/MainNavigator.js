import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OwnerLoginScreen from "../screens/auth/OwnerLoginScreen";
import OwnerRegistrationScreen from "../screens/auth/OwnerRegistrationScreen";
import RenntoLoadingScreen from "../screens/auth/RenntoLoadingScreen";

import TenantRegisterScreen from "../screens/auth/TenantRegisterScreen";
import OwnerNavigation  from "./OwnerNavigaton";
import OwnerNotificationScreen from "../screens/owner/OwnerNotificationScreen";
import VacateRequestDetailsScreen from "../screens/owner/VacateRequestDetailsScreen";
import OwnerEditProfileScreen from "../screens/owner/OwnerEditProfileScreen";
import AddExpenseScreen from "../screens/owner/AddExpenseScreen";
import PrivacySecurityScreen from "../screens/owner/PrivacySecurityScreen";
import OwnerTenantsScreen from "../screens/owner/OwnerTenantsScreen";
import OwnerPaymentHistoryScreen from "../screens/owner/OwnerPaymentHistoryScreen";
import OwnerExpenseHistoryScreen from "../screens/owner/OwnerExpenseHistoryScreen";
import RoleSection from "../screens/auth/RoleSection";
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import TenantNavigation from "./TenantNavigation";
import TenantNotificationScreen from "../screens/tenant/TenantNotificationScreen";
import TenantPaymentHistoryScreen from "../screens/tenant/TenantPaymentHistoryScreen";
// import ForgetPasswordScreen from "../screens/auth/ForgetPasswordScreen";
import WaitingScreen from "../screens/auth/WaitingScreen";
import { useMaintenance } from "../context/MaintenanceContext";
import MaintenanceScreen from "../screens/MaintenanceScreen";
import SplashScreen from "./Splashscreen";

 
import TenantHomeScreen from "../screens/tenant/TenantHomeScreen";
import TenantIssuesScreen from "../screens/tenant/TenantIssuesScreen";
import TenantPaymentScreen from "../screens/tenant/TenantPaymentScreen";
import TenantProfileScreen from "../screens/tenant/TenantProfileScreen";
import OwnerHomeScreen from "../screens/owner/OwnerHomeScreen";
import OwnerEditTenantScreen from "../screens/owner/OwnerEditTenantScreen";
import OwnerEditBuildingScreen from "../screens/owner/OwnerEditBuildingScreen";
import PaymentScreen from "../screens/tenant/PaymentScreen";
import WelcomeScreen from "../screens/tenant/WelcomeScreen";
 

// import LoadingScreen from "../screens/tenant/LoadingScreen";
const Stack = createStackNavigator();
export default function MainNavigator() {
  const { maintenanceMode } = useMaintenance();
  const [initialRoute, setInitialRoute] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
const checkSession = async () => {
  try {
    const role = await AsyncStorage.getItem("userRole");
    const onboardingCompleted = await AsyncStorage.getItem("onboardingCompleted");

    if (role === "owner") {
      setInitialRoute("OwnerNavigation");
    } else if (role === "tenant") {
      setInitialRoute("TenantNavigation");
    } else if (onboardingCompleted === "true") {
      setInitialRoute("RoleSection");
    } else {
      setInitialRoute("OnboardingScreen");
    }
  } catch (e) {
    setInitialRoute("OnboardingScreen");
  }
};
    if (maintenanceMode !== "FULL_MAINTENANCE") {
      checkSession();
    }
  }, [maintenanceMode]);

  if (maintenanceMode === "FULL_MAINTENANCE") {
    return <MaintenanceScreen />;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!initialRoute) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      
      <Stack.Screen
  name="OnboardingScreen"
  component={OnboardingScreen}
/>

<Stack.Screen
  name="RoleSection"
  component={RoleSection}
/>
      <Stack.Screen name="RenntoLoadingScreen" component={RenntoLoadingScreen} options={{ gestureEnabled: false }} />
<Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      
<Stack.Screen name="OwnerHomeScreen" component={OwnerHomeScreen}/>
<Stack.Screen name="OwnerEditTenantScreen" component={OwnerEditTenantScreen}/>
      <Stack.Screen name="OwnerLoginScreen" component={OwnerLoginScreen} />
     {/* <Stack.Screen name="Loading" component={LoadingScreen} /> */}
{/* <Stack.Screen name="ForgetPasswordScreen" component={ForgetPasswordScreen}/> */}

      <Stack.Screen name="WaitingScreen" component={WaitingScreen} />
      <Stack.Screen
        name="TenantRegisterScreen"
        component={TenantRegisterScreen}
      />

      <Stack.Screen
        name="OwnerRegistrationScreen"
        component={OwnerRegistrationScreen}
      />

      <Stack.Screen name="OwnerNavigation" component={OwnerNavigation} />

      <Stack.Screen name="TenantNavigation" component={TenantNavigation} 
   />

      <Stack.Screen name="TenantHomeScreen" component={TenantHomeScreen} />
      <Stack.Screen
  name="OwnerNotificationScreen"
  component={OwnerNotificationScreen}
/>
<Stack.Screen
  name="VacateRequestDetailsScreen"
  component={VacateRequestDetailsScreen}
/>
<Stack.Screen name="OwnerEditProfile" component={OwnerEditProfileScreen} />
<Stack.Screen name="AddExpense" component={AddExpenseScreen} />
<Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
<Stack.Screen name="Tenants" component={OwnerTenantsScreen} />
<Stack.Screen name="OwnerEditBuilding" component={OwnerEditBuildingScreen} />
<Stack.Screen name="OwnerPaymentHistory" component={OwnerPaymentHistoryScreen} />
<Stack.Screen name="OwnerExpenseHistory" component={OwnerExpenseHistoryScreen} />
<Stack.Screen
  name="TenantNotification"
  component={TenantNotificationScreen}
/>
<Stack.Screen name="TenantPaymentHistory" component={TenantPaymentHistoryScreen} />

      {/* ✅ KEEP ONLY ONE */}
      <Stack.Screen name="IssuesScreen" component={TenantIssuesScreen} />

      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />

      <Stack.Screen name="ProfileScreen" component={TenantProfileScreen} />



    </Stack.Navigator>
  );
}