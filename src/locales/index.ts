import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tr from './tr';
import en from './en';
import de from './de';

const LANGUAGE_KEY = 'portfolio_language';

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de }
};

export const availableLanguages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

const getInitialLanguage = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && resources[saved as keyof typeof resources]) {
      return saved;
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Error loading saved language:', error);
    }
  }

  const deviceLanguages = getLocales();
  const deviceLang = deviceLanguages[0]?.languageCode || 'en';
  
  if (resources[deviceLang as keyof typeof resources]) {
    return deviceLang;
  }
  
  return 'tr';
};

export const initializeI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'tr',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false
      }
    });
};

export const saveLanguage = async (languageCode: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    if (__DEV__) {
      console.log('Error saving language:', error);
    }
  }
};

export default i18n;
