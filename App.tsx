import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text as RNText, TextInput as RNTextInput } from 'react-native';

import { store, persistor, AppDispatch } from './src/store';
import { initializeI18n } from './src/locales';
import { fetchPrices } from './src/store/portfolioSlice';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { useToast } from './src/hooks/useToast';
import ToastNotification from './src/components/ToastNotification';
import ErrorBoundary from './src/components/ErrorBoundary';

// Global defaultProps ayarlaması - iOS Dynamic Type'ı devre dışı bırak
// Yedek koruma: Eğer bir yerde direkt React Native component'leri kullanılırsa
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
  const [isRehydrated, setIsRehydrated] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeI18n();
        setIsReady(true);
      } catch (error) {
        // Handle initialization error silently in production
        if (__DEV__) {
          console.error('Error initializing app:', error);
        }
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  // Rehydrate tamamlandıktan sonra fetchPrices çağır
  useEffect(() => {
    if (isRehydrated && isReady) {
      if (__DEV__) {
        console.log('[APP] Rehydrate tamamlandı, fetchPrices çağrılıyor');
      }
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
              if (__DEV__) {
                console.log('[APP] PersistGate onBeforeLift - Rehydrate tamamlandı');
              }
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
