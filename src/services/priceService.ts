import axios from 'axios';
import { Prices } from '../types';
import { logger } from '../utils/logger';
import { safeValidateApiResponse, safeValidatePrices } from '../schemas';
import { getApiUrl, apiConfig } from '../config/api';
import { retry } from '../utils/retry';
import { getCachedData, setCachedData, isCached, getCacheAge } from './cacheService';

const DEFAULT_PRICES: Prices = {
  '22_ayar': 2300,
  '24_ayar': 2500,
  ceyrek: 4000,
  tam: 16000,
  usd: 34,
  eur: 36,
  tl: 1,
  gumus: 30
};

/**
 * Safely parses a price value from API response
 * Handles "0" string correctly (doesn't fallback on valid 0 values)
 * Also handles cases where value might be number, string, null, or undefined
 */
const parsePrice = (value: string | number | null | undefined, fallback: number): number => {
  // Handle null or undefined
  if (value == null) {
    return fallback;
  }
  
  // If already a number, validate it
  if (typeof value === 'number') {
    if (isNaN(value) || value < 0) {
      return fallback;
    }
    return value;
  }
  
  // If string, trim and parse
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return fallback;
    }
    const parsed = Number(trimmed);
    // Check for NaN or invalid numbers (including 0, which is valid)
    if (isNaN(parsed) || parsed < 0) {
      return fallback;
    }
    return parsed;
  }
  
  // For any other type, return fallback
  return fallback;
};

/**
 * Cache key for prices
 */
const PRICES_CACHE_KEY = 'prices';

/**
 * Fetch fresh prices from API (internal function)
 */
const fetchFreshPrices = async (currentPrices?: Prices): Promise<Prices> => {
  const API_URL = getApiUrl('today.json');
  
  try {
    // Retry wrapper ile API call'ı wrap et
    return await retry(
      async () => {
        // LOG: API call başladı
        logger.debug('[PRICE_SERVICE] API call başladı', { url: API_URL });
        
        const response = await axios.get(API_URL, {
          timeout: apiConfig.timeout,
          validateStatus: (status) => status === 200, // Only accept 200 status
        });
        
        // Validate API response with Zod
        const apiValidation = safeValidateApiResponse(response.data);
        if (!apiValidation.success) {
          logger.warn('[PRICE_SERVICE] API response validation failed', {
            error: apiValidation.error?.issues,
          });
          throw new Error('Invalid API response structure');
        }
        
        // LOG: API başarılı
        logger.debug('[PRICE_SERVICE] API başarılı', { data: response.data });
        
        const data = apiValidation.data!;
        
        const prices: Prices = {
          usd: parsePrice(data.USD?.Buying, currentPrices?.usd || DEFAULT_PRICES.usd),
          eur: parsePrice(data.EUR?.Buying, currentPrices?.eur || DEFAULT_PRICES.eur),
          gumus: parsePrice(data.GUMUS?.Buying, currentPrices?.gumus || DEFAULT_PRICES.gumus),
          tam: parsePrice(data.TAMALTIN?.Buying, currentPrices?.tam || DEFAULT_PRICES.tam),
          ceyrek: parsePrice(data.CEYREKALTIN?.Buying, currentPrices?.ceyrek || DEFAULT_PRICES.ceyrek),
          '22_ayar': parsePrice(data.YIA?.Buying, currentPrices?.['22_ayar'] || DEFAULT_PRICES['22_ayar']),
          '24_ayar': parsePrice(data.GRA?.Buying, currentPrices?.['24_ayar'] || DEFAULT_PRICES['24_ayar']),
          tl: 1,
        };
        
        // Validate parsed prices with Zod
        const pricesValidation = safeValidatePrices(prices);
        if (!pricesValidation.success) {
          logger.warn('[PRICE_SERVICE] Parsed prices validation failed', {
            error: pricesValidation.error?.issues,
          });
          throw new Error('Invalid price values in response');
        }
        
        // Prices updated successfully - gerçek API verisi
        return prices;
      },
      {
        maxRetries: apiConfig.retryAttempts,
        initialDelay: apiConfig.retryDelay,
        retryableErrors: (error: unknown) => {
          // Retry on network errors, timeouts, and 5xx errors
          if (axios.isAxiosError(error)) {
            // Network error or timeout
            if (!error.response) {
              return true;
            }
            // 5xx server errors
            if (error.response.status >= 500 && error.response.status < 600) {
              return true;
            }
            // Don't retry on 4xx client errors
            return false;
          }
          // Retry on other errors (network issues, etc.)
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return (
              message.includes('network') ||
              message.includes('timeout') ||
              message.includes('econnrefused') ||
              message.includes('enotfound')
            );
          }
          return false;
        },
      }
    );
  } catch (error: unknown) {
    // Retry failed - use fallback
    // LOG: API hata - kritik log
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[PRICE_SERVICE] API HATA - Fallback kullanılıyor', error, {
      error: errorMessage,
      hasCurrentPrices: !!currentPrices,
      isCurrentPricesMock: currentPrices ? JSON.stringify(currentPrices) === JSON.stringify(DEFAULT_PRICES) : false,
      timestamp: new Date().toISOString()
    });
    
    // KRİTİK DEĞİŞİKLİK: Mock data yerine cached prices kullan
    if (currentPrices && Object.keys(currentPrices).length > 0) {
      // Validate current prices with Zod before using as fallback
      const currentPricesValidation = safeValidatePrices(currentPrices);
      
      // Eğer currentPrices geçerli ve mock data değilse, onu kullan
      const isCurrentPricesMock = JSON.stringify(currentPrices) === JSON.stringify(DEFAULT_PRICES);
      
      if (currentPricesValidation.success && !isCurrentPricesMock) {
        logger.debug('[PRICE_SERVICE] API hata - Cached prices kullanılıyor (mock değil)');
        return currentPricesValidation.data!; // Cached gerçek veri (validated)
      }
    }
    
    // Son çare: Mock data (ama sadece ilk açılışta, persist edilmeyecek)
    logger.warn('[PRICE_SERVICE] API hata - Mock data kullanılıyor (sadece ilk açılış, persist edilmeyecek)');
    return DEFAULT_PRICES;
  }
};

