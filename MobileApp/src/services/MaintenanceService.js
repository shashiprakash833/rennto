import BASE_URL from "../config/Api";

export const MaintenanceService = {
  async getSystemStatus() {
    try {
      const response = await fetch(`${BASE_URL}/api/system/status/`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        maintenanceMode: data.maintenance_mode || "NORMAL",
        message: data.message || "",
        estimatedCompletion: data.estimated_completion || null,
      };
    } catch (error) {
      console.log("[MaintenanceService] Error checking system status:", error);
      return {
        success: false,
        maintenanceMode: "NORMAL",
        message: "",
        estimatedCompletion: null,
      };
    }
  },
};
