import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { store, persistor, AppDispatch } from './src/store';
import { initializeI18n } from './src/locales';
import { fetchPrices } from './src/store/portfolioSlice';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { useToast } from './src/hooks/useToast';
import { OfflineIndicator } from './src/components';
import ToastNotification from './src/components/ToastNotification';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initializeSentry } from './src/config/sentry';
import { logger } from './src/utils/logger';
import { migrateToSecureStorage } from './src/store/secureStorage';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isRehydrated, setIsRehydrated] = useState(false);

  // Initialize Sentry on app start
  useEffect(() => {
    initializeSentry();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Migrate data from AsyncStorage to SecureStore (if needed)
        await migrateToSecureStorage();
        
        await initializeI18n();
        setIsReady(true);
      } catch (error) {
        // Handle initialization error silently in production
        logger.error('Error initializing app', error);
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  // Rehydrate tamamlandıktan sonra fetchPrices çağır
  useEffect(() => {
    if (isRehydrated && isReady) {
      logger.debug('[APP] Rehydrate tamamlandı, fetchPrices çağrılıyor');
      (store.dispatch as AppDispatch)(fetchPrices());
    }
  }, [isRehydrated, isReady]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <Provider store={store}>
          <PersistGate 
            loading={<ActivityIndicator size="large" color="#A78BFA" />}
            persistor={persistor}
            onBeforeLift={() => {
              logger.debug('[APP] PersistGate onBeforeLift - Rehydrate tamamlandı');
              setIsRehydrated(true);
            }}
          >
            <SafeAreaProvider>
              <NavigationContainer>
                <AppContent />
              </NavigationContainer>
            </SafeAreaProvider>
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      <BottomTabNavigator />
      <ToastNotification 
        toasts={toasts} 
        onRemove={removeToast} 
      />
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
