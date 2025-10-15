import axios from 'axios';
import { Prices } from '../types';

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

export const fetchPrices = async (currentPrices?: Prices): Promise<Prices> => {
  try {
    const response = await axios.get<ApiResponse>(API_URL, {
      timeout: 10000, // 10 second timeout
    });
    
    const data = response.data;
    
    const prices: Prices = {
      usd: Number(data.USD?.Buying) || currentPrices?.usd || DEFAULT_PRICES.usd,
      eur: Number(data.EUR?.Buying) || currentPrices?.eur || DEFAULT_PRICES.eur,
      gumus: Number(data.GUMUS?.Buying) || currentPrices?.gumus || DEFAULT_PRICES.gumus,
      tam: Number(data.TAMALTIN?.Buying) || currentPrices?.tam || DEFAULT_PRICES.tam,
      ceyrek: Number(data.CEYREKALTIN?.Buying) || currentPrices?.ceyrek || DEFAULT_PRICES.ceyrek,
      '22_ayar': Number(data.YIA?.Buying) || currentPrices?.['22_ayar'] || DEFAULT_PRICES['22_ayar'],
      '24_ayar': Number(data.GRA?.Buying) || currentPrices?.['24_ayar'] || DEFAULT_PRICES['24_ayar'],
      tl: 1,
    };
    
    // Prices updated successfully
    return prices;
  } catch (error) {
    // Error fetching prices, fallback to cached or default prices
    
    // Fallback to current prices or defaults
    if (currentPrices && Object.keys(currentPrices).length > 0) {
      return currentPrices;
    }
    
    return DEFAULT_PRICES;
  }
};

export const getDefaultPrices = (): Prices => DEFAULT_PRICES;
