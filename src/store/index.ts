import { configureStore } from '@reduxjs/toolkit';
import { sqliteStorage } from './sqliteStorage';
import portfolioReducer, { fetchPrices, selectTotalTL } from './portfolioSlice';
import { recordDailySnapshot } from '../services/dailySnapshotService';
import { syncWidgetPortfolioSnapshot } from '../services/widgetSnapshotService';

const SNAPSHOT_TRIGGER_ACTIONS = new Set([
  fetchPrices.fulfilled.type,
  'portfolio/addItem',
  'portfolio/removeItem',
  'portfolio/updateItemAmount',
  'portfolio/importBackup',
  'portfolio/undoHistoryEntry',
]);

async function syncTodayDailySnapshot(getState: () => { portfolio: ReturnType<typeof portfolioReducer> }) {
  const state = getState();
  const portfolio = state.portfolio;
  if (portfolio.items.length === 0 || portfolio.hasPartialPriceUpdate) {
    return;
  }
  const total = selectTotalTL(state);
  if (total > 0) {
    await recordDailySnapshot(total);
    await syncWidgetPortfolioSnapshot(total, portfolio.currentLanguage);
  }
}

export const store = configureStore({
  reducer: {
    portfolio: portfolioReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat((store) => (next) => (action) => {
      const result = next(action);

      if (SNAPSHOT_TRIGGER_ACTIONS.has(action.type)) {
        setTimeout(async () => {
          try {
            await syncTodayDailySnapshot(store.getState.bind(store));
          } catch {
            // Silent fail
          }
        }, 0);
      }
      
      if (action.type?.startsWith('portfolio/') && 
          !action.type.includes('/pending') && 
          !action.type.includes('/fulfilled') && 
          !action.type.includes('/rejected')) {
        setTimeout(async () => {
          try {
            const currentState = store.getState();
            const persistedState = {
              _persist: {
                version: 1,
                rehydrated: true,
              },
              portfolio: currentState.portfolio,
            };
            await sqliteStorage.setItem('persist:root', JSON.stringify(persistedState));
          } catch (error) {
            // Silently fail - persistence errors shouldn't break the app
          }
        }, 0);
      }
      
      return result;
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
