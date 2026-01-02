/**
 * Storage Utils Tests
 */

import {
  estimateStorageSize,
  cleanupHistory,
  STORAGE_LIMITS,
} from '../storageUtils';
import { HistoryItem } from '../../types';

describe('storageUtils', () => {
  describe('estimateStorageSize', () => {
    it('should estimate size for simple values', () => {
      expect(estimateStorageSize('test')).toBeGreaterThan(0);
      expect(estimateStorageSize(123)).toBeGreaterThan(0);
      expect(estimateStorageSize({ key: 'value' })).toBeGreaterThan(0);
      expect(estimateStorageSize([1, 2, 3])).toBeGreaterThan(0);
    });

    it('should handle null and undefined', () => {
      expect(estimateStorageSize(null)).toBeGreaterThanOrEqual(0);
      expect(estimateStorageSize(undefined)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanupHistory', () => {
    const createHistoryItem = (date: string): HistoryItem => ({
      type: 'add',
      item: {
        id: '1',
        type: '22_ayar',
        amount: 10,
        date: new Date().toISOString(),
      },
      date,
    });

    it('should return same array if under threshold', () => {
      const items = [
        createHistoryItem('2024-01-01T00:00:00.000Z'),
        createHistoryItem('2024-01-02T00:00:00.000Z'),
      ];
      const result = cleanupHistory(items, 100);
      expect(result).toEqual(items);
    });

    it('should cleanup items over threshold', () => {
      const items: HistoryItem[] = [];
      // Create more items than threshold
      for (let i = 0; i < 1500; i++) {
        items.push(createHistoryItem(new Date(2024, 0, i + 1).toISOString()));
      }

      const result = cleanupHistory(items, STORAGE_LIMITS.MAX_HISTORY_ITEMS);
      expect(result.length).toBe(STORAGE_LIMITS.MAX_HISTORY_ITEMS);
      expect(result.length).toBeLessThan(items.length);
    });

    it('should keep newest items', () => {
      const items: HistoryItem[] = [];
      for (let i = 0; i < 100; i++) {
        items.push(createHistoryItem(new Date(2024, 0, i + 1).toISOString()));
      }

      const result = cleanupHistory(items, 50);
      expect(result.length).toBe(50);
      
      // Check that newest items are kept (sorted by date descending)
      const newestDate = new Date(result[0].date).getTime();
      const oldestDate = new Date(result[result.length - 1].date).getTime();
      expect(newestDate).toBeGreaterThanOrEqual(oldestDate);
    });

    it('should handle empty array', () => {
      const result = cleanupHistory([], 100);
      expect(result).toEqual([]);
    });
  });
});

