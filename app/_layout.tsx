// app/_layout.tsx (with providers composer)
import { AppProviders } from "@/providers";
import { AuthGuard } from "@/context/AuthGuard";
import { Slot, SplashScreen } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const initializeApp = useCallback(async () => {
    const startTime = performance ? performance.now() : Date.now();

    try {
      // Any async initialization
    } catch (error) {
      console.warn("App initialization error:", error);
    } finally {
      const loadTime =
        (performance ? performance.now() : Date.now()) - startTime;
      if (__DEV__ && loadTime > 1000) {
        console.warn(`⚠️ Slow startup: ${loadTime.toFixed(0)}ms`);
      }

      setAppIsReady(true);
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProviders>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </AppProviders>
    </SafeAreaProvider>
  );
}
