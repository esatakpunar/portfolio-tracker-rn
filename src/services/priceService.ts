import { Prices, PriceChanges, BuyPrices } from '../types';
import { saveBackup, getBackup } from './priceBackupService';
import { fetchPricesFromTruncgil } from './priceServiceTruncgil';

export interface PriceData {
  prices: Prices; // Sell prices (satis)
  buyPrices?: BuyPrices; // Buy prices (alis) - optional for backward compatibility
  changes: PriceChanges;
  fetchedAt?: number; // Timestamp when prices were fetched (for backup age checking)
  isBackup?: boolean; // Indicates if this data is from backup
}

/**
 * Type for price API provider functions.
 * New API providers should implement this interface.
 */
type PriceApiProvider = () => Promise<PriceData>;

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
 * 1. Tries each API provider in order until one succeeds
 * 2. If all providers fail, uses backup if available
 * 3. If no backup is available, throws an error
 */
export const fetchPrices = async (): Promise<PriceData> => {
  const errors: string[] = [];

  // Try each API provider in order
  for (const provider of PRICE_API_PROVIDERS) {
    try {
      const data = await provider();

      // Save successful fetch to backup
      await saveBackup(
        data.prices,
        data.buyPrices,
        data.changes
      );

      return {
        ...data,
        isBackup: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      // Continue to next provider
      continue;
    }
  }

  // All providers failed, try backup
  const backup = await getBackup();
  if (backup) {
    return {
      ...backup,
      isBackup: true,
    };
  }

  // No backup available, throw error with all provider errors
  throw new Error(
    `All price API providers failed. Errors: ${errors.join('; ')}. No backup available.`
  );
};

