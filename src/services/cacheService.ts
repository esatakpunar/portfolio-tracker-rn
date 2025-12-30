import { logger } from '../utils/logger';

/**
 * Cached response with metadata
 */
interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Cache storage - in-memory cache
 * In a production app, you might want to use AsyncStorage or a more robust cache solution
 */
const cache = new Map<string, CachedResponse<any>>();

/**
 * Default TTL for cached responses (5 minutes)
 */
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if it exists and is not expired
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  
  if (!cached) {
    logger.debug(`[CACHE] Cache miss: ${key}`);
    return null;
  }

  const now = Date.now();
  const age = now - cached.timestamp;

  if (age > cached.ttl) {
    // Cache expired
    logger.debug(`[CACHE] Cache expired: ${key} (age: ${age}ms, ttl: ${cached.ttl}ms)`);
    cache.delete(key);
    return null;
  }

  logger.debug(`[CACHE] Cache hit: ${key} (age: ${age}ms, ttl: ${cached.ttl}ms)`);
  return cached.data as T;
};

/**
 * Set cached data with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 */
export const setCachedData = <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
  logger.debug(`[CACHE] Data cached: ${key} (ttl: ${ttl}ms)`);
};

/**
 * Remove cached data
 * @param key Cache key
 */
export const removeCachedData = (key: string): void => {
  const deleted = cache.delete(key);
  if (deleted) {
    logger.debug(`[CACHE] Cache removed: ${key}`);
  }
};

/**
 * Clear all cached data
 */
export const clearCache = (): void => {
  const size = cache.size;
  cache.clear();
  logger.debug(`[CACHE] Cache cleared (${size} entries removed)`);
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
};

/**
 * Check if cached data exists and is valid (not expired)
 * @param key Cache key
 * @returns true if cache exists and is valid, false otherwise
 */
export const isCached = (key: string): boolean => {
  const cached = cache.get(key);
  if (!cached) {
    return false;
  }

  const now = Date.now();
  const age = now - cached.timestamp;

  return age <= cached.ttl;
};

/**
 * Get cache age in milliseconds
 * @param key Cache key
 * @returns Age in milliseconds or null if not found
 */
export const getCacheAge = (key: string): number | null => {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  return Date.now() - cached.timestamp;
};

