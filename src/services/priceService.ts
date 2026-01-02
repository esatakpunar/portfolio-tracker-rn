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
    // responseType: 'json' yerine 'text' kullan ve manuel parse et
    // Çünkü bazı API'ler Content-Type header'ı yanlış gönderebilir
    responseType: 'text',
    maxRedirects: 5,
    // Transform response to parse JSON manually
    transformResponse: [(data) => {
      // Axios responseType: 'text' kullanıldığında data string olarak gelir
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (error) {
          // Parse başarısız olursa, orijinal string'i döndür
          // priceService içinde tekrar parse edilecek
          logger.warn('[AXIOS] TransformResponse: Failed to parse JSON, returning raw string', {
            error: error instanceof Error ? error.message : String(error),
            dataPreview: data.substring(0, 200),
          });
          return data;
        }
      }
      return data;
    }],
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

// DEFAULT_PRICES kaldırıldı - mock data kullanılmıyor
// Sadece kullanıcı verileri (cache, currentPrices) kullanılıyor

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
 * @param currentPrices Current prices from state (used as fallback for parsePrice only)
 * @param signal AbortSignal for request cancellation
 * @returns Prices object or null if API fails and no valid fallback available
 */
const fetchFreshPrices = async (
  currentPrices?: Prices, 
  signal?: AbortSignal
): Promise<Prices | null> => {
  const API_URL = getApiUrl('today.json');
  
  // Check network status before making API call (if NetInfo is available)
  if (isNetInfoAvailable && NetInfo) {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        logger.warn('[PRICE_SERVICE] Device is offline, using cached/fallback data');
        
        // ÖNCE: Cache'den veri al
        const cached = getCachedData<Prices>(PRICES_CACHE_KEY);
        if (cached) {
          const cachedValidation = safeValidatePrices(cached);
          if (cachedValidation.success) {
            logger.debug('[PRICE_SERVICE] Using cached data (offline)');
            return cachedValidation.data!;
          }
        }
        
        // İKİNCİ: currentPrices kullan (eğer geçerliyse)
        if (currentPrices && Object.keys(currentPrices).length > 0) {
          const currentPricesValidation = safeValidatePrices(currentPrices);
          if (currentPricesValidation.success) {
            logger.debug('[PRICE_SERVICE] Using currentPrices (offline)');
            return currentPricesValidation.data!;
          }
        }
        
        // Hiçbir veri yok - null döndür (mock data yok)
        logger.warn('[PRICE_SERVICE] Offline ve hiçbir veri yok - null döndürülüyor');
        return null;
      }
    } catch (error) {
      // NetInfo fetch failed, continue with API call (fallback)
      logger.warn('[PRICE_SERVICE] NetInfo fetch failed, continuing with API call', error as any);
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
        
        // Response data should already be parsed by transformResponse
        // But if it's still a string (transformResponse failed), parse it here
        let responseData = response.data;
        if (typeof responseData === 'string') {
          try {
            // Trim whitespace before parsing
            const trimmed = responseData.trim();
            if (!trimmed) {
              throw new Error('Empty response string');
            }
            responseData = JSON.parse(trimmed);
            logger.debug('[PRICE_SERVICE] Parsed JSON string response (fallback after transformResponse)');
          } catch (parseError) {
            // Log the actual string content for debugging (first 500 chars)
            const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
            const stringPreview = typeof responseData === 'string' 
              ? responseData.substring(0, 500) 
              : 'Not a string';
            logger.error('[PRICE_SERVICE] Failed to parse JSON string (both transformResponse and fallback failed)', { 
              error: errorMessage,
              stringLength: typeof responseData === 'string' ? responseData.length : 0,
              stringPreview,
              contentType: response.headers?.['content-type'],
              responseStatus: response.status,
              responseHeaders: response.headers,
            });
            throw new Error(`Invalid JSON response: ${errorMessage}`);
          }
        } else {
          // Response data is already an object (transformResponse başarılı)
          logger.debug('[PRICE_SERVICE] Response data already parsed by transformResponse');
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
    
        // Parse prices - fallback olarak sadece currentPrices kullan (mock data yok)
    const prices: Prices = {
          usd: parsePrice(data.USD?.Buying, currentPrices?.usd || 0),
          eur: parsePrice(data.EUR?.Buying, currentPrices?.eur || 0),
          gumus: parsePrice(data.GUMUS?.Buying, currentPrices?.gumus || 0),
          tam: parsePrice(data.TAMALTIN?.Buying, currentPrices?.tam || 0),
          ceyrek: parsePrice(data.CEYREKALTIN?.Buying, currentPrices?.ceyrek || 0),
          '22_ayar': parsePrice(data.YIA?.Buying, currentPrices?.['22_ayar'] || 0),
          '24_ayar': parsePrice(data.GRA?.Buying, currentPrices?.['24_ayar'] || 0),
          tl: 1, // TL always 1
        };
        
        // Eğer tüm fiyatlar 0 ise (API'den geçerli veri gelmemiş), null döndür
        const hasValidPrices = Object.values(prices).some((price, index) => {
          // TL'yi atla (her zaman 1)
          if (index === 7) return false; // tl index
          return price > 0;
        });
        
        if (!hasValidPrices) {
          logger.warn('[PRICE_SERVICE] API\'den geçerli fiyat verisi gelmedi, tüm fiyatlar 0');
          // Fallback'e düş
          throw new Error('No valid prices from API');
        }
        
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
      timestamp: new Date().toISOString(),
      url: API_URL,
    } as any);
    
    // ÖNCE: Cache'den veri al (en güvenilir)
    const cached = getCachedData<Prices>(PRICES_CACHE_KEY);
    if (cached) {
      const cachedValidation = safeValidatePrices(cached);
      if (cachedValidation.success) {
        logger.debug('[PRICE_SERVICE] API hata - Cache\'den veri kullanılıyor');
        return cachedValidation.data!;
      }
    }
    
    // İKİNCİ: currentPrices kullan (eğer geçerliyse)
    if (currentPrices && Object.keys(currentPrices).length > 0) {
      const currentPricesValidation = safeValidatePrices(currentPrices);
      if (currentPricesValidation.success) {
        logger.debug('[PRICE_SERVICE] API hata - Current prices kullanılıyor');
        return currentPricesValidation.data!;
      }
    }
    
    // Hiçbir veri yok - null döndür (mock data yok)
    logger.warn('[PRICE_SERVICE] API hata - Hiçbir veri yok, null döndürülüyor (mock data kullanılmıyor)');
    return null;
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
 * @returns Promise<Prices | null> - Fresh or cached prices, or null if no data available
 * 
 * NOT: Null dönerse, mevcut prices korunur (mock data kullanılmaz)
 */
