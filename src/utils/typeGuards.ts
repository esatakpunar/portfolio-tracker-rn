/**
 * Type Guards
 * 
 * Runtime type checking için type guard fonksiyonları
 */

import { AssetType, CurrencyType, PortfolioItem, HistoryItem, Prices } from '../types';

/**
 * Check if value is a valid AssetType
 */
export const isAssetType = (value: unknown): value is AssetType => {
  if (typeof value !== 'string') {
    return false;
  }
  const validAssetTypes: AssetType[] = [
    '22_ayar',
    '24_ayar',
    'ceyrek',
    'tam',
    'usd',
    'eur',
    'tl',
    'gumus',
  ];
  return validAssetTypes.includes(value as AssetType);
};

/**
 * Check if value is a valid CurrencyType
 */
export const isCurrencyType = (value: unknown): value is CurrencyType => {
  if (typeof value !== 'string') {
    return false;
  }
  const validCurrencyTypes: CurrencyType[] = ['TL', 'USD', 'EUR', 'ALTIN'];
  return validCurrencyTypes.includes(value as CurrencyType);
};

/**
 * Check if value is a valid PortfolioItem
 */
export const isPortfolioItem = (value: unknown): value is PortfolioItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    isAssetType(item.type) &&
    typeof item.amount === 'number' &&
    typeof item.date === 'string' &&
    (item.description === undefined || typeof item.description === 'string')
  );
};

/**
 * Check if value is a valid HistoryItem
 */
export const isHistoryItem = (value: unknown): value is HistoryItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    (item.type === 'add' || item.type === 'remove' || item.type === 'update') &&
    isPortfolioItem(item.item) &&
    typeof item.date === 'string' &&
    (item.description === undefined || typeof item.description === 'string') &&
    (item.previousAmount === undefined || typeof item.previousAmount === 'number')
  );
};

/**
 * Check if value is a valid Prices object
 */
export const isPrices = (value: unknown): value is Prices => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const prices = value as Record<string, unknown>;
  const requiredKeys: (keyof Prices)[] = [
    '22_ayar',
    '24_ayar',
    'ceyrek',
    'tam',
    'usd',
    'eur',
    'tl',
    'gumus',
  ];
  
  for (const key of requiredKeys) {
    if (typeof prices[key] !== 'number' || !isFinite(prices[key] as number) || (prices[key] as number) < 0) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if value is a number and is valid (finite, non-negative)
 */
export const isValidNumber = (value: unknown): value is number => {
  return (
    typeof value === 'number' &&
    isFinite(value) &&
    !isNaN(value) &&
    value >= 0
  );
};

/**
 * Check if value is a non-empty string
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

