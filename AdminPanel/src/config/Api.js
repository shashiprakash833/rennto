const getAdminBaseUrl = () => {
    if (typeof window !== "undefined" && window.location) {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            return `http://${host}:8000`;
        }
        if (host && !host.includes("rennto.in")) {
            return `http://${host}:8000`;
        }
    }
    return "http://localhost:8000";
};

const BASE_URL = getAdminBaseUrl();
// WebSocket base URL (safe conversion)
export const WS_BASE_URL = BASE_URL.replace("http://", "ws://").replace("https://", "wss://");

/**
 * Safe fetch wrapper with auth handling
 * - No infinite redirect loops
 * - No forced page reloads
 * - Graceful 401 handling
 */
export const fetchWithAuth = async (url, options = {}) => {
    //const token = localStorage.getItem("adminToken");
    const token = localStorage.getItem("adminToken");

    if (!token) {
        console.warn("[AUTH] No token found - skipping Authorization header");
    }

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // Attach token if available
    //if (token) {
    //  headers["Authorization"] = `Bearer ${token}`;
    //}
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
            localStorage.removeItem("isLoggedIn");

            // ❌ DO NOT redirect or reload (this was causing infinite loop)
            // window.location.href = "/login";  <-- REMOVED

            return response;
        }

        return response;
    } catch (error) {
        console.error("[API ERROR]", error);
        throw error;
    }
};

export default BASE_URL;
