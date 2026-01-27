import axios from 'axios';
import { Prices, PriceChanges, BuyPrices } from '../types';
import { PriceData } from './priceService';
import { trackPriceFetchError, trackNetworkError } from '../utils/errorTracking';

const API_URL = 'https://finans.truncgil.com/v4/today.json';
const MAX_RETRIES = 2; // Reduced from 3 to minimize wait time
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds (total max time: ~23s with retries)

interface TruncgilApiAsset {
  Type?: string;
  Change?: string | number;
  Name?: string;
  Buying?: string | number;
  Selling?: string | number;
}

interface TruncgilApiResponse {
  Update_Date?: string;
  USD?: TruncgilApiAsset;
  EUR?: TruncgilApiAsset;
  GUMUS?: TruncgilApiAsset;
  TAMALTIN?: TruncgilApiAsset;
  CEYREKALTIN?: TruncgilApiAsset;
  YIA?: TruncgilApiAsset;
  GRA?: TruncgilApiAsset;
  [key: string]: TruncgilApiAsset | string | undefined;
}

/**
 * Normalizes API values that can be string or number to a safe number.
 * Returns null for invalid data (finance-safe approach).
 */
const normalizeNumber = (
  v: string | number | null | undefined
): number | null => {
  if (v == null) {
    return null;
  }

  if (typeof v === 'number') {
    return isFinite(v) ? v : null;
  }

  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') {
      return null;
    }

    // Handle comma as decimal separator (TR format)
    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);
    return isFinite(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Parses price from API value.
 * Finance-safe: Returns null for invalid data.
 */
const parsePrice = (value: string | number | null | undefined): number | null => {
  return normalizeNumber(value);
};

/**
 * Parses change percentage from API value.
 * Finance-safe: Returns null for invalid data.
 */
const parseChange = (value: string | number | null | undefined): number | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    // Remove % sign if present
    const cleaned = trimmed.replace('%', '').replace(',', '.');
    const parsed = Number(cleaned);
    return isFinite(parsed) ? parsed : null;
  }

  return null;
};

