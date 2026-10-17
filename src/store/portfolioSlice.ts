import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  PortfolioItem,
  HistoryItem,
  Prices,
  PriceChanges,
  AssetType,
  CurrencyType,
  BuyPrices,
  LotEntryOptions,
  Wallet,
} from '../types';
import {
  createDefaultWallet,
  createWalletId,
  DEFAULT_WALLET_ID,
  normalizePortfolioItems,
  normalizeWalletId,
  normalizeWallets,
  walletItemCount,
} from '../utils/walletUtils';
import { fetchPrices as fetchPricesFromAPI } from '../services/priceService';
import { getBackup } from '../services/priceBackupService';
import { safeAdd, safeSubtract } from '../utils/numberUtils';
import { trackPriceFetchError } from '../utils/errorTracking';
import { createHistoryId, ensureHistoryIds } from '../utils/historyUtils';
import { convertFromTL } from '../utils/portfolioUtils';

interface PortfolioState {
  items: PortfolioItem[];
  wallets: Wallet[];
  activeWalletId: string;
  prices: Prices; // Sell prices (satis)
  buyPrices: BuyPrices; // Buy prices (alis)
  priceChanges: PriceChanges;
  history: HistoryItem[];
  currentLanguage: string;
  priceDataFetchedAt?: number; // Timestamp when prices were fetched
  isUsingBackupPriceData?: boolean; // Indicates if current prices are from backup
  isUsingOldBackup?: boolean; // Indicates if backup is older than 24 hours (stale)
  hasPartialPriceUpdate?: boolean; // Indicates if some prices failed to update
  isFetchingPrices?: boolean; // Indicates if prices are currently being fetched (race condition prevention)
  priceFetchError?: string | null; // Error message if price fetch failed
  priceSource?: string; // Name of the API provider that supplied the price data
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
  wallets: [createDefaultWallet()],
  activeWalletId: DEFAULT_WALLET_ID,
  prices: initialPrices,
  buyPrices: initialBuyPrices,
  priceChanges: initialChanges,
  history: [],
  currentLanguage: 'tr',
  isFetchingPrices: false,
  priceFetchError: null
};

// Promise cache for preventing race conditions
// Multiple simultaneous calls will share the same promise
let activeFetchPromise: Promise<any> | null = null;
let activeFetchStartTime: number | null = null;
const FETCH_CACHE_TIMEOUT_MS = 30000; // 30 seconds - clear cache if taking too long

