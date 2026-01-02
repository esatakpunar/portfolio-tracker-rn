/**
 * Currency Utility Functions
 * 
 * Currency type'ları için icon, color, symbol utility fonksiyonları
 */

import { CurrencyType } from '../types';

/**
 * Get currency icon
 */
export const getCurrencyIcon = (currency: CurrencyType): string => {
  const icons: Record<CurrencyType, string> = {
    'TL': '₺',
    'USD': '$',
    'EUR': '€',
    'ALTIN': '₲',
  };
  return icons[currency];
};

/**
 * Get currency color
 */
export const getCurrencyColor = (currency: CurrencyType): string => {
  const colors: Record<CurrencyType, string> = {
    'TL': '#dc2626',
    'USD': '#10b981',
    'EUR': '#3b82f6',
    'ALTIN': '#f59e0b',
  };
  return colors[currency];
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: CurrencyType): string => {
  const symbols: Record<CurrencyType, string> = {
    'TL': '₺',
    'USD': '$',
    'EUR': '€',
    'ALTIN': '₲',
  };
  return symbols[currency];
};

