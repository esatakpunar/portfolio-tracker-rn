import axios from 'axios';
import { Prices, PriceChanges } from '../types';

const API_URL = 'https://finans.truncgil.com/v4/today.json';

interface ApiResponse {
  USD?: { Buying: string; Change?: string | number };
  EUR?: { Buying: string; Change?: string | number };
  GUMUS?: { Buying: string; Change?: string | number };
  TAMALTIN?: { Buying: string; Change?: string | number };
  CEYREKALTIN?: { Buying: string; Change?: string | number };
  YIA?: { Buying: string; Change?: string | number }; // 22 ayar
  GRA?: { Buying: string; Change?: string | number }; // 24 ayar (gram altın)
}

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

const DEFAULT_CHANGES: PriceChanges = {
  '22_ayar': 0,
  '24_ayar': 0,
  ceyrek: 0,
  tam: 0,
  usd: 0,
  eur: 0,
  tl: 0,
  gumus: 0
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
 * Safely parses a change value from API response
 * Handles positive, negative, and zero values
 * Also handles cases where value might be number, string, null, or undefined
 */
const parseChange = (value: string | number | null | undefined, fallback: number): number => {
  // Handle null or undefined
  if (value == null) {
    return fallback;
  }
  
  // If already a number, validate it
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
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
    // Remove % sign if present
    const cleaned = trimmed.replace('%', '');
    const parsed = Number(cleaned);
    // Check for NaN or invalid numbers (0 is valid)
    if (isNaN(parsed) || !isFinite(parsed)) {
      return fallback;
    }
    return parsed;
  }
  
  // For any other type, return fallback
  return fallback;
};

/**
 * Validates API response structure
 */
const validateApiResponse = (data: any): data is ApiResponse => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  // Basic validation - check if it has expected structure
  return true;
};

export interface PriceData {
  prices: Prices;
  changes: PriceChanges;
}

export const fetchPrices = async (currentPrices?: Prices, currentChanges?: PriceChanges): Promise<PriceData> => {
  try {
    // LOG: API call başladı
    if (__DEV__) {
      console.log('[PRICE_SERVICE] API call başladı:', API_URL);
    }
    
    const response = await axios.get<ApiResponse>(API_URL, {
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status === 200, // Only accept 200 status
    });
    
    // Validate response structure
    if (!validateApiResponse(response.data)) {
      throw new Error('Invalid API response structure');
    }
    
    // LOG: API başarılı
    if (__DEV__) {
      console.log('[PRICE_SERVICE] API başarılı:', response.data);
    }
    
    const data = response.data;
    
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
    
    const changes: PriceChanges = {
      usd: parseChange(data.USD?.Change, currentChanges?.usd ?? DEFAULT_CHANGES.usd),
      eur: parseChange(data.EUR?.Change, currentChanges?.eur ?? DEFAULT_CHANGES.eur),
      gumus: parseChange(data.GUMUS?.Change, currentChanges?.gumus ?? DEFAULT_CHANGES.gumus),
      tam: parseChange(data.TAMALTIN?.Change, currentChanges?.tam ?? DEFAULT_CHANGES.tam),
      ceyrek: parseChange(data.CEYREKALTIN?.Change, currentChanges?.ceyrek ?? DEFAULT_CHANGES.ceyrek),
      '22_ayar': parseChange(data.YIA?.Change, currentChanges?.['22_ayar'] ?? DEFAULT_CHANGES['22_ayar']),
      '24_ayar': parseChange(data.GRA?.Change, currentChanges?.['24_ayar'] ?? DEFAULT_CHANGES['24_ayar']),
      tl: 0,
    };
    
    // Validate all prices are valid numbers
    const allPricesValid = Object.values(prices).every(
      (price) => typeof price === 'number' && !isNaN(price) && price >= 0
    );
    
    if (!allPricesValid) {
      throw new Error('Invalid price values in response');
    }
    
    // Prices updated successfully - gerçek API verisi
    return { prices, changes };
  } catch (error) {
    // LOG: API hata - kritik log
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PRICE_SERVICE] API HATA - Fallback kullanılıyor:', {
      error: errorMessage,
      hasCurrentPrices: !!currentPrices,
      isCurrentPricesMock: currentPrices ? JSON.stringify(currentPrices) === JSON.stringify(DEFAULT_PRICES) : false,
      timestamp: new Date().toISOString()
    });
    
    // KRİTİK DEĞİŞİKLİK: Mock data yerine cached prices kullan
    if (currentPrices && Object.keys(currentPrices).length > 0) {
      // Validate current prices before using as fallback
      const currentPricesValid = Object.values(currentPrices).every(
        (price) => typeof price === 'number' && !isNaN(price) && price >= 0 && price > 0
      );
      
      // Eğer currentPrices geçerli ve mock data değilse, onu kullan
      const isCurrentPricesMock = JSON.stringify(currentPrices) === JSON.stringify(DEFAULT_PRICES);
      
      if (currentPricesValid && !isCurrentPricesMock) {
        if (__DEV__) {
          console.log('[PRICE_SERVICE] API hata - Cached prices kullanılıyor (mock değil)');
        }
        return { 
          prices: currentPrices, 
          changes: currentChanges || DEFAULT_CHANGES 
        }; // Cached gerçek veri
      }
    }
    
    // Son çare: Mock data (ama sadece ilk açılışta, persist edilmeyecek)
    if (__DEV__) {
      console.warn('[PRICE_SERVICE] API hata - Mock data kullanılıyor (sadece ilk açılış, persist edilmeyecek)');
    }
    return { prices: DEFAULT_PRICES, changes: DEFAULT_CHANGES };
  }
};

export const getDefaultPrices = (): Prices => DEFAULT_PRICES;

export const getDefaultChanges = (): PriceChanges => DEFAULT_CHANGES;
