/**
 * Prices Schema Tests
 */

import { validatePrices, safeValidatePrices, validateApiResponse, safeValidateApiResponse } from '../pricesSchema';

describe('pricesSchema', () => {
  describe('validatePrices', () => {
    it('should validate valid prices object', () => {
      const validPrices = {
        '22_ayar': 2300,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      expect(() => validatePrices(validPrices)).not.toThrow();
      const result = validatePrices(validPrices);
      expect(result).toEqual(validPrices);
    });

    it('should reject invalid prices (negative)', () => {
      const invalidPrices = {
        '22_ayar': -100,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      expect(() => validatePrices(invalidPrices)).toThrow();
    });

    it('should reject invalid prices (NaN)', () => {
      const invalidPrices = {
        '22_ayar': NaN,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      expect(() => validatePrices(invalidPrices)).toThrow();
    });

    it('should reject invalid prices (Infinity)', () => {
      const invalidPrices = {
        '22_ayar': Infinity,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      expect(() => validatePrices(invalidPrices)).toThrow();
    });

    it('should reject invalid prices (wrong type)', () => {
      const invalidPrices = {
        '22_ayar': '2300', // String instead of number
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      expect(() => validatePrices(invalidPrices)).toThrow();
    });

    it('should reject prices with extra fields (strict mode)', () => {
      const invalidPrices = {
        '22_ayar': 2300,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
        extraField: 'should not be here',
      };

      expect(() => validatePrices(invalidPrices)).toThrow();
    });
  });

  describe('safeValidatePrices', () => {
    it('should return success for valid prices', () => {
      const validPrices = {
        '22_ayar': 2300,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      const result = safeValidatePrices(validPrices);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validPrices);
    });

    it('should return error for invalid prices', () => {
      const invalidPrices = {
        '22_ayar': -100,
        '24_ayar': 2500,
        ceyrek: 4000,
        tam: 16000,
        usd: 34,
        eur: 36,
        tl: 1,
        gumus: 30,
      };

      const result = safeValidatePrices(invalidPrices);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateApiResponse', () => {
    it('should validate valid API response', () => {
      const validResponse = {
        USD: { Buying: '34.50' },
        EUR: { Buying: '36.20' },
        GUMUS: { Buying: '30.00' },
        TAMALTIN: { Buying: '16000' },
        CEYREKALTIN: { Buying: '4000' },
        YIA: { Buying: '2300' },
        GRA: { Buying: '2500' },
      };

      expect(() => validateApiResponse(validResponse)).not.toThrow();
    });

    it('should validate API response with missing fields', () => {
      const partialResponse = {
        USD: { Buying: '34.50' },
        EUR: { Buying: '36.20' },
      };

      expect(() => validateApiResponse(partialResponse)).not.toThrow();
    });

    it('should validate API response with extra fields (passthrough)', () => {
      const responseWithExtra = {
        USD: { Buying: '34.50' },
        EUR: { Buying: '36.20' },
        EXTRA_FIELD: 'should be allowed',
      };

      expect(() => validateApiResponse(responseWithExtra)).not.toThrow();
    });
  });

  describe('safeValidateApiResponse', () => {
    it('should return success for valid API response', () => {
      const validResponse = {
        USD: { Buying: '34.50' },
        EUR: { Buying: '36.20' },
      };

      const result = safeValidateApiResponse(validResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for invalid API response', () => {
      const invalidResponse = null;

      const result = safeValidateApiResponse(invalidResponse);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

