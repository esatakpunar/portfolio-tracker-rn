/**
 * Storage Utilities
 * 
 * Storage quota kontrolü ve management için utility fonksiyonları
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

/**
 * Storage quota limits
 * React Native AsyncStorage genellikle 6MB limit'e sahip
 * SecureStore daha küçük limit'lere sahip olabilir
 */
export const STORAGE_LIMITS = {
  /**
   * Maximum storage size in bytes
   * AsyncStorage: ~6MB (6 * 1024 * 1024)
   * SecureStore: Daha küçük, item başına ~2KB limit
   */
  MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB (güvenli limit)
  
  /**
   * Warning threshold - bu seviyeye ulaşıldığında cleanup önerilir
   */
  WARNING_THRESHOLD: 4 * 1024 * 1024, // 4MB
  
  /**
   * Maximum history items to keep
   * History çok büyüyebilir, bu yüzden limit koyuyoruz
   */
  MAX_HISTORY_ITEMS: 1000,
  
  /**
   * History cleanup threshold
   * Bu sayıdan fazla history item varsa cleanup yapılır
   */
  HISTORY_CLEANUP_THRESHOLD: 800,
};

/**
 * Estimate storage size for a value
 * JSON stringify ile approximate size hesapla
 */
export const estimateStorageSize = (value: unknown): number => {
  try {
    const jsonString = JSON.stringify(value);
    // UTF-8 encoding: her karakter 1-4 byte olabilir, ortalama 2 byte
    // Buffer size approximation
    return new Blob([jsonString]).size || jsonString.length * 2;
  } catch (error) {
    logger.warn('[STORAGE_UTILS] Failed to estimate storage size', error);
    // Fallback: string length * 2 (approximate)
    return String(value).length * 2;
  }
};

/**
 * Check if storage is approaching quota limit
 * @returns true if storage is near limit, false otherwise
 */
export const checkStorageQuota = async (): Promise<{
  isNearLimit: boolean;
  isOverLimit: boolean;
  estimatedSize: number;
  percentage: number;
}> => {
  try {
    // AsyncStorage'dan tüm key'leri al
    const keys = await AsyncStorage.getAllKeys();
    
    // Tüm value'ları oku ve size hesapla
    let totalSize = 0;
    const values = await AsyncStorage.multiGet(keys);
    
    for (const [key, value] of values) {
      if (value) {
        totalSize += estimateStorageSize(value);
      }
    }
    
    const percentage = (totalSize / STORAGE_LIMITS.MAX_STORAGE_SIZE) * 100;
    const isNearLimit = totalSize >= STORAGE_LIMITS.WARNING_THRESHOLD;
    const isOverLimit = totalSize >= STORAGE_LIMITS.MAX_STORAGE_SIZE;
    
    logger.debug('[STORAGE_UTILS] Storage quota check', {
      totalSize,
      maxSize: STORAGE_LIMITS.MAX_STORAGE_SIZE,
      percentage: percentage.toFixed(2),
      isNearLimit,
      isOverLimit,
    });
    
    return {
      isNearLimit,
      isOverLimit,
      estimatedSize: totalSize,
      percentage,
    };
  } catch (error) {
    logger.error('[STORAGE_UTILS] Failed to check storage quota', error);
    // Hata durumunda güvenli default değerler döndür
    return {
      isNearLimit: false,
      isOverLimit: false,
      estimatedSize: 0,
      percentage: 0,
    };
  }
};

/**
 * Cleanup old history items
 * En eski history item'ları silerek storage'ı temizle
 * @param historyItems History items array
 * @param maxItems Maximum number of items to keep
 * @returns Cleaned history items
 */
export const cleanupHistory = <T extends { date: string }>(
  historyItems: T[],
  maxItems: number = STORAGE_LIMITS.MAX_HISTORY_ITEMS
): T[] => {
  if (historyItems.length <= maxItems) {
    return historyItems;
  }
  
  // Sort by date (newest first) and keep only the most recent items
  const sorted = [...historyItems].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
  
  const cleaned = sorted.slice(0, maxItems);
  const removedCount = historyItems.length - cleaned.length;
  
  logger.debug('[STORAGE_UTILS] History cleaned', {
    originalCount: historyItems.length,
    cleanedCount: cleaned.length,
    removedCount,
  });
  
  return cleaned;
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = async (): Promise<{
  totalKeys: number;
  estimatedSize: number;
  percentage: number;
  keys: string[];
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    
    let totalSize = 0;
    for (const [key, value] of values) {
      if (value) {
        totalSize += estimateStorageSize(value);
      }
    }
    
    const percentage = (totalSize / STORAGE_LIMITS.MAX_STORAGE_SIZE) * 100;
    
    return {
      totalKeys: keys.length,
      estimatedSize: totalSize,
      percentage,
      keys,
    };
  } catch (error) {
    logger.error('[STORAGE_UTILS] Failed to get storage stats', error);
    return {
      totalKeys: 0,
      estimatedSize: 0,
      percentage: 0,
      keys: [],
    };
  }
};

