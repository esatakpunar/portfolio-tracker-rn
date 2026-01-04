import axios from 'axios';
import { Prices, PriceChanges } from '../types';
import { saveBackup, getBackup } from './priceBackupService';

const API_URL = 'https://finans.truncgil.com/v4/today.json';

interface ApiResponse {
  USD?: { Buying: string; Change?: string | number };
  EUR?: { Buying: string; Change?: string | number };
  GUMUS?: { Buying: string; Change?: string | number };
  TAMALTIN?: { Buying: string; Change?: string | number };
  CEYREKALTIN?: { Buying: string; Change?: string | number };
  YIA?: { Buying: string; Change?: string | number };
  GRA?: { Buying: string; Change?: string | number };
}


const parsePrice = (value: string | number | null | undefined, fallback: number): number => {
  if (value == null) {
    return fallback;
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || value < 0) {
      return fallback;
    }
    return value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return fallback;
    }
    const parsed = Number(trimmed);
    if (isNaN(parsed) || parsed < 0) {
      return fallback;
    }
    return parsed;
  }
  
  return fallback;
};

const parseChange = (value: string | number | null | undefined, fallback: number): number => {
  if (value == null) {
    return fallback;
  }
  
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return fallback;
    }
    return value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return fallback;
    }
    const cleaned = trimmed.replace('%', '');
    const parsed = Number(cleaned);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return fallback;
    }
    return parsed;
  }
  
  return fallback;
};

const validateApiResponse = (data: any): data is ApiResponse => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  return true;
};

export interface PriceData {
  prices: Prices;
  changes: PriceChanges;
}

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
    
    const prices: Prices = {
      usd: parsePrice(data.USD?.Buying, backup?.prices.usd ?? 0),
      eur: parsePrice(data.EUR?.Buying, backup?.prices.eur ?? 0),
      gumus: parsePrice(data.GUMUS?.Buying, backup?.prices.gumus ?? 0),
      tam: parsePrice(data.TAMALTIN?.Buying, backup?.prices.tam ?? 0),
      ceyrek: parsePrice(data.CEYREKALTIN?.Buying, backup?.prices.ceyrek ?? 0),
      '22_ayar': parsePrice(data.YIA?.Buying, backup?.prices['22_ayar'] ?? 0),
      '24_ayar': parsePrice(data.GRA?.Buying, backup?.prices['24_ayar'] ?? 0),
      tl: 1,
    };
    
    const changes: PriceChanges = {
      usd: parseChange(data.USD?.Change, backup?.changes.usd ?? 0),
      eur: parseChange(data.EUR?.Change, backup?.changes.eur ?? 0),
      gumus: parseChange(data.GUMUS?.Change, backup?.changes.gumus ?? 0),
      tam: parseChange(data.TAMALTIN?.Change, backup?.changes.tam ?? 0),
      ceyrek: parseChange(data.CEYREKALTIN?.Change, backup?.changes.ceyrek ?? 0),
      '22_ayar': parseChange(data.YIA?.Change, backup?.changes['22_ayar'] ?? 0),
      '24_ayar': parseChange(data.GRA?.Change, backup?.changes['24_ayar'] ?? 0),
      tl: 0,
    };
    
    const allPricesValid = Object.values(prices).every(
      (price) => typeof price === 'number' && !isNaN(price) && price >= 0
    );
    
    if (!allPricesValid) {
      throw new Error('Invalid price values in response');
    }
    
    await saveBackup(prices, changes);
    
    return { prices, changes };
  } catch (error) {
    const backup = await getBackup();
    if (backup) {
      return backup;
    }
    
    throw new Error('API failed and no backup available');
  }
};

