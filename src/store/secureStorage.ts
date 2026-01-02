/**
 * Secure Storage Wrapper for Redux Persist
 * 
 * Redux Persist için secure storage adapter
 * expo-secure-store kullanarak data'yı encrypt eder
 * 
 * NOT: SecureStore tüm data'yı otomatik encrypt eder (iOS Keychain, Android Keystore)
 * Redux Persist 'persist:root' formatında key kullanır
 * 
 * FALLBACK: Expo Go'da SecureStore mevcut değilse AsyncStorage kullanılır
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

/**
 * SecureStore'un mevcut olup olmadığını kontrol et
 * Expo Go'da native modüller mevcut değil, bu yüzden fallback gerekli
 */
let SecureStore: typeof import('expo-secure-store') | null = null;
let isSecureStoreAvailable = false;

try {
  // Dynamic import - eğer modül mevcut değilse hata vermez
  SecureStore = require('expo-secure-store');
  // Modül yüklendi, şimdi native modülün mevcut olup olmadığını kontrol et
  if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
    isSecureStoreAvailable = true;
    logger.debug('[SECURE_STORAGE] SecureStore is available');
  }
} catch (error) {
  // SecureStore mevcut değil (Expo Go gibi)
  logger.warn('[SECURE_STORAGE] SecureStore not available, using AsyncStorage fallback', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  isSecureStoreAvailable = false;
}

/**
 * Redux Persist key'ini secure store key'ine çevir
 * 'persist:root' -> 'secure_persist_root'
 */
const getSecureKey = (key: string): string => {
  // Redux Persist 'persist:root' formatında key gönderir
  // SecureStore için güvenli bir key oluştur
  return key.replace(/:/g, '_').replace(/persist_/g, 'secure_persist_');
};

/**
 * Redux Persist için secure storage adapter
 * AsyncStorage interface'ini implement eder
 * SecureStore mevcut değilse AsyncStorage'a fallback yapar
 */
export const secureStorage = {
  /**
   * Key-value çiftini secure store'a kaydet
   * Redux Persist 'persist:root' key'ini kullanır
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Check storage quota before storing
      const quotaCheck = await checkStorageQuota();
      
      if (quotaCheck.isOverLimit) {
        logger.warn('[SECURE_STORAGE] Storage quota exceeded, attempting cleanup', {
          estimatedSize: quotaCheck.estimatedSize,
          percentage: quotaCheck.percentage.toFixed(2),
        });
        // Storage overflow - throw error to prevent data loss
        throw new Error(`Storage quota exceeded (${quotaCheck.percentage.toFixed(2)}%)`);
      }
      
      if (quotaCheck.isNearLimit) {
        logger.warn('[SECURE_STORAGE] Storage quota near limit', {
          estimatedSize: quotaCheck.estimatedSize,
          percentage: quotaCheck.percentage.toFixed(2),
        });
      }
      
      if (isSecureStoreAvailable && SecureStore) {
        // SecureStore kullan
        const secureKey = getSecureKey(key);
        await SecureStore.setItemAsync(secureKey, value);
        logger.debug(`[SECURE_STORAGE] Item stored in SecureStore: ${key} -> ${secureKey}`);
      } else {
        // AsyncStorage fallback
        await AsyncStorage.setItem(key, value);
        logger.debug(`[SECURE_STORAGE] Item stored in AsyncStorage (fallback): ${key}`);
      }
    } catch (error) {
      // Check if it's a quota error
      if (error instanceof Error && error.message.includes('quota')) {
        logger.error(`[SECURE_STORAGE] Storage quota error: ${key}`, error);
        // Re-throw with more context
        throw new Error(`Storage quota exceeded. Please clean up history or remove unused data.`);
      }
      logger.error(`[SECURE_STORAGE] Failed to store item: ${key}`, error);
      throw error;
    }
  },

  /**
   * Secure store'dan value getir
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isSecureStoreAvailable && SecureStore) {
        // SecureStore kullan
        const secureKey = getSecureKey(key);
        const value = await SecureStore.getItemAsync(secureKey);
        if (value) {
          logger.debug(`[SECURE_STORAGE] Item retrieved from SecureStore: ${key} -> ${secureKey}`);
          return value;
        }
        return null;
      } else {
        // AsyncStorage fallback
        const value = await AsyncStorage.getItem(key);
        if (value) {
          logger.debug(`[SECURE_STORAGE] Item retrieved from AsyncStorage (fallback): ${key}`);
        }
        return value;
      }
    } catch (error) {
      logger.error(`[SECURE_STORAGE] Failed to get item: ${key}`, error);
      return null;
    }
  },

  /**
   * Secure store'dan item sil
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isSecureStoreAvailable && SecureStore) {
        // SecureStore kullan
        const secureKey = getSecureKey(key);
        await SecureStore.deleteItemAsync(secureKey);
        logger.debug(`[SECURE_STORAGE] Item removed from SecureStore: ${key} -> ${secureKey}`);
      } else {
        // AsyncStorage fallback
        await AsyncStorage.removeItem(key);
        logger.debug(`[SECURE_STORAGE] Item removed from AsyncStorage (fallback): ${key}`);
      }
    } catch (error) {
      logger.error(`[SECURE_STORAGE] Failed to remove item: ${key}`, error);
      throw error;
    }
  },

  /**
   * getAllKeys - Redux Persist için gerekli
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      if (isSecureStoreAvailable && SecureStore) {
        // SecureStore'da getAllKeys yok, AsyncStorage'dan fallback
        // Redux Persist migration için gerekli
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter((k: string) => k.startsWith('persist:'));
      } else {
        // AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter((k: string) => k.startsWith('persist:'));
      }
    } catch (error) {
      logger.error('[SECURE_STORAGE] Failed to get all keys', error);
      return [];
    }
  },
};

/**
 * Migration: AsyncStorage'dan SecureStore'a data taşı
 * İlk açılışta mevcut AsyncStorage data'sını SecureStore'a migrate eder
 * SecureStore mevcut değilse migration skip edilir
 */
export const migrateToSecureStorage = async (): Promise<boolean> => {
  try {
    // SecureStore mevcut değilse migration gerekmiyor
    if (!isSecureStoreAvailable || !SecureStore) {
      logger.debug('[MIGRATION] SecureStore not available, skipping migration');
      return true; // Migration gerekmiyor, AsyncStorage kullanılıyor
    }

    const persistKey = 'persist:root';
    const secureKey = getSecureKey(persistKey);
    
    // AsyncStorage'dan mevcut data'yı oku
    const asyncData = await AsyncStorage.getItem(persistKey);
    
    if (!asyncData) {
      logger.debug('[MIGRATION] No data in AsyncStorage, skipping migration');
      return true; // Migration gerekmiyor
    }

    // SecureStore'da zaten data var mı kontrol et
    const secureData = await SecureStore.getItemAsync(secureKey);
    if (secureData) {
      logger.debug('[MIGRATION] Data already in SecureStore, skipping migration');
      // AsyncStorage'dan eski data'yı temizle (optional, güvenlik için)
      try {
        await AsyncStorage.removeItem(persistKey);
        logger.debug('[MIGRATION] Old AsyncStorage data cleaned up');
      } catch (e) {
        // Ignore cleanup errors
      }
      return true;
    }

    // AsyncStorage'dan SecureStore'a migrate et
    await SecureStore.setItemAsync(secureKey, asyncData);
    logger.debug('[MIGRATION] Data migrated from AsyncStorage to SecureStore successfully');
    
    // Migration başarılı, AsyncStorage'dan eski data'yı temizle (güvenlik için)
    try {
      await AsyncStorage.removeItem(persistKey);
      logger.debug('[MIGRATION] Old AsyncStorage data cleaned up after migration');
    } catch (e) {
      logger.warn('[MIGRATION] Failed to cleanup old AsyncStorage data', { error: e });
    }
    
    return true;
  } catch (error) {
    logger.error('[MIGRATION] Failed to migrate data', error);
    return false;
  }
};

