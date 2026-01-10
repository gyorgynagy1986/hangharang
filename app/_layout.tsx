// app/_layout.tsx
import { activateKeepAwakeAsync } from "expo-keep-awake";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // ⬅️ EZ KELL!
import "react-native-reanimated";

activateKeepAwakeAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar hidden />
    </GestureHandlerRootView>
  );
}