const validateApiResponse = (data: any): data is TruncgilApiResponse => {
  if (!data || typeof data !== 'object') {
    if (__DEV__) {
      console.warn('[TRUNCGIL] Validation failed: data is not an object', typeof data);
    }
    return false;
  }

  // Check if response has expected structure (at least one currency field)
  const hasExpectedFields = !!(
    data.USD ||
    data.EUR ||
    data.GUMUS ||
    data.TAMALTIN ||
    data.CEYREKALTIN ||
    data.YIA ||
    data.GRA
  );

  if (!hasExpectedFields) {
    if (__DEV__) {
      console.warn('[TRUNCGIL] Validation failed: missing expected currency fields');
      console.warn('[TRUNCGIL] Response keys:', Object.keys(data));
    }
    return false;
  }

  return true;
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Manual timeout wrapper for promises
 * React Native's axios timeout is not always reliable, especially during network changes
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Attempts to fetch prices from Truncgil API with exponential backoff retry
 */
const attemptFetchInternal = async (signal?: AbortSignal): Promise<PriceData> => {
  // Check if already aborted before making request
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }

  const response = await axios.get<TruncgilApiResponse>(API_URL, {
    timeout: REQUEST_TIMEOUT_MS + 1000, // Slightly higher than manual timeout for fallback
    validateStatus: (status) => status === 200,
    responseType: 'json', // Explicitly request JSON parsing
    // Note: signal is intentionally not passed to axios because React Native's
    // XMLHttpRequest doesn't fully support AbortSignal. We handle cancellation
    // manually by checking signal.aborted before and during retries.
    // Cache-busting: Add timestamp to prevent iOS/system caching issues
    params: {
      _t: Date.now(),
    },
    // HTTP headers to prevent caching
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json', // Explicitly request JSON
    },
  });

  // Debug: Log response type and sample data in dev
  if (__DEV__) {
    console.log('[TRUNCGIL] Response type:', typeof response.data);
    console.log('[TRUNCGIL] Response is string?', typeof response.data === 'string');
    if (typeof response.data === 'string') {
      console.log('[TRUNCGIL] String response (first 200 chars):', response.data.substring(0, 200));
      console.log('[TRUNCGIL] String length:', response.data.length);
      // If response is a string, try to parse it manually
      try {
        const parsed = JSON.parse(response.data);
        console.log('[TRUNCGIL] Successfully parsed string response');
        response.data = parsed;
      } catch (e) {
        console.error('[TRUNCGIL] Failed to parse string response (likely incomplete/truncated):', e instanceof Error ? e.message : e);
      }
    } else if (response.data) {
      console.log('[TRUNCGIL] Response keys:', Object.keys(response.data).slice(0, 10));
      console.log('[TRUNCGIL] Has USD?', !!response.data.USD);
    }
  }

  // Handle string responses in production too
  if (typeof response.data === 'string') {
    try {
      response.data = JSON.parse(response.data);
    } catch (parseError) {
      // Likely incomplete/truncated response - will be caught by retry mechanism
      const error = parseError instanceof Error ? parseError : new Error('Parse error');
      throw new Error(`Failed to parse API response: ${error.message} (response may be incomplete)`);
    }
  }

  if (!validateApiResponse(response.data)) {
    if (__DEV__) {
      console.error('[TRUNCGIL] Full response data:', JSON.stringify(response.data).substring(0, 500));
    }
    throw new Error('Invalid API response structure');
  }

  const data = response.data;

  // Map API codes to asset types using Selling (satis) price
  // If Selling is not available, fall back to Buying
  const prices: Prices = {
    usd: parsePrice(data.USD?.Selling) ?? parsePrice(data.USD?.Buying),
    eur: parsePrice(data.EUR?.Selling) ?? parsePrice(data.EUR?.Buying),
    gumus: parsePrice(data.GUMUS?.Selling) ?? parsePrice(data.GUMUS?.Buying),
    tam: parsePrice(data.TAMALTIN?.Selling) ?? parsePrice(data.TAMALTIN?.Buying),
    ceyrek: parsePrice(data.CEYREKALTIN?.Selling) ?? parsePrice(data.CEYREKALTIN?.Buying),
    '22_ayar': parsePrice(data.YIA?.Selling) ?? parsePrice(data.YIA?.Buying),
    '24_ayar': parsePrice(data.GRA?.Selling) ?? parsePrice(data.GRA?.Buying),
    tl: 1, // TL is always 1 (base currency)
  };

  // Parse buy prices (alis) - use Buying field
  const buyPrices: BuyPrices = {
    usd: parsePrice(data.USD?.Buying),
    eur: parsePrice(data.EUR?.Buying),
    gumus: parsePrice(data.GUMUS?.Buying),
    tam: parsePrice(data.TAMALTIN?.Buying),
    ceyrek: parsePrice(data.CEYREKALTIN?.Buying),
    '22_ayar': parsePrice(data.YIA?.Buying),
    '24_ayar': parsePrice(data.GRA?.Buying),
    tl: 1, // TL is always 1 (base currency)
  };

  // Parse changes from Change field
  const changes: PriceChanges = {
    usd: parseChange(data.USD?.Change),
    eur: parseChange(data.EUR?.Change),
    gumus: parseChange(data.GUMUS?.Change),
    tam: parseChange(data.TAMALTIN?.Change),
    ceyrek: parseChange(data.CEYREKALTIN?.Change),
    '22_ayar': parseChange(data.YIA?.Change),
    '24_ayar': parseChange(data.GRA?.Change),
    tl: null,
  };

  // Validate that we have at least some valid prices
  const hasAnyValidPrice = Object.values(prices).some(
    (price) => price !== null && typeof price === 'number' && !isNaN(price) && price > 0
  );

  if (!hasAnyValidPrice) {
    throw new Error('No valid price values in response');
  }

  return {
    prices,
    buyPrices,
    changes,
    fetchedAt: Date.now(),
    isBackup: false,
  };
};

/**
 * Wrapper for attemptFetchInternal with manual timeout
 * React Native's axios timeout is not reliable, so we implement our own
 */
