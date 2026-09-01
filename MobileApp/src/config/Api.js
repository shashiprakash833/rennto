import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }
  return 'http://192.168.88.17:8000';
};

const BASE_URL = __DEV__
  ? getDevBaseUrl()
  : "https://api.rennto.in";

export const WS_BASE_URL = BASE_URL
  .replace("http://", "ws://")
  .replace("https://", "wss://");

export const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const selectedAccountId = await AsyncStorage.getItem("selectedAccountId");
    const headers = { ...(options.headers || {}) };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (selectedAccountId) {
      headers["X-Owner-Account-ID"] = selectedAccountId;
    }

    const config = { ...options, headers };
    const { apiFetch } = require('../utils/ApiWrapper');
    const response = await apiFetch(url, config, fetch);

    // Intercept 503 Maintenance Mode and return empty data gracefully
    if (response.status === 503) {
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        if (data.maintenance_mode === 'FULL_MAINTENANCE' || data.maintenance_mode === 'READ_ONLY') {
          if (global.triggerMaintenanceCheck) {
            global.triggerMaintenanceCheck();
          }
          return new Response(
            JSON.stringify({
              success: true,
              data: [],
              message: data.message || "Maintenance Mode"
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } catch (e) {
        console.log("Error checking maintenance mode", e);
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export default BASE_URL;
