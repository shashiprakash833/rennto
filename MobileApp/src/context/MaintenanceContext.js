import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaintenanceService } from "../services/MaintenanceService";

export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceMode, setMaintenanceMode] = useState("NORMAL");
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState(null);
  const [allowAdminOverride, setAllowAdminOverride] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to query status
  const checkMaintenance = useCallback(async () => {
    try {
      const status = await MaintenanceService.getSystemStatus();
      if (status.success) {
        setMaintenanceMode(status.maintenanceMode);
        setMaintenanceMessage(status.message);
        setEstimatedCompletion(status.estimatedCompletion);
      }
      return status;
    } catch (e) {
      console.log("[MaintenanceProvider] checkMaintenance error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup AppState listeners and polling on mount
  useEffect(() => {
    // Initial fetch
    checkMaintenance();

    // 1. Setup global callback to trigger check (e.g. from fetch interceptor or login)
    global.triggerMaintenanceCheck = checkMaintenance;

    // 2. Setup 60 seconds interval polling
    const interval = setInterval(() => {
      checkMaintenance();
    }, 60000);

    // 3. Setup AppState change listener (e.g. when returning from background)
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        checkMaintenance();
      }
    };
    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    // 4. Load any saved admin override settings
    const loadAdminOverride = async () => {
      try {
        const value = await AsyncStorage.getItem("allowAdminOverride");
        if (value !== null) {
          setAllowAdminOverride(JSON.parse(value));
        }
      } catch (e) {
        console.log("Error loading admin override:", e);
      }
    };
    loadAdminOverride();

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
      if (global.triggerMaintenanceCheck === checkMaintenance) {
        global.triggerMaintenanceCheck = null;
      }
    };
  }, [checkMaintenance]);

  const setAdminOverride = async (override) => {
    try {
      setAllowAdminOverride(override);
      await AsyncStorage.setItem("allowAdminOverride", JSON.stringify(override));
    } catch (e) {
      console.log("Error saving admin override:", e);
    }
  };

  return (
    <MaintenanceContext.Provider
      value={{
        maintenanceMode,
        maintenanceMessage,
        estimatedCompletion,
        allowAdminOverride,
        setAdminOverride,
        checkMaintenance,
        loading,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
};
