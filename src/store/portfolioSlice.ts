import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PortfolioItem, HistoryItem, Prices, AssetType, CurrencyType } from '../types';
import { fetchPrices as fetchPricesFromAPI } from '../services/priceService';

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

const LOCAL_KEY = 'portfolio_items';
const HISTORY_KEY = 'portfolio_history';
const PRICES_KEY = 'portfolio_prices';
const LANGUAGE_KEY = 'portfolio_language';

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
      
      Promise.all([
        AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(state.items)),
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(state.history))
      ]).catch(error => {
        // Handle AsyncStorage error silently in production
        if (__DEV__) {
          console.error('Error saving to AsyncStorage:', error);
        }
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
        
        Promise.all([
          AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(state.items)),
          AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(state.history))
        ]).catch(error => console.error('Error saving to AsyncStorage:', error));
      }
    },
    
    updateItemAmount: (state, action: PayloadAction<{ type: AssetType; newAmount: number; description?: string }>) => {
      const { type, newAmount, description } = action.payload;
      const itemsOfType = state.items.filter(item => item.type === type);
      const currentTotal = itemsOfType.reduce((sum, item) => sum + item.amount, 0);
      const difference = newAmount - currentTotal;
      
      if (difference === 0) return;
      
      if (difference > 0) {
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
          description: description || undefined
        });
      } else {
        let remainingToRemove = Math.abs(difference);
        
        for (let i = itemsOfType.length - 1; i >= 0 && remainingToRemove > 0; i--) {
          const item = itemsOfType[i];
          const index = state.items.findIndex(stateItem => stateItem.id === item.id);
          
          if (index !== -1) {
            if (item.amount <= remainingToRemove) {
              remainingToRemove -= item.amount;
              state.items.splice(index, 1);
              
              state.history.unshift({
                type: 'remove',
                item: item,
                date: new Date().toISOString(),
                description: description || undefined
              });
            } else {
              const removedAmount = remainingToRemove;
              state.items[index].amount -= remainingToRemove;
              remainingToRemove = 0;
              
              state.history.unshift({
                type: 'remove',
                item: { ...item, amount: removedAmount },
                date: new Date().toISOString(),
                description: description || undefined
              });
            }
          }
        }
      }
      
      Promise.all([
        AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(state.items)),
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(state.history))
      ]).catch(error => {
        // Handle AsyncStorage error silently in production
        if (__DEV__) {
          console.error('Error saving to AsyncStorage:', error);
        }
      });
    },
    
    updatePrice: (state, action: PayloadAction<{ key: AssetType; value: number }>) => {
      state.prices[action.payload.key] = action.payload.value;
      AsyncStorage.setItem(PRICES_KEY, JSON.stringify(state.prices))
        .catch(error => {
          // Handle AsyncStorage error silently in production
          if (__DEV__) {
            console.error('Error saving prices:', error);
          }
        });
    },
    
    setLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
      AsyncStorage.setItem(LANGUAGE_KEY, action.payload)
        .catch(error => {
          // Handle AsyncStorage error silently in production
          if (__DEV__) {
            console.error('Error saving language:', error);
          }
        });
    },
    
    resetAll: (state) => {
      state.items = [];
      state.history = [];
      AsyncStorage.removeItem(LOCAL_KEY);
      AsyncStorage.removeItem(HISTORY_KEY);
    },
    
    loadPersistedData: (
      state, 
      action: PayloadAction<{ 
        items?: PortfolioItem[]; 
        history?: HistoryItem[]; 
        prices?: Prices;
        language?: string;
      }>
    ) => {
      if (action.payload.items) {
        state.items = action.payload.items;
      }
      if (action.payload.history) {
        state.history = action.payload.history;
      }
      if (action.payload.prices) {
        state.prices = { ...initialPrices, ...action.payload.prices };
      }
      if (action.payload.language) {
        state.currentLanguage = action.payload.language;
      }
    },
    
    setPrices: (state, action: PayloadAction<Prices>) => {
      state.prices = { ...state.prices, ...action.payload };
      AsyncStorage.setItem(PRICES_KEY, JSON.stringify(state.prices))
        .catch(error => {
          // Handle AsyncStorage error silently in production
          if (__DEV__) {
            console.error('Error saving prices:', error);
          }
        });
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPrices.fulfilled, (state, action) => {
      state.prices = { ...state.prices, ...action.payload };
      AsyncStorage.setItem(PRICES_KEY, JSON.stringify(state.prices))
        .catch(error => {
          // Handle AsyncStorage error silently in production
          if (__DEV__) {
            console.error('Error saving prices:', error);
          }
        });
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
  loadPersistedData,
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

export const loadInitialData = () => async (dispatch: any) => {
  try {
    const [itemsJson, historyJson, pricesJson, language] = await Promise.all([
      AsyncStorage.getItem(LOCAL_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(PRICES_KEY),
      AsyncStorage.getItem(LANGUAGE_KEY)
    ]);
    
    const items = itemsJson ? JSON.parse(itemsJson) : undefined;
    const history = historyJson ? JSON.parse(historyJson) : undefined;
    const prices = pricesJson ? JSON.parse(pricesJson) : undefined;
    
    dispatch(loadPersistedData({ items, history, prices, language: language || undefined }));
    } catch (error) {
      // Handle error silently in production
      if (__DEV__) {
        console.error('Error loading persisted data:', error);
      }
    }
};

export default portfolioSlice.reducer;
