/**
 * Validation Utils Tests
 */

import { validateAmount, validateRemoveAmount, parseAmount } from '../validationUtils';

describe('validationUtils', () => {
  describe('validateAmount', () => {
    it('should validate positive number', () => {
      const result = validateAmount('10.5');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10.5);
    });

    it('should reject empty string', () => {
      const result = validateAmount('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject negative number', () => {
      const result = validateAmount('-10');
      expect(result.isValid).toBe(false);
    });

    it('should reject zero', () => {
      const result = validateAmount('0');
      expect(result.isValid).toBe(false);
    });

    it('should handle comma as decimal separator', () => {
      const result = validateAmount('10,5');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10.5);
    });

    it('should reject invalid number format', () => {
      const result = validateAmount('abc');
      expect(result.isValid).toBe(false);
    });

    it('should reject numbers exceeding max limit', () => {
      const result = validateAmount('10000000000000'); // > 1 trillion
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateRemoveAmount', () => {
    it('should validate amount less than current', () => {
      const result = validateRemoveAmount('5', 10);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should reject amount greater than current', () => {
      const result = validateRemoveAmount('15', 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should validate amount equal to current', () => {
      const result = validateRemoveAmount('10', 10);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10);
    });
  });

  describe('parseAmount', () => {
    it('should parse valid number', () => {
      expect(parseAmount('10.5')).toBe(10.5);
    });

    it('should handle comma as decimal separator', () => {
      expect(parseAmount('10,5')).toBe(10.5);
    });

    it('should return 0 for invalid input', () => {
      expect(parseAmount('abc')).toBe(0);
    });
  });
});

