/**
 * Portfolio Slice Tests
 * 
 * Redux portfolio slice için unit testler
 */

import { createTestStore } from './testStore';
import {
  addItem,
  removeItem,
  updateItemAmount,
  selectTotalTL,
  selectTotalIn,
  fetchPrices,
} from '../portfolioSlice';
import { AssetType } from '../../types';

describe('portfolioSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('addItem', () => {
    it('should add item correctly', () => {
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 10,
          description: 'Test item',
        })
      );

      const state = store.getState();
      expect(state.portfolio.items).toHaveLength(1);
      expect(state.portfolio.items[0].type).toBe('22_ayar');
      expect(state.portfolio.items[0].amount).toBe(10);
      expect(state.portfolio.items[0].description).toBe('Test item');
      expect(state.portfolio.items[0].id).toBeDefined();
      expect(state.portfolio.items[0].date).toBeDefined();
    });

    it('should add item to history', () => {
      store.dispatch(
        addItem({
          type: 'usd',
          amount: 100,
        })
      );

      const state = store.getState();
      expect(state.portfolio.history).toHaveLength(1);
      expect(state.portfolio.history[0].type).toBe('add');
      expect(state.portfolio.history[0].item.type).toBe('usd');
      expect(state.portfolio.history[0].item.amount).toBe(100);
    });

    it('should not add item with invalid amount', () => {
      const initialState = store.getState();
      
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: -10, // Invalid
        })
      );

      const state = store.getState();
      expect(state.portfolio.items).toHaveLength(initialState.portfolio.items.length);
    });

    it('should not add item with zero amount', () => {
      const initialState = store.getState();
      
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 0, // Invalid
        })
      );

      const state = store.getState();
      expect(state.portfolio.items).toHaveLength(initialState.portfolio.items.length);
    });
  });

  describe('removeItem', () => {
    it('should remove item correctly', () => {
      // Önce item ekle
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 10,
        })
      );

      const stateBefore = store.getState();
      const itemId = stateBefore.portfolio.items[0].id;

      // Item'ı sil
      store.dispatch(removeItem(itemId));

      const stateAfter = store.getState();
      expect(stateAfter.portfolio.items).toHaveLength(0);
      expect(stateAfter.portfolio.history).toHaveLength(2); // add + remove
      expect(stateAfter.portfolio.history[0].type).toBe('remove');
    });

    it('should not remove non-existent item', () => {
      const initialState = store.getState();
      
      store.dispatch(removeItem('non-existent-id'));

      const state = store.getState();
      expect(state.portfolio.items).toHaveLength(initialState.portfolio.items.length);
    });
  });

  describe('updateItemAmount', () => {
    it('should add more assets when newAmount > currentTotal', () => {
      // Önce item ekle
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 10,
        })
      );

      // Amount'u artır
      store.dispatch(
        updateItemAmount({
          type: '22_ayar',
          newAmount: 20,
        })
      );

      const state = store.getState();
      const itemsOfType = state.portfolio.items.filter((item) => item.type === '22_ayar');
      const total = itemsOfType.reduce((sum, item) => sum + item.amount, 0);
      expect(total).toBe(20);
    });

    it('should remove assets when newAmount < currentTotal', () => {
      // Önce item ekle
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 20,
        })
      );

      // Amount'u azalt
      store.dispatch(
        updateItemAmount({
          type: '22_ayar',
          newAmount: 10,
        })
      );

      const state = store.getState();
      const itemsOfType = state.portfolio.items.filter((item) => item.type === '22_ayar');
      const total = itemsOfType.reduce((sum, item) => sum + item.amount, 0);
      expect(total).toBe(10);
    });

    it('should not update if newAmount equals currentTotal', () => {
      // Önce item ekle
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 10,
        })
      );

      const stateBefore = store.getState();
      const itemsBefore = stateBefore.portfolio.items.length;

      // Aynı amount ile update et
      store.dispatch(
        updateItemAmount({
          type: '22_ayar',
          newAmount: 10,
        })
      );

      const stateAfter = store.getState();
      expect(stateAfter.portfolio.items.length).toBe(itemsBefore);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      // Test için sample data ekle
      store.dispatch(
        addItem({
          type: '22_ayar',
          amount: 10,
        })
      );
      store.dispatch(
        addItem({
          type: 'usd',
          amount: 100,
        })
      );
    });

    it('should calculate total TL correctly', () => {
      const state = store.getState();
      const total = selectTotalTL(state);
      expect(total).toBeGreaterThan(0);
      // 10 gram 22 ayar + 100 USD
      // 10 * 2300 + 100 * 34 = 23000 + 3400 = 26400
      expect(total).toBeCloseTo(26400, 0);
    });

    it('should calculate total in USD correctly', () => {
      const state = store.getState();
      const totalUSD = selectTotalIn('USD')(state);
      expect(totalUSD).toBeGreaterThan(0);
    });

    it('should calculate total in EUR correctly', () => {
      const state = store.getState();
      const totalEUR = selectTotalIn('EUR')(state);
      expect(totalEUR).toBeGreaterThan(0);
    });

    it('should calculate total in ALTIN correctly', () => {
      const state = store.getState();
      const totalAltin = selectTotalIn('ALTIN')(state);
      expect(totalAltin).toBeGreaterThan(0);
    });
  });

  describe('fetchPrices', () => {
    it('should handle fulfilled state', async () => {
      // Mock fetchPrices için API mock gerekir
      // Bu test için axios mock'u eklenebilir
      // Şimdilik skip ediyoruz, service testlerinde yapılacak
    });

    it('should handle rejected state', async () => {
      // Mock fetchPrices için API mock gerekir
      // Şimdilik skip ediyoruz
    });
  });
});

