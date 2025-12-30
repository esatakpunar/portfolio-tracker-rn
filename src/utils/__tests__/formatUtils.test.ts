/**
 * Format Utils Tests
 */

import { formatCurrency, formatDate, formatRelativeDate } from '../formatUtils';

// Mock i18n t function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
  };
  return translations[key] || key;
};

describe('formatUtils', () => {
  describe('formatCurrency', () => {
    it('should format number as currency for Turkish locale', () => {
      const result = formatCurrency(1234.56, 'tr');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should format number as currency for English locale', () => {
      const result = formatCurrency(1234.56, 'en');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0, 'tr');
      expect(result).toBe('0,00');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000, 'tr');
      expect(result).toContain('1');
      expect(result).toContain('000');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date, 'tr');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatRelativeDate', () => {
    it('should return time for today', () => {
      const now = new Date();
      const result = formatRelativeDate(now.toISOString(), 'tr', mockT);
      expect(result).toContain(':');
    });

    it('should return "yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatRelativeDate(yesterday.toISOString(), 'en', mockT);
      expect(result).toBe('Yesterday');
    });

    it('should return "X days ago" for older dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = formatRelativeDate(threeDaysAgo.toISOString(), 'en', mockT);
      expect(result).toContain('3');
      expect(result).toContain('days ago');
    });
  });
});

