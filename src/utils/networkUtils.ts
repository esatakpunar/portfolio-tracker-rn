// Safely import NetInfo with fallback for when native module isn't available
let NetInfo: any = null;
let netInfoAvailable = false;

try {
  const netInfoModule = require('@react-native-community/netinfo');
  NetInfo = netInfoModule.default || netInfoModule;
  // Check if native module is actually available
  if (NetInfo && typeof NetInfo.fetch === 'function') {
    netInfoAvailable = true;
  }
} catch (error) {
  // NetInfo module not available - will use fallback
  netInfoAvailable = false;
}

/**
 * Checks if device has network connectivity
 * @returns Promise<boolean> - true if online, false if offline
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    // If NetInfo is not available, assume online to allow API calls
    // This is a graceful degradation - better to try and fail than block all requests
    if (!netInfoAvailable || !NetInfo) {
      // Only log once on first check to avoid spam
      if (__DEV__ && !netInfoAvailable) {
        // Log at debug level, not warning - this is expected until native rebuild
        // console.debug('[NETWORK] NetInfo native module not linked, using fallback (rebuild required)');
      }
      return true; // Assume online to allow API calls
    }
    
    const state = await NetInfo.fetch();
    // Graceful degradation: assume online if state is unknown
    // This prevents blocking API calls when NetInfo returns uncertain state
    return state.isConnected !== false; // Only return false if explicitly false
  } catch (error) {
    // If network check fails, assume online to be safe (allow API calls)
    // This prevents blocking legitimate requests when network check fails
    // Only log actual errors, not the expected "native module not available" case
    if (__DEV__ && error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('null') && !errorMessage.includes('RNCNetInfo')) {
        console.warn('[NETWORK] Failed to check network status:', error);
      }
    }
    return true; // Assume online to allow API calls
  }
};

/**
 * Gets current network state
 * @returns Promise<NetInfo.NetInfoState> - Network state information
 */
export const getNetworkState = async (): Promise<any> => {
  try {
    if (!NetInfo) {
      // Return a default online state if NetInfo is not available
      // Using true for graceful degradation - better to try and fail than block
      return {
        type: 'unknown',
        isConnected: true,
        isInternetReachable: true,
      };
    }
    
    return await NetInfo.fetch();
  } catch (error) {
    if (__DEV__) {
      console.warn('[NETWORK] Failed to get network state:', error);
    }
    // Return a default online state to allow API calls
    return {
      type: 'unknown',
      isConnected: true,
      isInternetReachable: true,
    };
  }
};
