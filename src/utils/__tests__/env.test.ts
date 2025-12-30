/**
 * Env Utils Tests
 */

import { isDevelopment, isProduction } from '../env';

describe('env utils', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalGlobal = global;

  beforeEach(() => {
    // Reset mocks
    delete (global as any).__DEV__;
    delete (window as any).__DEV__;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('isDevelopment', () => {
    it('should return true when __DEV__ is true in global', () => {
      (global as any).__DEV__ = true;
      expect(isDevelopment()).toBe(true);
    });

    it('should return false when __DEV__ is false in global', () => {
      (global as any).__DEV__ = false;
      expect(isDevelopment()).toBe(false);
    });

    it('should return true when __DEV__ is true in window', () => {
      (window as any).__DEV__ = true;
      expect(isDevelopment()).toBe(true);
    });

    it('should return true when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isDevelopment()).toBe(false);
    });

    it('should return true as fallback when no env variables', () => {
      delete process.env.NODE_ENV;
      expect(isDevelopment()).toBe(true);
    });

    it('should handle errors gracefully', () => {
      // Mock global.__DEV__ to throw error when accessed
      const originalDev = (global as any).__DEV__;
      try {
        // Delete first to avoid redefine error
        delete (global as any).__DEV__;
        
        // Create a getter that throws
        let accessCount = 0;
        Object.defineProperty(global, '__DEV__', {
          get: () => {
            accessCount++;
            if (accessCount === 1) {
              throw new Error('Test error');
            }
            return originalDev;
          },
          configurable: true,
        });

        // First call should throw and return fallback
        const result = isDevelopment();
        expect(result).toBe(true); // Should return true as fallback
      } finally {
        // Clean up
        delete (global as any).__DEV__;
        if (originalDev !== undefined) {
          (global as any).__DEV__ = originalDev;
        }
      }
    });
  });

  describe('isProduction', () => {
    it('should return false when isDevelopment returns true', () => {
      (global as any).__DEV__ = true;
      expect(isProduction()).toBe(false);
    });

    it('should return true when isDevelopment returns false', () => {
      (global as any).__DEV__ = false;
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });

    it('should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });
  });
});

