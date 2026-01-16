// app/index.tsx
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import AudioChannel from "../src/components/AudioChannel";
import LanguageSwitcher from "../src/components/LanguageSwitcher";
import SceneHeader from "../src/components/SceneHeader";
import { useLanguage } from "../src/contexts/LanguageContext";
import { scenes } from "../src/data/scenes";
import { useAutoSleep } from "../src/hooks/useAutoSleep";

const COLORS = {
  background: "#F5E6D3",
  primary: "#8B4513",
  text: "#3E2723",
  buttonText: "#F5E6D3",
};

 // Alvó állapot időzítő és debounce időzítő értékek

const TOGGLE_DEBOUNCE_MS = 200;
const AUTO_SLEEP_TIMEOUT = 60000 // 1 perc és szundi; 

const LABELS = {
  hu: { title: "Hangtájoló", start: "Indítás" },
  en: { title: "Soundscape", start: "Start" },
  de: { title: "Klanglandschaft", start: "Starten" },
};

export default function HomeScreen() {
  const { language } = useLanguage();

  // Állapot: Elindult-e az app?
  const [hasStarted, setHasStarted] = useState(false);

  const [currentScene, setCurrentScene] = useState(0);
  const [channelStates, setChannelStates] = useState(
    scenes.map((scene) => scene.channels.map(() => false))
  );
  const { width } = useWindowDimensions();

  const lastToggleRef = useRef<{ [key: string]: number }>({});
  const isTablet = width >= 600;

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  // ✅ MÓDOSÍTOTT AUTO-SLEEP FÜGGVÉNY
  const handleSleep = useCallback(() => {
    if (!hasStarted) return; // Ha már a kezdőképernyőn vagyunk, ne fusson le

    console.log("🌙 Auto-sleep: Resetelés és visszatérés a kezdőképernyőre");

    // 1. Minden hang lekapcsolása
    setChannelStates((prev) =>
      prev.map((sceneChannels) => sceneChannels.map(() => false))
    );

    // 2. Visszaugrás az első jelenetre (hogy a következő látogató az elején kezdje)
    setCurrentScene(0);

    // 3. Visszalépés a START képernyőre
    setHasStarted(false);

    // Opcionális: Görgetés a tetejére (ha van ref a ScrollView-hoz, de a képernyőváltás miatt ez automatikus lesz)

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [hasStarted]);

  const { resetTimer } = useAutoSleep({
    timeout: AUTO_SLEEP_TIMEOUT,
    onSleep: handleSleep,
  });

  const handlePrevScene = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScene((prev) => (prev - 1 + scenes.length) % scenes.length);
    resetTimer();
  };

  const handleNextScene = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScene((prev) => (prev + 1) % scenes.length);
    resetTimer();
  };

  const toggleChannel = useCallback(
    (channelIndex: number) => {
      const key = `${currentScene}-${channelIndex}`;
      const now = Date.now();
      const lastToggle = lastToggleRef.current[key] || 0;

      if (now - lastToggle < TOGGLE_DEBOUNCE_MS) {
        return;
      }

      lastToggleRef.current[key] = now;

      setChannelStates((prev) => {
        const newStates = [...prev];
        newStates[currentScene] = [...newStates[currentScene]];
        newStates[currentScene][channelIndex] =
          !newStates[currentScene][channelIndex];
        return newStates;
      });

      resetTimer();
    },
    [currentScene, resetTimer]
  );

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasStarted(true);
    resetTimer();
  };

  // --- START KÉPERNYŐ ---
  if (!hasStarted) {
    const texts = LABELS[language as keyof typeof LABELS] || LABELS.en;
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.startContainer}>
          <Text style={styles.title}>{texts.title}</Text>
          <View style={styles.languageContainer}>
            <LanguageSwitcher />
          </View>
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>{texts.start}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- FŐ ALKALMAZÁS ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={resetTimer}
      >
        <SceneHeader
          scene={scenes[currentScene]}
          onPrev={handlePrevScene}
          onNext={handleNextScene}
        />

        <View style={styles.channelsContainer}>
          {scenes[currentScene].channels.map((channel, index) => (
            <AudioChannel
              key={`${currentScene}-${index}-${language}`}
              channel={channel}
              isActive={channelStates[currentScene][index]}
              onToggle={() => toggleChannel(index)}
              isTablet={isTablet}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  channelsContainer: {
    gap: 25,
  },
  startContainer: {
    width: "100%",
    alignItems: "center",
    gap: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 20,
  },
  languageContainer: {
    marginBottom: 20,
    transform: [{ scale: 1.2 }],
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  startButtonText: {
    color: COLORS.buttonText,
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
