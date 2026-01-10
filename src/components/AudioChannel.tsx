// src/components/AudioChannel.tsx
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Knob from "./Knob";

// Tanya/Farm színpaletta
const COLORS = {
  background: "#F5E6D3",
  cardBg: "#FDF8F0",
  cardBgActive: "#E8F5E0",
  primary: "#8B7355",
  secondary: "#6B8E23",
  accent: "#D4A574",
  dark: "#4A3728",
  text: "#3D2914",
  textLight: "#7D6B5D",
  border: "#C4A77D",
  borderActive: "#8FBC8F",
  hand: "#A67B5B",
};

interface Channel {
  name: string;
  file: any;
  type?: string;
  img?: ImageSourcePropType;
}

interface AudioChannelProps {
  channel: Channel;
  isActive: boolean;
  onToggle: () => void;
  isTablet?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AudioChannel({
  channel,
  isActive,
  onToggle,
  isTablet = false,
}: AudioChannelProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(70);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs a race condition elkerülésére
  const soundRef = useRef<Audio.Sound | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Animations
  const handOpacity = useSharedValue(1);
  const imageFlash = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Mounted tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Blinking hand animation for inactive state
  useEffect(() => {
    if (!isActive && !isProcessing) {
      handOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      handOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any pending operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cleanup sound
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Sound management with AbortController
  useEffect(() => {
    const manageSound = async () => {
      // Megszakítjuk az előző műveletet, ha van
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Új AbortController létrehozása
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Helper: ellenőrzi, hogy érvényes-e még a művelet
      const isAborted = () => controller.signal.aborted || !isMountedRef.current;

      setIsProcessing(true);

      try {
        if (isActive) {
          // === PLAY ===

          // 1. Először mindig cleanup a régi hangot (ha van)
          if (soundRef.current) {
            const oldSound = soundRef.current;
            soundRef.current = null;
            setSound(null);

            try {
              await oldSound.stopAsync();
              await oldSound.unloadAsync();
            } catch (e) {
              // Ignore cleanup errors
            }
          }

          // 2. Ellenőrizzük, hogy nem abort-olták-e közben
          if (isAborted()) {
            console.log('[AudioChannel] Aborted before loading new sound');
            return;
          }

          // 3. Új hang betöltése
          const { sound: newSound } = await Audio.Sound.createAsync(
            channel.file,
            {
              isLooping: true,
              volume: volume / 100,
            }
          );

          // 4. Újra ellenőrizzük - ha közben abort volt, unload és kilépés
          if (isAborted()) {
            console.log('[AudioChannel] Aborted after loading, cleaning up');
            await newSound.unloadAsync();
            return;
          }

          // 5. Hang indítása
          await newSound.playAsync();

          // 6. Utolsó ellenőrzés mielőtt mentjük
          if (isAborted()) {
            console.log('[AudioChannel] Aborted after play, cleaning up');
            await newSound.stopAsync();
            await newSound.unloadAsync();
            return;
          }

          // 7. Sikeres - mentjük a referenciákat
          soundRef.current = newSound;
          setSound(newSound);

        } else {
          // === STOP ===

          if (soundRef.current) {
            const currentSound = soundRef.current;

            // Azonnal nullázzuk a referenciákat
            soundRef.current = null;
            setSound(null);

            // Aztán leállítjuk és unload-oljuk
            try {
              await currentSound.stopAsync();
              await currentSound.unloadAsync();
            } catch (e) {
              console.warn('[AudioChannel] Error during stop:', e);
            }
          }
        }
      } catch (error) {
        if (!isAborted()) {
          console.error('[AudioChannel] Sound management error:', error);
        }
      } finally {
        // Csak akkor állítjuk vissza a processing-et, ha ez még az aktuális művelet
        if (!isAborted()) {
          setIsProcessing(false);
        }
      }
    };

    manageSound();
  }, [isActive, channel.file]);

  // Volume change handling (külön effect, nem kell AbortController)
  useEffect(() => {
    if (soundRef.current && isActive) {
      soundRef.current.setVolumeAsync(volume / 100).catch((e) => {
        console.warn('[AudioChannel] Volume change error:', e);
      });
    }
  }, [volume, isActive]);

  const handlePress = () => {
    // Ne engedjünk új kattintást, amíg folyamatban van egy művelet
    if (isProcessing) {
      console.log('[AudioChannel] Press ignored - processing in progress');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Image flash animation
    imageFlash.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );

    // Card scale animation
    cardScale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );

    onToggle();
  };

  const handAnimatedStyle = useAnimatedStyle(() => ({
    opacity: handOpacity.value,
  }));

  const imageFlashStyle = useAnimatedStyle(() => ({
    opacity: imageFlash.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const cardHeight = isTablet ? 220 : 120;
  const imageWidth = isTablet ? 320 : 180;
  const fadeWidth = isTablet ? 120 : 80;
  const knobSize = isTablet ? 120 : 90;

  const bgColor = isActive ? COLORS.cardBgActive : COLORS.cardBg;

  return (
    <AnimatedTouchable
      onPress={handlePress}
      activeOpacity={0.9}
      disabled={isProcessing}
      style={[
        styles.container,
        { height: cardHeight, backgroundColor: bgColor },
        isActive && styles.containerActive,
        isProcessing && styles.containerProcessing,
        cardAnimatedStyle,
      ]}
    >
      {/* Loading indicator */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      )}

      {/* Blinking hand - positioned to the RIGHT side */}
      {!isActive && !isProcessing && (
        <Animated.View style={[styles.handContainer, handAnimatedStyle]}>
          <Text style={[styles.handIcon, isTablet && styles.handIconTablet]}>
            👆
          </Text>
        </Animated.View>
      )}

      {/* Széles kép - bal oldal, fade a jobb szélén */}
      <View style={[styles.imageSection, { width: imageWidth }]}>
        {channel.img && (
          <Image
            source={channel.img}
            style={styles.channelImage}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        )}

        {/* Fade gradient on right edge */}
        <LinearGradient
          colors={["transparent", bgColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fadeGradient, { width: fadeWidth }]}
          pointerEvents="none"
        />

        {/* Flash overlay */}
        <Animated.View style={[styles.flashOverlay, imageFlashStyle]} />

        {/* Playing indicator */}
        {isActive && !isProcessing && (
          <View style={styles.playingIndicator}>
            <Text
              style={[styles.playingIcon, isTablet && styles.playingIconTablet]}
            >
              🔊
            </Text>
          </View>
        )}
      </View>

      {/* Jobb oldali szekció - Név + Knob */}
      <View style={styles.rightSection}>
        {/* Név - bal oldalon */}
        <View style={styles.nameSection}>
          <Text
            style={[
              styles.channelName,
              isActive && styles.channelNameActive,
              isTablet && styles.channelNameTablet,
            ]}
          >
            {channel.name}
          </Text>
          {isActive && !isProcessing && (
            <Text
              style={[styles.volumeText, isTablet && styles.volumeTextTablet]}
            >
              Hangerő: {volume}%
            </Text>
          )}
          {isProcessing && (
            <Text
              style={[styles.volumeText, isTablet && styles.volumeTextTablet]}
            >
              Betöltés...
            </Text>
          )}
        </View>

        {/* Knob - jobb sarokban */}
        <View style={[styles.knobContainer, !isActive && styles.knobInactive]}>
          <Knob value={volume} onChange={setVolume} size={knobSize} />
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 0,
    borderColor: COLORS.border,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
  },
  containerActive: {
    borderColor: COLORS.borderActive,
    borderWidth: 3,
  },
  containerProcessing: {
    opacity: 0.8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  handContainer: {
    position: "absolute",
    top: 0,
    left: "50%",
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  handIcon: {
    fontSize: 28,
    opacity: 0.5,
  },
  handIconTablet: {
    fontSize: 36,
  },
  imageSection: {
    height: "100%",
    position: "relative",
  },
  channelImage: {
    width: "100%",
    height: "100%",
  },
  fadeGradient: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  playingIndicator: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(143, 188, 143, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  playingIcon: {
    fontSize: 14,
  },
  playingIconTablet: {
    fontSize: 18,
  },
  rightSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  nameSection: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  channelNameActive: {
    color: COLORS.secondary,
    fontWeight: "700",
  },
  channelNameTablet: {
    fontSize: 24,
  },
  volumeText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  volumeTextTablet: {
    fontSize: 16,
  },
  knobContainer: {
    marginLeft: 8,
    opacity: 1,
  },
  knobInactive: {
    opacity: 0.4,
  },
});