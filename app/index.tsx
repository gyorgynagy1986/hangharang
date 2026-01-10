// app/index.tsx
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import Svg, { Path } from "react-native-svg";
import AudioChannel from "../src/components/AudioChannel";
import { scenes } from "../src/data/scenes";

// Tanya/Farm színpaletta
const COLORS = {
  background: "#F5E6D3",
  backgroundDark: "#E8DCC8",
  primary: "#8B7355",
  secondary: "#6B8E23",
  accent: "#D4A574",
  dark: "#4A3728",
  text: "#3D2914",
  textLight: "#F5E6D3",
  border: "#C4A77D",
  navButton: "#8B7355",
  navButtonBorder: "#D4A574",
};

// SVG Nyíl komponensek
const ArrowLeft = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={COLORS.textLight}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ArrowRight = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={COLORS.textLight}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Debounce delay (ms) - gyerekeknek magasabb érték ajánlott
const TOGGLE_DEBOUNCE_MS = 200;

export default function HomeScreen() {
  const [currentScene, setCurrentScene] = useState(0);
  const [channelStates, setChannelStates] = useState(
    scenes.map((scene) => scene.channels.map(() => false))
  );
  const { width } = useWindowDimensions();

  // Debounce tracking - csatornánként
  const lastToggleRef = useRef<{ [key: string]: number }>({});

  // Tablet detektálás: 600dp felett = tablet
  const isTablet = width >= 600;

  useEffect(() => {
    // Audio konfiguráció
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  const handlePrevScene = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScene((prev) => (prev - 1 + scenes.length) % scenes.length);
  };

  const handleNextScene = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentScene((prev) => (prev + 1) % scenes.length);
  };

  // Debounced toggle - megakadályozza a túl gyors kattintásokat
  const toggleChannel = useCallback(
    (channelIndex: number) => {
      const key = `${currentScene}-${channelIndex}`;
      const now = Date.now();
      const lastToggle = lastToggleRef.current[key] || 0;

      // Ha túl gyorsan jött a kattintás, ignoráljuk
      if (now - lastToggle < TOGGLE_DEBOUNCE_MS) {
        console.log(
          `[HomeScreen] Toggle debounced for channel ${channelIndex}`
        );
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
    },
    [currentScene]
  );

  // Scene váltáskor leállítjuk az összes hangot az előző scene-ben
  // Ez opcionális - ha szeretnéd, hogy a hangok maradjanak, kommenteld ki
  /*
  useEffect(() => {
    // Reset all channels when scene changes
    setChannelStates((prev) => {
      const newStates = [...prev];
      // Előző scene összes hangja leáll
      const prevScene = (currentScene - 1 + scenes.length) % scenes.length;
      newStates[prevScene] = newStates[prevScene].map(() => false);
      return newStates;
    });
  }, [currentScene]);
  */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Színtér váltó - HÁTTÉRKÉPPEL */}
        <View style={styles.sceneSelector}>
          <Image
            source={scenes[currentScene].backgroundImg}
            style={styles.backgroundImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={["rgba(74, 55, 40, 0.75)", "rgba(74, 55, 40, 0.5)"]}
            style={styles.overlay}
          >
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePrevScene}
              activeOpacity={0.7}
            >
              <ArrowLeft />
            </TouchableOpacity>

            <View style={styles.sceneInfo}>
              <Text style={styles.title}>{scenes[currentScene].name}</Text>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextScene}
              activeOpacity={0.7}
            >
              <ArrowRight />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Csatornák */}
        <View style={styles.channelsContainer}>
          {scenes[currentScene].channels.map((channel, index) => (
            <AudioChannel
              key={`${currentScene}-${index}`}
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
  scrollContent: {
    padding: 20,
  },
  sceneSelector: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 6,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    height: 300,
    width: "100%",
    position: "relative",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  overlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    flex: 1,
  },
  navButton: {
    backgroundColor: COLORS.navButton,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.navButtonBorder,
  },
  sceneInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textLight,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  channelsContainer: {
    gap: 25,
  },
});
