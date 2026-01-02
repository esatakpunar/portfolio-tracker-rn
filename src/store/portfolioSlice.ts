import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { PortfolioItem, HistoryItem, Prices, AssetType, CurrencyType } from '../types';
import { fetchPrices as fetchPricesFromAPI, getDefaultPrices } from '../services/priceService';
import { safeAdd, safeSubtract } from '../utils/numberUtils';
import { logger } from '../utils/logger';
import { RootState } from './index';
import { cleanupHistory, STORAGE_LIMITS } from '../utils/storageUtils';
import { analytics } from '../services/analytics';

interface PortfolioState {
  items: PortfolioItem[];
  prices: Prices;
  history: HistoryItem[];
  currentLanguage: string;
}

const initialPrices: Prices = {
  '22_ayar': 2300,
  '24_ayar': 2500,
  ceyrek: 4000,
  tam: 16000,
  usd: 34,
  eur: 36,
  tl: 1,
  gumus: 30
};

export const initialState: PortfolioState = {
  items: [],
  prices: initialPrices,
  history: [],
  currentLanguage: 'tr'
};

// Race condition prevention
let isFetchingPrices = false;

export const fetchPrices = createAsyncThunk(
  'portfolio/fetchPrices',
  async (_, { rejectWithValue, getState }) => {
    if (isFetchingPrices) {
      return rejectWithValue('Already fetching prices');
    }
    
    isFetchingPrices = true;
    try {
      // Get current prices from state to pass as fallback
      const state = getState() as RootState;
      const currentPrices = state?.portfolio?.prices;
      const prices = await fetchPricesFromAPI(currentPrices);
      return prices;
    } catch (error) {
      logger.error('Error fetching prices', error);
      return rejectWithValue('Failed to fetch prices');
    } finally {
      isFetchingPrices = false;
    }
  }
);

const getItemValueInTL = (item: PortfolioItem, prices: Prices): number => {
  // Validate inputs
  if (!item || !item.type || isNaN(item.amount) || !isFinite(item.amount) || item.amount < 0) {
    return 0;
  }
  
  if (item.type === 'tl') {
    return item.amount;
  } else if (item.type === 'usd') {
    const usdPrice = prices.usd || 0;
    if (isNaN(usdPrice) || !isFinite(usdPrice) || usdPrice < 0) {
      return 0;
    }
    return item.amount * usdPrice;
  } else if (item.type === 'eur') {
    const eurPrice = prices.eur || 0;
    if (isNaN(eurPrice) || !isFinite(eurPrice) || eurPrice < 0) {
      return 0;
    }
    return item.amount * eurPrice;
  } else {
    const price = prices[item.type] || 0;
    if (isNaN(price) || !isFinite(price) || price < 0) {
      return 0;
    }
    return item.amount * price;
  }
};

