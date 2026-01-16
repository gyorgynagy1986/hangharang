import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { changeLanguage } from "../../i18n/index";

const LanguageContext = createContext({
  language: "hu",
  setLanguage: (lang: string) => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // Kezdőértéknek beállítjuk az aktuális i18n nyelvet
  const [language, setLanguageState] = useState(i18n.locale);

  // 1. Betöltés indításkor: Megnézzük, van-e mentett nyelv
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("user-language");
        if (savedLanguage) {
          // Ha van mentett, beállítjuk az i18n-t és a state-et is
          changeLanguage(savedLanguage);
          setLanguageState(savedLanguage);
        }
      } catch (e) {
        console.error("Nem sikerült betölteni a nyelvet", e);
      }
    };
    loadLanguage();
  }, []);

  // 2. Nyelv váltása: Beállítjuk, elmentjük és frissítjük a state-et
  const handleSetLanguage = async (lang: string) => {
    // 1. Azonnal beállítjuk az i18n-t (hogy a függvények már az újat adják)
    changeLanguage(lang);
    // 2. Frissítjük a React state-et (ez triggereli az újrarajzolást mindenhol)
    setLanguageState(lang);
    // 3. Elmentjük a jövőre nézve
    try {
      await AsyncStorage.setItem("user-language", lang);
    } catch (e) {
      console.error("Nem sikerült menteni a nyelvet", e);
    }
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);