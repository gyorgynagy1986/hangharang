import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Importáljuk a Contextet
import { getAvailableLanguages } from "../../i18n/index";
import { useLanguage } from "../contexts/LanguageContext";

type SupportedLanguage = "hu" | "en" | "de" | "es";

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  hu: "🇭🇺",
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
};

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  hu: "Magyar",
  en: "English",
  de: "Deutsch",
  es: "Español",
};

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: string) => {
    if (lang !== language) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLanguage(lang);
    }
  };

  return (
    <View style={styles.container}>
      {getAvailableLanguages().map((lang: string) => (
        <TouchableOpacity
          key={lang}
          onPress={() => handleLanguageChange(lang)}
          style={[
            styles.langButton,
            // Közvetlenül a language változót vizsgáljuk
            language === lang && styles.langButtonActive,
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.flag}>
            {LANGUAGE_FLAGS[lang as SupportedLanguage]}
          </Text>
          <Text
            style={[
              styles.langName,
              language === lang && styles.langNameActive,
            ]}
          >
            {LANGUAGE_NAMES[lang as SupportedLanguage]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    justifyContent: "center",
  },
  langButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5E6D3",
    borderWidth: 2,
    borderColor: "#C4A77D",
    alignItems: "center",
    minWidth: 70,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  langButtonActive: {
    backgroundColor: "#E8F5E0",
    borderColor: "#8FBC8F",
    borderWidth: 3,
  },
  flag: {
    fontSize: 24,
  },
  langName: {
    fontSize: 12,
    marginTop: 4,
    color: "#3D2914",
    fontWeight: "600",
  },
  langNameActive: {
    color: "#6B8E23",
    fontWeight: "700",
  },
});

