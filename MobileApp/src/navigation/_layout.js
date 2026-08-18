import { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

// Keep native splash visible until we manually hide it
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const onLayoutRootView = useCallback(async () => {
    // Wait until the custom splash screen's fade-in animation
    // has finished before removing the native splash.
    // This avoids any blank frame in between.
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 600);
  }, []);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  return <Stack screenOptions={{ headerShown: false }} />;
}