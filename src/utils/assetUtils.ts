import { AssetType } from '../types';
import { colors } from '../theme';

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
    'tl': colors.negative,
    'usd': colors.positive,
    'eur': colors.accent,
    'gumus': colors.textMuted,
    'tam': colors.warning,
    'ceyrek': colors.warning,
    '22_ayar': colors.warning,
    '24_ayar': colors.warning,
  };
  return colorMap[type] || colors.accent;
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
