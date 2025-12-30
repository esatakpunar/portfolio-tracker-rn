/**
 * Encryption Service
 * 
 * Portfolio data'yı encrypt/decrypt etmek için kullanılır
 * expo-secure-store zaten encryption yapıyor, bu service wrapper olarak kullanılıyor
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const ENCRYPTION_KEY = 'portfolio_data_encrypted';

/**
 * Data'yı encrypt edip secure store'a kaydet
 */
export const encryptAndStore = async (data: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(ENCRYPTION_KEY, data);
    logger.debug('[ENCRYPTION] Data encrypted and stored successfully');
    return true;
  } catch (error) {
    logger.error('[ENCRYPTION] Failed to encrypt and store data', error);
    return false;
  }
};

/**
 * Secure store'dan data'yı decrypt edip getir
 */
export const decryptAndRetrieve = async (): Promise<string | null> => {
  try {
    const data = await SecureStore.getItemAsync(ENCRYPTION_KEY);
    if (data) {
      logger.debug('[ENCRYPTION] Data decrypted and retrieved successfully');
      return data;
    }
    return null;
  } catch (error) {
    logger.error('[ENCRYPTION] Failed to decrypt and retrieve data', error);
    return null;
  }
};

/**
 * Secure store'dan data'yı sil
 */
export const deleteEncryptedData = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
    logger.debug('[ENCRYPTION] Encrypted data deleted successfully');
    return true;
  } catch (error) {
    logger.error('[ENCRYPTION] Failed to delete encrypted data', error);
    return false;
  }
};

/**
 * Secure store'da data var mı kontrol et
 */
export const hasEncryptedData = async (): Promise<boolean> => {
  try {
    const data = await SecureStore.getItemAsync(ENCRYPTION_KEY);
    return data !== null;
  } catch (error) {
    return false;
  }
};

