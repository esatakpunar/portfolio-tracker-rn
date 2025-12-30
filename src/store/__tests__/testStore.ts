/**
 * Test Store Setup
 * 
 * Redux store test setup utilities
 */

import { configureStore } from '@reduxjs/toolkit';
import portfolioReducer, { initialState } from '../portfolioSlice';

/**
 * Test için Redux store oluştur
 * Persist olmadan, sadece reducer ile
 */
export const createTestStore = () => {
  return configureStore({
    reducer: {
      portfolio: portfolioReducer,
    },
  });
};

/**
 * Test için mock state oluştur
 */
export const createMockPortfolioState = (overrides?: Partial<typeof initialState>) => {
  return {
    ...initialState,
    ...overrides,
  };
};

// Test suite - utility functions test
describe('testStore utilities', () => {
  it('should create test store', () => {
    const store = createTestStore();
    expect(store).toBeDefined();
    expect(store.getState).toBeDefined();
    expect(store.dispatch).toBeDefined();
  });

  it('should create mock portfolio state', () => {
    const mockState = createMockPortfolioState();
    expect(mockState).toEqual(initialState);
  });

  it('should create mock portfolio state with overrides', () => {
    const mockState = createMockPortfolioState({
      currentLanguage: 'en',
    });
    expect(mockState.currentLanguage).toBe('en');
    expect(mockState.items).toEqual(initialState.items);
  });
});

