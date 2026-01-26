import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PortfolioItem, HistoryItem, Prices, PriceChanges, AssetType, CurrencyType, BuyPrices } from '../types';
import { fetchPrices as fetchPricesFromAPI } from '../services/priceService';
import { getBackup } from '../services/priceBackupService';
import { safeAdd, safeSubtract } from '../utils/numberUtils';
import { trackPriceFetchError } from '../utils/errorTracking';

interface PortfolioState {
  items: PortfolioItem[];
  prices: Prices; // Sell prices (satis)
  buyPrices: BuyPrices; // Buy prices (alis)
  priceChanges: PriceChanges;
  history: HistoryItem[];
  currentLanguage: string;
  priceDataFetchedAt?: number; // Timestamp when prices were fetched
  isUsingBackupPriceData?: boolean; // Indicates if current prices are from backup
  hasPartialPriceUpdate?: boolean; // Indicates if some prices failed to update
  isFetchingPrices?: boolean; // Indicates if prices are currently being fetched (race condition prevention)
  priceFetchError?: string | null; // Error message if price fetch failed
}

const initialPrices: Prices = {
  '22_ayar': null,
  '24_ayar': null,
  ceyrek: null,
  tam: null,
  usd: null,
  eur: null,
  tl: 1, // TL is always 1 (base currency)
  gumus: null
};

const initialBuyPrices: BuyPrices = {
  '22_ayar': null,
  '24_ayar': null,
  ceyrek: null,
  tam: null,
  usd: null,
  eur: null,
  tl: 1, // TL is always 1 (base currency)
  gumus: null
};

const initialChanges: PriceChanges = {
  '22_ayar': null,
  '24_ayar': null,
  ceyrek: null,
  tam: null,
  usd: null,
  eur: null,
  tl: null,
  gumus: null
};

export const initialState: PortfolioState = {
  items: [],
  prices: initialPrices,
  buyPrices: initialBuyPrices,
  priceChanges: initialChanges,
  history: [],
  currentLanguage: 'tr',
  isFetchingPrices: false,
  priceFetchError: null
};

// Module-level flag for immediate race condition prevention
// This is checked synchronously before Redux state update
let isFetchingPricesModule = false;

export const fetchPrices = createAsyncThunk(
  'portfolio/fetchPrices',
  async (_, { getState, rejectWithValue, dispatch }) => {
    // Check module-level flag first for immediate synchronization
    if (isFetchingPricesModule) {
      // Also check Redux state as secondary check
      const state = getState() as { portfolio: PortfolioState };
      if (state.portfolio.isFetchingPrices) {
        return rejectWithValue('Already fetching prices');
      }
    }
    
    // Set module-level flag immediately
    isFetchingPricesModule = true;
    
    try {
      const priceData = await fetchPricesFromAPI();
      return priceData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prices';
      return rejectWithValue(errorMessage);
    } finally {
      // Always clear the flag when done
      isFetchingPricesModule = false;
    }
  }
);

const getItemValueInTL = (item: PortfolioItem, prices: Prices): number | null => {
  // Validate inputs
  if (!item || !item.type || isNaN(item.amount) || !isFinite(item.amount) || item.amount < 0) {
    return 0;
  }
  
  if (item.type === 'tl') {
    return item.amount;
  } else if (item.type === 'usd') {
    const usdPrice = prices.usd;
    // Finance-safe: Return null if price is unavailable, do not hide errors with 0
    if (usdPrice == null || isNaN(usdPrice) || !isFinite(usdPrice) || usdPrice <= 0) {
      return null;
    }
    return item.amount * usdPrice;
  } else if (item.type === 'eur') {
    const eurPrice = prices.eur;
    // Finance-safe: Return null if price is unavailable, do not hide errors with 0
    if (eurPrice == null || isNaN(eurPrice) || !isFinite(eurPrice) || eurPrice <= 0) {
      return null;
    }
    return item.amount * eurPrice;
  } else {
    const price = prices[item.type];
    // Finance-safe: Return null if price is unavailable, do not hide errors with 0
    if (price == null || isNaN(price) || !isFinite(price) || price <= 0) {
      return null;
    }
    return item.amount * price;
  }
};

