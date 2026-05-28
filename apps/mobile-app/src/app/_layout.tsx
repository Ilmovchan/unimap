import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { enableFreeze } from "react-native-screens";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { globalColors } from "../styles/styles";
import { LocationProvider } from "../features/core/location/stores/LocationProvider";
import { subscribeNewsAppBadgeRefresh } from "@/src/features/news/newsAppBadge";
import { useEffect } from "react";
import { Platform } from "react-native";
import "@/src/config/logger";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.setOptions({
  duration: 300,
  fade: true,
});

SplashScreen.preventAutoHideAsync();
enableFreeze(true);

const RootStack = () => {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => subscribeNewsAppBadgeRefresh(), []);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: globalColors.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="(protected)" options={{ animation: "none" }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <LocationProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            style={Platform.OS === "android" ? "light" : "auto"}
            backgroundColor={Platform.OS === "android" ? "#000000" : undefined}
          />
          <RootStack />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </LocationProvider>
  );
}
