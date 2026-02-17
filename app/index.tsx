// app/index.tsx
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { translations } from "../i18n/translations";
import AudioChannel from "../src/components/AudioChannel";
import LanguageSwitcher from "../src/components/LanguageSwitcher";
import SceneHeader from "../src/components/SceneHeader"; 
import { useLanguage } from "../src/contexts/LanguageContext";
import { scenes } from "../src/data/scenes";
import { useAutoSleep } from "../src/hooks/useAutoSleep";

const COLORS = {
  background: "#f4f0e3",
  primary: "#6A7730",
  text: "#363A2C",
  textLight: "#363A2C",
  buttonText: "#F5E6D3",
  overlay: "#f4f0e3",
};

const TOGGLE_DEBOUNCE_MS = 200;
const AUTO_SLEEP_TIMEOUT = 60000;

type SupportedLanguage = "hu" | "en" | "sr";

export default function HomeScreen() {
  const { language } = useLanguage();
  const [hasStarted, setHasStarted] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [channelStates, setChannelStates] = useState(
    scenes.map((scene) => scene.channels.map(() => false)),
  );
  const { width, height } = useWindowDimensions();

  const lastToggleRef = useRef<{ [key: string]: number }>({});
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;

  const t = translations[language as SupportedLanguage] || translations.en;

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  const handleSleep = useCallback(() => {
    if (!hasStarted) return;

    console.log("🌙 Auto-sleep: Resetelés és visszatérés a kezdőképernyőre");

    setChannelStates((prev) =>
      prev.map((sceneChannels) => sceneChannels.map(() => false)),
    );

    setCurrentScene(0);
    setHasStarted(false);

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
    [currentScene, resetTimer],
  );

  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasStarted(true);
    resetTimer();
  };

  // Dinamikus méretek
  const titleSize = isLandscape ? 32 : isTablet ? 48 : 36;
  const introSize = isLandscape ? 16 : isTablet ? 24 : 18;
  const introLineHeight = isLandscape ? 24 : isTablet ? 36 : 28;
  const buttonFontSize = isLandscape ? 20 : isTablet ? 28 : 22;
  const cardPadding = isLandscape ? 24 : 40;
  const startPaddingH = isLandscape ? 50 : 80;
  const startPaddingV = isLandscape ? 14 : 22;

  // --- START KÉPERNYŐ ---
  if (!hasStarted) {
    return (
      <ImageBackground
        source={require("../assets/img/cover.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={[styles.container, styles.centerContent]}>
          {/* Nyelvválasztó - jobb felső sarok */}
          <View style={styles.languageTopRight}>
            <LanguageSwitcher />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.startScrollContent,
              isLandscape && styles.startScrollContentLandscape,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.contentCard,
                { padding: cardPadding },
                isLandscape && styles.contentCardLandscape,
              ]}
            >
              <Text style={[styles.title, { fontSize: titleSize }]}>
                {t.ui.introTitle}
              </Text>

              <View style={styles.introContainer}>
                <Text
                  style={[
                    styles.introText,
                    { fontSize: introSize, lineHeight: introLineHeight },
                  ]}
                >
                  {t.ui.introParagraph1}
                </Text>
                <Text
                  style={[
                    styles.introText,
                    { fontSize: introSize, lineHeight: introLineHeight },
                  ]}
                >
                  {t.ui.introParagraph2}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.startButton,
                  {
                    paddingVertical: startPaddingV,
                    paddingHorizontal: startPaddingH,
                  },
                ]}
                onPress={handleStart}
              >
                <Text
                  style={[styles.startButtonText, { fontSize: buttonFontSize }]}
                >
                  {t.ui.start}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // --- FŐ ALKALMAZÁS - LANDSCAPE: bal/jobb split ---
  if (isLandscape) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.landscapeLayout}>
          {/* Bal oldal: SceneHeader kitölti a teljes magasságot */}
          <View style={styles.landscapeLeft}>
            <SceneHeader
              scene={scenes[currentScene]}
              onPrev={handlePrevScene}
              onNext={handleNextScene}
              fillHeight
            />
          </View>

          {/* Jobb oldal: channelek kitöltik a helyet egyenlően */}
          <View style={styles.landscapeRight}>
            {scenes[currentScene].channels.map((channel, index) => (
              <View
                key={`${currentScene}-${index}-${language}`}
                style={styles.landscapeChannelItem}
              >
                <AudioChannel
                  channel={channel}
                  isActive={channelStates[currentScene][index]}
                  onToggle={() => toggleChannel(index)}
                  isTablet={isTablet}
                  fillHeight
                />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- PORTRAIT ---
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
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centerContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  startScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 40,
  },
  startScrollContentLandscape: {
    padding: 20,
    justifyContent: "center",
  },
  channelsContainer: {
    gap: 25,
  },

  // === LANDSCAPE SPLIT LAYOUT ===
  landscapeLayout: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  landscapeLeft: {
    flex: 2,
  },
  landscapeRight: {
    flex: 2,
    gap: 8,
  },
  landscapeChannelItem: {
    flex: 1,
  },

  // === START SCREEN ===
  contentCard: {
    backgroundColor: COLORS.overlay,
    borderRadius: 50,
    maxWidth: 700,
    alignSelf: "center",
    alignItems: "center",
    gap: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contentCardLandscape: {
    gap: 16,
    borderRadius: 30,
    maxWidth: 600,
  },
  title: {
    fontFamily: "Cantarell-Bold",
    color: COLORS.text,
    textAlign: "center",
  },
  introContainer: {
    gap: 20,
  },
  introText: {
    fontFamily: "Cantarell-Regular",
    color: COLORS.textLight,
    textAlign: "center",
  },
  languageTopRight: {
    position: "absolute",
    top: 50,
    right: 30,
    zIndex: 10,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginTop: 8,
  },
  startButtonText: {
    color: COLORS.buttonText,
    fontFamily: "Cantarell-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
