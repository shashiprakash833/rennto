const BASE_URL = "http://13.126.156.146:8000";
export const WS_BASE_URL = BASE_URL.replace("http://", "ws://").replace("https://", "wss://");

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("adminToken");

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    // Optionally handle global 401 Unauthorized by clearing token & redirecting to login
    if (response.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
    }

    return response;
};

export default BASE_URL;
