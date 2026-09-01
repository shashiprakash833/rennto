const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    return `http://${window.location.hostname}:8000`;
  }
  return "http://192.168.88.17:8000";
};

const BASE_URL = getBaseUrl();
// const BASE_URL = "https://api.rennto.in";
// WebSocket base URL (safe conversion)
export const WS_BASE_URL = BASE_URL.replace("http://", "ws://").replace("https://", "wss://");

/**
 * Safe fetch wrapper with auth handling
 * - No infinite redirect loops
 * - No forced page reloads
 * - Graceful 401 handling
 */
export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

    if (!token) {
        console.warn("[AUTH] No token found - skipping Authorization header");
    }

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // Attach token if available
    if (token && token !== "null" && token !== "undefined") {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        // Handle 401 WITHOUT breaking app (IMPORTANT FIX)
        if (response.status === 401) {
            console.warn("[AUTH] 401 Unauthorized - clearing token (no auto reload)");

            // Clear invalid session
            localStorage.removeItem("adminToken");
            localStorage.removeItem("token");
            localStorage.removeItem("isLoggedIn");

            return response;
        }

        return response;
    } catch (error) {
        console.error("[API ERROR]", error);
        throw error;
    }
};

export default BASE_URL;

