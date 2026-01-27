import { Prices, PriceChanges, BuyPrices } from '../types';
import { saveBackup, getBackup } from './priceBackupService';
import { fetchPricesFromTruncgil } from './priceServiceTruncgil';
import { isOnline } from '../utils/networkUtils';
import { trackPriceFetchError } from '../utils/errorTracking';

export interface PriceData {
  prices: Prices; // Sell prices (satis)
  buyPrices?: BuyPrices; // Buy prices (alis) - optional for backward compatibility
  changes: PriceChanges;
  fetchedAt?: number; // Timestamp when prices were fetched (for backup age checking)
  isBackup?: boolean; // Indicates if this data is from backup
  isOldBackup?: boolean; // Indicates if backup is older than 24 hours (stale)
}

/**
 * Type for price API provider functions.
 * New API providers should implement this interface.
 * @param signal Optional AbortSignal for request cancellation
 */
type PriceApiProvider = (signal?: AbortSignal) => Promise<PriceData>;

/**
 * List of price API providers to try in order.
 * If one fails, the next one will be tried.
 * To add a new API provider:
 * 1. Create a new service file (e.g., priceServiceNewApi.ts)
 * 2. Export a function that returns Promise<PriceData>
 * 3. Add it to this array
 */
const PRICE_API_PROVIDERS: PriceApiProvider[] = [
  fetchPricesFromTruncgil,
  // Add more API providers here as needed
  // Example: fetchPricesFromNewApi,
];

/**
 * Fetches prices with fallback mechanism:
 * 1. Checks network connectivity first
 * 2. Tries each API provider in order until one succeeds
 * 3. If all providers fail, uses backup if available
 * 4. If no backup is available, throws an error
 * @param signal Optional AbortSignal for request cancellation
 */
export const fetchPrices = async (signal?: AbortSignal): Promise<PriceData> => {
  const errors: string[] = [];

  // Check if request was already aborted
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }

  // Check network connectivity but don't block API calls
  // This is advisory only - we'll still try the API even if network check fails
  // This prevents false negatives from NetInfo module issues
  const online = await isOnline();
  if (!online && __DEV__) {
    console.warn('[PRICE_SERVICE] Network appears offline, but will still attempt API calls');
  }

  // Try each API provider in order
  for (let i = 0; i < PRICE_API_PROVIDERS.length; i++) {
    const provider = PRICE_API_PROVIDERS[i];

    // Check if aborted before trying next provider
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    try {
      if (__DEV__) {
        console.log(`[PRICE_SERVICE] Attempting provider ${i + 1}/${PRICE_API_PROVIDERS.length}...`);
      }

      const data = await provider(signal);

      if (__DEV__) {
        console.log(`[PRICE_SERVICE] Provider ${i + 1} succeeded, saving backup...`);
      }

      // Save successful fetch to backup
      // Wrap in try-catch to prevent backup save failures from breaking the fetch
      try {
        await saveBackup(
          data.prices,
          data.buyPrices,
          data.changes
        );
        if (__DEV__) {
          console.log('[PRICE_SERVICE] Backup saved successfully');
        }
      } catch (backupError) {
        // Log backup save failure but don't fail the fetch
        // The user still gets fresh prices, just won't have backup for next time
        if (__DEV__) {
          console.warn('[PRICE_SERVICE] Failed to save backup:', backupError);
        }
      }

      return {
        ...data,
        isBackup: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (__DEV__) {
        console.warn(`[PRICE_SERVICE] Provider ${i + 1} failed:`, errorMessage);
      }
      errors.push(`Provider ${i + 1}: ${errorMessage}`);
      // Continue to next provider
      continue;
    }
  }

  // All providers failed, try backup
  if (__DEV__) {
    console.warn('[PRICE_SERVICE] All providers failed, attempting to load backup...');
  }

  const backup = await getBackup();
  if (backup) {
    if (__DEV__) {
      console.log('[PRICE_SERVICE] Loaded backup data successfully');
      if (backup.isOldBackup) {
        console.warn('[PRICE_SERVICE] Backup is older than 24 hours (stale)');
      }
    }
    return {
      ...backup,
      isBackup: true,
      // isOldBackup is already in backup from getBackup()
    };
  }

  // No backup available, throw error with all provider errors
  if (__DEV__) {
    console.error('[PRICE_SERVICE] No backup available. All attempts failed.');
  }

  const error = new Error(
    `All price API providers failed. Errors: ${errors.join('; ')}. No backup available.`
  );
  trackPriceFetchError(error, 'All Providers', undefined, false);
  throw error;
};

