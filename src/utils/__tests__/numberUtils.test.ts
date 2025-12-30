/**
 * Number Utils Tests
 */

import { safeAdd, safeSubtract, safeMultiply, safeDivide, roundToDecimals } from '../numberUtils';

describe('numberUtils', () => {
  describe('safeAdd', () => {
    it('should add two numbers correctly', () => {
      expect(safeAdd(1.1, 2.2)).toBeCloseTo(3.3, 5);
    });

    it('should handle floating point precision errors', () => {
      expect(safeAdd(0.1, 0.2)).toBeCloseTo(0.3, 5);
    });

    it('should handle large numbers', () => {
      expect(safeAdd(1000000, 2000000)).toBe(3000000);
    });
  });

  describe('safeSubtract', () => {
    it('should subtract two numbers correctly', () => {
      expect(safeSubtract(3.3, 2.2)).toBeCloseTo(1.1, 5);
    });

    it('should handle floating point precision errors', () => {
      expect(safeSubtract(0.3, 0.1)).toBeCloseTo(0.2, 5);
    });

    it('should handle negative results', () => {
      expect(safeSubtract(1, 2)).toBe(-1);
    });
  });

  describe('safeMultiply', () => {
    it('should multiply two numbers correctly', () => {
      expect(safeMultiply(2.5, 4)).toBe(10);
    });

    it('should handle decimal multiplication', () => {
      expect(safeMultiply(0.1, 0.2)).toBeCloseTo(0.02, 5);
    });
  });

  describe('safeDivide', () => {
    it('should divide two numbers correctly', () => {
      expect(safeDivide(10, 2)).toBe(5);
    });

    it('should handle decimal division', () => {
      expect(safeDivide(1, 3)).toBeCloseTo(0.333333, 5);
    });

    it('should return 0 when dividing by zero', () => {
      expect(safeDivide(10, 0)).toBe(0);
    });
  });

  describe('roundToDecimals', () => {
    it('should round to specified decimal places', () => {
      expect(roundToDecimals(1.234567, 2)).toBe(1.23);
    });

    it('should handle epsilon for floating point errors', () => {
      expect(roundToDecimals(1.005, 2)).toBe(1.01);
    });
  });
});

