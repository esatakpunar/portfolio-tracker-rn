import { Prices, PriceChanges, BuyPrices } from '../types';
import { saveBackup, getBackup } from './priceBackupService';
import { fetchPricesFromTruncgil } from './priceServiceTruncgil';
import { fetchPricesFromInvesting } from './priceServiceInvesting';
import { isOnline } from '../utils/networkUtils';
import { trackPriceFetchError } from '../utils/errorTracking';
import { getPriceSourcePreference, PriceSource, PRICE_SOURCES } from '../utils/preferenceStorage';

export interface PriceData {
  prices: Prices; // Sell prices (satis)
  buyPrices?: BuyPrices; // Buy prices (alis) - optional for backward compatibility
  changes: PriceChanges;
  fetchedAt?: number; // Timestamp when prices were fetched (for backup age checking)
  isBackup?: boolean; // Indicates if this data is from backup
  isOldBackup?: boolean; // Indicates if backup is older than 24 hours (stale)
  priceSource?: string; // Name of the API provider that supplied the data
}

/**
 * Type for price API provider functions.
 * New API providers should implement this interface.
 * @param signal Optional AbortSignal for request cancellation
 */
type PriceApiProvider = (signal?: AbortSignal) => Promise<PriceData>;

/**
 * Map of provider functions to their display names.
 * Used to show the user which API provider is currently active.
 */
const PROVIDER_NAMES: Record<string, string> = {
  fetchPricesFromTruncgil: 'Truncgil API',
  fetchPricesFromInvesting: 'Investing.com',
};

/**
 * List of price API providers to try in order.
 * If one fails, the next one will be tried.
 * To add a new API provider:
 * 1. Create a new service file (e.g., priceServiceNewApi.ts)
 * 2. Export a function that returns Promise<PriceData>
 * 3. Add it to this array
 * 4. Add its display name to PROVIDER_NAMES
 */
const PRICE_API_PROVIDERS: PriceApiProvider[] = [
  fetchPricesFromTruncgil,
  fetchPricesFromInvesting, // Fallback: only provides EUR, USD, GAU, XAG (partial data)
  // Add more API providers here as needed
];

/**
 * Get the list of API providers to try based on user preference
 */
const getProvidersForPreference = (preference: PriceSource): PriceApiProvider[] => {
  switch (preference) {
    case PRICE_SOURCES.TRUNCGIL:
      return [fetchPricesFromTruncgil];
    case PRICE_SOURCES.INVESTING:
      return [fetchPricesFromInvesting];
    case PRICE_SOURCES.AUTO:
    default:
      return PRICE_API_PROVIDERS; // Try Truncgil first, then Investing
  }
};

/**
 * Fetches prices with fallback mechanism:
 * 1. Checks network connectivity first
 * 2. Gets user's preferred price source
 * 3. Tries each API provider in order until one succeeds
 * 4. If all providers fail, uses backup if available
 * 5. If no backup is available, throws an error
 * @param signal Optional AbortSignal for request cancellation
 */
export const fetchPrices = async (signal?: AbortSignal): Promise<PriceData> => {
  const errors: Array<{ provider: string; error: string }> = [];
  const startTime = Date.now();

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

  // Get user's price source preference
  const priceSourcePreference = await getPriceSourcePreference();
  const providers = getProvidersForPreference(priceSourcePreference);

  if (__DEV__) {
    console.log('[PRICE_SERVICE] Price source preference:', priceSourcePreference);
    console.log('[PRICE_SERVICE] Will try providers:', providers.map(p => PROVIDER_NAMES[p.name] || p.name).join(', '));
  }

  // Try each API provider in order
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const providerName = PROVIDER_NAMES[provider.name] || `Provider ${i + 1}`;
    let attemptStart = 0;

    // Check if aborted before trying next provider
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    try {
      attemptStart = Date.now();
      if (__DEV__) {
        console.log(`[PRICE_SERVICE] Attempting ${providerName} (${i + 1}/${providers.length})...`);
      }

      const data = await provider(signal);

      // Validate that we have actual price data
      if (!data || !data.prices || typeof data.prices !== 'object') {
        throw new Error('Invalid data structure returned from provider');
      }

      const attemptDuration = Date.now() - attemptStart;
      if (__DEV__) {
        console.log(`[PRICE_SERVICE] ✅ ${providerName} succeeded in ${attemptDuration}ms`);
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
          console.warn('[PRICE_SERVICE] Failed to save backup:', backupError instanceof Error ? backupError.message : 'Unknown error');
        }
      }

      // CRITICAL: Explicitly set isBackup to false for fresh API data
      // This ensures Redux state correctly identifies this as live data
      const result: PriceData = {
        prices: data.prices,
        buyPrices: data.buyPrices,
        changes: data.changes,
        fetchedAt: Date.now(),
        isBackup: false, // ← CRITICAL: Live data from API
        isOldBackup: false, // ← Not backup at all
        priceSource: providerName,
      };

      const totalDuration = Date.now() - startTime;
      if (__DEV__) {
        console.log(`[PRICE_SERVICE] Total fetch duration: ${totalDuration}ms`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const attemptDuration = attemptStart > 0 ? Date.now() - attemptStart : 0;

      // Always log failures (helpful for production debugging)
      console.warn(`[PRICE_SERVICE] ❌ ${providerName} failed after ${attemptDuration}ms:`, errorMessage);

      errors.push({
        provider: providerName,
        error: errorMessage,
      });

      // Continue to next provider
      continue;
    }
  }

  // All providers failed, try backup
  // Always log this critical situation
  console.warn('[PRICE_SERVICE] All API providers failed, attempting to load backup...');
  if (__DEV__) {
    console.warn('[PRICE_SERVICE] Provider errors:', JSON.stringify(errors, null, 2));
  }

  const backup = await getBackup();
  if (backup) {
    console.log('[PRICE_SERVICE] ✅ Loaded backup data successfully');
    if (backup.isOldBackup) {
      console.warn('[PRICE_SERVICE] ⚠️ Backup is older than 24 hours (stale)');
    }

    // CRITICAL: Explicitly mark as backup data
    return {
      ...backup,
      isBackup: true, // ← CRITICAL: This is backup data
      priceSource: 'Backup',
      // isOldBackup is already in backup from getBackup()
    };
  }

  // No backup available, throw error with all provider errors
  // Always log this critical error
  console.error('[PRICE_SERVICE] ❌ No backup available. All attempts failed.');
  if (__DEV__) {
    console.error('[PRICE_SERVICE] Error summary:', errors);
  }

  const error = new Error(
    `All price API providers failed: ${errors.map(e => `${e.provider}: ${e.error}`).join('; ')}. No backup available.`
  );
  trackPriceFetchError(error, 'All Providers', undefined, false);
  throw error;
};

