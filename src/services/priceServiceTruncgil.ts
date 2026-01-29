import axios from 'axios';
import { Prices, PriceChanges, BuyPrices } from '../types';
import { PriceData } from './priceService';
import { trackPriceFetchError, trackNetworkError } from '../utils/errorTracking';

const API_URL = 'https://finans.truncgil.com/v4/today.json';
const MAX_RETRIES = 3; // 3 attempts - if it fails, fallback to Investing.com
const INITIAL_RETRY_DELAY_MS = 500; // 0.5 second (give server time to reset rate limits)
const REQUEST_TIMEOUT_MS = 3000; // 3 seconds per request (total max: ~13s with retries)

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

/**
 * Extracts a single field value from a currency object in the response string.
 * More flexible than trying to match all fields at once.
 */
const extractFieldValue = (responseStr: string, currencyCode: string, fieldName: string): string | null => {
  // Pattern explanation:
  // "USD":\s*\{  - Match currency start
  // [\s\S]*?    - Match any characters (including newlines) non-greedily
  // "Buying":\s*"?([0-9.,+-]+)"? - Match the field value (with or without quotes)
  //
  // Example matches:
  // "USD":{"Type":"Currency","Change":0.06,"Name":"Amerikan Doları","Buying":43.4229,"Selling":43.4273}
  // "USD":{"Buying":"43.4229","Selling":"43.4273"}
  // "USD":{ "Buying" : 43.4229 , "Selling" : 43.4273 }

  const pattern = new RegExp(
    `"${currencyCode}":\\s*\\{[\\s\\S]*?"${fieldName}":\\s*"?([0-9.,+%-]+)"?`,
    'i'
  );

  const match = responseStr.match(pattern);
  if (!match) {
    return null;
  }

  // Clean up the extracted value (remove trailing commas, extra spaces)
  let value = match[1].trim();
  // Remove trailing comma if present (e.g., "51391.59," -> "51391.59")
  if (value.endsWith(',')) {
    value = value.slice(0, -1);
  }

  return value;
};

/**
 * Extracts price data from response string using regex patterns.
 * This is a fallback method when JSON parsing fails due to truncated/incomplete responses.
 *
 * Strategy: Extract each field independently to be more robust against field ordering
 * and incomplete/malformed JSON.
 */
const extractPricesFromString = (responseStr: string): TruncgilApiResponse | null => {
  try {
    console.log('[TRUNCGIL] Attempting string-based extraction (fallback method)');
    console.log('[TRUNCGIL] Response length:', responseStr.length, 'chars');

    const result: TruncgilApiResponse = {};

    // Currency codes to extract
    const currencies = [
      { code: 'USD', field: 'USD' },
      { code: 'EUR', field: 'EUR' },
      { code: 'GUMUS', field: 'GUMUS' },
      { code: 'TAMALTIN', field: 'TAMALTIN' },
      { code: 'CEYREKALTIN', field: 'CEYREKALTIN' },
      { code: 'YIA', field: 'YIA' },
      { code: 'GRA', field: 'GRA' },
    ];

    let extractedCount = 0;

    for (const { code, field } of currencies) {
      // Extract each field independently
      const buying = extractFieldValue(responseStr, code, 'Buying');
      const selling = extractFieldValue(responseStr, code, 'Selling');
      const change = extractFieldValue(responseStr, code, 'Change');

      // Only include if we found at least Buying or Selling
      if (buying || selling) {
        result[field] = {
          Buying: buying || undefined,
          Selling: selling || undefined,
          Change: change || undefined,
        };
        extractedCount++;

        if (__DEV__) {
          console.log(`[TRUNCGIL] Extracted ${code}:`, { buying, selling, change });
        }
      } else if (__DEV__) {
        console.log(`[TRUNCGIL] Could not extract ${code}`);
      }
    }

    console.log(`[TRUNCGIL] String extraction completed: ${extractedCount}/${currencies.length} currencies found`);

    // Return result only if we found at least one currency
    return extractedCount > 0 ? result : null;
  } catch (error) {
    console.error('[TRUNCGIL] String extraction failed:', error instanceof Error ? error.message : error);
    return null;
  }
};

