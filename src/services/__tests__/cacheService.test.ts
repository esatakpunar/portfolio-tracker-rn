import {
  getCachedData,
  setCachedData,
  removeCachedData,
  clearCache,
  getCacheStats,
  isCached,
  getCacheAge,
} from '../cacheService';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('cacheService', () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  describe('getCachedData', () => {
    it('should return null for non-existent cache', () => {
      const result = getCachedData('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached data when it exists and is not expired', () => {
      const testData = { foo: 'bar' };
      setCachedData('test-key', testData, 5000); // 5 second TTL

      const result = getCachedData('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache', (done) => {
      const testData = { foo: 'bar' };
      setCachedData('test-key', testData, 100); // 100ms TTL

      setTimeout(() => {
        const result = getCachedData('test-key');
        expect(result).toBeNull();
        done();
      }, 150);
    });
  });

  describe('setCachedData', () => {
    it('should cache data with default TTL', () => {
      const testData = { foo: 'bar' };
      setCachedData('test-key', testData);

      const result = getCachedData('test-key');
      expect(result).toEqual(testData);
    });

    it('should cache data with custom TTL', () => {
      const testData = { foo: 'bar' };
      setCachedData('test-key', testData, 1000);

      const result = getCachedData('test-key');
      expect(result).toEqual(testData);
    });

    it('should overwrite existing cache', () => {
      setCachedData('test-key', { foo: 'bar' });
      setCachedData('test-key', { foo: 'baz' });

      const result = getCachedData('test-key');
      expect(result).toEqual({ foo: 'baz' });
    });
  });

  describe('removeCachedData', () => {
    it('should remove cached data', () => {
      setCachedData('test-key', { foo: 'bar' });
      removeCachedData('test-key');

      const result = getCachedData('test-key');
      expect(result).toBeNull();
    });

    it('should handle removing non-existent cache', () => {
      expect(() => removeCachedData('non-existent')).not.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      setCachedData('key1', { foo: 'bar' });
      setCachedData('key2', { baz: 'qux' });

      clearCache();

      expect(getCachedData('key1')).toBeNull();
      expect(getCachedData('key2')).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      setCachedData('key1', { foo: 'bar' });
      setCachedData('key2', { baz: 'qux' });

      const stats = getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should return empty stats for empty cache', () => {
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('isCached', () => {
    it('should return true for valid cached data', () => {
      setCachedData('test-key', { foo: 'bar' }, 5000);
      expect(isCached('test-key')).toBe(true);
    });

    it('should return false for non-existent cache', () => {
      expect(isCached('non-existent')).toBe(false);
    });

    it('should return false for expired cache', (done) => {
      setCachedData('test-key', { foo: 'bar' }, 100);

      setTimeout(() => {
        expect(isCached('test-key')).toBe(false);
        done();
      }, 150);
    });
  });

  describe('getCacheAge', () => {
    it('should return cache age in milliseconds', (done) => {
      setCachedData('test-key', { foo: 'bar' });

      setTimeout(() => {
        const age = getCacheAge('test-key');
        expect(age).toBeGreaterThan(0);
        expect(age).toBeLessThan(200); // Should be around 100ms
        done();
      }, 100);
    });

    it('should return null for non-existent cache', () => {
      const age = getCacheAge('non-existent');
      expect(age).toBeNull();
    });
  });
});

