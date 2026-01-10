import axios from 'axios';
import { Prices, PriceChanges, BuyPrices } from '../types';
import { PriceData } from './priceService';

const API_URL = 'https://finans.truncgil.com/v4/today.json';

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
    return false;
  }
  return true;
};

/**
 * Fetches prices from Truncgil API
 */
export const fetchPricesFromTruncgil = async (): Promise<PriceData> => {
  try {
    const response = await axios.get<TruncgilApiResponse>(API_URL, {
      timeout: 10000,
      validateStatus: (status) => status === 200,
    });

    if (!validateApiResponse(response.data)) {
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
  } catch (error) {
    throw new Error(`Truncgil API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
