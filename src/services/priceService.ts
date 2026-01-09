import axios from 'axios';
import { Prices, PriceChanges, BuyPrices } from '../types';
import { saveBackup, getBackup } from './priceBackupService';

const API_URL = 'https://canlipiyasalar.haremaltin.com/tmp/altin.json?dil_kodu=tr';

interface ApiAssetData {
  code: string;
  alis: string | number;
  satis: string | number;
  tarih: string;
  dir: {
    alis_dir: string;
    satis_dir: string;
  };
  dusuk: string | number;
  yuksek: string | number;
  kapanis: string | number;
}

interface ApiResponse {
  meta: {
    time: number;
    tarih: string;
  };
  data: {
    USDTRY?: ApiAssetData;
    EURTRY?: ApiAssetData;
    GUMUSTRY?: ApiAssetData;
    TEK_YENI?: ApiAssetData;
    CEYREK_YENI?: ApiAssetData;
    AYAR22?: ApiAssetData;
    KULCEALTIN?: ApiAssetData;
    [key: string]: ApiAssetData | undefined;
  };
}


/**
 * Normalizes API values that can be string or number to a safe number.
 * Handles the type-unsafe nature of the API where same fields can be either type.
 * 
 * Finance-safe: Does not hide errors by returning 0. Returns null for invalid data.
 * Supports TR/EU locale format (comma as decimal separator, dot as thousands separator).
 * 
 * @param v - Value that can be string, number, null, or undefined
 * @returns Normalized number or null if invalid/unparseable
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

    // Smart format detection: handle both US (dot decimal) and TR/EU (comma decimal) formats
    // Examples:
    //   "43.1110" -> 43.1110 (US format: dot is decimal)
    //   "42,7" -> 42.7 (TR format: comma is decimal)
    //   "43.111,00" -> 43111.00 (TR format: comma is decimal, dot is thousands)
    
    const hasComma = trimmed.includes(',');
    const hasDot = trimmed.includes('.');
    
    let normalized: string;
    
    if (hasComma && hasDot) {
      // Both comma and dot: determine which is decimal separator
      const commaIndex = trimmed.lastIndexOf(',');
      const dotIndex = trimmed.lastIndexOf('.');
      
      if (commaIndex > dotIndex) {
        // Comma comes after dot: comma is decimal, dot is thousands
        // Example: "43.111,00" -> "43111.00"
        normalized = trimmed.replace(/\./g, '').replace(',', '.');
      } else {
        // Dot comes after comma: dot is decimal, comma is thousands (rare but possible)
        // Example: "43,111.00" -> "43111.00"
        normalized = trimmed.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      // Only comma: comma is decimal separator (TR format)
      // Example: "42,7" -> "42.7"
      normalized = trimmed.replace(',', '.');
    } else if (!hasComma && hasDot) {
      // Only dot: dot is decimal separator (US format)
      // Example: "43.1110" -> "43.1110" (no change needed)
      normalized = trimmed;
    } else {
      // No separators: direct parse
      normalized = trimmed;
    }

    const parsed = Number(normalized);
    return isFinite(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Parses price from API value.
 * Finance-safe: Returns null for invalid data, does not hide errors with fallback.
 * Fallback should be handled at UI/display layer, not here.
 * 
 * @param value - API value (string | number | null | undefined)
 * @returns Normalized price or null if invalid/unparseable
 */
const parsePrice = (value: string | number | null | undefined): number | null => {
  const normalized = normalizeNumber(value);
  // Return null for invalid data - do not hide errors
  // Note: 0 is a valid price (though rare), so we only reject null/invalid
  return normalized;
};

const validateApiResponse = (data: any): data is ApiResponse => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check for meta structure
  if (!data.meta || typeof data.meta !== 'object') {
    return false;
  }
  
  // Validate meta.time is a valid number
  if (typeof data.meta.time !== 'number' || !isFinite(data.meta.time)) {
    return false;
  }
  
  // Check for data structure
  if (!data.data || typeof data.data !== 'object') {
    return false;
  }
  
  // Ensure data is not an empty object (at least some structure should exist)
  if (Object.keys(data.data).length === 0) {
    return false;
  }
  
  // Validation should accept that numeric fields can be either string or number
  // We don't need to validate specific asset codes here as they're checked during mapping
  return true;
};

export interface PriceData {
  prices: Prices; // Sell prices (satis)
  buyPrices?: BuyPrices; // Buy prices (alis) - optional for backward compatibility
  changes: PriceChanges;
  fetchedAt?: number; // Timestamp when prices were fetched (for backup age checking)
  isBackup?: boolean; // Indicates if this data is from backup
}

