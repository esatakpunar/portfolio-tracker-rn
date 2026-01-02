/**
 * Currency Utils Tests
 */

import { getCurrencyIcon, getCurrencyColor, getCurrencySymbol } from '../currencyUtils';
import { CurrencyType } from '../../types';

describe('currencyUtils', () => {
  describe('getCurrencyIcon', () => {
    it('should return correct icon for each currency', () => {
      expect(getCurrencyIcon('TL')).toBe('₺');
      expect(getCurrencyIcon('USD')).toBe('$');
      expect(getCurrencyIcon('EUR')).toBe('€');
      expect(getCurrencyIcon('ALTIN')).toBe('₲');
    });
  });

  describe('getCurrencyColor', () => {
    it('should return correct color for each currency', () => {
      expect(getCurrencyColor('TL')).toBe('#dc2626');
      expect(getCurrencyColor('USD')).toBe('#10b981');
      expect(getCurrencyColor('EUR')).toBe('#3b82f6');
      expect(getCurrencyColor('ALTIN')).toBe('#f59e0b');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for each currency', () => {
      expect(getCurrencySymbol('TL')).toBe('₺');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('ALTIN')).toBe('₲');
    });
  });
});

