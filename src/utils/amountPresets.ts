import { AssetType } from '../types';

/**
 * Amount presets for different asset categories
 * Currency: Common currency amounts
 * Gold: Common gold amounts in grams
 */
export const AMOUNT_PRESETS = {
  currency: [50, 100, 250, 500, 1000],
  gold: [1, 2, 5, 10, 25],
} as const;

/**
 * Get amount presets for a given asset type
 * @param assetType - The asset type to get presets for
 * @returns Array of preset amounts
 */
export function getAmountPresets(assetType: AssetType): number[] {
  // Currency types
  if (assetType === 'tl' || assetType === 'usd' || assetType === 'eur') {
    return [...AMOUNT_PRESETS.currency];
  }
  
  // Gold types (including silver)
  if (
    assetType === '22_ayar' ||
    assetType === '24_ayar' ||
    assetType === 'ceyrek' ||
    assetType === 'tam' ||
    assetType === 'gumus'
  ) {
    return [...AMOUNT_PRESETS.gold];
  }
  
  // Default: empty array
  return [];
}