/**
 * Calculates percentage change from current price and previous closing price.
 * Returns null if data is invalid or cannot be calculated.
 * Finance-safe: Does not hide errors by returning 0.
 */
const calculateChange = (
  satis: string | number,
  kapanis: string | number
): number | null => {
  const current = normalizeNumber(satis);
  const previous = normalizeNumber(kapanis);

  if (current == null || previous == null || previous === 0) {
    return null;
  }

  const change = ((current - previous) / previous) * 100;

  return isFinite(change) ? change : null;
};

export const fetchPrices = async (): Promise<PriceData> => {
  try {
    const backup = await getBackup();
    
    const response = await axios.get<ApiResponse>(API_URL, {
      timeout: 10000,
      validateStatus: (status) => status === 200,
    });
    
    if (!validateApiResponse(response.data)) {
      throw new Error('Invalid API response structure');
    }
    
    const data = response.data;
    
    // Map new API codes to existing asset types using satis (sell) and alis (buy) fields
    // Finance-safe: Returns null for invalid data, does not hide errors with backup
    const prices: Prices = {
      usd: parsePrice(data.data.USDTRY?.satis),
      eur: parsePrice(data.data.EURTRY?.satis),
      gumus: parsePrice(data.data.GUMUSTRY?.satis),
      tam: parsePrice(data.data.TEK_YENI?.satis),
      ceyrek: parsePrice(data.data.CEYREK_YENI?.satis),
      '22_ayar': parsePrice(data.data.AYAR22?.satis),
      '24_ayar': parsePrice(data.data.KULCEALTIN?.satis),
      tl: 1, // TL is always 1 (base currency)
    };
    
    // Also parse buy prices (alis)
    const buyPrices: BuyPrices = {
      usd: parsePrice(data.data.USDTRY?.alis),
      eur: parsePrice(data.data.EURTRY?.alis),
      gumus: parsePrice(data.data.GUMUSTRY?.alis),
      tam: parsePrice(data.data.TEK_YENI?.alis),
      ceyrek: parsePrice(data.data.CEYREK_YENI?.alis),
      '22_ayar': parsePrice(data.data.AYAR22?.alis),
      '24_ayar': parsePrice(data.data.KULCEALTIN?.alis),
      tl: 1, // TL is always 1 (base currency)
    };
    
    // Calculate changes from satis (current) and kapanis (previous closing)
    // Finance-safe: Change is NEVER filled from backup - either calculated or null
    // This ensures we don't show stale change data as current
    const changes: PriceChanges = {
      usd: data.data.USDTRY 
        ? calculateChange(data.data.USDTRY.satis, data.data.USDTRY.kapanis)
        : null,
      eur: data.data.EURTRY
        ? calculateChange(data.data.EURTRY.satis, data.data.EURTRY.kapanis)
        : null,
      gumus: data.data.GUMUSTRY
        ? calculateChange(data.data.GUMUSTRY.satis, data.data.GUMUSTRY.kapanis)
        : null,
      tam: data.data.TEK_YENI
        ? calculateChange(data.data.TEK_YENI.satis, data.data.TEK_YENI.kapanis)
        : null,
      ceyrek: data.data.CEYREK_YENI
        ? calculateChange(data.data.CEYREK_YENI.satis, data.data.CEYREK_YENI.kapanis)
        : null,
      '22_ayar': data.data.AYAR22
        ? calculateChange(data.data.AYAR22.satis, data.data.AYAR22.kapanis)
        : null,
      '24_ayar': data.data.KULCEALTIN
        ? calculateChange(data.data.KULCEALTIN.satis, data.data.KULCEALTIN.kapanis)
        : null,
      tl: null,
    };
    
    // Validate that we have at least some valid prices
    // Note: null prices are valid (indicates unavailable data), but we should have some data
    const hasAnyValidPrice = Object.values(prices).some(
      (price) => price !== null && typeof price === 'number' && !isNaN(price) && price > 0
    );
    
    if (!hasAnyValidPrice) {
      throw new Error('No valid price values in response');
    }
    
    await saveBackup(prices, buyPrices, changes);
    
    return { 
      prices, 
      buyPrices,
      changes,
      fetchedAt: Date.now(),
      isBackup: false
    };
  } catch (error) {
    const backup = await getBackup();
    if (backup) {
      return {
        ...backup,
        isBackup: true
      };
    }
    
    throw new Error('API failed and no backup available');
  }
};

