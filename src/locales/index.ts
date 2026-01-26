import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLanguage, setLanguage as saveLanguageToDB } from '../services/portfolioRepository';

import tr from './tr';
import en from './en';
import de from './de';

// Lazy import expo-localization to handle potential native module issues
let Localization: any = null;
try {
  Localization = require('expo-localization');
} catch (error) {
  if (__DEV__) {
    console.warn('[I18N] expo-localization not available, using defaults');
  }
}

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
  // Try to get saved language from database with timeout
  try {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 1000)
    );

    const saved = await Promise.race([
      getLanguage(),
      timeoutPromise
    ]);

    if (saved && typeof saved === 'string' && resources[saved as keyof typeof resources]) {
      if (__DEV__) {
        console.log('[I18N] Using saved language:', saved);
      }
      return saved;
    }
  } catch (error) {
    // Silently fail - fallback to device language or default
    if (__DEV__) {
      console.warn('[I18N] Error getting saved language (timeout or error):', error instanceof Error ? error.message : error);
    }
  }

  // Skip device language detection for now - it's causing native module issues
  // Just use default Turkish
  if (__DEV__) {
    console.log('[I18N] Using default language: tr');
  }

  return 'tr';
};

export const initializeI18n = async () => {
  try {
    // Ensure i18n is not already initialized
    if (i18n.isInitialized) {
      if (__DEV__) {
        console.log('[I18N] Already initialized');
      }
      return;
    }

    const initialLanguage = await getInitialLanguage();

    if (__DEV__) {
      console.log('[I18N] Initializing with language:', initialLanguage);
    }

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: initialLanguage,
        fallbackLng: 'tr',
        compatibilityJSON: 'v3', // v3 for react-i18next 16.x
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false // Disable suspense to prevent race conditions
        }
      });

    if (__DEV__) {
      console.log('[I18N] Initialization complete');
    }
  } catch (error) {
    // Log error but don't crash - fall back to default
    if (__DEV__) {
      console.error('[I18N] Initialization error:', error);
    }

    // Try minimal initialization as fallback
    if (!i18n.isInitialized) {
      try {
        await i18n
          .use(initReactI18next)
          .init({
            resources,
            lng: 'tr', // Hard-coded fallback
            fallbackLng: 'tr',
            compatibilityJSON: 'v3',
            interpolation: {
              escapeValue: false
            },
            react: {
              useSuspense: false
            }
          });

        if (__DEV__) {
          console.log('[I18N] Fallback initialization complete');
        }
      } catch (fallbackError) {
        if (__DEV__) {
          console.error('[I18N] Fallback initialization failed:', fallbackError);
        }
        // At this point, we can't do much else
      }
    }
  }
};

export const saveLanguage = async (languageCode: string) => {
  try {
    await saveLanguageToDB(languageCode);
  } catch (error) {
    // Silently fail - language change will still work for current session
  }
};

export default i18n;
