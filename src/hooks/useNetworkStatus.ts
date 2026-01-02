/**
 * Network Status Hook
 * 
 * Network connectivity durumunu monitor eden custom hook
 * @react-native-community/netinfo kullanır
 */

import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
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
    isConnected: true,
    isInternetReachable: true,
    type: NetInfoStateType.unknown,
    details: null,
  });

  useEffect(() => {
    // Initial state check
    NetInfo.fetch().then((state) => {
      setNetworkState(state);
      logger.debug('[NETWORK] Initial network state', {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
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

  return {
    isConnected: networkState.isConnected ?? false,
    isInternetReachable: networkState.isInternetReachable,
    type: networkState.type,
    isWifi: networkState.type === NetInfoStateType.wifi,
    isCellular: networkState.type === NetInfoStateType.cellular,
    isEthernet: networkState.type === NetInfoStateType.ethernet,
    isUnknown: networkState.type === NetInfoStateType.unknown,
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

