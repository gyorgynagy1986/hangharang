import { useFonts } from "expo-font";
import { activateKeepAwakeAsync } from "expo-keep-awake";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { LanguageProvider } from "../src/contexts/LanguageContext";

activateKeepAwakeAsync();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Cantarell-Regular": require("../assets/fonts/Cantarell-Regular.ttf"),
    "Cantarell-Bold": require("../assets/fonts/Cantarell-Bold.ttf"),
    "Cantarell-Italic": require("../assets/fonts/Cantarell-Italic.ttf"),
    "Cantarell-BoldItalic": require("../assets/fonts/Cantarell-BoldItalic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
        <StatusBar hidden />
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
