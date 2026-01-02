/**
 * Network Status Hook
 * 
 * Network connectivity durumunu monitor eden custom hook
 * @react-native-community/netinfo kullanır
 * 
 * NOTE: Expo Go'da native modül mevcut olmayabilir, bu yüzden fallback mekanizması var
 */

import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

// NetInfo'yu dynamic import ile yükle (Expo Go uyumluluğu için)
let NetInfo: typeof import('@react-native-community/netinfo') | null = null;
let NetInfoStateType: typeof import('@react-native-community/netinfo').NetInfoStateType | null = null;
let isNetInfoAvailable = false;

try {
  const netInfoModule = require('@react-native-community/netinfo');
  NetInfo = netInfoModule.default || netInfoModule;
  NetInfoStateType = netInfoModule.NetInfoStateType;
  
  // Native module'ün mevcut olup olmadığını kontrol et
  if (NetInfo && typeof NetInfo.fetch === 'function') {
    isNetInfoAvailable = true;
    logger.debug('[NETWORK] NetInfo is available');
  }
} catch (error) {
  logger.warn('[NETWORK] NetInfo not available, using fallback', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  isNetInfoAvailable = false;
}

// Fallback type definitions
type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  details: any;
};

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  isEthernet: boolean;
  isUnknown: boolean;
}

/**
 * Network status hook
 * 
 * @returns Network status object
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    isConnected: true, // Default: assume connected (Expo Go fallback)
    isInternetReachable: true,
    type: 'unknown',
    details: null,
  });

  useEffect(() => {
    if (!isNetInfoAvailable || !NetInfo) {
      // NetInfo mevcut değilse (Expo Go), default olarak connected kabul et
      logger.debug('[NETWORK] NetInfo not available, assuming connected (Expo Go fallback)');
      return;
    }

    // Initial state check
    NetInfo.fetch()
      .then((state) => {
        setNetworkState(state);
        logger.debug('[NETWORK] Initial network state', {
          isConnected: state.isConnected,
          type: state.type,
          isInternetReachable: state.isInternetReachable,
        });
      })
      .catch((error) => {
        logger.warn('[NETWORK] Failed to fetch initial network state', error);
        // Fallback: assume connected
        setNetworkState({
          isConnected: true,
          isInternetReachable: true,
          type: 'unknown',
          details: null,
        });
      });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state);
      
      logger.debug('[NETWORK] Network state changed', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Log warning if offline
      if (!state.isConnected) {
        logger.warn('[NETWORK] Device is offline');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const type = networkState.type || 'unknown';
  const isWifi = NetInfoStateType ? type === NetInfoStateType.wifi : false;
  const isCellular = NetInfoStateType ? type === NetInfoStateType.cellular : false;
  const isEthernet = NetInfoStateType ? type === NetInfoStateType.ethernet : false;
  const isUnknown = !isWifi && !isCellular && !isEthernet;

  return {
    isConnected: networkState.isConnected ?? true, // Default: true if null (Expo Go fallback)
    isInternetReachable: networkState.isInternetReachable,
    type,
    isWifi,
    isCellular,
    isEthernet,
    isUnknown,
  };
};

/**
 * Simple hook that returns only connection status
 * 
 * @returns true if connected, false otherwise
 */
export const useIsConnected = (): boolean => {
  const { isConnected } = useNetworkStatus();
  return isConnected;
};

