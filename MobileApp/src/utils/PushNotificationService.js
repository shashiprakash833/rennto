import * as Notifications from "./NotificationsProxy";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {

    // ANDROID CHANNEL
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId;

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    console.log("EXPO PUSH TOKEN:", token);

    return token;

  } catch (error) {
    console.log("PUSH TOKEN ERROR:", error);
    return null;
  }
}