export const fetchPrices = createAsyncThunk(
  'portfolio/fetchPrices',
  async (signal: AbortSignal | undefined, { rejectWithValue }) => {
    // Check if cached promise is stale (hung request)
    if (activeFetchPromise && activeFetchStartTime) {
      const elapsed = Date.now() - activeFetchStartTime;
      if (elapsed > FETCH_CACHE_TIMEOUT_MS) {
        if (__DEV__) {
          console.warn('[PORTFOLIO] Cached promise is stale (hung request), clearing cache');
        }
        activeFetchPromise = null;
        activeFetchStartTime = null;
      }
    }

    // If there's already an active fetch, return its promise
    // This ensures all concurrent calls wait for the same fetch
    if (activeFetchPromise) {
      if (__DEV__) {
        console.log('[PORTFOLIO] Reusing active fetch promise');
      }
      try {
        return await activeFetchPromise;
      } catch (error) {
        // If the cached promise rejected, we'll try a fresh fetch below
        activeFetchPromise = null;
        activeFetchStartTime = null;
      }
    }

    // Create new fetch promise and cache it
    activeFetchStartTime = Date.now();
    activeFetchPromise = (async () => {
      try {
        const priceData = await fetchPricesFromAPI(signal);
        return priceData;
      } finally {
        // Clear cache when done (success or failure)
        activeFetchPromise = null;
        activeFetchStartTime = null;
      }
    })();

    try {
      return await activeFetchPromise;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prices';
      return rejectWithValue(errorMessage);
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

function resolvePriceAtTime(
  type: AssetType,
  amount: number,
  unitBuyPrice: number | null | undefined,
  priceAtTime: number | null | undefined,
  prices: Prices,
  useExplicitTotal: boolean
): number | null {
  if (useExplicitTotal && priceAtTime != null) {
    return priceAtTime;
  }
  if (unitBuyPrice != null && unitBuyPrice >= 0 && type === 'tl') {
    return amount;
  }
  if (unitBuyPrice != null && unitBuyPrice >= 0) {
    return unitBuyPrice * amount;
  }
  if (priceAtTime != null) {
    return priceAtTime;
  }
  return getItemValueInTL({ type, amount, id: '', date: '' }, prices);
}

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<Omit<PortfolioItem, 'id' | 'date'> & LotEntryOptions>
    ) => {
      const {
        type,
        amount,
        priceAtTime,
        unitBuyPrice,
        useExplicitTotalCost,
        transactionDate,
      } = action.payload;
      
      // Validate input
      if (!type || isNaN(amount) || !isFinite(amount) || amount <= 0) {
        return; // Invalid input, ignore
      }

      const txDate = transactionDate ?? new Date().toISOString();
      
      const walletId = normalizeWalletId(action.payload.walletId ?? state.activeWalletId);
      const newItem: PortfolioItem = {
        type,
        amount,
        description: action.payload.description,
        id: Date.now().toString(),
        date: txDate,
        walletId,
      };
      
      state.items.push(newItem);
      
      const finalPriceAtTime = resolvePriceAtTime(
        type,
        amount,
        unitBuyPrice,
        priceAtTime,
        state.prices,
        useExplicitTotalCost === true
      );
      
      state.history.unshift({
        id: createHistoryId(),
        type: 'add',
        item: newItem,
        date: txDate,
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
          id: createHistoryId(),
          type: 'remove',
          item: removed,
          date: new Date().toISOString(),
          priceAtTime: priceAtTime != null ? priceAtTime : null
        });
      }
    },
    
    updateItemAmount: (
      state,
      action: PayloadAction<
        { type: AssetType; newAmount: number; description?: string; walletId?: string } & LotEntryOptions
      >
    ) => {
      const {
        type,
        newAmount,
        description,
        priceAtTime,
        unitBuyPrice,
        useExplicitTotalCost,
        transactionDate,
        walletId: payloadWalletId,
      } = action.payload;
      
      // Validate input
      if (!type || isNaN(newAmount) || !isFinite(newAmount) || newAmount < 0) {
        return; // Invalid input, ignore
      }
      
      // Calculate current total for this asset type
      const targetWalletId = normalizeWalletId(payloadWalletId ?? state.activeWalletId);
      const itemsOfType = state.items.filter(
        (item) => item.type === type && normalizeWalletId(item.walletId) === targetWalletId
      );
      const currentTotal = itemsOfType.reduce((sum, item) => safeAdd(sum, item.amount), 0);
      
      // Calculate difference safely
      const difference = safeSubtract(newAmount, currentTotal);
      
      if (Math.abs(difference) < 0.000001) return; // Use epsilon for floating point comparison
      
      if (difference > 0) {
        const txDate = transactionDate ?? new Date().toISOString();
        // Adding more assets
        const newItem: PortfolioItem = {
          type,
          amount: difference,
          id: Date.now().toString(),
          date: txDate,
          description: description || undefined,
          walletId: targetWalletId,
        };
        
        state.items.push(newItem);
        
        const finalPriceAtTime = resolvePriceAtTime(
          type,
          difference,
          unitBuyPrice,
          priceAtTime,
          state.prices,
          useExplicitTotalCost === true
        );
        
        state.history.unshift({
          id: createHistoryId(),
          type: 'add',
          item: newItem,
          date: txDate,
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
          if (
            item.type === type &&
            normalizeWalletId(item.walletId) === targetWalletId &&
            remainingToRemove > 0
          ) {
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
          id: createHistoryId(),
          type: 'remove',
          item: {
            type,
            amount: amountToRemove,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            walletId: targetWalletId,
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
      state.wallets = [createDefaultWallet()];
      state.activeWalletId = DEFAULT_WALLET_ID;
    },
    
    setPrices: (state, action: PayloadAction<Partial<Prices>>) => {
      // Merge strategy: only update provided prices, keep others unchanged
      state.prices = { ...state.prices, ...action.payload };
    },
    
    setHistory: (state, action: PayloadAction<HistoryItem[]>) => {
      state.history = ensureHistoryIds(action.payload);
    },
    
    setItems: (state, action: PayloadAction<PortfolioItem[]>) => {
      state.items = normalizePortfolioItems(action.payload);
    },

    setWallets: (state, action: PayloadAction<Wallet[]>) => {
      state.wallets = normalizeWallets(action.payload);
      if (!state.wallets.some((w) => w.id === state.activeWalletId)) {
        state.activeWalletId = DEFAULT_WALLET_ID;
      }
    },

    setActiveWalletId: (state, action: PayloadAction<string>) => {
      const id = normalizeWalletId(action.payload);
      if (id === DEFAULT_WALLET_ID || state.wallets.some((w) => w.id === id)) {
        state.activeWalletId = id;
      }
    },

    addWallet: (state, action: PayloadAction<{ name: string; id?: string }>) => {
      const name = action.payload.name.trim();
      if (!name) {
        return;
      }
      const wallet: Wallet = {
        id: action.payload.id ?? createWalletId(),
        name,
        createdAt: Date.now(),
      };
      state.wallets.push(wallet);
      state.activeWalletId = wallet.id;
    },

    renameWallet: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const name = action.payload.name.trim();
      if (!name) {
        return;
      }
      const wallet = state.wallets.find((w) => w.id === action.payload.id);
      if (wallet) {
        wallet.name = name;
      }
    },

    moveWalletHoldings: (
      state,
      action: PayloadAction<{ fromWalletId: string; toWalletId: string }>
    ) => {
      const fromId = normalizeWalletId(action.payload.fromWalletId);
      const toId = normalizeWalletId(action.payload.toWalletId);
      if (fromId === toId) {
        return;
      }
      if (!state.wallets.some((w) => w.id === fromId) || !state.wallets.some((w) => w.id === toId)) {
        return;
      }
      for (const item of state.items) {
        if (normalizeWalletId(item.walletId) === fromId) {
          item.walletId = toId;
        }
      }
      for (const entry of state.history) {
        if (normalizeWalletId(entry.item.walletId) === fromId) {
          entry.item = { ...entry.item, walletId: toId };
        }
      }
    },

    moveAssetHoldings: (
      state,
      action: PayloadAction<{
        assetType: AssetType;
        toWalletId: string;
        fromWalletId?: string;
      }>
    ) => {
      const { assetType } = action.payload;
      const fromId = normalizeWalletId(
        action.payload.fromWalletId ?? state.activeWalletId
      );
      const toId = normalizeWalletId(action.payload.toWalletId);
      if (fromId === toId) {
        return;
      }
      if (
        !state.wallets.some((w) => w.id === fromId) ||
        !state.wallets.some((w) => w.id === toId)
      ) {
        return;
      }
      for (const item of state.items) {
        if (item.type === assetType && normalizeWalletId(item.walletId) === fromId) {
          item.walletId = toId;
        }
      }
      for (const entry of state.history) {
        if (
          entry.item.type === assetType &&
          normalizeWalletId(entry.item.walletId) === fromId
        ) {
          entry.item = { ...entry.item, walletId: toId };
        }
      }
    },

    deleteWallet: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === DEFAULT_WALLET_ID) {
        return;
      }
      const hasActivity = state.history.some(
        (entry) => normalizeWalletId(entry.item.walletId) === id
      );
      if (walletItemCount(state.items, id) > 0 || hasActivity) {
        return;
      }
      state.wallets = state.wallets.filter((w) => w.id !== id);
      if (state.activeWalletId === id) {
        state.activeWalletId = DEFAULT_WALLET_ID;
      }
    },

    deleteWalletWithContents: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (id === DEFAULT_WALLET_ID) {
        return;
      }
      if (!state.wallets.some((w) => w.id === id)) {
        return;
      }
      state.items = state.items.filter(
        (item) => normalizeWalletId(item.walletId) !== id
      );
      state.history = state.history.filter(
        (entry) => normalizeWalletId(entry.item.walletId) !== id
      );
      state.wallets = state.wallets.filter((w) => w.id !== id);
      if (state.activeWalletId === id) {
        state.activeWalletId = DEFAULT_WALLET_ID;
      }
    },

    importBackup: (
      state,
      action: PayloadAction<{
        items: PortfolioItem[];
        history: HistoryItem[];
        wallets?: Wallet[];
        activeWalletId?: string;
      }>
    ) => {
      state.items = normalizePortfolioItems(action.payload.items);
      state.history = ensureHistoryIds(action.payload.history);
      if (action.payload.wallets?.length) {
        state.wallets = normalizeWallets(action.payload.wallets);
      } else {
        state.wallets = normalizeWallets(state.wallets);
      }
      const nextActive = action.payload.activeWalletId ?? state.activeWalletId;
      state.activeWalletId = state.wallets.some((w) => w.id === nextActive)
        ? nextActive
        : DEFAULT_WALLET_ID;
    },

    undoHistoryEntry: (state, action: PayloadAction<string>) => {
      const entry = state.history.find((h) => h.id === action.payload);
      if (!entry) {
        return;
      }
      if (entry.type === 'update') {
        return;
      }
      if (entry.type === 'add') {
        const index = state.items.findIndex((i) => i.id === entry.item.id);
        if (index !== -1) {
          state.items.splice(index, 1);
        }
      } else if (entry.type === 'remove') {
        state.items.push({ ...entry.item, id: `${entry.item.id}-restored-${Date.now()}` });
      }
      state.history = state.history.filter((h) => h.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrices.pending, (state) => {
        // Set fetching flag and clear error
        state.isFetchingPrices = true;
        state.priceFetchError = null;
        // Clear backup flags when starting a new fetch
        // This ensures that if the fetch succeeds, we don't show backup warning
        state.isUsingBackupPriceData = false;
        state.isUsingOldBackup = false;
      })
      .addCase(fetchPrices.fulfilled, (state, action) => {
        // Clear fetching flag
        state.isFetchingPrices = false;
        state.priceFetchError = null;

        // Check if payload is valid PriceData
        if (!action.payload || typeof action.payload !== 'object' || !('prices' in action.payload) || !('changes' in action.payload)) {
          console.warn('[PORTFOLIO] Invalid payload structure');
          state.priceFetchError = 'Invalid response structure';
          return;
        }

        const { prices, buyPrices, changes, fetchedAt, isBackup, isOldBackup, priceSource } = action.payload;

        // CRITICAL: Explicitly set backup flags based on payload
        // Default to false if not explicitly set to true
        const isActuallyBackup = isBackup === true;
        const isActuallyOldBackup = isOldBackup === true;

        if (__DEV__) {
          console.log('[PORTFOLIO] Processing price update:', {
            source: priceSource || 'Unknown',
            isBackup: isActuallyBackup,
            isOldBackup: isActuallyOldBackup,
            timestamp: fetchedAt || Date.now(),
          });
        }

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

          if (hasPartialUpdate && __DEV__) {
            console.warn('[PORTFOLIO] Partial price update detected. Missing prices:',
              requiredPriceKeys.filter(key => !validatedPrices[key] || validatedPrices[key] === null)
            );
          }

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
        // CRITICAL: Use the explicitly determined values
        state.priceDataFetchedAt = fetchedAt || Date.now();
        state.isUsingBackupPriceData = isActuallyBackup;
        state.isUsingOldBackup = isActuallyOldBackup;
        state.hasPartialPriceUpdate = hasPartialUpdate;
        state.priceSource = priceSource || undefined;

        if (__DEV__) {
          console.log('[PORTFOLIO] State updated:', {
            isUsingBackupPriceData: state.isUsingBackupPriceData,
            isUsingOldBackup: state.isUsingOldBackup,
            hasPartialPriceUpdate: state.hasPartialPriceUpdate,
            priceSource: state.priceSource,
          });
        }
      })
      .addCase(fetchPrices.rejected, (state, action) => {
        // Clear fetching flag
        state.isFetchingPrices = false;

        // Set error message
        const errorMessage = typeof action.payload === 'string' ? action.payload : 'Failed to fetch prices';
        state.priceFetchError = errorMessage;

        // Track the error (pass string directly, trackPriceFetchError accepts Error | string)
        try {
          trackPriceFetchError(errorMessage, 'Redux Thunk', undefined, false);
        } catch (trackingError) {
          // Don't let error tracking break the app
          if (__DEV__) {
            console.warn('[PORTFOLIO] Error tracking failed:', trackingError);
          }
        }

        // Attempt to load backup as fallback
        // Note: This is async, so we'll handle it in a thunk if needed
        // For now, we keep existing prices and set error flag
        // The backup will be attempted automatically on next fetch

        if (__DEV__) {
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
  setItems,
  setWallets,
  setActiveWalletId,
  addWallet,
  renameWallet,
  moveWalletHoldings,
  moveAssetHoldings,
  deleteWallet,
  deleteWalletWithContents,
  importBackup,
  undoHistoryEntry,
} = portfolioSlice.actions;

export const selectItems = (state: { portfolio: PortfolioState }) => state.portfolio.items;
export const selectWallets = (state: { portfolio: PortfolioState }) => state.portfolio.wallets;
export const selectActiveWalletId = (state: { portfolio: PortfolioState }) =>
  normalizeWalletId(state.portfolio.activeWalletId);

export const selectActiveWalletItems = (state: { portfolio: PortfolioState }) => {
  const walletId = selectActiveWalletId(state);
  return state.portfolio.items.filter(
    (item) => normalizeWalletId(item.walletId) === walletId
  );
};
export const selectPrices = (state: { portfolio: PortfolioState }) => state.portfolio.prices;
export const selectBuyPrices = (state: { portfolio: PortfolioState }) => state.portfolio.buyPrices;
export const selectPriceChanges = (state: { portfolio: PortfolioState }) => state.portfolio.priceChanges;
export const selectHistory = (state: { portfolio: PortfolioState }) => state.portfolio.history;
export const selectLanguage = (state: { portfolio: PortfolioState }) => state.portfolio.currentLanguage;
export const selectPriceDataFetchedAt = (state: { portfolio: PortfolioState }) => state.portfolio.priceDataFetchedAt;
export const selectIsUsingBackupPriceData = (state: { portfolio: PortfolioState }) => state.portfolio.isUsingBackupPriceData;
export const selectIsUsingOldBackup = (state: { portfolio: PortfolioState }) => state.portfolio.isUsingOldBackup;
export const selectHasPartialPriceUpdate = (state: { portfolio: PortfolioState }) => state.portfolio.hasPartialPriceUpdate;
export const selectIsFetchingPrices = (state: { portfolio: PortfolioState }) => state.portfolio.isFetchingPrices ?? false;
export const selectPriceFetchError = (state: { portfolio: PortfolioState }) => state.portfolio.priceFetchError;
export const selectPriceSource = (state: { portfolio: PortfolioState }) => state.portfolio.priceSource;

export function sumItemsTotalTL(items: PortfolioItem[], prices: Prices): number {
  if (!items.length) {
    return 0;
  }
  return items.reduce((sum, item) => {
    if (!item || !item.type || isNaN(item.amount)) {
      return sum;
    }
    const value = getItemValueInTL(item, prices);
    return value != null ? sum + value : sum;
  }, 0);
}

/** All wallets — daily snapshot, widget, zakat. */
export const selectTotalTLAllWallets = (state: { portfolio: PortfolioState }) =>
  sumItemsTotalTL(state.portfolio.items, state.portfolio.prices);

/** Active wallet — portfolio screen totals. */
export const selectTotalTL = (state: { portfolio: PortfolioState }) =>
  sumItemsTotalTL(selectActiveWalletItems(state), state.portfolio.prices);

export const selectTotalIn = (currency: CurrencyType) => (state: { portfolio: PortfolioState }) => {
  const items = selectActiveWalletItems(state);
  if (!items.length) {
    return 0;
  }

  const gramEquivalents: Record<string, number> = {
    ceyrek: 1.75,
    tam: 7,
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
