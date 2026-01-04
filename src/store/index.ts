import { configureStore } from '@reduxjs/toolkit';
import { sqliteStorage } from './sqliteStorage';
import portfolioReducer from './portfolioSlice';

export const store = configureStore({
  reducer: {
    portfolio: portfolioReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat((store) => (next) => (action) => {
      const result = next(action);
      
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
