import { Alert } from "react-native";

let lastKey = "";
let lastAt = 0;

/**
 * Shows at most one native Alert for the same title+message within a short window.
 * Multiple WebSocket sockets, push listeners, and screens were stacking 5–6 popups.
 */
export function showOnceAlert(title, message, buttons, options) {
  const key = `${title || ""}|${message || ""}`;
  const now = Date.now();
  if (key === lastKey && now - lastAt < 8000) {
    return;
  }
  lastKey = key;
  lastAt = now;
  Alert.alert(title, message, buttons, options);
}



