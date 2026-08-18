import Constants from "expo-constants";
import { Platform } from "react-native";

let Notifications = null;

// Only load expo-notifications in standalone/development builds, NOT in Expo Go
if (Constants.appOwnership !== "expo") {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.warn("Failed to load expo-notifications:", e);
  }
}

const isMock = !Notifications;

export const setNotificationHandler = (handler) => {
  if (isMock) return;
  return Notifications.setNotificationHandler(handler);
};

export const getPermissionsAsync = async () => {
  if (isMock) return { status: "granted" };
  return Notifications.getPermissionsAsync();
};

export const requestPermissionsAsync = async () => {
  if (isMock) return { status: "granted" };
  return Notifications.requestPermissionsAsync();
};

export const getExpoPushTokenAsync = async (options) => {
  if (isMock) return { data: "mock-token-expo-go" };
  return Notifications.getExpoPushTokenAsync(options);
};

export const setNotificationChannelAsync = async (id, config) => {
  if (isMock) return;
  return Notifications.setNotificationChannelAsync(id, config);
};

export const addNotificationReceivedListener = (listener) => {
  if (isMock) return { remove: () => {} };
  return Notifications.addNotificationReceivedListener(listener);
};

export const addNotificationResponseReceivedListener = (listener) => {
  if (isMock) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener(listener);
};

export const AndroidImportance = isMock ? { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 } : Notifications?.AndroidImportance;

export default {
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  setNotificationChannelAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  AndroidImportance
};
