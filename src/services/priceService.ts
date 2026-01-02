import axios, { AxiosInstance } from 'axios';
import { Prices } from '../types';
import { logger } from '../utils/logger';
import { safeValidateApiResponse, safeValidatePrices } from '../schemas';
import { getApiUrl, apiConfig } from '../config/api';
import { retry } from '../utils/retry';
import { getCachedData, setCachedData, isCached, getCacheAge } from './cacheService';

// NetInfo'yu dynamic import ile yükle (Expo Go uyumluluğu için)
let NetInfo: typeof import('@react-native-community/netinfo') | null = null;
let isNetInfoAvailable = false;

try {
  const netInfoModule = require('@react-native-community/netinfo');
  NetInfo = netInfoModule.default || netInfoModule;
  if (NetInfo && typeof NetInfo.fetch === 'function') {
    isNetInfoAvailable = true;
  }
} catch (error) {
  // NetInfo mevcut değil (Expo Go), fallback kullanılacak
  isNetInfoAvailable = false;
}

/**
 * Create axios instance with default config for React Native
 * React Native'de network istekleri için özel config
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    timeout: apiConfig.timeout,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PortfolioTracker/1.0',
    },
    // React Native için özel ayarlar
    validateStatus: (status) => status === 200,
    responseType: 'json',
    maxRedirects: 5,
  });

  // Request interceptor - log requests in dev
  instance.interceptors.request.use(
    (config) => {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        logger.debug('[AXIOS] Request', {
          method: config.method,
          url: config.url,
        });
      }
      return config;
    },
    (error) => {
      logger.error('[AXIOS] Request error', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - log responses and handle errors
  instance.interceptors.response.use(
    (response) => {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        logger.debug('[AXIOS] Response', {
          status: response.status,
          url: response.config.url,
          dataType: typeof response.data,
        });
      }
      return response;
    },
    (error) => {
      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        logger.warn('[AXIOS] Response error', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
          } : null,
          request: error.request ? 'Request made but no response' : null,
        });
      } else {
        logger.error('[AXIOS] Unknown error', error);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Global axios instance
const axiosInstance = createAxiosInstance();

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
 * 
 * @param currentPrices Current prices from state (used as fallback)
 * @param signal AbortSignal for request cancellation
 */
const fetchFreshPrices = async (currentPrices?: Prices, signal?: AbortSignal): Promise<Prices> => {
  const API_URL = getApiUrl('today.json');
  
  // Check network status before making API call (if NetInfo is available)
  if (isNetInfoAvailable && NetInfo) {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
    logger.warn('[PRICE_SERVICE] Device is offline, using cached/fallback data');
    // Return cached data or fallback
    if (currentPrices && Object.keys(currentPrices).length > 0) {
      const currentPricesValidation = safeValidatePrices(currentPrices);
      const isCurrentPricesMock = JSON.stringify(currentPrices) === JSON.stringify(DEFAULT_PRICES);
      if (currentPricesValidation.success && !isCurrentPricesMock) {
        return currentPricesValidation.data!;
      }
    }
    // Return cached data from cache service
    const cached = getCachedData<Prices>(PRICES_CACHE_KEY);
    if (cached) {
      logger.debug('[PRICE_SERVICE] Using cached data (offline)');
      return cached;
    }
    // Last resort: return default prices
        return DEFAULT_PRICES;
      }
    } catch (error) {
      // NetInfo fetch failed, continue with API call (fallback)
      logger.warn('[PRICE_SERVICE] NetInfo fetch failed, continuing with API call', error);
    }
  }
  
  try {
    // Retry wrapper ile API call'ı wrap et
    return await retry(
      async () => {
        // LOG: API call başladı
        logger.debug('[PRICE_SERVICE] API call başladı', { url: API_URL });
        
        // Create axios config with signal if provided
        const axiosConfig = signal ? { signal } : {};
        const response = await axiosInstance.get(API_URL, axiosConfig);
        
        // Parse response data if it's a string
        let responseData = response.data;
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
            logger.debug('[PRICE_SERVICE] Parsed JSON string response');
          } catch (parseError) {
            logger.warn('[PRICE_SERVICE] Failed to parse JSON string', { parseError });
            throw new Error('Invalid JSON response');
          }
        }
        
        // Validate API response with Zod
        const apiValidation = safeValidateApiResponse(responseData);
        if (!apiValidation.success) {
          logger.warn('[PRICE_SERVICE] API response validation failed', {
            error: apiValidation.error?.issues,
          });
          throw new Error('Invalid API response structure');
        }
        
        // LOG: API başarılı
        logger.debug('[PRICE_SERVICE] API başarılı', { data: responseData });
        
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
    let errorMessage = 'Unknown error';
    let errorDetails: any = {};
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.message;
      errorDetails = {
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : error.response.data,
        } : null,
        request: error.request ? {
          method: error.request.method,
          url: error.request.url,
        } : null,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
        },
      };
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack?.substring(0, 500),
      };
    }
    
    logger.error('[PRICE_SERVICE] API HATA - Fallback kullanılıyor', error, {
      error: errorMessage,
      errorDetails,
      hasCurrentPrices: !!currentPrices,
      isCurrentPricesMock: currentPrices ? JSON.stringify(currentPrices) === JSON.stringify(DEFAULT_PRICES) : false,
      timestamp: new Date().toISOString(),
      url: API_URL,
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
 * @param signal AbortSignal for request cancellation (optional)
 * @returns Promise<Prices> - Fresh or cached prices
 */
export const fetchPrices = async (currentPrices?: Prices, signal?: AbortSignal): Promise<Prices> => {
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
  const freshPrices = await fetchFreshPrices(currentPrices, signal);
  
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
