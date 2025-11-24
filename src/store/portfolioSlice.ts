import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PortfolioItem, HistoryItem, Prices, AssetType, CurrencyType } from '../types';
import { fetchPrices as fetchPricesFromAPI } from '../services/priceService';
import { safeAdd, safeSubtract } from '../utils/numberUtils';

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

const initialState: PortfolioState = {
  items: [],
  prices: initialPrices,
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
      const prices = await fetchPricesFromAPI();
      return prices;
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching prices:', error);
      }
      return rejectWithValue('Failed to fetch prices');
    } finally {
      isFetchingPrices = false;
    }
  }
);

const getItemValueInTL = (item: PortfolioItem, prices: Prices): number => {
  if (item.type === 'tl') {
    return item.amount;
  } else if (item.type === 'usd') {
    return item.amount * (prices.usd || 0);
  } else if (item.type === 'eur') {
    return item.amount * (prices.eur || 0);
  } else {
    return item.amount * (prices[item.type] || 0);
  }
};

const convertFromTL = (valueTL: number, targetCurrency: CurrencyType, prices: Prices): number => {
  switch (targetCurrency) {
    case 'TL':
      return valueTL;
    case 'USD':
      return valueTL / (prices.usd || 1);
    case 'EUR':
      return valueTL / (prices.eur || 1);
    case 'ALTIN':
      return valueTL / (prices['24_ayar'] || 1);
    default:
      return valueTL;
  }
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<PortfolioItem, 'id' | 'date'>>) => {
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
      
      // Calculate current total for this asset type
      const itemsOfType = state.items.filter(item => item.type === type);
      const currentTotal = itemsOfType.reduce((sum, item) => safeAdd(sum, item.amount), 0);
      
      // Calculate difference safely
      const difference = safeSubtract(newAmount, currentTotal);
      
      if (difference === 0) return;
      
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
          type: 'update',
          item: newItem,
          date: new Date().toISOString(),
          description: description || undefined, // Description will be set in component level with i18n
          previousAmount: currentTotal
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
          type: 'update',
          item: { 
            type, 
            amount: amountToRemove, // Show how much was removed (positive number)
            id: Date.now().toString(), 
            date: new Date().toISOString() 
          },
          date: new Date().toISOString(),
          description: description || undefined, // Description will be set in component level with i18n
          previousAmount: currentTotal
        });
      }
    },
    
    updatePrice: (state, action: PayloadAction<{ key: AssetType; value: number }>) => {
      state.prices[action.payload.key] = action.payload.value;
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
        // Merge new prices with existing ones
        state.prices = { ...state.prices, ...action.payload };
      })
      .addCase(fetchPrices.rejected, (state) => {
        // Keep existing prices on error - no state change needed
        // Error is handled in the component
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
export const selectHistory = (state: { portfolio: PortfolioState }) => state.portfolio.history;
export const selectLanguage = (state: { portfolio: PortfolioState }) => state.portfolio.currentLanguage;

export const selectTotalTL = (state: { portfolio: PortfolioState }) => {
  return state.portfolio.items.reduce((sum, item) => {
    return sum + getItemValueInTL(item, state.portfolio.prices);
  }, 0);
};

export const selectTotalIn = (currency: CurrencyType) => (state: { portfolio: PortfolioState }) => {
  const gramEquivalents: Record<string, number> = {
    'ceyrek': 1.75,
    'tam': 7,
    '22_ayar': 1,
    '24_ayar': 1,
  };
  
  return state.portfolio.items.reduce((sum, item) => {
    if (currency === 'ALTIN' && gramEquivalents[item.type]) {
      return sum + (item.amount * gramEquivalents[item.type]);
    } else {
      const valueTL = getItemValueInTL(item, state.portfolio.prices);
      const convertedValue = convertFromTL(valueTL, currency, state.portfolio.prices);
      return sum + convertedValue;
    }
  }, 0);
};

export default portfolioSlice.reducer;
