// src/components/SceneHeader.tsx
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useLanguage } from "../contexts/LanguageContext";

const COLORS = {
  textLight: "#F5E6D3",
  navButton: "#8B7355",
  navButtonBorder: "#D4A574",
  dark: "#4A3728",
};

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

interface SceneHeaderProps {
  scene: any;
  onPrev: () => void;
  onNext: () => void;
  fillHeight?: boolean;
}

export default function SceneHeader({
  scene,
  onPrev,
  onNext,
  fillHeight = false,
}: SceneHeaderProps) {
  const { language } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Ha fillHeight true (landscape mód), flex: 1 kitölti a szülő magasságát
  // Ha nem, portrait módban fix/dinamikus magasság
  const headerHeight = fillHeight ? undefined : Math.min(300, height * 0.35);

  const titleSize = isLandscape ? 18 : 22;

  const title = React.useMemo(() => {
    return typeof scene.name === "function" ? scene.name() : scene.name;
  }, [scene.name, language]);

  return (
    <View
      style={[
        styles.sceneSelector,
        fillHeight ? styles.fillHeight : { height: headerHeight },
      ]}
    >
      <Image
        source={scene.backgroundImg}
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
          style={[styles.navButton, isLandscape && styles.navButtonLandscape]}
          onPress={onPrev}
          activeOpacity={0.7}
        >
          <ArrowLeft />
        </TouchableOpacity>

        <View style={styles.sceneInfo}>
          <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, isLandscape && styles.navButtonLandscape]}
          onPress={onNext}
          activeOpacity={0.7}
        >
          <ArrowRight />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  sceneSelector: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 6,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    width: "100%",
    position: "relative",
  },
  fillHeight: {
    flex: 1,
    marginBottom: 0,
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
  navButtonLandscape: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sceneInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  title: {
    fontFamily: "Cantarell-Bold",
    color: COLORS.textLight,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
