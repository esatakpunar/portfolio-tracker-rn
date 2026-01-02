/**
 * Recent Amounts Service
 * 
 * Son kullanılan miktarları AsyncStorage'da saklar ve yönetir
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssetType } from '../types';
import { logger } from '../utils/logger';

const RECENT_AMOUNTS_PREFIX = 'recent_amounts_';
const MAX_RECENT_AMOUNTS = 5;

/**
 * Get recent amounts for an asset type
 * 
 * @param assetType Asset type
 * @returns Promise<number[]> Array of recent amounts (max 5, most recent first)
 */
export const getRecentAmounts = async (assetType: AssetType): Promise<number[]> => {
  try {
    const key = `${RECENT_AMOUNTS_PREFIX}${assetType}`;
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      return [];
    }
    
    const amounts = JSON.parse(data) as number[];
    
    // Validate and filter amounts
    const validAmounts = amounts.filter(
      (amount) => typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount > 0
    );
    
    return validAmounts.slice(0, MAX_RECENT_AMOUNTS);
  } catch (error) {
    logger.error('[RECENT_AMOUNTS] Failed to get recent amounts', error, { assetType });
    return [];
  }
};

/**
 * Add a recent amount for an asset type
 * Uses FIFO (First In First Out) - removes oldest if max reached
 * 
 * @param assetType Asset type
 * @param amount Amount to add
 * @returns Promise<void>
 */
export const addRecentAmount = async (assetType: AssetType, amount: number): Promise<void> => {
  try {
    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount) || amount <= 0) {
      logger.warn('[RECENT_AMOUNTS] Invalid amount, skipping', { assetType, amount });
      return;
    }
    
    const key = `${RECENT_AMOUNTS_PREFIX}${assetType}`;
    const existingAmounts = await getRecentAmounts(assetType);
    
    // Remove if already exists (to move to front)
    const filteredAmounts = existingAmounts.filter((a) => a !== amount);
    
    // Add to front
    const newAmounts = [amount, ...filteredAmounts];
    
    // Keep only max amounts
    const finalAmounts = newAmounts.slice(0, MAX_RECENT_AMOUNTS);
    
    await AsyncStorage.setItem(key, JSON.stringify(finalAmounts));
    logger.debug('[RECENT_AMOUNTS] Added recent amount', { assetType, amount, total: finalAmounts.length });
  } catch (error) {
    logger.error('[RECENT_AMOUNTS] Failed to add recent amount', error, { assetType, amount });
  }
};

/**
 * Clear recent amounts for an asset type
 * 
 * @param assetType Asset type
 * @returns Promise<void>
 */
export const clearRecentAmounts = async (assetType: AssetType): Promise<void> => {
  try {
    const key = `${RECENT_AMOUNTS_PREFIX}${assetType}`;
    await AsyncStorage.removeItem(key);
    logger.debug('[RECENT_AMOUNTS] Cleared recent amounts', { assetType });
  } catch (error) {
    logger.error('[RECENT_AMOUNTS] Failed to clear recent amounts', error, { assetType });
  }
};