const validateApiResponse = (data: any): data is TruncgilApiResponse => {
  if (!data || typeof data !== 'object') {
    console.warn('[TRUNCGIL] Validation failed: data is not an object, type:', typeof data);
    return false;
  }

  // Check if response has expected structure (at least one currency field)
  const expectedFields = ['USD', 'EUR', 'GUMUS', 'TAMALTIN', 'CEYREKALTIN', 'YIA', 'GRA'];
  const hasExpectedFields = expectedFields.some(field => field in data && data[field]);

  if (!hasExpectedFields) {
    const availableKeys = Object.keys(data);
    console.warn('[TRUNCGIL] Validation failed: missing expected currency fields');
    console.warn('[TRUNCGIL] Expected one of:', expectedFields.join(', '));
    console.warn('[TRUNCGIL] Available keys:', availableKeys.slice(0, 20).join(', '));

    // If response has keys but none of our expected ones, it might be an error response
    if (availableKeys.length > 0) {
      console.warn('[TRUNCGIL] Response appears to be an error or unexpected format');
      if (data.error) {
        console.warn('[TRUNCGIL] Error in response:', data.error);
      }
      if (data.message) {
        console.warn('[TRUNCGIL] Message in response:', data.message);
      }
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
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      console.warn(`[TRUNCGIL] ⏱️ Request timed out after ${timeoutMs}ms (likely stuck/pending)`);
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        if (!timedOut) {
          clearTimeout(timer);
          resolve(value);
        }
      })
      .catch((error) => {
        if (!timedOut) {
          clearTimeout(timer);
          reject(error);
        }
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

  // Use 'any' type because responseType is 'text', so data will be string
  const response = await axios.get<any>(API_URL, {
    timeout: REQUEST_TIMEOUT_MS + 1000, // Slightly higher than manual timeout for fallback (4s)
    validateStatus: (status) => status === 200,
    responseType: 'text', // Changed to 'text' to prevent axios from parsing incomplete JSON
    // Note: signal is intentionally not passed to axios because React Native's
    // XMLHttpRequest doesn't fully support AbortSignal. We handle cancellation
    // manually by checking signal.aborted before and during retries.
    // Cache-busting: Add timestamp to prevent iOS/system caching issues
    params: {
      _t: Date.now(),
      _rand: Math.random().toString(36).substring(7), // Extra randomness
    },
    // HTTP headers to prevent caching and look like a normal browser
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'identity', // Disable compression to avoid truncation issues
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', // Look like a real iPhone
      'Connection': 'close', // Close connection after request (prevent keep-alive issues)
    },
  });

  // Check response type and parse if necessary
  const responseType = typeof response.data;
  const isString = responseType === 'string';

  if (__DEV__) {
    console.log('[TRUNCGIL] Response type:', responseType);
    if (isString) {
      const strData = response.data as string;
      console.log('[TRUNCGIL] String response length:', strData.length);
      console.log('[TRUNCGIL] String response (first 200 chars):', strData.substring(0, 200));
    } else if (response.data) {
      const keys = Object.keys(response.data);
      console.log('[TRUNCGIL] Response keys:', keys.slice(0, 10));
      console.log('[TRUNCGIL] Has USD?', !!response.data.USD);
    }
  }

  // Handle string responses (both dev and production)
  if (isString) {
    const strData = response.data as string;

    // Check if response seems incomplete (common issue with truncated responses)
    if (strData.length < 100) {
      console.warn('[TRUNCGIL] Response suspiciously short:', strData.length, 'chars');
      throw new Error(`API response too short (${strData.length} chars) - likely incomplete`);
    }

    // Try JSON parsing first (preferred method)
    try {
      response.data = JSON.parse(strData);
      if (__DEV__) {
        console.log('[TRUNCGIL] ✅ Successfully parsed string response with JSON.parse');
      }
    } catch (parseError) {
      const error = parseError instanceof Error ? parseError : new Error('Parse error');
      console.warn('[TRUNCGIL] ⚠️ JSON parse failed:', error.message);

      // FALLBACK: Try string-based extraction
      // This is robust against incomplete/truncated JSON
      const extracted = extractPricesFromString(strData);

      if (extracted && Object.keys(extracted).length > 0) {
        console.log('[TRUNCGIL] ✅ Successfully extracted data using string patterns (fallback)');
        response.data = extracted;
      } else {
        // Both methods failed - throw error
        console.error('[TRUNCGIL] ❌ Both JSON parse and string extraction failed');
        if (__DEV__ && strData.length > 0) {
          console.error('[TRUNCGIL] Last 100 chars of response:', strData.slice(-100));
        }
        throw new Error(`Failed to parse API response: ${error.message}. String extraction also failed.`);
      }
    }
  }

  if (!validateApiResponse(response.data)) {
    // Log first 500 chars of response to help debug (in both dev and prod)
    const dataStr = JSON.stringify(response.data);
    console.error('[TRUNCGIL] Invalid response structure. First 500 chars:', dataStr.substring(0, 500));
    throw new Error('Invalid API response structure: missing expected currency fields');
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
  let consecutiveTimeouts = 0; // Track consecutive timeout errors

  if (__DEV__) {
    console.log(`[TRUNCGIL] Starting fetch from ${API_URL}`);
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[TRUNCGIL] 🔄 Attempt ${attempt + 1}/${MAX_RETRIES} (timeout: ${REQUEST_TIMEOUT_MS}ms)...`);

      const result = await attemptFetch(signal);

      console.log(`[TRUNCGIL] ✅ Fetch successful on attempt ${attempt + 1}/${MAX_RETRIES}`);

      if (__DEV__) {
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

      // Log detailed error info
      const isLastAttempt = attempt === MAX_RETRIES - 1;
      const isTimeout = error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('timed out') ||
        (axios.isAxiosError(error) && error.code === 'ECONNABORTED')
      );

      if (isTimeout) {
        consecutiveTimeouts++;
      } else {
        consecutiveTimeouts = 0; // Reset if not a timeout error
      }

      console.warn(`[TRUNCGIL] ============ ERROR on attempt ${attempt + 1}/${MAX_RETRIES} ============`);

      if (isTimeout) {
        console.warn(`[TRUNCGIL] ⏱️ Request TIMEOUT (${REQUEST_TIMEOUT_MS}ms) - request stuck/pending`);
        console.warn(`[TRUNCGIL] ⚠️ Consecutive timeouts: ${consecutiveTimeouts}/${MAX_RETRIES}`);

        if (consecutiveTimeouts >= 2) {
          console.warn(`[TRUNCGIL] 🛡️ Possible rate limiting or API protection detected (${consecutiveTimeouts} consecutive timeouts)`);
        }
      }

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
            const dataStr = error.response.data as string;
            console.warn('[TRUNCGIL] Response length:', dataStr.length, 'chars');
            console.warn('[TRUNCGIL] String response preview (first 300 chars):', dataStr.substring(0, 300));
            if (isLastAttempt) {
              // On last attempt, show more details
              console.warn('[TRUNCGIL] String response preview (last 200 chars):', dataStr.slice(-200));
            }
          } else {
            console.warn('[TRUNCGIL] Response keys:', Object.keys(error.response.data || {}).slice(0, 15));
          }
        }
      } else {
        console.warn('[TRUNCGIL] Non-axios error:', {
          message: lastError.message,
          name: lastError.name,
          stack: __DEV__ ? lastError.stack?.substring(0, 200) : undefined,
        });
      }

      console.warn('[TRUNCGIL] ===================================================');

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

      // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s
      // If we have consecutive timeouts (possible rate limiting), add extra delay
      let delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

      if (consecutiveTimeouts >= 2) {
        // Double the delay if we suspect rate limiting
        delayMs = delayMs * 2;
        console.log(`[TRUNCGIL] 🛡️ Doubling delay due to suspected rate limiting`);
      }

      console.log(`[TRUNCGIL] ⏳ Waiting ${delayMs}ms before retry... (${attempt + 1}/${MAX_RETRIES - 1} retries used)`);

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
    `Truncgil API failed after ${MAX_RETRIES} attempts (timeout: ${REQUEST_TIMEOUT_MS}ms per attempt): ${errorDetails.message}` +
    (errorDetails.code ? ` (code: ${errorDetails.code})` : '')
  );
  trackPriceFetchError(finalError, 'Truncgil', MAX_RETRIES, false);
  throw finalError;
};
