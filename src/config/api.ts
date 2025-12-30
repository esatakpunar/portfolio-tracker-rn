/**
 * API Configuration
 * 
 * Environment-based API configuration
 * Uses Expo environment variables
 */

import { logger } from '../utils/logger';
import { isDevelopment } from '../utils/env';

/**
 * API Configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Get API base URL from environment
 * Falls back to default if not set
 */
const getApiBaseUrl = (): string => {
  // Expo uses EXPO_PUBLIC_ prefix for public env variables
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (envUrl) {
    logger.debug('[API_CONFIG] Using API URL from environment', { url: envUrl });
    return envUrl;
  }
  
  // Default API URL (fallback)
  const defaultUrl = 'https://finans.truncgil.com/v4';
  if (isDevelopment()) {
    logger.warn('[API_CONFIG] API URL not set in environment, using default', { url: defaultUrl });
  }
  
  return defaultUrl;
};

/**
 * Get API timeout from environment
 */
const getApiTimeout = (): number => {
  const envTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 10000; // Default 10 seconds
};

/**
 * Get retry attempts from environment
 */
const getRetryAttempts = (): number => {
  const envRetries = process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS;
  if (envRetries) {
    const parsed = parseInt(envRetries, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 3; // Default 3 retries
};

/**
 * Get retry delay from environment
 */
const getRetryDelay = (): number => {
  const envDelay = process.env.EXPO_PUBLIC_API_RETRY_DELAY;
  if (envDelay) {
    const parsed = parseInt(envDelay, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1000; // Default 1 second
};

/**
 * API Configuration
 * Environment variables'den veya default değerlerden oluşturulur
 */
export const apiConfig: ApiConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: getApiTimeout(),
  retryAttempts: getRetryAttempts(),
  retryDelay: getRetryDelay(),
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
  });
}

