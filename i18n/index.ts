// src/i18n/index.ts
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { translations } from './translations';

const i18n = new I18n(translations);

// Eszköz nyelvének detektálása
i18n.locale = getLocales()[0]?.languageCode ?? 'hu';

// Fallback nyelv (ha nincs fordítás)
i18n.enableFallback = true;
i18n.defaultLocale = 'hu';

export default i18n;

// Helper függvény a nyelv váltásához
export const changeLanguage = (locale: string) => {
  i18n.locale = locale;
};

export const getCurrentLanguage = () => i18n.locale;
export const getAvailableLanguages = () => Object.keys(translations);