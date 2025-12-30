import axios from 'axios';
import { Prices } from '../types';
import { logger } from '../utils/logger';

const API_URL = 'https://finans.truncgil.com/v4/today.json';

interface ApiResponse {
  USD?: { Buying: string };
  EUR?: { Buying: string };
  GUMUS?: { Buying: string };
  TAMALTIN?: { Buying: string };
  CEYREKALTIN?: { Buying: string };
  YIA?: { Buying: string }; // 22 ayar
  GRA?: { Buying: string }; // 24 ayar (gram altın)
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
 * Validates API response structure
 */
const validateApiResponse = (data: any): data is ApiResponse => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  // Basic validation - check if it has expected structure
  return true;
};

export const fetchPrices = async (currentPrices?: Prices): Promise<Prices> => {
  try {
    // LOG: API call başladı
    logger.debug('[PRICE_SERVICE] API call başladı', { url: API_URL });
    
    const response = await axios.get<ApiResponse>(API_URL, {
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status === 200, // Only accept 200 status
    });
    
    // Validate response structure
    if (!validateApiResponse(response.data)) {
      throw new Error('Invalid API response structure');
    }
    
    // LOG: API başarılı
    logger.debug('[PRICE_SERVICE] API başarılı', { data: response.data });
    
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
    
    // Validate all prices are valid numbers
    const allPricesValid = Object.values(prices).every(
      (price) => typeof price === 'number' && !isNaN(price) && price >= 0
    );
    
    if (!allPricesValid) {
      throw new Error('Invalid price values in response');
    }
    
    // Prices updated successfully - gerçek API verisi
    return prices;
  } catch (error) {
    // LOG: API hata - kritik log
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[PRICE_SERVICE] API HATA - Fallback kullanılıyor', error, {
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
        logger.debug('[PRICE_SERVICE] API hata - Cached prices kullanılıyor (mock değil)');
        return currentPrices; // Cached gerçek veri
      }
    }
    
    // Son çare: Mock data (ama sadece ilk açılışta, persist edilmeyecek)
    logger.warn('[PRICE_SERVICE] API hata - Mock data kullanılıyor (sadece ilk açılış, persist edilmeyecek)');
    return DEFAULT_PRICES;
  }
};

export const getDefaultPrices = (): Prices => DEFAULT_PRICES;
