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

export const fetchPrices = createAsyncThunk(
  'portfolio/fetchPrices',
  async (_, { rejectWithValue }) => {
    try {
      const prices = await fetchPricesFromAPI();
      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return rejectWithValue('Failed to fetch prices');
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
          description: description || 'Miktar artırıldı',
          previousAmount: currentTotal
        });
      } else {
        // Removing assets (difference is negative)
        const amountToRemove = Math.abs(difference);
        let remainingToRemove = amountToRemove;
        
        // Create a new items array to avoid complex in-place splicing issues
        const newItems: PortfolioItem[] = [];
        const removedItems: PortfolioItem[] = []; // Track what we removed for history if needed
        
        // Keep items that are not of this type
        state.items.forEach(item => {
          if (item.type !== type) {
            newItems.push(item);
          }
        });
        
        // Process items of this type (oldest first or newest first? usually FIFO or LIFO. 
        // The previous implementation was iterating backwards (LIFO removal). Let's stick to that for consistency.)
        // Actually, iterating backwards is good for removing from the end.
        
        // Let's sort itemsOfType by date descending (newest first) to remove newest first? 
        // Or just use the order they are in.
        // The previous implementation iterated backwards: `for (let i = itemsOfType.length - 1; ...)`
        
        const itemsToProcess = [...itemsOfType]; // Copy
        
        // We want to remove `remainingToRemove` from `itemsToProcess` starting from the end
        for (let i = itemsToProcess.length - 1; i >= 0; i--) {
          const item = itemsToProcess[i];
          
          if (remainingToRemove <= 0) {
            newItems.push(item); // Keep the rest
            continue;
          }
          
          if (item.amount <= remainingToRemove) {
            // Remove this entire item
            remainingToRemove = safeSubtract(remainingToRemove, item.amount);
            // Don't push to newItems
          } else {
            // Partial removal
            const newAmount = safeSubtract(item.amount, remainingToRemove);
            remainingToRemove = 0;
            newItems.push({ ...item, amount: newAmount });
          }
        }
        
        // Reconstruct state.items. 
        // Note: The order in newItems might be mixed up because we separated by type.
        // To preserve order, we should have iterated the main list.
        // Let's try a safer approach that preserves order.
        
        // Reset logic:
        remainingToRemove = amountToRemove;
        // We iterate backwards through the main list to find items of this type
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
          description: description || 'Miktar azaltıldı',
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
    
    setPrices: (state, action: PayloadAction<Prices>) => {
      state.prices = { ...state.prices, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPrices.fulfilled, (state, action) => {
      state.prices = { ...state.prices, ...action.payload };
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
