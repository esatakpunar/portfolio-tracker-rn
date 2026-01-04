import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { getLanguage, setLanguage as saveLanguageToDB } from '../services/portfolioRepository';

import tr from './tr';
import en from './en';
import de from './de';

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
    const saved = await getLanguage();
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
    await saveLanguageToDB(languageCode);
  } catch (error) {
    if (__DEV__) {
      console.log('Error saving language:', error);
    }
  }
};

export default i18n;
