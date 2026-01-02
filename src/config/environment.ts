/**
 * Environment Configuration
 * 
 * Centralized environment management system
 * Handles environment detection, validation, and configuration
 */

import { isDevelopment } from '../utils/env';

// Logger import'u yok - require cycle'ı önlemek için
// Logger kullanmak yerine console.log kullanıyoruz (sadece initialization sırasında)

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  environment: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  apiTimeout: number;
  apiRetryAttempts: number;
  apiRetryDelay: number;
  apiCacheTTL: number;
  apiCacheStaleThreshold: number;
  sentryDsn?: string;
  enableSentryInDev: boolean;
  enableLogging: boolean;
  enableAnalytics: boolean;
}

/**
 * Get current environment from process.env
 */
const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';
  
  // Normalize environment string
  const normalizedEnv = env.toLowerCase().trim();
  
  if (normalizedEnv === 'production' || normalizedEnv === 'prod') {
    return 'production';
  }
  
  if (normalizedEnv === 'staging' || normalizedEnv === 'stage') {
    return 'staging';
  }
  
  return 'development';
};

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = (env: Environment): string => {
  // Check for explicit environment variable first
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Environment-specific defaults
  switch (env) {
    case 'production':
      return 'https://finans.truncgil.com/v4';
    case 'staging':
      return 'https://finans.truncgil.com/v4'; // Same as production for now
    case 'development':
    default:
      return 'https://finans.truncgil.com/v4'; // Same as production for now
  }
};

/**
 * Get API timeout based on environment
 */
const getApiTimeout = (env: Environment): number => {
  const envTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  // Environment-specific defaults
  switch (env) {
    case 'production':
      return 10000; // 10 seconds
    case 'staging':
      return 15000; // 15 seconds (more lenient for testing)
    case 'development':
    default:
      return 20000; // 20 seconds (most lenient for dev)
  }
};

/**
 * Get retry attempts based on environment
 */
