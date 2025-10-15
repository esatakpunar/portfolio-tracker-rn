import { AssetType } from '../types';

export const getAssetIcon = (type: AssetType): string => {
  const iconMap: Record<AssetType, string> = {
    'tl': '₺',
    'usd': '$',
    'eur': '€',
    'gumus': '₲',
    'tam': '₲',
    'ceyrek': '₲',
    '22_ayar': '₲',
    '24_ayar': '₲',
  };
  return iconMap[type] || '₲';
};

export const getAssetColor = (type: AssetType): string => {
  const colorMap: Record<AssetType, string> = {
    'tl': '#dc2626',
    'usd': '#10b981',
    'eur': '#3b82f6',
    'gumus': '#6b7280',
    'tam': '#f59e0b',
    'ceyrek': '#f59e0b',
    '22_ayar': '#f59e0b',
    '24_ayar': '#f59e0b',
  };
  return colorMap[type] || '#6366f1';
};

export const getAssetUnit = (type: AssetType, t: (key: string) => string): string => {
  if (type === 'ceyrek' || type === 'tam') {
    return t('units.piece');
  }
  if (type === 'tl') {
    return 'TL';
  }
  if (type === 'usd') {
    return 'USD';
  }
  if (type === 'eur') {
    return 'EUR';
  }
  return t('units.gram');
};
