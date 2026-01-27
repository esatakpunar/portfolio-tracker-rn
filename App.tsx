import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text as RNText, TextInput as RNTextInput } from 'react-native';

import { store, AppDispatch } from './src/store';
import { initializeI18n } from './src/locales';
import { fetchPrices } from './src/store/portfolioSlice';
import { initDatabase } from './src/services/database';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { useToast } from './src/hooks/useToast';
import ToastNotification from './src/components/ToastNotification';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors } from './src/theme';

if ((RNText as any).defaultProps == null) {
  (RNText as any).defaultProps = {};
}
(RNText as any).defaultProps.allowFontScaling = false;

if ((RNTextInput as any).defaultProps == null) {
  (RNTextInput as any).defaultProps = {};
}
(RNTextInput as any).defaultProps.allowFontScaling = false;

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Ensure database is fully initialized
        await initDatabase();
        
        try {
          const { sqliteStorage } = await import('./src/store/sqliteStorage');
          const storedValue = await sqliteStorage.getItem('persist:root');
          
          if (storedValue) {
            const parsed = JSON.parse(storedValue);
            if (parsed.portfolio) {
              const portfolioSlice = await import('./src/store/portfolioSlice');
              const { setPrices, setLanguage, setHistory, setItems } = portfolioSlice;
              
              if (parsed.portfolio.prices) {
                store.dispatch(setPrices(parsed.portfolio.prices));
              }
              
              if (parsed.portfolio.currentLanguage) {
                store.dispatch(setLanguage(parsed.portfolio.currentLanguage));
              }
              
              if (parsed.portfolio.history && parsed.portfolio.history.length > 0) {
                store.dispatch(setHistory(parsed.portfolio.history));
              }
              
              if (parsed.portfolio.items && parsed.portfolio.items.length > 0) {
                // Restore items directly without adding to history (history already restored above)
                store.dispatch(setItems(parsed.portfolio.items));
              }
            }
          }
        } catch (error) {
          // Log error but continue - app will start with empty state
          // fetchPrices will still be called to attempt backup load
          if (__DEV__) {
            console.warn('[APP] State restore failed:', error);
          }
        }
        
        setIsStateRestored(true);

        // Initialize i18n separately and set flag when done
        try {
          await initializeI18n();
          setI18nReady(true);
        } catch (i18nError) {
          if (__DEV__) {
            console.error('[APP] i18n initialization failed:', i18nError);
          }
          // Set ready anyway to allow app to start with fallback
          setI18nReady(true);
        }

        setIsReady(true);
      } catch (error) {
        // Even if initialization fails, set ready flags so app can start
        // fetchPrices will still attempt to load backup
        if (__DEV__) {
          console.error('[APP] Initialization failed:', error);
        }
        setIsReady(true);
        setIsStateRestored(true);
        setI18nReady(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchInitialPrices = async () => {
      if (isReady && isStateRestored) {
        try {
          // Database is already initialized in first useEffect, no need to call again
          const result = await (store.dispatch as AppDispatch)(fetchPrices(abortController.signal));

          // Check if fetch failed - error handling is done in slice
          if (fetchPrices.rejected.match(result)) {
            if (__DEV__) {
              console.warn('[APP] Initial price fetch failed:', result.payload);
            }
          }
        } catch (error) {
          // Log error but don't block app startup
          if (__DEV__) {
            console.error('[APP] Error fetching initial prices:', error);
          }
        }
      }
    };

    fetchInitialPrices();

    // Cleanup: abort fetch if component unmounts before completion
    return () => {
      abortController.abort();
    };
  }, [isReady, isStateRestored]);

  if (!isReady || !i18nReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent} />
        {__DEV__ && (
          <RNText style={{ color: colors.textMuted, marginTop: 10 }}>
            {!isReady ? 'Initializing app...' : 'Loading translations...'}
          </RNText>
        )}
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <Provider store={store}>
          <SafeAreaProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <View style={styles.container}>
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
    backgroundColor: colors.background,
  },
});