export const fetchPrices = async (
  currentPrices?: Prices, 
  signal?: AbortSignal
): Promise<Prices | null> => {
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
    fetchFreshPrices(currentPrices, signal)
      .then((freshPrices) => {
        if (freshPrices) {
          // Validate fresh prices before caching
          const validation = safeValidatePrices(freshPrices);
          if (validation.success) {
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
  
  if (!freshPrices) {
    // API başarısız ve fallback yok - null döndür
    logger.warn('[PRICE_SERVICE] No fresh prices available, returning null');
    return null;
  }
  
  // Cache fresh data
  const validation = safeValidatePrices(freshPrices);
  if (validation.success) {
    setCachedData(PRICES_CACHE_KEY, freshPrices, apiConfig.cacheTTL);
    logger.debug('[PRICE_SERVICE] Fresh data cached');
  }
  
  return freshPrices;
};

// getDefaultPrices kaldırıldı - mock data kullanılmıyor

/**
 * Parse price change from API response
 * Helper function to extract Change values from API response
 */
const parsePriceChange = (value: number | undefined): number | null => {
  if (value === undefined || value === null) {
    return null;
  }
  
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return null;
  }
  
  return value;
};

/**
 * Cache key for price changes
 */
const PRICE_CHANGES_CACHE_KEY = 'price_changes';

/**
 * Fetch price changes from API
 * Returns only the Change values, not stored in Redux state
 * Uses caching to reduce API calls
 * 
 * @returns Promise with price changes for USD, EUR, and 24_ayar (ALTIN)
 */
export const fetchPriceChanges = async (): Promise<{
  usd: number | null;
  eur: number | null;
  '24_ayar': number | null;
}> => {
  const API_URL = getApiUrl('today.json');
  
  // Check cache first
  const cached = getCachedData<{ usd: number | null; eur: number | null; '24_ayar': number | null }>(PRICE_CHANGES_CACHE_KEY);
  if (cached) {
    const cacheAge = getCacheAge(PRICE_CHANGES_CACHE_KEY);
    const isStale = cacheAge !== null && cacheAge > apiConfig.cacheStaleThreshold;
    
    if (!isStale) {
      // Cache is fresh - return immediately
      logger.debug('[PRICE_SERVICE] Using cached price changes', { cacheAge });
      return cached;
    }
  }
  
  try {
    const response = await axiosInstance.get(API_URL);
    
    // Parse response data if it's a string
    let responseData = response.data;
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (parseError) {
        logger.warn('[PRICE_SERVICE] Failed to parse JSON string for price changes', { parseError });
        // Return cached data if available, otherwise null
        return cached || { usd: null, eur: null, '24_ayar': null };
      }
    }
    
    // Validate API response with Zod
    const apiValidation = safeValidateApiResponse(responseData);
    if (!apiValidation.success) {
      logger.warn('[PRICE_SERVICE] API response validation failed for price changes');
      // Return cached data if available, otherwise null
      return cached || { usd: null, eur: null, '24_ayar': null };
    }
    
    const data = apiValidation.data!;
    
    const priceChanges = {
      usd: parsePriceChange(data.USD?.Change),
      eur: parsePriceChange(data.EUR?.Change),
      '24_ayar': parsePriceChange(data.GRA?.Change),
    };
    
    // Cache the result
    setCachedData(PRICE_CHANGES_CACHE_KEY, priceChanges, apiConfig.cacheTTL);
    logger.debug('[PRICE_SERVICE] Price changes cached');
    
    return priceChanges;
  } catch (error) {
    // Network error - use cached data if available, otherwise return null
    // This is not a critical error, so use warn level instead of error
    logger.warn('[PRICE_SERVICE] Failed to fetch price changes, using cache or returning null', {
      hasCache: !!cached,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Return cached data if available, otherwise null
    return cached || { usd: null, eur: null, '24_ayar': null };
  }
};
