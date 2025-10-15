import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import { store } from './src/store';
import { initializeI18n } from './src/locales';
import { loadInitialData, fetchPrices } from './src/store/portfolioSlice';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { useToast } from './src/hooks/useToast';
import ToastNotification from './src/components/ToastNotification';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeI18n();
        store.dispatch(loadInitialData() as any);
        store.dispatch(fetchPrices() as any);
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

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const AppContent: React.FC = () => {
  const { toasts, fadeAnim, removeToast } = useToast();

  return (
    <View style={styles.container}>
      <BottomTabNavigator />
      <ToastNotification 
        toasts={toasts} 
        fadeAnim={fadeAnim} 
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
