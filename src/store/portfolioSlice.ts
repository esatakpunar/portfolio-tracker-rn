import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PortfolioItem, HistoryItem, Prices, PriceChanges, AssetType, CurrencyType } from '../types';
import { fetchPrices as fetchPricesFromAPI } from '../services/priceService';
import { safeAdd, safeSubtract } from '../utils/numberUtils';

interface PortfolioState {
  items: PortfolioItem[];
  prices: Prices;
  priceChanges: PriceChanges;
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

const initialChanges: PriceChanges = {
  '22_ayar': 0,
  '24_ayar': 0,
  ceyrek: 0,
  tam: 0,
  usd: 0,
  eur: 0,
  tl: 0,
  gumus: 0
};

export const initialState: PortfolioState = {
  items: [],
  prices: initialPrices,
  priceChanges: initialChanges,
  history: [],
  currentLanguage: 'tr'
};

// Race condition prevention
let isFetchingPrices = false;

export const fetchPrices = createAsyncThunk(
  'portfolio/fetchPrices',
  async (_, { rejectWithValue }) => {
    if (isFetchingPrices) {
      return rejectWithValue('Already fetching prices');
    }
    
    isFetchingPrices = true;
    try {
      const priceData = await fetchPricesFromAPI();
      return priceData;
    } catch (error) {
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
      const usdPrice = prices.usd;
      return (usdPrice != null && usdPrice > 0) ? valueTL / usdPrice : 0;
    }
    case 'EUR': {
      const eurPrice = prices.eur;
      return (eurPrice != null && eurPrice > 0) ? valueTL / eurPrice : 0;
    }
    case 'ALTIN': {
      const altinPrice = prices['24_ayar'];
      return (altinPrice != null && altinPrice > 0) ? valueTL / altinPrice : 0;
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
      
      state.history.unshift({
        type: 'add',
        item: newItem,
        date: new Date().toISOString(),
        description: newItem.description || ''
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
        // Check if payload is valid PriceData
        if (!action.payload || typeof action.payload !== 'object' || !('prices' in action.payload) || !('changes' in action.payload)) {
          if (__DEV__) {
            console.warn('[PORTFOLIO] Invalid payload structure');
          }
          return;
        }

        const { prices, changes } = action.payload;
        
        if (prices && typeof prices === 'object') {
          const validatedPrices: Partial<Prices> = {};
          Object.entries(prices).forEach(([key, value]) => {
            // Accept both number and null values (null indicates unavailable/invalid data)
            // Finance-safe: Do not hide errors by silently skipping null values
            if (value === null || (typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= 0)) {
              validatedPrices[key as keyof Prices] = value;
            }
          });
          state.prices = { ...state.prices, ...validatedPrices };
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
      })
      .addCase(fetchPrices.rejected, (state) => {
        // Keep existing prices on error
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

export const selectItems = (state: { portfolio: PortfolioState }) => state.portfolio.items;
export const selectPrices = (state: { portfolio: PortfolioState }) => state.portfolio.prices;
export const selectPriceChanges = (state: { portfolio: PortfolioState }) => state.portfolio.priceChanges;
export const selectHistory = (state: { portfolio: PortfolioState }) => state.portfolio.history;
export const selectLanguage = (state: { portfolio: PortfolioState }) => state.portfolio.currentLanguage;

export const selectTotalTL = (state: { portfolio: PortfolioState }) => {
  if (!state.portfolio?.items || state.portfolio.items.length === 0) {
    return 0;
  }
  return state.portfolio.items.reduce((sum, item) => {
    if (!item || !item.type || isNaN(item.amount)) {
      return sum;
    }
    return sum + getItemValueInTL(item, state.portfolio.prices);
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
      const convertedValue = convertFromTL(valueTL, currency, state.portfolio.prices);
      // Check for NaN or Infinity
      if (isNaN(convertedValue) || !isFinite(convertedValue)) {
        return sum;
      }
      return sum + convertedValue;
    }
  }, 0);
};

export default portfolioSlice.reducer;
