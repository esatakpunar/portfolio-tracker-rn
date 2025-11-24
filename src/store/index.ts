import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import portfolioReducer from './portfolioSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['portfolio'] // Only persist portfolio slice
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
