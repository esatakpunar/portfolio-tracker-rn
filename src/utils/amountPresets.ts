/**
 * Amount Presets Utility
 * 
 * Hızlı miktar seçimi için preset değerleri
 */

import { AssetType } from '../types';

/**
 * Get preset amounts for an asset type
 * 
 * @param assetType Asset type
 * @returns Array of preset amounts
 */
export const getAmountPresets = (assetType: AssetType): number[] => {
  // Default presets for most asset types
  const defaultPresets = [100, 500, 1000, 5000];
  
  // For gold types (gram-based), use smaller presets
  if (assetType === '22_ayar' || assetType === '24_ayar' || assetType === 'gumus' || assetType === 'ceyrek' || assetType === 'tam') {
    return [1, 5, 10, 25];
  }
  
  // For currencies (USD, EUR, TL), use default presets
  return defaultPresets;
};

/**
 * Filter presets that are valid for removal (not exceeding current amount)
 * 
 * @param presets Array of preset amounts
 * @param currentAmount Current amount available
 * @returns Filtered array of valid presets
 */
export const filterValidPresets = (presets: number[], currentAmount: number): number[] => {
  if (isNaN(currentAmount) || !isFinite(currentAmount) || currentAmount <= 0) {
    return [];
  }
  
  return presets.filter(preset => preset <= currentAmount && preset > 0);
};