const attemptFetch = async (signal?: AbortSignal): Promise<PriceData> => {
  return withTimeout(
    attemptFetchInternal(signal),
    REQUEST_TIMEOUT_MS,
    `Request timeout after ${REQUEST_TIMEOUT_MS}ms`
  );
};

/**
 * Fetches prices from Truncgil API with exponential backoff retry mechanism
 * @param signal Optional AbortSignal for request cancellation
 */
export const fetchPricesFromTruncgil = async (signal?: AbortSignal): Promise<PriceData> => {
  let lastError: Error | null = null;

  if (__DEV__) {
    console.log(`[TRUNCGIL] Starting fetch from ${API_URL}`);
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (__DEV__) {
        console.log(`[TRUNCGIL] Attempt ${attempt + 1}/${MAX_RETRIES}...`);
      }

      const result = await attemptFetch(signal);

      if (__DEV__) {
        console.log(`[TRUNCGIL] ✅ Fetch successful on attempt ${attempt + 1}`);
        console.log(`[TRUNCGIL] Prices fetched:`, {
          usd: result.prices.usd,
          eur: result.prices.eur,
          hasAllPrices: Object.values(result.prices).every(p => p !== null),
        });
      }

      return result;
    } catch (error) {
      // Check if request was aborted
      if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
        if (__DEV__) {
          console.log('[TRUNCGIL] Request cancelled');
        }
        throw new Error('Request cancelled');
      }

      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Log detailed error info in dev mode
      if (__DEV__) {
        console.warn(`[TRUNCGIL] ============ ERROR on attempt ${attempt + 1}/${MAX_RETRIES} ============`);
        if (axios.isAxiosError(error)) {
          console.warn('[TRUNCGIL] Axios error details:', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            timeout: error.code === 'ECONNABORTED',
            responseType: typeof error.response?.data,
            hasResponse: !!error.response,
            hasRequest: !!error.request,
          });

          // If response exists but validation failed, show response
          if (error.response?.data) {
            console.warn('[TRUNCGIL] Response data type:', typeof error.response.data);
            if (typeof error.response.data === 'string') {
              console.warn('[TRUNCGIL] String response preview:', error.response.data.substring(0, 300));
            } else {
              console.warn('[TRUNCGIL] Response keys:', Object.keys(error.response.data || {}).slice(0, 15));
            }
          }
        } else {
          console.warn('[TRUNCGIL] Non-axios error:', {
            message: lastError.message,
            name: lastError.name,
            stack: lastError.stack?.substring(0, 200),
          });
        }
        console.warn('[TRUNCGIL] ===================================================');
      }

      // Track network errors
      if (axios.isAxiosError(error)) {
        trackNetworkError(error, API_URL);
      }

      // Don't retry on last attempt
      if (attempt === MAX_RETRIES - 1) {
        if (__DEV__) {
          console.error('[TRUNCGIL] All retry attempts exhausted');
        }
        break;
      }

      // Check if signal is aborted before retrying
      if (signal?.aborted) {
        if (__DEV__) {
          console.log('[TRUNCGIL] Signal aborted, stopping retries');
        }
        throw new Error('Request cancelled');
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

      if (__DEV__) {
        console.log(`[TRUNCGIL] Retrying in ${delayMs}ms...`);
      }

      await sleep(delayMs);
    }
  }

  // All retries exhausted - track the error
  const errorDetails = lastError instanceof Error ? {
    message: lastError.message,
    name: lastError.name,
    code: (lastError as any).code,
  } : { message: 'Unknown error' };

  if (__DEV__) {
    console.error('[TRUNCGIL] ❌ All retry attempts exhausted');
    console.error('[TRUNCGIL] Last error details:', errorDetails);
  }

  const finalError = new Error(
    `Truncgil API failed after ${MAX_RETRIES} attempts: ${errorDetails.message}` +
    (errorDetails.code ? ` (code: ${errorDetails.code})` : '')
  );
  trackPriceFetchError(finalError, 'Truncgil', MAX_RETRIES, false);
  throw finalError;
};