const convertFromTL = (valueTL: number, targetCurrency: CurrencyType, prices: Prices): number => {
  // Validate input
  if (isNaN(valueTL) || !isFinite(valueTL) || valueTL < 0) {
    return 0;
  }
  
  switch (targetCurrency) {
    case 'TL':
      return valueTL;
    case 'USD': {
      const usdPrice = prices.usd || 0;
      return usdPrice > 0 ? valueTL / usdPrice : 0;
    }
    case 'EUR': {
      const eurPrice = prices.eur || 0;
      return eurPrice > 0 ? valueTL / eurPrice : 0;
    }
    case 'ALTIN': {
      const altinPrice = prices['24_ayar'] || 0;
      return altinPrice > 0 ? valueTL / altinPrice : 0;
    }
    default:
      return valueTL;
  }
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<PortfolioItem, 'id' | 'date'>>) => {
      const { type, amount } = action.payload;
      
      // Validate input
      if (!type || isNaN(amount) || !isFinite(amount) || amount <= 0) {
        return; // Invalid input, ignore
      }
      
      const newItem: PortfolioItem = {
        ...action.payload,
        id: Date.now().toString(),
        date: new Date().toISOString()
      };
      
      state.items.push(newItem);
      
      // Add to history
      state.history.unshift({
        type: 'add',
        item: newItem,
        date: new Date().toISOString(),
        description: newItem.description || ''
      });
      
      // Cleanup history if it exceeds threshold
      if (state.history.length > STORAGE_LIMITS.HISTORY_CLEANUP_THRESHOLD) {
        state.history = cleanupHistory(state.history, STORAGE_LIMITS.MAX_HISTORY_ITEMS);
      }
      
      // Track analytics
      analytics.trackBusinessEvent('portfolio_item_added', {
        asset_type: type,
        amount: amount,
      });
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      
      if (index !== -1) {
        const removed = state.items[index];
        state.items.splice(index, 1);
        
        state.history.unshift({
          type: 'remove',
          item: removed,
          date: new Date().toISOString()
        });
        
        // Cleanup history if it exceeds threshold
        if (state.history.length > STORAGE_LIMITS.HISTORY_CLEANUP_THRESHOLD) {
          state.history = cleanupHistory(state.history, STORAGE_LIMITS.MAX_HISTORY_ITEMS);
        }
      }
    },
    
    updateItemAmount: (state, action: PayloadAction<{ type: AssetType; newAmount: number; description?: string }>) => {
      const { type, newAmount, description } = action.payload;
      
      // Validate input
      if (!type || isNaN(newAmount) || !isFinite(newAmount) || newAmount < 0) {
        return; // Invalid input, ignore
      }
      
      // Calculate current total for this asset type
      const itemsOfType = state.items.filter(item => item.type === type);
      const currentTotal = itemsOfType.reduce((sum, item) => safeAdd(sum, item.amount), 0);
      
      // Calculate difference safely
      const difference = safeSubtract(newAmount, currentTotal);
      
      if (Math.abs(difference) < 0.000001) return; // Use epsilon for floating point comparison
      
      if (difference > 0) {
        // Adding more assets
        const newItem: PortfolioItem = {
          type,
          amount: difference,
          id: Date.now().toString(),
          date: new Date().toISOString(),
          description: description || undefined
        };
        
        state.items.push(newItem);
        
        state.history.unshift({
          type: 'add',
          item: newItem,
          date: new Date().toISOString(),
          description: description || undefined, // Description will be set in component level with i18n
        });
        
        // Cleanup history if it exceeds threshold
        if (state.history.length > STORAGE_LIMITS.HISTORY_CLEANUP_THRESHOLD) {
          state.history = cleanupHistory(state.history, STORAGE_LIMITS.MAX_HISTORY_ITEMS);
        }
      } else {
        // Removing assets (difference is negative)
        // Use LIFO (Last In First Out) - remove from the end
        const amountToRemove = Math.abs(difference);
        let remainingToRemove = amountToRemove;
        
        // Iterate backwards through the main list to find items of this type
        for (let i = state.items.length - 1; i >= 0; i--) {
          const item = state.items[i];
          if (item.type === type && remainingToRemove > 0) {
            if (item.amount <= remainingToRemove) {
              // Remove entire item
              remainingToRemove = safeSubtract(remainingToRemove, item.amount);
              state.items.splice(i, 1);
            } else {
              // Reduce amount
              const newItemAmount = safeSubtract(item.amount, remainingToRemove);
              state.items[i].amount = newItemAmount;
              remainingToRemove = 0;
            }
          }
        }
        
        state.history.unshift({
          type: 'remove',
          item: { 
            type, 
            amount: amountToRemove, // Show how much was removed (positive number)
            id: Date.now().toString(), 
            date: new Date().toISOString() 
          },
          date: new Date().toISOString(),
          description: description || undefined, // Description will be set in component level with i18n
        });
        
        // Cleanup history if it exceeds threshold
        if (state.history.length > STORAGE_LIMITS.HISTORY_CLEANUP_THRESHOLD) {
          state.history = cleanupHistory(state.history, STORAGE_LIMITS.MAX_HISTORY_ITEMS);
        }
      }
    },
    
    updatePrice: (state, action: PayloadAction<{ key: AssetType; value: number }>) => {
      const { key, value } = action.payload;
      // Validate input
      if (!key || isNaN(value) || !isFinite(value) || value < 0) {
        return; // Invalid input, ignore
      }
      state.prices[key] = value;
    },
    
    setLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
    },
    
    resetAll: (state) => {
      state.items = [];
      state.history = [];
    },
    
    setPrices: (state, action: PayloadAction<Partial<Prices>>) => {
      // Merge strategy: only update provided prices, keep others unchanged
      state.prices = { ...state.prices, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrices.fulfilled, (state, action) => {
        // Mock data kontrolü - eğer payload DEFAULT_PRICES ise persist etme
        const defaultPrices = getDefaultPrices();
        const isMockData = action.payload && JSON.stringify(action.payload) === JSON.stringify(defaultPrices);
        
        if (isMockData) {
          // Mock data - sadece state'e yazma, persist etme
          // Mevcut prices'ı koru (eğer varsa gerçek veri)
          logger.warn('[PORTFOLIO] Mock data alındı, persist edilmiyor - mevcut prices korunuyor');
          return; // State'i değiştirme, mevcut prices'ı koru
        }
        
        // Gerçek API verisi - persist et
        if (action.payload && typeof action.payload === 'object') {
          const validatedPrices: Partial<Prices> = {};
          Object.entries(action.payload).forEach(([key, value]) => {
            if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0) {
              validatedPrices[key as keyof Prices] = value;
            }
          });
          // Merge new prices with existing ones
          state.prices = { ...state.prices, ...validatedPrices };
          
          logger.debug('[PORTFOLIO] Gerçek API verisi alındı ve persist ediliyor');
        }
      })
      .addCase(fetchPrices.rejected, (state) => {
        // Keep existing prices on error - no state change needed
        // Error is handled in the component
        logger.warn('[PORTFOLIO] fetchPrices rejected - mevcut prices korunuyor');
      });
  }
});

