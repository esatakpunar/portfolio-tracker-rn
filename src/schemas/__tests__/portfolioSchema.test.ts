/**
 * Portfolio Schema Tests
 */

import {
  validatePortfolioItem,
  safeValidatePortfolioItem,
  validatePortfolioState,
  safeValidatePortfolioState,
} from '../portfolioSchema';

describe('portfolioSchema', () => {
  describe('validatePortfolioItem', () => {
    it('should validate valid portfolio item', () => {
      const validItem = {
        id: '123',
        type: '22_ayar',
        amount: 10,
        date: new Date().toISOString(),
        description: 'Test item',
      };

      expect(() => validatePortfolioItem(validItem)).not.toThrow();
      const result = validatePortfolioItem(validItem);
      expect(result).toEqual(validItem);
    });

    it('should reject invalid portfolio item (negative amount)', () => {
      const invalidItem = {
        id: '123',
        type: '22_ayar',
        amount: -10,
        date: new Date().toISOString(),
      };

      expect(() => validatePortfolioItem(invalidItem)).toThrow();
    });

    it('should reject invalid portfolio item (zero amount)', () => {
      const invalidItem = {
        id: '123',
        type: '22_ayar',
        amount: 0,
        date: new Date().toISOString(),
      };

      expect(() => validatePortfolioItem(invalidItem)).toThrow();
    });

    it('should reject invalid portfolio item (invalid type)', () => {
      const invalidItem = {
        id: '123',
        type: 'invalid_type',
        amount: 10,
        date: new Date().toISOString(),
      };

      expect(() => validatePortfolioItem(invalidItem)).toThrow();
    });

    it('should reject invalid portfolio item (missing required field)', () => {
      const invalidItem = {
        id: '123',
        type: '22_ayar',
        // amount missing
        date: new Date().toISOString(),
      };

      expect(() => validatePortfolioItem(invalidItem)).toThrow();
    });
  });

  describe('safeValidatePortfolioItem', () => {
    it('should return success for valid portfolio item', () => {
      const validItem = {
        id: '123',
        type: '22_ayar',
        amount: 10,
        date: new Date().toISOString(),
      };

      const result = safeValidatePortfolioItem(validItem);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validItem);
    });

    it('should return error for invalid portfolio item', () => {
      const invalidItem = {
        id: '123',
        type: '22_ayar',
        amount: -10,
        date: new Date().toISOString(),
      };

      const result = safeValidatePortfolioItem(invalidItem);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validatePortfolioState', () => {
    it('should validate valid portfolio state', () => {
      const validState = {
        items: [
          {
            id: '1',
            type: '22_ayar',
            amount: 10,
            date: new Date().toISOString(),
          },
        ],
        prices: {
          '22_ayar': 2300,
          '24_ayar': 2500,
          ceyrek: 4000,
          tam: 16000,
          usd: 34,
          eur: 36,
          tl: 1,
          gumus: 30,
        },
        history: [],
        currentLanguage: 'tr',
      };

      expect(() => validatePortfolioState(validState)).not.toThrow();
    });

    it('should reject invalid portfolio state (invalid items)', () => {
      const invalidState = {
        items: [
          {
            id: '1',
            type: '22_ayar',
            amount: -10, // Invalid
            date: new Date().toISOString(),
          },
        ],
        prices: {
          '22_ayar': 2300,
          '24_ayar': 2500,
          ceyrek: 4000,
          tam: 16000,
          usd: 34,
          eur: 36,
          tl: 1,
          gumus: 30,
        },
        history: [],
        currentLanguage: 'tr',
      };

      expect(() => validatePortfolioState(invalidState)).toThrow();
    });

    it('should reject invalid portfolio state (invalid language)', () => {
      const invalidState = {
        items: [],
        prices: {
          '22_ayar': 2300,
          '24_ayar': 2500,
          ceyrek: 4000,
          tam: 16000,
          usd: 34,
          eur: 36,
          tl: 1,
          gumus: 30,
        },
        history: [],
        currentLanguage: 'invalid_language_code_too_long',
      };

      expect(() => validatePortfolioState(invalidState)).toThrow();
    });
  });

  describe('safeValidatePortfolioState', () => {
    it('should return success for valid portfolio state', () => {
      const validState = {
        items: [],
        prices: {
          '22_ayar': 2300,
          '24_ayar': 2500,
          ceyrek: 4000,
          tam: 16000,
          usd: 34,
          eur: 36,
          tl: 1,
          gumus: 30,
        },
        history: [],
        currentLanguage: 'tr',
      };

      const result = safeValidatePortfolioState(validState);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for invalid portfolio state', () => {
      const invalidState = {
        items: [],
        prices: {
          '22_ayar': -100, // Invalid
          '24_ayar': 2500,
          ceyrek: 4000,
          tam: 16000,
          usd: 34,
          eur: 36,
          tl: 1,
          gumus: 30,
        },
        history: [],
        currentLanguage: 'tr',
      };

      const result = safeValidatePortfolioState(invalidState);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

