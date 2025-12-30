/**
 * Migration System Tests
 */

import { migrateState, validateState } from '../index';
import { PersistedState } from '../types';
import { initialState } from '../../portfolioSlice';

// Mock logger to suppress console output
jest.mock('../../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('migrations', () => {
  describe('migrateState', () => {
    it('should return initialState when state is undefined', async () => {
      const result = await migrateState(undefined, 1);

      expect(result._persist?.version).toBe(1);
      expect(result.portfolio).toEqual(initialState);
    });

    it('should return state when already at current version', async () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: initialState,
      };

      const result = await migrateState(state, 1);

      expect(result).toEqual(state);
    });

    it('should return state when version is higher than current', async () => {
      const state: PersistedState = {
        _persist: { version: 2, rehydrated: false },
        portfolio: initialState,
      };

      const result = await migrateState(state, 1);

      expect(result).toEqual(state);
    });

    it('should update version when no migration needed', async () => {
      const state: PersistedState = {
        _persist: { version: 0, rehydrated: false },
        portfolio: initialState,
      };

      const result = await migrateState(state, 1);

      expect(result._persist?.version).toBe(1);
      expect(result.portfolio).toEqual(initialState);
    });

    it('should handle state without _persist', async () => {
      const state: PersistedState = {
        portfolio: initialState,
      };

      const result = await migrateState(state, 1);

      expect(result._persist?.version).toBe(1);
      expect(result.portfolio).toEqual(initialState);
    });
  });

  describe('validateState', () => {
    it('should return false for undefined state', () => {
      expect(validateState(undefined)).toBe(false);
    });

    it('should return false for state without portfolio', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
      };

      expect(validateState(state)).toBe(false);
    });

    it('should return false for invalid portfolio structure', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
          items: 'invalid', // Should be array
          prices: {},
          history: [],
          currentLanguage: 'tr',
        },
      };

      expect(validateState(state)).toBe(false);
    });

    it('should return false when items is not array', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
          items: {} as any,
          prices: {},
          history: [],
          currentLanguage: 'tr',
        },
      };

      expect(validateState(state)).toBe(false);
    });

    it('should return false when prices is not object', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
          items: [],
          prices: [] as any,
          history: [],
          currentLanguage: 'tr',
        },
      };

      expect(validateState(state)).toBe(false);
    });

    it('should return false when history is not array', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
          items: [],
          prices: {},
          history: {} as any,
          currentLanguage: 'tr',
        },
      };

      expect(validateState(state)).toBe(false);
    });

    it('should return false when currentLanguage is not string', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
          items: [],
          prices: {},
          history: [],
          currentLanguage: 123 as any,
        },
      };

      expect(validateState(state)).toBe(false);
    });

    it('should return true for valid state', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
          items: [],
          prices: {},
          history: [],
          currentLanguage: 'tr',
        },
      };

      expect(validateState(state)).toBe(true);
    });

    it('should return true for state with valid portfolio data', () => {
      const state: PersistedState = {
        _persist: { version: 1, rehydrated: false },
        portfolio: {
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
            usd: 34,
          },
          history: [],
          currentLanguage: 'tr',
        },
      };

      expect(validateState(state)).toBe(true);
    });
  });
});

