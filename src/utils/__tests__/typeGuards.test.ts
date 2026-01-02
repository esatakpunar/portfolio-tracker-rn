/**
 * Type Guards Tests
 */

import {
  isAssetType,
  isCurrencyType,
  isPortfolioItem,
  isHistoryItem,
  isPrices,
  isValidNumber,
  isNonEmptyString,
} from '../typeGuards';
import { AssetType, CurrencyType, PortfolioItem, HistoryItem, Prices } from '../../types';

describe('typeGuards', () => {
  describe('isAssetType', () => {
    it('should return true for valid asset types', () => {
      const validTypes: AssetType[] = [
        '22_ayar',
        '24_ayar',
        'ceyrek',
        'tam',
        'usd',
        'eur',
        'tl',
        'gumus',
      ];
      validTypes.forEach((type) => {
        expect(isAssetType(type)).toBe(true);
      });
    });

    it('should return false for invalid asset types', () => {
      expect(isAssetType('invalid')).toBe(false);
      expect(isAssetType('')).toBe(false);
      expect(isAssetType(null)).toBe(false);
      expect(isAssetType(undefined)).toBe(false);
      expect(isAssetType(123)).toBe(false);
      expect(isAssetType({})).toBe(false);
    });
  });

  describe('isCurrencyType', () => {
    it('should return true for valid currency types', () => {
      const validTypes: CurrencyType[] = ['TL', 'USD', 'EUR', 'ALTIN'];
      validTypes.forEach((type) => {
        expect(isCurrencyType(type)).toBe(true);
      });
    });

    it('should return false for invalid currency types', () => {
      expect(isCurrencyType('invalid')).toBe(false);
      expect(isCurrencyType('')).toBe(false);
      expect(isCurrencyType(null)).toBe(false);
      expect(isCurrencyType(undefined)).toBe(false);
      expect(isCurrencyType(123)).toBe(false);
    });
  });

  describe('isPortfolioItem', () => {
    it('should return true for valid portfolio items', () => {
      const validItem: PortfolioItem = {
        id: '1',
        type: '22_ayar',
        amount: 10,
        date: '2024-01-01T00:00:00.000Z',
        description: 'Test',
      };
      expect(isPortfolioItem(validItem)).toBe(true);

      const itemWithoutDescription: PortfolioItem = {
        id: '2',
        type: 'usd',
        amount: 100,
        date: '2024-01-01T00:00:00.000Z',
      };
      expect(isPortfolioItem(itemWithoutDescription)).toBe(true);
    });

    it('should return false for invalid portfolio items', () => {
      expect(isPortfolioItem(null)).toBe(false);
      expect(isPortfolioItem(undefined)).toBe(false);
      expect(isPortfolioItem({})).toBe(false);
      expect(isPortfolioItem({ id: '1' })).toBe(false);
      expect(isPortfolioItem({ id: '1', type: 'invalid' })).toBe(false);
      expect(isPortfolioItem({ id: '1', type: '22_ayar', amount: 'invalid' })).toBe(false);
    });
  });

  describe('isHistoryItem', () => {
    it('should return true for valid history items', () => {
      const validItem: HistoryItem = {
        type: 'add',
        item: {
          id: '1',
          type: '22_ayar',
          amount: 10,
          date: '2024-01-01T00:00:00.000Z',
        },
        date: '2024-01-01T00:00:00.000Z',
        description: 'Test',
      };
      expect(isHistoryItem(validItem)).toBe(true);

      const removeItem: HistoryItem = {
        type: 'remove',
        item: {
          id: '2',
          type: 'usd',
          amount: 100,
          date: '2024-01-01T00:00:00.000Z',
        },
        date: '2024-01-01T00:00:00.000Z',
      };
      expect(isHistoryItem(removeItem)).toBe(true);
    });

    it('should return false for invalid history items', () => {
      expect(isHistoryItem(null)).toBe(false);
      expect(isHistoryItem(undefined)).toBe(false);
      expect(isHistoryItem({})).toBe(false);
      expect(isHistoryItem({ type: 'invalid' })).toBe(false);
      expect(isHistoryItem({ type: 'add' })).toBe(false);
    });
  });

  describe('isPrices', () => {
    it('should return true for valid prices', () => {
      const validPrices: Prices = {
        '22_ayar': 2300,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };
      expect(isPrices(validPrices)).toBe(true);
    });

    it('should return false for invalid prices', () => {
      expect(isPrices(null)).toBe(false);
      expect(isPrices(undefined)).toBe(false);
      expect(isPrices({})).toBe(false);
      expect(isPrices({ '22_ayar': 2300 })).toBe(false);
      expect(isPrices({ '22_ayar': 'invalid' })).toBe(false);
      expect(isPrices({ '22_ayar': -1 })).toBe(false);
      expect(isPrices({ '22_ayar': NaN })).toBe(false);
      expect(isPrices({ '22_ayar': Infinity })).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(1)).toBe(true);
      expect(isValidNumber(100.5)).toBe(true);
      expect(isValidNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isValidNumber(-1)).toBe(false);
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
      expect(isValidNumber('123')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString('   test   ')).toBe(true); // Trimmed
    });

    it('should return false for empty or invalid strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });
});

