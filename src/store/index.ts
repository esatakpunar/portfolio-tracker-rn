import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import portfolioReducer, { initialState } from './portfolioSlice';
import { logger } from '../utils/logger';
import { secureStorage, migrateToSecureStorage } from './secureStorage';
import { migrateState, validateState, normalizeState } from './migrations';
import { raceConditionMiddleware } from './middleware/raceConditionMiddleware';
import { PersistedState } from './migrations/types';

const CURRENT_VERSION = 1; // State structure değişikliklerinde artırılmalı

const persistConfig = {
  key: 'root',
  storage: secureStorage, // Secure storage kullan (encrypted)
  whitelist: ['portfolio'], // Only persist portfolio slice
  version: CURRENT_VERSION, // Version kontrolü - state structure değişikliklerinde artırılmalı
  migrate: async (state: PersistedState | undefined) => {
    try {
      // Önce normalize et - eksik field'ları doldur
      const normalizedState = normalizeState(state);
      
      if (!normalizedState) {
        // State tamamen bozuk, initialState kullan
        logger.warn('[REDUX_PERSIST] State normalization failed, using initialState');
        return {
          _persist: {
            version: CURRENT_VERSION,
            rehydrated: false,
          },
          portfolio: initialState,
        };
      }

      // Kritik validation - sadece items'ı kontrol et
      if (!validateState(normalizedState)) {
        // Items bozuk - kullanıcı verileri korunamaz
        logger.error('[REDUX_PERSIST] State validation failed (items bozuk), using initialState');
        return {
          _persist: {
            version: CURRENT_VERSION,
            rehydrated: false,
          },
          portfolio: initialState,
        };
      }

      // Migration uygula
      const migratedState = await migrateState(normalizedState, CURRENT_VERSION);
      
      // Migration sonrası tekrar normalize et
      const finalNormalizedState = normalizeState(migratedState);
      
      if (!finalNormalizedState) {
        logger.error('[REDUX_PERSIST] State normalization failed after migration, using initialState');
        return {
          _persist: {
            version: CURRENT_VERSION,
            rehydrated: false,
          },
          portfolio: initialState,
        };
      }

      // Migration sonrası tekrar validate et
      if (!validateState(finalNormalizedState)) {
        logger.error('[REDUX_PERSIST] State validation failed after migration, using initialState');
        return {
          _persist: {
            version: CURRENT_VERSION,
            rehydrated: false,
          },
          portfolio: initialState,
        };
      }

      return finalNormalizedState;
    } catch (error) {
      logger.error('[REDUX_PERSIST] Migration error', error);
      // Hata durumunda initialState kullan
      return {
        _persist: {
          version: CURRENT_VERSION,
          rehydrated: false,
        },
        portfolio: initialState,
      };
    }
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
    }).concat(raceConditionMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