const convertFromTL = (valueTL: number, targetCurrency: CurrencyType, prices: Prices): number | null => {
  // Validate input
  if (isNaN(valueTL) || !isFinite(valueTL) || valueTL < 0) {
    return 0;
  }
  
  switch (targetCurrency) {
    case 'TL':
      return valueTL;
    case 'USD': {
      const usdPrice = prices.usd;
      // Finance-safe: Return null if price is unavailable, do not hide errors with 0
      if (usdPrice == null || isNaN(usdPrice) || !isFinite(usdPrice) || usdPrice <= 0) {
        return null;
      }
      return valueTL / usdPrice;
    }
    case 'EUR': {
      const eurPrice = prices.eur;
      // Finance-safe: Return null if price is unavailable, do not hide errors with 0
      if (eurPrice == null || isNaN(eurPrice) || !isFinite(eurPrice) || eurPrice <= 0) {
        return null;
      }
      return valueTL / eurPrice;
    }
    case 'ALTIN': {
      const altinPrice = prices['24_ayar'];
      // Finance-safe: Return null if price is unavailable, do not hide errors with 0
      if (altinPrice == null || isNaN(altinPrice) || !isFinite(altinPrice) || altinPrice <= 0) {
        return null;
      }
      return valueTL / altinPrice;
    }
    default:
      return valueTL;
  }
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<PortfolioItem, 'id' | 'date'> & { priceAtTime?: number | null }>) => {
      const { type, amount, priceAtTime } = action.payload;
      
      // Validate input
      if (!type || isNaN(amount) || !isFinite(amount) || amount <= 0) {
        return; // Invalid input, ignore
      }
      
      const newItem: PortfolioItem = {
        type,
        amount,
        description: action.payload.description,
        id: Date.now().toString(),
        date: new Date().toISOString()
      };
      
      state.items.push(newItem);
      
      // Use provided priceAtTime or calculate from current prices
      const finalPriceAtTime = priceAtTime != null 
        ? priceAtTime 
        : (getItemValueInTL(newItem, state.prices) ?? null);
      
      state.history.unshift({
        type: 'add',
        item: newItem,
        date: new Date().toISOString(),
        description: newItem.description || '',
        priceAtTime: finalPriceAtTime
      });
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      
      if (index !== -1) {
        const removed = state.items[index];
        state.items.splice(index, 1);
        
        // Calculate price at time of transaction
        const priceAtTime = getItemValueInTL(removed, state.prices);
        
        state.history.unshift({
          type: 'remove',
          item: removed,
          date: new Date().toISOString(),
          priceAtTime: priceAtTime != null ? priceAtTime : null
        });
      }
    },
    
    updateItemAmount: (state, action: PayloadAction<{ type: AssetType; newAmount: number; description?: string; priceAtTime?: number | null }>) => {
      const { type, newAmount, description, priceAtTime } = action.payload;
      
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
        
        // Use provided priceAtTime or calculate from current prices
        const finalPriceAtTime = priceAtTime != null 
          ? priceAtTime 
          : (getItemValueInTL(newItem, state.prices) ?? null);
        
        state.history.unshift({
          type: 'add',
          item: newItem,
          date: new Date().toISOString(),
          description: description || undefined, // Description will be set in component level with i18n
          priceAtTime: finalPriceAtTime
        });
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
        
        // Use provided priceAtTime or calculate from current prices for the removed amount
        const removedItemForPrice: PortfolioItem = {
          type,
          amount: amountToRemove,
          id: Date.now().toString(),
          date: new Date().toISOString()
        };
        const finalPriceAtTime = priceAtTime != null 
          ? priceAtTime 
          : (getItemValueInTL(removedItemForPrice, state.prices) ?? null);
        
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
          priceAtTime: finalPriceAtTime
        });
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
    },
    
    setHistory: (state, action: PayloadAction<HistoryItem[]>) => {
      state.history = action.payload;
    },
    
    setItems: (state, action: PayloadAction<PortfolioItem[]>) => {
      // Set items without adding to history (used for restore operations)
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrices.pending, (state) => {
        // Set fetching flag and clear error
        // Note: Module-level flag is already set in the thunk for immediate synchronization
        state.isFetchingPrices = true;
        state.priceFetchError = null;
        // Clear backup flag when starting a new fetch
        // This ensures that if the fetch succeeds, we don't show backup warning
        state.isUsingBackupPriceData = false;
      })
      .addCase(fetchPrices.fulfilled, (state, action) => {
        // Clear fetching flag
        state.isFetchingPrices = false;
        state.priceFetchError = null;
        
        // Check if payload is valid PriceData
        if (!action.payload || typeof action.payload !== 'object' || !('prices' in action.payload) || !('changes' in action.payload)) {
          if (__DEV__) {
            console.warn('[PORTFOLIO] Invalid payload structure');
          }
          state.priceFetchError = 'Invalid response structure';
          return;
        }

        const { prices, buyPrices, changes, fetchedAt, isBackup } = action.payload;
        
        // Check if this is a partial update (some prices are null/missing)
        // Fix: Check for non-null values, not just key presence
        const requiredPriceKeys: (keyof Prices)[] = ['22_ayar', '24_ayar', 'ceyrek', 'tam', 'usd', 'eur', 'tl', 'gumus'];
        let hasPartialUpdate = false;
        
        if (prices && typeof prices === 'object') {
          const validatedPrices: Partial<Prices> = {};
          const validPriceKeys: string[] = [];
          
          Object.entries(prices).forEach(([key, value]) => {
            // Accept both number and null values (null indicates unavailable/invalid data)
            // Finance-safe: Do not hide errors by silently skipping null values
            if (value === null || (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0)) {
              validatedPrices[key as keyof Prices] = value;
              // Only count non-null values as valid updates
              if (value !== null) {
                validPriceKeys.push(key);
              }
            }
          });
          
          // Check if all required prices have non-null values
          const allPricesValid = requiredPriceKeys.every(key => {
            const priceValue = validatedPrices[key];
            return priceValue !== null && priceValue !== undefined;
          });
          hasPartialUpdate = !allPricesValid;
          
          state.prices = { ...state.prices, ...validatedPrices };
        }
        
        // Update buy prices if provided
        if (buyPrices && typeof buyPrices === 'object') {
          const validatedBuyPrices: Partial<BuyPrices> = {};
          Object.entries(buyPrices).forEach(([key, value]) => {
            // Accept both number and null values (null indicates unavailable/invalid data)
            if (value === null || (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0)) {
              validatedBuyPrices[key as keyof BuyPrices] = value;
            }
          });
          state.buyPrices = { ...state.buyPrices, ...validatedBuyPrices };
        }
        
        if (changes && typeof changes === 'object') {
          const validatedChanges: Partial<PriceChanges> = {};
          Object.entries(changes).forEach(([key, value]) => {
            // Accept both number and null values (null indicates invalid/missing data)
            if (value === null || (typeof value === 'number' && !isNaN(value) && isFinite(value))) {
              validatedChanges[key as keyof PriceChanges] = value;
            }
          });
          state.priceChanges = { ...state.priceChanges, ...validatedChanges };
        }
        
        // Store metadata about price data source
        // Explicitly set isUsingBackupPriceData based on isBackup flag
        // Only set to true if isBackup is explicitly true, otherwise false
        state.priceDataFetchedAt = fetchedAt || Date.now();
        state.isUsingBackupPriceData = isBackup === true;
        state.hasPartialPriceUpdate = hasPartialUpdate;
      })
      .addCase(fetchPrices.rejected, (state, action) => {
        // Clear fetching flag
        // Note: Module-level flag is already cleared in the thunk's finally block
        state.isFetchingPrices = false;
        
        // Set error message
        const errorMessage = typeof action.payload === 'string' ? action.payload : 'Failed to fetch prices';
        state.priceFetchError = errorMessage;
        
        // Don't track "Already fetching prices" as an error - it's expected behavior
        if (errorMessage !== 'Already fetching prices') {
          // Track the error (pass string directly, trackPriceFetchError accepts Error | string)
          try {
            trackPriceFetchError(errorMessage, 'Redux Thunk', undefined, false);
          } catch (trackingError) {
            // Don't let error tracking break the app
            if (__DEV__) {
              console.warn('[PORTFOLIO] Error tracking failed:', trackingError);
            }
          }
        }
        
        // Attempt to load backup as fallback
        // Note: This is async, so we'll handle it in a thunk if needed
        // For now, we keep existing prices and set error flag
        // The backup will be attempted automatically on next fetch
        
        if (__DEV__ && errorMessage !== 'Already fetching prices') {
          console.warn('[PORTFOLIO] Price fetch rejected:', errorMessage);
        }
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
  setPrices,
  setHistory,
  setItems
} = portfolioSlice.actions;

export const selectItems = (state: { portfolio: PortfolioState }) => state.portfolio.items;
export const selectPrices = (state: { portfolio: PortfolioState }) => state.portfolio.prices;
export const selectBuyPrices = (state: { portfolio: PortfolioState }) => state.portfolio.buyPrices;
export const selectPriceChanges = (state: { portfolio: PortfolioState }) => state.portfolio.priceChanges;
export const selectHistory = (state: { portfolio: PortfolioState }) => state.portfolio.history;
export const selectLanguage = (state: { portfolio: PortfolioState }) => state.portfolio.currentLanguage;
export const selectPriceDataFetchedAt = (state: { portfolio: PortfolioState }) => state.portfolio.priceDataFetchedAt;
export const selectIsUsingBackupPriceData = (state: { portfolio: PortfolioState }) => state.portfolio.isUsingBackupPriceData;
export const selectHasPartialPriceUpdate = (state: { portfolio: PortfolioState }) => state.portfolio.hasPartialPriceUpdate;
export const selectIsFetchingPrices = (state: { portfolio: PortfolioState }) => state.portfolio.isFetchingPrices ?? false;
export const selectPriceFetchError = (state: { portfolio: PortfolioState }) => state.portfolio.priceFetchError;

export const selectTotalTL = (state: { portfolio: PortfolioState }) => {
  if (!state.portfolio?.items || state.portfolio.items.length === 0) {
    return 0;
  }
  return state.portfolio.items.reduce((sum, item) => {
    if (!item || !item.type || isNaN(item.amount)) {
      return sum;
    }
    const value = getItemValueInTL(item, state.portfolio.prices);
    // Finance-safe: Skip items with null prices (unavailable data), do not add 0
    return value != null ? sum + value : sum;
  }, 0);
};

export const selectTotalIn = (currency: CurrencyType) => (state: { portfolio: PortfolioState }) => {
  if (!state.portfolio?.items || state.portfolio.items.length === 0) {
    return 0;
  }
  
  const gramEquivalents: Record<string, number> = {
    'ceyrek': 1.75,
    'tam': 7,
    '22_ayar': 1,
    '24_ayar': 1,
  };
  
  return state.portfolio.items.reduce((sum, item) => {
    if (!item || !item.type || isNaN(item.amount) || !isFinite(item.amount)) {
      return sum;
    }
    
    if (currency === 'ALTIN' && gramEquivalents[item.type]) {
      return sum + (item.amount * gramEquivalents[item.type]);
    } else {
      const valueTL = getItemValueInTL(item, state.portfolio.prices);
      // Finance-safe: Skip items with null prices (unavailable data)
      if (valueTL == null) {
        return sum;
      }
      const convertedValue = convertFromTL(valueTL, currency, state.portfolio.prices);
      // Finance-safe: Skip items with null conversion (unavailable price data)
      if (convertedValue == null || isNaN(convertedValue) || !isFinite(convertedValue)) {
        return sum;
      }
      return sum + convertedValue;
    }
  }, 0);
};

export default portfolioSlice.reducer;