export const { 
  addItem, 
  removeItem,
  updateItemAmount,
  updatePrice, 
  setLanguage, 
  resetAll, 
  setPrices
} = portfolioSlice.actions;

// ═══════════════════════════════════════════════════════════════
// BASE SELECTORS - Memoization için base selector'lar
// ═══════════════════════════════════════════════════════════════

/**
 * Base selector'lar - State'in direkt slice'larını döndürür
 * Bu selector'lar memoization için kullanılacak
 */
const selectPortfolioState = (state: RootState) => state.portfolio;

export const selectItems = createSelector(
  [selectPortfolioState],
  (portfolio) => portfolio.items
);

export const selectPrices = createSelector(
  [selectPortfolioState],
  (portfolio) => portfolio.prices
);

export const selectHistory = createSelector(
  [selectPortfolioState],
  (portfolio) => portfolio.history
);

export const selectLanguage = createSelector(
  [selectPortfolioState],
  (portfolio) => portfolio.currentLanguage
);

// ═══════════════════════════════════════════════════════════════
// COMPUTED SELECTORS - Memoized computed selector'lar
// ═══════════════════════════════════════════════════════════════

/**
 * Total TL value selector - Memoized
 * Items veya prices değişmediği sürece cache'den döner
 */
export const selectTotalTL = createSelector(
  [selectItems, selectPrices],
  (items, prices) => {
    if (!items || items.length === 0) {
      return 0;
    }
    return items.reduce((sum, item) => {
      if (!item || !item.type || isNaN(item.amount)) {
        return sum;
      }
      return sum + getItemValueInTL(item, prices);
    }, 0);
  }
);

/**
 * Total in currency selector - Parametreli memoized selector
 * Items veya prices değişmediği sürece cache'den döner
 * Currency parametresi için factory function pattern kullanıyoruz
 */
const selectTotalInBase = createSelector(
  [selectItems, selectPrices],
  (items, prices) => {
    // Base computation - currency'ye göre total hesapla
    // Bu fonksiyon currency parametresi alan bir fonksiyon döndürür
    return (currency: CurrencyType): number => {
      if (!items || items.length === 0) {
        return 0;
      }
      
      const gramEquivalents: Record<string, number> = {
        'ceyrek': 1.75,
        'tam': 7,
        '22_ayar': 1,
        '24_ayar': 1,
      };
      
      return items.reduce((sum, item) => {
        if (!item || !item.type || isNaN(item.amount) || !isFinite(item.amount)) {
          return sum;
        }
        
        if (currency === 'ALTIN' && gramEquivalents[item.type]) {
          return sum + (item.amount * gramEquivalents[item.type]);
        } else {
          const valueTL = getItemValueInTL(item, prices);
          const convertedValue = convertFromTL(valueTL, currency, prices);
          // Check for NaN or Infinity
          if (isNaN(convertedValue) || !isFinite(convertedValue)) {
            return sum;
          }
          return sum + convertedValue;
        }
      }, 0);
    };
  }
);

/**
 * Parametreli selector factory
 * Currency parametresi ile total değeri döndürür
 * Memoization: items ve prices değişmediği sürece aynı fonksiyon döner
 */
export const selectTotalIn = (currency: CurrencyType) => {
  return (state: RootState) => {
    const totalInBase = selectTotalInBase(state);
    return totalInBase(currency);
  };
};

export default portfolioSlice.reducer;
