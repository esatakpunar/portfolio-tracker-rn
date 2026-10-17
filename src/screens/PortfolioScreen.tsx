import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import {
  addItem,
  updateItemAmount,
  selectActiveWalletId,
  selectWallets,
  selectPrices,
  selectPriceChanges,
  selectHistory,
  selectTotalIn,
  fetchPrices,
  selectPriceDataFetchedAt,
  selectIsUsingBackupPriceData,
  selectIsUsingOldBackup,
  selectHasPartialPriceUpdate,
  selectPriceFetchError,
  setActiveWalletId,
  addWallet,
  renameWallet,
  deleteWallet,
  deleteWalletWithContents,
  moveWalletHoldings,
  moveAssetHoldings,
  selectItems,
  sumItemsTotalTL,
} from '../store/portfolioSlice';
import PortfolioProfitSummary from '../components/PortfolioProfitSummary';
import PortfolioAllocationCard from '../components/PortfolioAllocationCard';
import PortfolioGoalCard from '../components/PortfolioGoalCard';
import PortfolioGoalsOverviewCard from '../components/PortfolioGoalsOverviewCard';
import { getAssetProfitLoss, getPortfolioProfitLoss } from '../utils/portfolioUtils';
import { AppDispatch } from '../store';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { CurrencyType, AssetType, PortfolioItem } from '../types';
import AddItemModal from '../components/AddItemModal';
import WalletNameModal, { WalletNameModalMode } from '../components/WalletNameModal';
import QuickAddModal from '../components/QuickAddModal';
import QuickRemoveModal from '../components/QuickRemoveModal';
import SwipeableAssetItem from '../components/SwipeableAssetItem';
import EmptyState from '../components/EmptyState';
import PriceChangeIndicator from '../components/PriceChangeIndicator';
import { hapticFeedback } from '../utils/haptics';
import { formatCurrency, getCurrencySymbol } from '../utils/formatUtils';
import { useToast } from '../hooks/useToast';
import {
  DEFAULT_WALLET_ID,
  normalizeWalletId,
  PORTFOLIO_WALLET_ALL,
  resolveWalletForAssetType,
  assetAmountInWallet,
  walletHasHoldingsOrHistory,
  walletItemCount,
  walletHistoryCount,
  createWalletId,
} from '../utils/walletUtils';
import { Wallet } from '../types';

const { width } = Dimensions.get('window');
const CURRENCIES: CurrencyType[] = ['TL', 'USD', 'EUR', 'ALTIN'];

const PortfolioScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const allItems = useAppSelector(selectItems);
  const wallets = useAppSelector(selectWallets);
  const activeWalletId = useAppSelector(selectActiveWalletId);
  const [portfolioWalletFilter, setPortfolioWalletFilter] = useState(() =>
    wallets.length > 1 ? PORTFOLIO_WALLET_ALL : normalizeWalletId(activeWalletId)
  );

  const isAllWalletsView = portfolioWalletFilter === PORTFOLIO_WALLET_ALL;

  const items = useMemo(() => {
    if (isAllWalletsView) {
      return allItems;
    }
    return allItems.filter(
      (item) => normalizeWalletId(item.walletId) === portfolioWalletFilter
    );
  }, [allItems, isAllWalletsView, portfolioWalletFilter]);

  useEffect(() => {
    if (portfolioWalletFilter !== PORTFOLIO_WALLET_ALL) {
      setPortfolioWalletFilter(activeWalletId);
    }
  }, [activeWalletId]);
  const history = useAppSelector(selectHistory);
  const prices = useAppSelector(selectPrices);
  const priceChanges = useAppSelector(selectPriceChanges);
  const priceDataFetchedAt = useAppSelector(selectPriceDataFetchedAt);
  const isUsingBackupPriceData = useAppSelector(selectIsUsingBackupPriceData);
  const isUsingOldBackup = useAppSelector(selectIsUsingOldBackup);
  const hasPartialPriceUpdate = useAppSelector(selectHasPartialPriceUpdate);
  const priceFetchError = useAppSelector(selectPriceFetchError);
  const { showToast } = useToast();
  
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showQuickRemoveModal, setShowQuickRemoveModal] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [selectedAssetAmount, setSelectedAssetAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<WalletNameModalMode>('add');
  const [walletModalInitialName, setWalletModalInitialName] = useState('');
  const [walletRenamingId, setWalletRenamingId] = useState<string | null>(null);
  const [quickModalWalletId, setQuickModalWalletId] = useState('');

  const defaultOperationWalletId = useMemo(() => {
    const id = normalizeWalletId(activeWalletId);
    return wallets.some((w) => w.id === id) ? id : DEFAULT_WALLET_ID;
  }, [activeWalletId, wallets]);

  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const currentlyOpenSwipeable = useRef<string | null>(null);
  const currencyAnimation = useRef(new Animated.Value(1)).current;
  const currencyFlatListRef = useRef<FlatList<CurrencyType> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Bounds check for currency index to prevent out-of-bounds access
  const safeCurrencyIndex = useMemo(() => {
    const index = Math.max(0, Math.min(currentCurrencyIndex, CURRENCIES.length - 1));
    return index;
  }, [currentCurrencyIndex]);
  
  const currentCurrency = CURRENCIES[safeCurrencyIndex] || CURRENCIES[0];
  
  // Calculate total values for all currencies
  const totalValuesByCurrency = useMemo(() => {
    const values: Record<CurrencyType, number> = {} as Record<CurrencyType, number>;
    
    if (!items || items.length === 0) {
      CURRENCIES.forEach(currency => {
        values[currency] = 0;
      });
      return values;
    }
    
    const gramEquivalents: Record<string, number> = {
      'ceyrek': 1.75,
      'tam': 7,
      '22_ayar': 1,
      '24_ayar': 1,
    };
    
    CURRENCIES.forEach(currency => {
      let total = 0;
      
      items.forEach(item => {
        if (!item || !item.type || isNaN(item.amount) || !isFinite(item.amount)) {
          return;
        }
        
        if (currency === 'ALTIN' && gramEquivalents[item.type]) {
          total += item.amount * gramEquivalents[item.type];
        } else {
          // Calculate value in TL first
          let valueTL: number | null = null;
          if (item.type === 'tl') {
            valueTL = item.amount;
          } else if (item.type === 'usd') {
            const usdPrice = prices.usd;
            // Finance-safe: Skip if price is unavailable (null), do not use 0
            if (usdPrice != null && !isNaN(usdPrice) && isFinite(usdPrice) && usdPrice > 0) {
              valueTL = item.amount * usdPrice;
            }
          } else if (item.type === 'eur') {
            const eurPrice = prices.eur;
            // Finance-safe: Skip if price is unavailable (null), do not use 0
            if (eurPrice != null && !isNaN(eurPrice) && isFinite(eurPrice) && eurPrice > 0) {
              valueTL = item.amount * eurPrice;
            }
          } else {
            const price = prices[item.type];
            // Finance-safe: Skip if price is unavailable (null), do not use 0
            if (price != null && !isNaN(price) && isFinite(price) && price > 0) {
              valueTL = item.amount * price;
            }
          }
          
          // Skip if valueTL is null (price unavailable)
          if (valueTL == null) {
            return; // Skip this item in calculation
          }
          
          // Convert to target currency
          if (currency === 'TL') {
            total += valueTL;
          } else if (currency === 'USD') {
            const usdPrice = prices.usd;
            // Finance-safe: Skip if price is unavailable (null), do not use 0
            if (usdPrice != null && !isNaN(usdPrice) && isFinite(usdPrice) && usdPrice > 0) {
              total += valueTL / usdPrice;
            }
          } else if (currency === 'EUR') {
            const eurPrice = prices.eur;
            // Finance-safe: Skip if price is unavailable (null), do not use 0
            if (eurPrice != null && !isNaN(eurPrice) && isFinite(eurPrice) && eurPrice > 0) {
              total += valueTL / eurPrice;
            }
          } else if (currency === 'ALTIN') {
            const altinPrice = prices['24_ayar'];
            // Finance-safe: Skip if price is unavailable (null), do not use 0
            if (altinPrice != null && !isNaN(altinPrice) && isFinite(altinPrice) && altinPrice > 0) {
              total += valueTL / altinPrice;
            }
          }
        }
      });
      
      values[currency] = isNaN(total) || !isFinite(total) || total < 0 ? 0 : total;
    });
    
    return values;
  }, [items, prices]);
  
  // Current currency total value for backward compatibility
  const totalValue = totalValuesByCurrency[currentCurrency] || 0;
  const safeTotalValue = totalValue;

  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {} as Record<AssetType, PortfolioItem[]>);
  }, [items]);

  // Calculate unique asset types count
  const uniqueAssetCount = useMemo(() => {
    return Object.keys(groupedItems).length;
  }, [groupedItems]);

  const walletDisplayName = (wallet: Wallet) =>
    wallet.id === DEFAULT_WALLET_ID ? t('walletsDefaultName') : wallet.name;

  const walletHistory = useMemo(() => {
    if (isAllWalletsView) {
      return history;
    }
    return history.filter(
      (entry) => normalizeWalletId(entry.item.walletId) === portfolioWalletFilter
    );
  }, [history, isAllWalletsView, portfolioWalletFilter]);

  const walletBreakdown = useMemo(() => {
    if (!isAllWalletsView || wallets.length <= 1) {
      return [];
    }
    return wallets.map((wallet) => {
      const walletItems = allItems.filter(
        (item) => normalizeWalletId(item.walletId) === wallet.id
      );
      return {
        id: wallet.id,
        label: walletDisplayName(wallet),
        totalTL: sumItemsTotalTL(walletItems, prices),
      };
    });
  }, [isAllWalletsView, wallets, allItems, prices, t]);

  const portfolioProfitLoss = useMemo(
    () => getPortfolioProfitLoss(items, walletHistory, prices),
    [items, walletHistory, prices]
  );

  const resolveContextWalletForAsset = (type: AssetType): string => {
    if (isAllWalletsView) {
      return resolveWalletForAssetType(allItems, type, defaultOperationWalletId);
    }
    return normalizeWalletId(portfolioWalletFilter);
  };

  const openAssetQuickAdd = (type: AssetType) => {
    const walletId = resolveContextWalletForAsset(type);
    setQuickModalWalletId(walletId);
    setSelectedAssetType(type);
    setSelectedAssetAmount(assetAmountInWallet(allItems, type, walletId));
    setShowQuickAddModal(true);
  };

  const openAssetQuickRemove = (type: AssetType) => {
    const walletId = resolveContextWalletForAsset(type);
    setQuickModalWalletId(walletId);
    setSelectedAssetType(type);
    setSelectedAssetAmount(assetAmountInWallet(allItems, type, walletId));
    setShowQuickRemoveModal(true);
    swipeableRefs.current[type]?.close();
    currentlyOpenSwipeable.current = null;
  };

  const handleQuickModalWalletChange = (walletId: string) => {
    setQuickModalWalletId(walletId);
    if (selectedAssetType) {
      setSelectedAssetAmount(
        assetAmountInWallet(allItems, selectedAssetType, walletId)
      );
    }
  };

  const handleSelectWallet = (walletId: string) => {
    if (portfolioWalletFilter === walletId && !isAllWalletsView) {
      return;
    }
    hapticFeedback.selection();
    setPortfolioWalletFilter(walletId);
    if (walletId !== activeWalletId) {
      dispatch(setActiveWalletId(walletId));
    }
  };

  const handleSelectAllWallets = () => {
    if (isAllWalletsView) {
      return;
    }
    hapticFeedback.selection();
    setPortfolioWalletFilter(PORTFOLIO_WALLET_ALL);
    dispatch(setActiveWalletId(DEFAULT_WALLET_ID));
  };

  const handleAddWallet = () => {
    hapticFeedback.light();
    setWalletModalMode('add');
    setWalletRenamingId(null);
    setWalletModalInitialName('');
    setWalletModalVisible(true);
  };

  const handleRenameWallet = (wallet: Wallet) => {
    hapticFeedback.light();
    setWalletModalMode('rename');
    setWalletRenamingId(wallet.id);
    setWalletModalInitialName(walletDisplayName(wallet));
    setWalletModalVisible(true);
  };

  const handleWalletModalSubmit = (name: string) => {
    if (walletModalMode === 'add') {
      const newWalletId = createWalletId();
      dispatch(addWallet({ name, id: newWalletId }));
      setPortfolioWalletFilter(newWalletId);
    } else if (walletRenamingId) {
      dispatch(renameWallet({ id: walletRenamingId, name }));
    }
  };

  const walletDeleteBlocked =
    walletRenamingId != null &&
    walletHasHoldingsOrHistory(allItems, history, walletRenamingId);

  const walletDeleteStats = useMemo(() => {
    if (!walletRenamingId) {
      return { holdingsCount: 0, historyCount: 0 };
    }
    return {
      holdingsCount: walletItemCount(allItems, walletRenamingId),
      historyCount: walletHistoryCount(history, walletRenamingId),
    };
  }, [allItems, history, walletRenamingId]);

  const walletTransferTargets = useMemo(() => {
    if (!walletRenamingId) {
      return [];
    }
    return wallets
      .filter((w) => w.id !== walletRenamingId)
      .map((w) => ({ id: w.id, label: walletDisplayName(w) }));
  }, [wallets, walletRenamingId, t]);

  const showWalletTransfer =
    walletModalMode === 'rename' &&
    walletRenamingId != null &&
    walletHasHoldingsOrHistory(allItems, history, walletRenamingId) &&
    walletTransferTargets.length > 0;

  const assetWalletOptions = useMemo(
    () => wallets.map((w) => ({ id: w.id, label: walletDisplayName(w) })),
    [wallets, t]
  );

  const handleMoveAssetToWallet = (toWalletId: string) => {
    if (!selectedAssetType || selectedAssetAmount <= 0) {
      return;
    }
    dispatch(
      moveAssetHoldings({
        assetType: selectedAssetType,
        toWalletId,
        fromWalletId: quickModalWalletId || defaultOperationWalletId,
      })
    );
    hapticFeedback.success();
    setShowQuickAddModal(false);
    setSelectedAssetType(null);
    setSelectedAssetAmount(0);
  };

  const handleMoveAllWalletHoldings = (toWalletId: string) => {
    if (!walletRenamingId) {
      return;
    }
    dispatch(moveWalletHoldings({ fromWalletId: walletRenamingId, toWalletId }));
    hapticFeedback.success();
    setWalletModalVisible(false);
  };

  const handleConfirmDeleteWallet = () => {
    if (!walletRenamingId || walletRenamingId === DEFAULT_WALLET_ID) {
      return;
    }
    if (walletHasHoldingsOrHistory(allItems, history, walletRenamingId)) {
      hapticFeedback.error();
      return;
    }
    dispatch(deleteWallet(walletRenamingId));
    hapticFeedback.success();
    setWalletModalVisible(false);
    setWalletRenamingId(null);
  };

  const handleConfirmDeleteWalletWithContents = () => {
    if (!walletRenamingId || walletRenamingId === DEFAULT_WALLET_ID) {
      return;
    }
    dispatch(deleteWalletWithContents(walletRenamingId));
    hapticFeedback.success();
    setWalletModalVisible(false);
    setWalletRenamingId(null);
  };

  // Currency change animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(currencyAnimation, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(currencyAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [safeCurrencyIndex]);

  const handleAddItem = (
    type: AssetType,
    amount: number,
    options?: {
      description?: string;
      priceAtTime?: number | null;
      unitBuyPrice?: number | null;
      useExplicitTotalCost?: boolean;
      transactionDate?: string;
      walletId?: string;
    }
  ) => {
    // Validate inputs
    if (!type || isNaN(amount) || !isFinite(amount) || amount <= 0) {
      return;
    }
    const walletId = options?.walletId ?? defaultOperationWalletId;
    dispatch(addItem({ type, amount, ...options, walletId }));
    hapticFeedback.success();
  };

  const handleCardPress = (type: AssetType, _totalAmount: number) => {
    hapticFeedback.light();
    openAssetQuickAdd(type);
  };

  const handleQuickAdd = (
    amount: number,
    options?: {
      description?: string;
      priceAtTime?: number | null;
      unitBuyPrice?: number | null;
      useExplicitTotalCost?: boolean;
      transactionDate?: string;
    }
  ) => {
    const { description, priceAtTime, unitBuyPrice, useExplicitTotalCost, transactionDate } =
      options ?? {};
    if (selectedAssetType) {
      // Validate amount
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        return;
      }
      
      const walletId = quickModalWalletId || defaultOperationWalletId;
      const currentTotal = assetAmountInWallet(allItems, selectedAssetType, walletId);
      const newAmount = currentTotal + amount;

      if (isNaN(newAmount) || !isFinite(newAmount) || newAmount < 0) {
        return;
      }

      const finalDescription = description || t('amountIncreased');
      dispatch(
        updateItemAmount({
          type: selectedAssetType,
          newAmount,
          walletId,
          description: finalDescription,
          priceAtTime,
          unitBuyPrice,
          useExplicitTotalCost,
          transactionDate,
        })
      );
      hapticFeedback.medium();
      hapticFeedback.success();
    }
  };

  const closeAllSwipeables = () => {
    if (currentlyOpenSwipeable.current) {
      swipeableRefs.current[currentlyOpenSwipeable.current]?.close();
      currentlyOpenSwipeable.current = null;
    }
  };

  const handleSwipeableWillOpen = (type: AssetType) => {
    if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== type) {
      swipeableRefs.current[currentlyOpenSwipeable.current]?.close();
    }
    currentlyOpenSwipeable.current = type;
  };

  const handleEditPress = (type: AssetType, _totalAmount: number) => {
    hapticFeedback.light();
    openAssetQuickRemove(type);
  };

  const handleQuickRemove = (amountToRemove: number, description?: string, priceAtTime?: number | null) => {
    if (selectedAssetType) {
      // Validate amountToRemove
      if (isNaN(amountToRemove) || !isFinite(amountToRemove) || amountToRemove <= 0) {
        return;
      }
      
      const walletId = quickModalWalletId || defaultOperationWalletId;
      const currentTotal = assetAmountInWallet(allItems, selectedAssetType, walletId);
      const newAmount = Math.max(0, currentTotal - amountToRemove);

      if (isNaN(newAmount) || !isFinite(newAmount) || newAmount < 0) {
        return;
      }

      const finalDescription = description || t('amountDecreased');
      dispatch(
        updateItemAmount({
          type: selectedAssetType,
          newAmount,
          walletId,
          description: finalDescription,
          priceAtTime,
        })
      );
      hapticFeedback.heavy();
    }
  };

  const handleDeletePress = (type: AssetType, _totalAmount: number) => {
    hapticFeedback.light();
    openAssetQuickRemove(type);
  };

  const onRefresh = async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    hapticFeedback.light();
    setRefreshing(true);
    try {
      const result = await (dispatch as AppDispatch)(fetchPrices(abortController.signal));
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }
      
      if (fetchPrices.fulfilled.match(result)) {
        hapticFeedback.success();
        // Show warning if using backup (especially if it's old)
        if (result.payload?.isBackup) {
          if (result.payload?.isOldBackup) {
            showToast(t('usingOldBackupData'), 'warning');
          } else {
            showToast(t('usingBackupData'), 'warning');
          }
        } else if (result.payload && 'hasPartialPriceUpdate' in result.payload && result.payload.hasPartialPriceUpdate) {
          showToast(t('partialPriceUpdate'), 'warning');
        }
      } else {
        hapticFeedback.error();
        const errorMessage = fetchPrices.rejected.match(result) 
          ? (result.payload as string) || t('pricesUpdateFailed')
          : t('pricesUpdateFailed');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      // Don't show error if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }
      hapticFeedback.error();
      showToast(t('pricesUpdateFailed'), 'error');
    } finally {
      if (!abortController.signal.aborted) {
        setRefreshing(false);
      }
      // Clear abort controller if this was the current one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  // Cleanup: cancel any ongoing requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Show error toast when price fetch error is detected
  useEffect(() => {
    if (priceFetchError) {
      // Check if error is about network
      if (priceFetchError.includes('network') || priceFetchError.includes('No network')) {
        showToast(t('noNetworkConnection'), 'error');
      } else if (priceFetchError.includes('backup')) {
        showToast(t('noBackupAvailable'), 'warning');
      } else {
        showToast(priceFetchError, 'error');
      }
    }
  }, [priceFetchError, showToast, t]);


  const getCurrencyIcon = (currency: CurrencyType): string => {
    const icons: Record<CurrencyType, string> = {
      'TL': '₺',
      'USD': '$',
      'EUR': '€',
      'ALTIN': '₲',
    };
    return icons[currency];
  };

  const getCurrencyColor = (currency: CurrencyType): string => {
    const colors_map: Record<CurrencyType, string> = {
      'TL': colors.negative,
      'USD': colors.positive,
      'EUR': colors.accent,
      'ALTIN': colors.warning,
    };
    return colors_map[currency];
  };

  const renderCurrencySlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderWrapper}>
          <Animated.View
            style={[
              styles.sliderContent,
              { transform: [{ scale: currencyAnimation }] }
            ]}
          >
            <FlatList
              ref={currencyFlatListRef}
              data={CURRENCIES}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                // Bounds check to prevent invalid index
                const safeIndex = Math.max(0, Math.min(index, CURRENCIES.length - 1));
                if (safeIndex >= 0 && safeIndex < CURRENCIES.length) {
                  // Only update if different to avoid unnecessary re-renders
                  if (safeIndex !== currentCurrencyIndex) {
                    hapticFeedback.selection();
                    setCurrentCurrencyIndex(safeIndex);
                  }
                }
              }}
              onScrollEndDrag={(event) => {
                // Also handle scroll end drag for better responsiveness
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                const safeIndex = Math.max(0, Math.min(index, CURRENCIES.length - 1));
                if (safeIndex >= 0 && safeIndex < CURRENCIES.length && safeIndex !== currentCurrencyIndex) {
                  setCurrentCurrencyIndex(safeIndex);
                }
              }}
              onScrollToIndexFailed={(info) => {
                // Fallback: scroll to offset
                currencyFlatListRef.current?.scrollToOffset({
                  offset: info.index * width,
                  animated: false,
                });
              }}
              renderItem={({ item: currency }) => (
                <View style={[styles.slide, { width }]}>
                  <View style={styles.totalCard}>
                    <View style={[
                      styles.gradientOverlay,
                      { backgroundColor: getCurrencyColor(currency) }
                    ]} />
                    
                    <View style={styles.totalCardContent}>
                      <View style={styles.totalCardHeader}>
                        <View style={[
                          styles.currencyIconContainer,
                          { 
                            backgroundColor: getCurrencyColor(currency) + '20',
                            borderColor: getCurrencyColor(currency) + '40',
                          }
                        ]}>
                          <Text style={[
                            styles.currencyIconText,
                            { color: getCurrencyColor(currency) }
                          ]}>
                            {getCurrencyIcon(currency)}
                          </Text>
                        </View>
                        <View style={styles.currencyInfo}>
                          <Text style={styles.totalLabel}>{t('total')}</Text>
                          <Text style={styles.currencyLabel}>{t(`currencies.${currency}`)}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.totalCardBody}>
                        <View style={styles.totalValueContainer}>
                          <Text style={styles.totalValue}>
                            {formatCurrency(totalValuesByCurrency[currency] || 0, i18n.language)}
                          </Text>
                          <Text style={styles.totalCurrencySymbol}>
                            {getCurrencySymbol(currency)}
                          </Text>
                        </View>
                        <View style={styles.totalValueChangeContainer}>
                          {currency !== 'TL' ? (
                            <View style={styles.priceInfoContainer}>
                              <Text style={styles.currentValueLabel}>{t('currentValue')}</Text>
                              <View style={styles.priceInfoRow}>
                                <Text style={styles.currentPriceText}>
                                  {(() => {
                                    const price = getCurrencyPrice(currency);
                                    return price != null 
                                      ? `${formatCurrency(price, i18n.language)} ₺`
                                      : '—';
                                  })()}
                                </Text>
                                <View style={styles.changeIndicatorWrapper}>
                                  <PriceChangeIndicator change={getCurrencyChange(currency)} />
                                </View>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.priceInfoContainer}>
                              <Text style={styles.currentValueLabel}>{t('totalAssets')}</Text>
                              <Text style={styles.currentPriceText}>
                                {uniqueAssetCount} {t('assets')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item}
            />
          </Animated.View>
        </View>
        <View style={styles.paginationDots}>
          {CURRENCIES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                safeCurrencyIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const getAssetIcon = (type: AssetType) => {
    const iconMap: Record<AssetType, string> = {
      'tl': '₺',
      'usd': '$',
      'eur': '€',
      'gumus': '₲',
      'tam': '₲',
      'ceyrek': '₲',
      '22_ayar': '₲',
      '24_ayar': '₲',
    };
    return iconMap[type] || '₲';
  };

  const getAssetIconStyle = (type: AssetType) => {
    const styleMap: Record<AssetType, any> = {
      'tl': styles.iconTL,
      'usd': styles.iconUSD,
      'eur': styles.iconEUR,
      'gumus': styles.iconSilver,
      'tam': styles.iconGold,
      'ceyrek': styles.iconGold,
      '22_ayar': styles.iconGold,
      '24_ayar': styles.iconGold,
    };
    return styleMap[type] || styles.iconDefault;
  };

  const getDefaultUnit = (type: AssetType) => {
    if (type === 'tl') {
      return '₺';
    }
    if (type === 'usd') {
      return '$';
    }
    if (type === 'eur') {
      return '€';
    }
    if (type === 'ceyrek' || type === 'tam') {
      return t('units.piece');
    }
    return t('units.gram');
  };

  const formatAssetAmountLabel = (type: AssetType, amount: number) => {
    const safe = isNaN(amount) || !isFinite(amount) ? 0 : amount;
    const unit = getDefaultUnit(type);
    const formatted = formatCurrency(safe, i18n.language);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const convertToTargetCurrency = (
    valueTL: number, 
    targetCurrency: CurrencyType, 
    itemType: AssetType,
    itemAmount: number
  ): number | null => {
    // Validate inputs
    if (isNaN(valueTL) || !isFinite(valueTL) || valueTL < 0) {
      return 0;
    }
    if (isNaN(itemAmount) || !isFinite(itemAmount) || itemAmount < 0) {
      return 0;
    }
    
    if (targetCurrency === 'TL') {
      return valueTL;
    }
    if (targetCurrency === 'USD') {
      const usdPrice = prices.usd;
      // Finance-safe: Return null if price is unavailable, do not use 0
      if (usdPrice == null || isNaN(usdPrice) || !isFinite(usdPrice) || usdPrice <= 0) {
        return null;
      }
      return valueTL / usdPrice;
    }
    if (targetCurrency === 'EUR') {
      const eurPrice = prices.eur;
      // Finance-safe: Return null if price is unavailable, do not use 0
      if (eurPrice == null || isNaN(eurPrice) || !isFinite(eurPrice) || eurPrice <= 0) {
        return null;
      }
      return valueTL / eurPrice;
    }
    if (targetCurrency === 'ALTIN') {
      const gramEquivalents: Record<string, number> = {
        'ceyrek': 1.75,
        'tam': 7,
        '22_ayar': 1,
        '24_ayar': 1,
      };
      
      if (gramEquivalents[itemType]) {
        return itemAmount * gramEquivalents[itemType];
      } else {
        const altinPrice = prices['24_ayar'];
        // Finance-safe: Return null if price is unavailable, do not use 0
        if (altinPrice == null || isNaN(altinPrice) || !isFinite(altinPrice) || altinPrice <= 0) {
          return null;
        }
        return valueTL / altinPrice;
      }
    }
    return valueTL;
  };

  const getCurrencyChange = (currency: CurrencyType): number | null => {
    const changeMap: Record<CurrencyType, keyof typeof priceChanges> = {
      'TL': 'tl',
      'USD': 'usd',
      'EUR': 'eur',
      'ALTIN': '24_ayar', // Gram altın için 24 ayar change değeri
    };
    const change = priceChanges[changeMap[currency]];
    return change ?? null; // Return null for unavailable data, not 0
  };

  const getCurrencyPrice = (currency: CurrencyType): number | null => {
    const priceMap: Record<CurrencyType, keyof typeof prices> = {
      'TL': 'tl',
      'USD': 'usd',
      'EUR': 'eur',
      'ALTIN': '24_ayar', // Gram altın için 24 ayar fiyatı
    };
    const price = prices[priceMap[currency]];
    // Finance-safe: Return null for unavailable data, not 0
    return price ?? null;
  };

  const renderAssetGroup = (type: AssetType, groupItems: PortfolioItem[]) => {
    // Safety check: empty array
    if (!groupItems || groupItems.length === 0) {
      return null;
    }
    
    const totalAmount = groupItems.reduce((sum, item) => {
      if (!item || isNaN(item.amount) || !isFinite(item.amount)) {
        return sum;
      }
      return sum + item.amount;
    }, 0);
    
    // Validate totalAmount
    if (isNaN(totalAmount) || !isFinite(totalAmount) || totalAmount <= 0) {
      return null;
    }
    
    const pricePerUnit = prices[type];
    // Finance-safe: Return null if price is unavailable, do not use 0
    if (pricePerUnit == null || isNaN(pricePerUnit) || !isFinite(pricePerUnit) || pricePerUnit <= 0) {
      return null;
    }
    
    const totalValueTL = totalAmount * pricePerUnit;
    const convertedValue = convertToTargetCurrency(totalValueTL, currentCurrency, type, totalAmount);
    
    // Finance-safe: Return null if conversion failed (unavailable price data)
    if (convertedValue == null || isNaN(convertedValue) || !isFinite(convertedValue)) {
      return null;
    }
    
    const currencySymbol = getCurrencySymbol(currentCurrency);
    const assetProfit = getAssetProfitLoss(type, items, walletHistory, prices);

    const contextWalletIdForCard = isAllWalletsView
      ? resolveWalletForAssetType(allItems, type, defaultOperationWalletId)
      : null;
    const walletAmountOnCard =
      contextWalletIdForCard != null
        ? assetAmountInWallet(allItems, type, contextWalletIdForCard)
        : 0;
    const contextWalletForCard = contextWalletIdForCard
      ? wallets.find((w) => w.id === contextWalletIdForCard)
      : undefined;
    const contextWalletLabel = contextWalletForCard
      ? walletDisplayName(contextWalletForCard)
      : '';

    const assetWalletHolderIds = new Set<string>();
    for (const item of allItems) {
      if (item.type === type && item.amount > 0) {
        assetWalletHolderIds.add(normalizeWalletId(item.walletId));
      }
    }
    const showMultiWalletAssetHint =
      isAllWalletsView &&
      wallets.length > 1 &&
      assetWalletHolderIds.size > 1 &&
      contextWalletLabel.length > 0;

    return (
      <SwipeableAssetItem
        key={type}
        ref={(ref) => {
          swipeableRefs.current[type] = ref;
        }}
        item={groupItems[0]}
        pricePerUnit={pricePerUnit}
        onEdit={() => handleEditPress(type, totalAmount)}
        onDelete={() => handleDeletePress(type, totalAmount)}
        onSwipeableWillOpen={() => handleSwipeableWillOpen(type)}
      >
        <TouchableOpacity
          style={styles.assetCard}
          activeOpacity={0.7}
          onPress={() => handleCardPress(type, totalAmount)}
        >
          <View style={[styles.assetIcon, getAssetIconStyle(type)]}>
            <Text style={styles.assetIconText}>{getAssetIcon(type)}</Text>
          </View>
          
          <View style={styles.assetContent}>
            <Text style={styles.assetName}>{t(`assetTypes.${type}`)}</Text>
            <Text style={styles.assetAmount}>
              {formatCurrency(
                isNaN(totalAmount) || !isFinite(totalAmount) ? 0 : totalAmount,
                i18n.language
              )}{getDefaultUnit(type) && ' '}{getDefaultUnit(type)}
            </Text>
            {showMultiWalletAssetHint && (
              <View style={styles.assetWalletHintRow}>
                <Text
                  style={styles.assetWalletHintName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {contextWalletLabel}
                </Text>
                <Text style={styles.assetWalletHintDot}>·</Text>
                <Text style={styles.assetWalletHintAmount} numberOfLines={1}>
                  {formatAssetAmountLabel(type, walletAmountOnCard)}
                </Text>
              </View>
            )}
            {assetProfit && (
              <Text
                style={[
                  styles.assetProfitLine,
                  { color: assetProfit.profitAmount >= 0 ? colors.success : colors.error },
                ]}
              >
                {assetProfit.profitAmount >= 0 ? '+' : '−'}
                {Math.abs(assetProfit.profitPct).toFixed(1)}% · {assetProfit.profitAmount >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(assetProfit.profitAmount), i18n.language)} ₺
              </Text>
            )}
          </View>
          
          <View style={styles.assetValueContainer}>
            <Text style={styles.assetValue}>
              {formatCurrency(
                isNaN(convertedValue) || !isFinite(convertedValue) ? 0 : convertedValue,
                i18n.language
              )} {currencySymbol}
            </Text>
          </View>
        </TouchableOpacity>
      </SwipeableAssetItem>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={closeAllSwipeables}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('portfolio')}</Text>
            <Text style={styles.headerSubtitle}>{t('portfolioSubtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              hapticFeedback.light();
              setShowAddModal(true);
            }}
          >
            <Feather name="plus" size={28} color={colors.primaryStart} />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={closeAllSwipeables}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryStart}
            colors={[colors.primaryStart]}
          />
        }
      >
        {renderCurrencySlider()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.walletRowScroll}
          contentContainerStyle={styles.walletRowContent}
        >
          {wallets.length > 1 && (
            <TouchableOpacity
              style={[styles.walletChip, isAllWalletsView && styles.walletChipActive]}
              onPress={handleSelectAllWallets}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.walletChipText,
                  isAllWalletsView && styles.walletChipTextActive,
                ]}
                numberOfLines={1}
              >
                {t('historyWalletAll')}
              </Text>
            </TouchableOpacity>
          )}
          {wallets.map((wallet) => {
            const isActive =
              !isAllWalletsView && wallet.id === portfolioWalletFilter;
            return (
              <TouchableOpacity
                key={wallet.id}
                style={[styles.walletChip, isActive && styles.walletChipActive]}
                onPress={() => handleSelectWallet(wallet.id)}
                onLongPress={() => handleRenameWallet(wallet)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.walletChipText, isActive && styles.walletChipTextActive]}
                  numberOfLines={1}
                >
                  {walletDisplayName(wallet)}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.walletChipAdd} onPress={handleAddWallet} activeOpacity={0.8}>
            <Feather name="plus" size={16} color={colors.primaryStart} />
            <Text style={styles.walletChipAddText}>{t('walletsAdd')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {isAllWalletsView && wallets.length > 1 && (
          <View style={styles.allWalletsSection}>
            <Text style={styles.walletBreakdownTitle}>{t('portfolioWalletBreakdownTitle')}</Text>
            {walletBreakdown.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={styles.walletBreakdownRow}
                onPress={() => handleSelectWallet(row.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.walletBreakdownName} numberOfLines={1}>
                  {row.label}
                </Text>
                <Text style={styles.walletBreakdownValue}>
                  {formatCurrency(row.totalTL, i18n.language)} ₺
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {portfolioProfitLoss && (
          <PortfolioProfitSummary data={portfolioProfitLoss} />
        )}

        {items.length > 0 && (
          <>
            {isAllWalletsView && wallets.length > 1 ? (
              <PortfolioGoalsOverviewCard
                wallets={wallets}
                allItems={allItems}
                prices={prices}
                walletLabel={walletDisplayName}
                onOpenWallet={handleSelectWallet}
              />
            ) : (
              <PortfolioGoalCard
                walletId={normalizeWalletId(portfolioWalletFilter)}
                walletLabel={walletDisplayName(
                  wallets.find((w) => w.id === normalizeWalletId(portfolioWalletFilter)) ?? {
                    id: normalizeWalletId(portfolioWalletFilter),
                    name: '',
                    createdAt: 0,
                  }
                )}
                showWalletSubtitle={wallets.length > 1}
                items={items}
                prices={prices}
              />
            )}
            <PortfolioAllocationCard items={items} prices={prices} />
          </>
        )}

        <TouchableWithoutFeedback onPress={closeAllSwipeables}>
          <View style={styles.assetsContainer}>
            <Text style={styles.sectionTitle}>
              {t('assets')}
            </Text>
            
            {items.length === 0 ? (
              <EmptyState
                icon={<Feather name="briefcase" size={40} color={colors.textMuted} />}
                title={t('noAssets')}
                description={t('addFirstAsset')}
                action={
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => {
                      hapticFeedback.light();
                      setShowAddModal(true);
                    }}
                  >
                    <Text style={styles.emptyStateButtonText}>{t('addNewAsset')}</Text>
                  </TouchableOpacity>
                }
              />
            ) : (
              <View>
                {Object.entries(groupedItems)
                  .filter(([_, groupItems]) => groupItems && groupItems.length > 0)
                  .map(([type, groupItems]) =>
                    renderAssetGroup(type as AssetType, groupItems)
                  )}
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
        walletOptions={assetWalletOptions}
        defaultWalletId={defaultOperationWalletId}
      />
      
      <QuickAddModal
        visible={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false);
          setSelectedAssetType(null);
          setSelectedAssetAmount(0);
          setQuickModalWalletId('');
        }}
        onAdd={handleQuickAdd}
        assetType={selectedAssetType || '22_ayar'}
        currentAmount={selectedAssetAmount}
        walletOptions={assetWalletOptions}
        editingWalletId={quickModalWalletId || defaultOperationWalletId}
        onEditingWalletChange={handleQuickModalWalletChange}
        onMoveAssetWallet={handleMoveAssetToWallet}
      />
      
      <QuickRemoveModal
        visible={showQuickRemoveModal}
        onClose={() => {
          setShowQuickRemoveModal(false);
          setSelectedAssetType(null);
          setSelectedAssetAmount(0);
          setQuickModalWalletId('');
        }}
        onRemove={handleQuickRemove}
        assetType={selectedAssetType || '22_ayar'}
        currentAmount={selectedAssetAmount}
        walletOptions={assetWalletOptions}
        editingWalletId={quickModalWalletId || defaultOperationWalletId}
        onEditingWalletChange={handleQuickModalWalletChange}
      />

      <WalletNameModal
        visible={walletModalVisible}
        mode={walletModalMode}
        initialName={walletModalInitialName}
        currentWalletLabel={
          walletRenamingId
            ? walletDisplayName(
                wallets.find((w) => w.id === walletRenamingId) ?? {
                  id: walletRenamingId,
                  name: '',
                  createdAt: 0,
                }
              )
            : ''
        }
        showDelete={walletModalMode === 'rename' && walletRenamingId !== DEFAULT_WALLET_ID}
        deleteBlocked={walletDeleteBlocked}
        deleteHoldingsCount={walletDeleteStats.holdingsCount}
        deleteHistoryCount={walletDeleteStats.historyCount}
        showTransfer={showWalletTransfer}
        transferTargets={walletTransferTargets}
        onClose={() => setWalletModalVisible(false)}
        onSubmit={handleWalletModalSubmit}
        onConfirmDelete={handleConfirmDeleteWallet}
        onConfirmDeleteWithContents={handleConfirmDeleteWalletWithContents}
        onMoveAll={handleMoveAllWalletHoldings}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    minHeight: 88,
  },
  headerTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: colors.primaryStart,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  content: {
    flex: 1,
  },
  sliderContainer: {
    marginVertical: spacing.xl,
  },
  sliderWrapper: {
    position: 'relative',
  },
  sliderContent: {
    flex: 1,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCard: {
    width: width - spacing.xl * 2,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    minHeight: 180,
    ...shadows.medium,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.1,
    transform: [{ translateX: 40 }, { translateY: -40 }],
  },
  totalCardContent: {
    padding: spacing.lg,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  currencyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
  },
  currencyIconText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
  },
  currencyInfo: {
    flex: 1,
  },
  totalCardBody: {
    alignItems: 'flex-start',
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 38,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 44,
  },
  totalCurrencySymbol: {
    fontSize: 24,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    lineHeight: 44,
  },
  valueUnderline: {
    alignSelf: 'stretch',
    height: 4,
    backgroundColor: colors.primaryStart,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  currencyLabel: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.paginationDotInactive,
    marginHorizontal: spacing.xs,
  },
  activeDot: {
    backgroundColor: colors.primaryStart,
    width: 24,
  },
  walletRowScroll: {
    marginBottom: spacing.md,
    maxHeight: 44,
  },
  walletRowContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  walletChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxWidth: 160,
  },
  walletChipActive: {
    borderColor: colors.primaryStart,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  walletChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  walletChipTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  walletChipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
  },
  allWalletsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  walletBreakdownTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  walletBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  walletBreakdownName: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  walletBreakdownValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  walletChipAddText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primaryStart,
  },
  assetsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: colors.primaryStart,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  emptyStateButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  assetCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    ...shadows.medium,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  assetIconText: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  iconGold: {
    backgroundColor: colors.warning,
  },
  iconUSD: {
    backgroundColor: colors.positive,
  },
  iconEUR: {
    backgroundColor: colors.accent,
  },
  iconTL: {
    backgroundColor: colors.negative,
  },
  iconSilver: {
    backgroundColor: colors.textMuted,
  },
  iconDefault: {
    backgroundColor: colors.primaryStart,
  },
  assetContent: {
    flex: 1,
  },
  assetName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
    lineHeight: 16,
  },
  assetAmount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  assetWalletHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: '100%',
    gap: 4,
  },
  assetWalletHintName: {
    flexShrink: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 14,
    minWidth: 0,
  },
  assetWalletHintDot: {
    flexShrink: 0,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 14,
  },
  assetWalletHintAmount: {
    flexShrink: 0,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  assetProfitLine: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 14,
  },
  assetValueContainer: {
    marginRight: spacing.sm,
  },
  assetValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 16,
  },
  totalValueChangeContainer: {
    marginTop: spacing.xs,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    minHeight: 42,
  },
  priceInfoContainer: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  currentValueLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  currentPriceText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  changeIndicatorWrapper: {
    marginLeft: spacing.sm,
  },
  emptyChangeIndicator: {
    height: 20,
  },
});

export default PortfolioScreen;
