import { Alert } from 'react-native';

export const showOfflineAlert = () => {
  console.log(
    "Connection Offline",
    "Internet connection is required for this action.",
    [{ text: "OK" }],
    { cancelable: true }
  );
};

export default {
  showOfflineAlert
};
