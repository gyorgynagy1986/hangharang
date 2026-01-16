// app/_layout.tsx
import { activateKeepAwakeAsync } from "expo-keep-awake";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { LanguageProvider } from "../src/contexts/LanguageContext";

activateKeepAwakeAsync();

export default function RootLayout() {
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