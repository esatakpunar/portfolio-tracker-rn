/**
 * Secure Storage Wrapper for Redux Persist
 * 
 * Redux Persist için secure storage adapter
 * expo-secure-store kullanarak data'yı encrypt eder
 * 
 * NOT: SecureStore tüm data'yı otomatik encrypt eder (iOS Keychain, Android Keystore)
 * Redux Persist 'persist:root' formatında key kullanır
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

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
 */
export const secureStorage = {
  /**
   * Key-value çiftini secure store'a kaydet
   * Redux Persist 'persist:root' key'ini kullanır
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const secureKey = getSecureKey(key);
      await SecureStore.setItemAsync(secureKey, value);
      logger.debug(`[SECURE_STORAGE] Item stored: ${key} -> ${secureKey}`);
    } catch (error) {
      logger.error(`[SECURE_STORAGE] Failed to store item: ${key}`, error);
      throw error;
    }
  },

  /**
   * Secure store'dan value getir
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      const secureKey = getSecureKey(key);
      const value = await SecureStore.getItemAsync(secureKey);
      if (value) {
        logger.debug(`[SECURE_STORAGE] Item retrieved: ${key} -> ${secureKey}`);
        return value;
      }
      return null;
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
      const secureKey = getSecureKey(key);
      await SecureStore.deleteItemAsync(secureKey);
      logger.debug(`[SECURE_STORAGE] Item removed: ${key} -> ${secureKey}`);
    } catch (error) {
      logger.error(`[SECURE_STORAGE] Failed to remove item: ${key}`, error);
      throw error;
    }
  },
};

/**
 * Migration: AsyncStorage'dan SecureStore'a data taşı
 * İlk açılışta mevcut AsyncStorage data'sını SecureStore'a migrate eder
 */
export const migrateToSecureStorage = async (): Promise<boolean> => {
  try {
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

