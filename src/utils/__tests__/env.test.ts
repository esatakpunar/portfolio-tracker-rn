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
      // Mock to throw error
      const originalGlobal = global;
      Object.defineProperty(global, '__DEV__', {
        get: () => {
          throw new Error('Test error');
        },
      });

      expect(isDevelopment()).toBe(true); // Should return true as fallback

      // Restore
      Object.defineProperty(global, '__DEV__', {
        get: () => originalGlobal.__DEV__,
      });
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

