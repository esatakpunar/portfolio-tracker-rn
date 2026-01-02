/**
 * API Configuration
 * 
 * Environment-based API configuration
 * Uses centralized environment configuration
 */

import { logger } from '../utils/logger';
import { isDevelopment } from '../utils/env';
import { environmentConfig } from './environment';

/**
 * API Configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheTTL: number; // Cache time to live in milliseconds
  cacheStaleThreshold: number; // Cache stale threshold in milliseconds (for stale-while-revalidate)
}

/**
 * API Configuration now uses centralized environment configuration
 * All environment-specific values come from environmentConfig
 */

/**
 * API Configuration
 * Uses centralized environment configuration
 */
export const apiConfig: ApiConfig = {
  baseUrl: environmentConfig.apiBaseUrl,
  timeout: environmentConfig.apiTimeout,
  retryAttempts: environmentConfig.apiRetryAttempts,
  retryDelay: environmentConfig.apiRetryDelay,
  cacheTTL: environmentConfig.apiCacheTTL,
  cacheStaleThreshold: environmentConfig.apiCacheStaleThreshold,
};

/**
 * Get full API URL for a specific endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${apiConfig.baseUrl}/${cleanEndpoint}`;
};

/**
 * Log API configuration (only in development)
 */
if (isDevelopment()) {
  logger.debug('[API_CONFIG] API Configuration loaded', {
    baseUrl: apiConfig.baseUrl,
    timeout: apiConfig.timeout,
    retryAttempts: apiConfig.retryAttempts,
    retryDelay: apiConfig.retryDelay,
    cacheTTL: apiConfig.cacheTTL,
    cacheStaleThreshold: apiConfig.cacheStaleThreshold,
  });
}

