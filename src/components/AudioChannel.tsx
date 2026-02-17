// src/components/AudioChannel.tsx
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import i18n from "../../i18n/index";
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
  name: string | (() => string);
  file: any;
  type?: string;
  img?: ImageSourcePropType;
}

interface AudioChannelProps {
  channel: Channel;
  isActive: boolean;
  onToggle: () => void;
  isTablet?: boolean;
  fillHeight?: boolean;
  onInteraction?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AudioChannel({
  channel,
  isActive,
  onToggle,
  isTablet = false,
  fillHeight = false,
  onInteraction,
}: AudioChannelProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(70);
  const [isProcessing, setIsProcessing] = useState(false);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      handOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive, isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const isAborted = () =>
        controller.signal.aborted || !isMountedRef.current;

      setIsProcessing(true);

      try {
        if (isActive) {
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

          if (isAborted()) return;

          const { sound: newSound } = await Audio.Sound.createAsync(
            channel.file,
            {
              isLooping: true,
              volume: volume / 100,
            },
          );

          if (isAborted()) {
            await newSound.unloadAsync();
            return;
          }

          await newSound.playAsync();

          if (isAborted()) {
            await newSound.stopAsync();
            await newSound.unloadAsync();
            return;
          }

          soundRef.current = newSound;
          setSound(newSound);
        } else {
          if (soundRef.current) {
            const currentSound = soundRef.current;
            soundRef.current = null;
            setSound(null);

            try {
              await currentSound.stopAsync();
              await currentSound.unloadAsync();
            } catch (e) {
              console.warn("[AudioChannel] Error during stop:", e);
            }
          }
        }
      } catch (error) {
        if (!isAborted()) {
          console.error("[AudioChannel] Sound management error:", error);
        }
      } finally {
        if (!isAborted()) {
          setIsProcessing(false);
        }
      }
    };

    manageSound();
  }, [isActive, channel.file]);

  // Volume change handling
  useEffect(() => {
    if (soundRef.current && isActive) {
      soundRef.current.setVolumeAsync(volume / 100).catch((e) => {
        console.warn("[AudioChannel] Volume change error:", e);
      });
    }
  }, [volume, isActive]);

  const handlePress = () => {
    if (isProcessing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    imageFlash.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 }),
    );

    cardScale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 200 }),
    );

    if (onInteraction) {
      onInteraction();
    }

    onToggle();
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (onInteraction) {
      onInteraction();
    }
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

  // Dinamikus méretek - landscape-ben kisebb
  const cardHeight = isLandscape
    ? isTablet
      ? 160
      : 100
    : isTablet
      ? 220
      : 120;
  const imageWidth = isLandscape
    ? isTablet
      ? 300
      : 180
    : isTablet
      ? 400
      : 180;

  const knobSize = isLandscape ? (isTablet ? 90 : 70) : isTablet ? 120 : 90;
  const nameSize = isLandscape ? (isTablet ? 18 : 14) : isTablet ? 24 : 18;
  const volumeSize = isLandscape ? (isTablet ? 12 : 10) : isTablet ? 16 : 12;

  const bgColor = isActive ? COLORS.cardBgActive : COLORS.cardBg;

  const getChannelName = () => {
    return typeof channel.name === "function" ? channel.name() : channel.name;
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      activeOpacity={0.9}
      disabled={isProcessing}
      style={[
        styles.container,
        fillHeight ? { flex: 1 } : { height: cardHeight },
        { backgroundColor: bgColor },
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

      {/* Blinking hand */}
      {!isActive && !isProcessing && (
        <Animated.View style={[styles.handContainer, handAnimatedStyle]}>
          <Text style={[styles.handIcon, isTablet && styles.handIconTablet]}>
            👆
          </Text>
        </Animated.View>
      )}

      {/* Kép - bal oldal */}
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
              { fontSize: nameSize },
              isActive && styles.channelNameActive,
            ]}
          >
            {getChannelName()}
          </Text>
          {isActive && !isProcessing && (
            <Text style={[styles.volumeText, { fontSize: volumeSize }]}>
              {i18n.t("ui.volume")}: {volume}%
            </Text>
          )}
          {isProcessing && (
            <Text style={[styles.volumeText, { fontSize: volumeSize }]}>
              {i18n.t("ui.loading")}
            </Text>
          )}
        </View>

        {/* Knob - jobb sarokban */}
        <View style={[styles.knobContainer, !isActive && styles.knobInactive]}>
          <Knob
            value={volume}
            onChange={handleVolumeChange}
            onInteraction={onInteraction}
            size={knobSize}
          />
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
    top: -100,
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
    fontFamily: "Cantarell-Bold",
    color: COLORS.text,
  },
  channelNameActive: {
    color: COLORS.secondary,
    fontFamily: "Cantarell-Bold",
  },
  volumeText: {
    fontFamily: "Cantarell-Regular",
    color: COLORS.textLight,
    marginTop: 4,
  },
  knobContainer: {
    marginLeft: 8,
    opacity: 1,
  },
  knobInactive: {
    opacity: 0.4,
  },
});