const getRetryAttempts = (env: Environment): number => {
  const envRetries = process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS;
  if (envRetries) {
    const parsed = parseInt(envRetries, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  
  // Environment-specific defaults
  switch (env) {
    case 'production':
      return 3; // 3 retries in production
    case 'staging':
      return 2; // 2 retries in staging
    case 'development':
    default:
      return 1; // 1 retry in development (faster feedback)
  }
};

/**
 * Get retry delay based on environment
 */
const getRetryDelay = (env: Environment): number => {
  const envDelay = process.env.EXPO_PUBLIC_API_RETRY_DELAY;
  if (envDelay) {
    const parsed = parseInt(envDelay, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  // Environment-specific defaults
  switch (env) {
    case 'production':
      return 1000; // 1 second
    case 'staging':
      return 1500; // 1.5 seconds
    case 'development':
    default:
      return 500; // 0.5 seconds (faster in dev)
  }
};

/**
 * Get cache TTL based on environment
 */
const getCacheTTL = (env: Environment): number => {
  const envTTL = process.env.EXPO_PUBLIC_API_CACHE_TTL;
  if (envTTL) {
    const parsed = parseInt(envTTL, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  // Environment-specific defaults
  switch (env) {
    case 'production':
      return 5 * 60 * 1000; // 5 minutes
    case 'staging':
      return 2 * 60 * 1000; // 2 minutes (shorter for testing)
    case 'development':
    default:
      return 1 * 60 * 1000; // 1 minute (shortest for dev)
  }
};

/**
 * Get cache stale threshold based on environment
 */
const getCacheStaleThreshold = (env: Environment): number => {
  const envThreshold = process.env.EXPO_PUBLIC_API_CACHE_STALE_THRESHOLD;
  if (envThreshold) {
    const parsed = parseInt(envThreshold, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  // Environment-specific defaults
  switch (env) {
    case 'production':
      return 2 * 60 * 1000; // 2 minutes
    case 'staging':
      return 1 * 60 * 1000; // 1 minute
    case 'development':
    default:
      return 30 * 1000; // 30 seconds
  }
};

/**
 * Get Sentry DSN from environment
 */
const getSentryDsn = (): string | undefined => {
  return process.env.EXPO_PUBLIC_SENTRY_DSN;
};

/**
 * Check if Sentry should be enabled in development
 */
const getEnableSentryInDev = (): boolean => {
  const envValue = process.env.EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV;
  if (envValue) {
    return envValue.toLowerCase() === 'true';
  }
  return false; // Default: disabled in dev
};

/**
 * Check if logging should be enabled
 */
const getEnableLogging = (env: Environment): boolean => {
  // Always enable logging in development
  if (env === 'development') {
    return true;
  }
  
  // Check environment variable
  const envValue = process.env.EXPO_PUBLIC_ENABLE_LOGGING;
  if (envValue) {
    return envValue.toLowerCase() === 'true';
  }
  
  // Default: enabled in staging, disabled in production
  return env === 'staging';
};

/**
 * Check if analytics should be enabled
 */
const getEnableAnalytics = (env: Environment): boolean => {
  // Check environment variable
  const envValue = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS;
  if (envValue) {
    return envValue.toLowerCase() === 'true';
  }
  
  // Default: enabled in production and staging, disabled in development
  return env === 'production' || env === 'staging';
};

/**
 * Current environment
 */
const currentEnvironment = getEnvironment();

/**
 * Environment configuration
 * This is the single source of truth for all environment-based configuration
 */
export const environmentConfig: EnvironmentConfig = {
  environment: currentEnvironment,
  isDevelopment: currentEnvironment === 'development',
  isStaging: currentEnvironment === 'staging',
  isProduction: currentEnvironment === 'production',
  apiBaseUrl: getApiBaseUrl(currentEnvironment),
  apiTimeout: getApiTimeout(currentEnvironment),
  apiRetryAttempts: getRetryAttempts(currentEnvironment),
  apiRetryDelay: getRetryDelay(currentEnvironment),
  apiCacheTTL: getCacheTTL(currentEnvironment),
  apiCacheStaleThreshold: getCacheStaleThreshold(currentEnvironment),
  sentryDsn: getSentryDsn(),
  enableSentryInDev: getEnableSentryInDev(),
  enableLogging: getEnableLogging(currentEnvironment),
  enableAnalytics: getEnableAnalytics(currentEnvironment),
};

/**
 * Log environment configuration (only in development)
 */
if (isDevelopment()) {
  console.debug('[ENV_CONFIG] Environment Configuration loaded', {
    environment: environmentConfig.environment,
    apiBaseUrl: environmentConfig.apiBaseUrl,
    apiTimeout: environmentConfig.apiTimeout,
    apiRetryAttempts: environmentConfig.apiRetryAttempts,
    apiRetryDelay: environmentConfig.apiRetryDelay,
    apiCacheTTL: environmentConfig.apiCacheTTL,
    apiCacheStaleThreshold: environmentConfig.apiCacheStaleThreshold,
    enableSentryInDev: environmentConfig.enableSentryInDev,
    enableLogging: environmentConfig.enableLogging,
    enableAnalytics: environmentConfig.enableAnalytics,
    hasSentryDsn: !!environmentConfig.sentryDsn,
  });
}

/**
 * Validate environment configuration
 */
export const validateEnvironmentConfig = (): boolean => {
  const errors: string[] = [];
  
  if (!environmentConfig.apiBaseUrl) {
    errors.push('API base URL is required');
  }
  
  if (environmentConfig.apiTimeout <= 0) {
    errors.push('API timeout must be greater than 0');
  }
  
  if (environmentConfig.apiRetryAttempts < 0) {
    errors.push('API retry attempts must be non-negative');
  }
  
  if (environmentConfig.apiRetryDelay <= 0) {
    errors.push('API retry delay must be greater than 0');
  }
  
  if (environmentConfig.apiCacheTTL <= 0) {
    errors.push('API cache TTL must be greater than 0');
  }
  
  if (environmentConfig.apiCacheStaleThreshold <= 0) {
    errors.push('API cache stale threshold must be greater than 0');
  }
  
  if (errors.length > 0) {
    // Logger kullanmıyoruz - require cycle'ı önlemek için console.error kullanıyoruz
    console.error('[ENV_CONFIG] Environment configuration validation failed', {
      errors,
    });
    return false;
  }
  
  return true;
};

/**
 * Get environment-specific configuration value
 */
export const getEnvConfig = <K extends keyof EnvironmentConfig>(
  key: K
): EnvironmentConfig[K] => {
  return environmentConfig[key];
};

/**
 * Check if current environment matches
 */
export const isEnvironment = (env: Environment): boolean => {
  return environmentConfig.environment === env;
};

export default environmentConfig;

