// src/components/Knob.tsx
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

// Tanya/Farm színpaletta
const COLORS = {
  track: "#E8D5B7",
  trackActive: "#8FBC8F",
  thumb: "#FFFFFF",
  thumbBorder: "#8B7355",
  shadow: "rgba(0,0,0,0.2)",
};

interface KnobProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  size?: number; // Magasság
}

export default function Knob({ value, onChange, size = 120 }: KnobProps) {
  const trackHeight = size;
  const thumbSize = 56;

  // Shared values - teljesen a gesture kezeli
  const position = useSharedValue(value / 100);
  const isDragging = useSharedValue(false);
  const startPosition = useSharedValue(0);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Value change callback
  const updateValue = useCallback(
    (newValue: number) => {
      onChange(newValue);
    },
    [onChange]
  );

  // Külső value változás CSAK ha NEM draggel a user
  React.useEffect(() => {
    if (!isDragging.value) {
      position.value = value / 100;
    }
  }, [value]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startPosition.value = position.value;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      // Közvetlen pozíció számítás - NINCS ANIMÁCIÓ
      const trackRange = trackHeight - thumbSize;
      const deltaY = event.translationY / trackRange;

      // Új pozíció = start - delta (felfelé húzás = növekvő érték)
      const newPosition = Math.max(
        0,
        Math.min(1, startPosition.value - deltaY)
      );

      // AZONNALI update - nincs spring!
      position.value = newPosition;

      // JS callback throttled (csak ha elég nagy a változás)
      const newValue = Math.round(newPosition * 100);
      const currentValue = Math.round(startPosition.value * 100);

      // Csak 5%-onként haptic és value update (kevesebb lag)
      if (Math.abs(newValue - currentValue) >= 5) {
        runOnJS(updateValue)(newValue);
      }
    })
    .onEnd(() => {
      isDragging.value = false;

      // Végső érték
      const finalValue = Math.round(position.value * 100);
      runOnJS(updateValue)(finalValue);
      runOnJS(triggerHaptic)();

      // Opcionális: snap to nearest 5%
      // const snappedValue = Math.round(finalValue / 5) * 5;
      // position.value = withSpring(snappedValue / 100, { damping: 15 });
      // runOnJS(updateValue)(snappedValue);
    });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const trackRange = trackHeight - thumbSize;
    // Invertált: position 1 = top (max), position 0 = bottom (min)
    const top = (1 - position.value) * trackRange;
    return {
      transform: [{ translateY: top }],
    };
  });

  const activeTrackStyle = useAnimatedStyle(() => {
    return {
      height: `${position.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Track container */}
      <View style={[styles.trackContainer, { height: trackHeight }]}>
        {/* Background track */}
        <View style={styles.track} />

        {/* Active portion (fills from bottom) */}
        <Animated.View style={[styles.trackActive, activeTrackStyle]} />

        {/* Thumb */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
              },
              thumbAnimatedStyle,
            ]}
          >
            <Text style={styles.thumbEmoji}>🍃</Text>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 20,
  },
  trackContainer: {
    width: 16,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    position: "absolute",
    width: 12,
    height: "100%",
    backgroundColor: COLORS.track,
    borderRadius: 6,
  },
  trackActive: {
    position: "absolute",
    bottom: 0,
    width: 12,
    backgroundColor: COLORS.trackActive,
    borderRadius: 6,
  },
  thumb: {
    position: "absolute",
    top: 0,
    backgroundColor: COLORS.thumb,
    borderWidth: 3,
    borderColor: COLORS.thumbBorder,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbEmoji: {
    fontSize: 24,
  },
});