/**
 * Fetch prices from API with caching and stale-while-revalidate pattern
 * 
 * Strategy:
 * 1. Check cache first
 * 2. If cache exists and is fresh, return cached data immediately
 * 3. If cache exists but is stale, return stale data immediately and fetch fresh data in background
 * 4. If no cache, fetch fresh data
 * 
 * @param currentPrices Current prices from Redux state (used as fallback)
 * @returns Promise<Prices> - Fresh or cached prices
 */
export const fetchPrices = async (currentPrices?: Prices): Promise<Prices> => {
  // Check cache first
  const cached = getCachedData<Prices>(PRICES_CACHE_KEY);
  
  if (cached) {
    // Cache exists - check if it's stale
    const cacheAge = getCacheAge(PRICES_CACHE_KEY);
    const isStale = cacheAge !== null && cacheAge > apiConfig.cacheStaleThreshold;
    
    if (!isStale) {
      // Cache is fresh - return immediately
      logger.debug('[PRICE_SERVICE] Using fresh cache', { cacheAge });
      return cached;
    }
    
    // Cache is stale - return stale data immediately and fetch fresh in background
    logger.debug('[PRICE_SERVICE] Using stale cache, fetching fresh data in background', { cacheAge });
    
    // Fetch fresh data in background (don't await)
    fetchFreshPrices(currentPrices)
      .then((freshPrices) => {
        // Validate fresh prices before caching
        const validation = safeValidatePrices(freshPrices);
        if (validation.success) {
          // Don't cache mock data
          const isMockData = JSON.stringify(freshPrices) === JSON.stringify(DEFAULT_PRICES);
          if (!isMockData) {
            setCachedData(PRICES_CACHE_KEY, freshPrices, apiConfig.cacheTTL);
            logger.debug('[PRICE_SERVICE] Fresh data cached in background');
          }
        }
      })
      .catch((error) => {
        // Ignore background fetch errors - we already have stale data
        logger.debug('[PRICE_SERVICE] Background fetch failed, using stale cache', { error });
      });
    
    // Return stale data immediately
    return cached;
  }
  
  // No cache - fetch fresh data
  logger.debug('[PRICE_SERVICE] No cache, fetching fresh data');
  const freshPrices = await fetchFreshPrices(currentPrices);
  
  // Cache fresh data (if not mock)
  const validation = safeValidatePrices(freshPrices);
  if (validation.success) {
    const isMockData = JSON.stringify(freshPrices) === JSON.stringify(DEFAULT_PRICES);
    if (!isMockData) {
      setCachedData(PRICES_CACHE_KEY, freshPrices, apiConfig.cacheTTL);
      logger.debug('[PRICE_SERVICE] Fresh data cached');
    }
  }
  
  return freshPrices;
};

export const getDefaultPrices = (): Prices => DEFAULT_PRICES;
