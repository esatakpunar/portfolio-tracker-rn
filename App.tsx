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

  useEffect(() => {
    const initialize = async () => {
      try {
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
          // Silently fail - app will start with empty state
        }
        
        setIsStateRestored(true);
        await initializeI18n();
        setIsReady(true);
      } catch (error) {
        setIsReady(true);
        setIsStateRestored(true);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isReady && isStateRestored) {
      (store.dispatch as AppDispatch)(fetchPrices());
    }
  }, [isReady, isStateRestored]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent} />
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
