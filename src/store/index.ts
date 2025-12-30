import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import portfolioReducer, { initialState } from './portfolioSlice';
import { logger } from '../utils/logger';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['portfolio'], // Only persist portfolio slice
  version: 1, // Version kontrolü - state structure değişikliklerinde artırılmalı
  migrate: (state: any) => {
    // Eski state format'ını yeni formata çevir
    if (state && state.portfolio) {
      // State validation - eğer portfolio state geçerliyse kullan
      if (
        Array.isArray(state.portfolio.items) &&
        typeof state.portfolio.prices === 'object' &&
        Array.isArray(state.portfolio.history)
      ) {
        return Promise.resolve(state);
      }
    }
    // Eğer state bozuksa veya format uyumsuzsa, initialState kullan
    logger.warn('[REDUX_PERSIST] State format uyumsuz, initialState kullanılıyor');
    return Promise.resolve({ portfolio: initialState });
  },
  onRehydrateStorage: () => {
    // Rehydrate başladı
    logger.debug('[REDUX_PERSIST] Rehydrate başladı');
    return (state, err) => {
      if (err) {
        // Rehydrate hatası - kritik log
        logger.error('[REDUX_PERSIST] Rehydrate HATA', err);
        // Hata durumunda kullanıcıya bildir (toast) - ama uygulamayı crash etme
        // Toast notification AppContent içinde handle edilebilir
      } else {
        // Rehydrate başarılı
        logger.debug('[REDUX_PERSIST] Rehydrate tamamlandı', {
          itemsCount: state?.portfolio?.items?.length || 0,
          hasPrices: !!state?.portfolio?.prices,
          historyCount: state?.portfolio?.history?.length || 0,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
};

const persistedReducer = persistReducer(persistConfig, portfolioReducer);

export const store = configureStore({
  reducer: {
    portfolio: persistedReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
