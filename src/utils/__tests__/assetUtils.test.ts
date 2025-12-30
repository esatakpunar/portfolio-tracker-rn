/**
 * Asset Utils Tests
 */

import { getAssetIcon, getAssetColor, getAssetUnit } from '../assetUtils';
import { AssetType } from '../../types';

describe('assetUtils', () => {
  const mockT = (key: string): string => {
    const translations: Record<string, string> = {
      'units.piece': 'Adet',
      'units.gram': 'Gram',
    };
    return translations[key] || key;
  };

  describe('getAssetIcon', () => {
    it('should return correct icon for TL', () => {
      expect(getAssetIcon('tl')).toBe('₺');
    });

    it('should return correct icon for USD', () => {
      expect(getAssetIcon('usd')).toBe('$');
    });

    it('should return correct icon for EUR', () => {
      expect(getAssetIcon('eur')).toBe('€');
    });

    it('should return correct icon for GUMUS', () => {
      expect(getAssetIcon('gumus')).toBe('₲');
    });

    it('should return correct icon for TAM', () => {
      expect(getAssetIcon('tam')).toBe('₲');
    });

    it('should return correct icon for CEYREK', () => {
      expect(getAssetIcon('ceyrek')).toBe('₲');
    });

    it('should return correct icon for 22_ayar', () => {
      expect(getAssetIcon('22_ayar')).toBe('₲');
    });

    it('should return correct icon for 24_ayar', () => {
      expect(getAssetIcon('24_ayar')).toBe('₲');
    });

    it('should return default icon for unknown type', () => {
      expect(getAssetIcon('unknown' as AssetType)).toBe('₲');
    });
  });

  describe('getAssetColor', () => {
    it('should return correct color for TL', () => {
      expect(getAssetColor('tl')).toBe('#dc2626');
    });

    it('should return correct color for USD', () => {
      expect(getAssetColor('usd')).toBe('#10b981');
    });

    it('should return correct color for EUR', () => {
      expect(getAssetColor('eur')).toBe('#3b82f6');
    });

    it('should return correct color for GUMUS', () => {
      expect(getAssetColor('gumus')).toBe('#6b7280');
    });

    it('should return correct color for TAM', () => {
      expect(getAssetColor('tam')).toBe('#f59e0b');
    });

    it('should return correct color for CEYREK', () => {
      expect(getAssetColor('ceyrek')).toBe('#f59e0b');
    });

    it('should return correct color for 22_ayar', () => {
      expect(getAssetColor('22_ayar')).toBe('#f59e0b');
    });

    it('should return correct color for 24_ayar', () => {
      expect(getAssetColor('24_ayar')).toBe('#f59e0b');
    });

    it('should return default color for unknown type', () => {
      expect(getAssetColor('unknown' as AssetType)).toBe('#6366f1');
    });
  });

  describe('getAssetUnit', () => {
    it('should return "Adet" for ceyrek', () => {
      expect(getAssetUnit('ceyrek', mockT)).toBe('Adet');
    });

    it('should return "Adet" for tam', () => {
      expect(getAssetUnit('tam', mockT)).toBe('Adet');
    });

    it('should return "TL" for tl', () => {
      expect(getAssetUnit('tl', mockT)).toBe('TL');
    });

    it('should return "USD" for usd', () => {
      expect(getAssetUnit('usd', mockT)).toBe('USD');
    });

    it('should return "EUR" for eur', () => {
      expect(getAssetUnit('eur', mockT)).toBe('EUR');
    });

    it('should return "Gram" for 22_ayar', () => {
      expect(getAssetUnit('22_ayar', mockT)).toBe('Gram');
    });

    it('should return "Gram" for 24_ayar', () => {
      expect(getAssetUnit('24_ayar', mockT)).toBe('Gram');
    });

    it('should return "Gram" for gumus', () => {
      expect(getAssetUnit('gumus', mockT)).toBe('Gram');
    });
  });
});

