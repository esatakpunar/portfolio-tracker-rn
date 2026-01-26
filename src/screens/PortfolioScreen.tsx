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
import { addItem, updateItemAmount, selectItems, selectPrices, selectPriceChanges, selectTotalIn, fetchPrices, selectPriceDataFetchedAt, selectIsUsingBackupPriceData, selectHasPartialPriceUpdate, selectPriceFetchError } from '../store/portfolioSlice';
import { AppDispatch } from '../store';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { CurrencyType, AssetType, PortfolioItem } from '../types';
import AddItemModal from '../components/AddItemModal';
import QuickAddModal from '../components/QuickAddModal';
import QuickRemoveModal from '../components/QuickRemoveModal';
import SwipeableAssetItem from '../components/SwipeableAssetItem';
import EmptyState from '../components/EmptyState';
import PriceChangeIndicator from '../components/PriceChangeIndicator';
import { hapticFeedback } from '../utils/haptics';
import { formatCurrency } from '../utils/formatUtils';
import { useToast } from '../hooks/useToast';

const { width } = Dimensions.get('window');
const CURRENCIES: CurrencyType[] = ['TL', 'USD', 'EUR', 'ALTIN'];

const PortfolioScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectItems);
  const prices = useAppSelector(selectPrices);
  const priceChanges = useAppSelector(selectPriceChanges);
  const priceDataFetchedAt = useAppSelector(selectPriceDataFetchedAt);
  const isUsingBackupPriceData = useAppSelector(selectIsUsingBackupPriceData);
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

  const handleAddItem = (type: AssetType, amount: number, description?: string, priceAtTime?: number | null) => {
    // Validate inputs
    if (!type || isNaN(amount) || !isFinite(amount) || amount <= 0) {
      return;
    }
    dispatch(addItem({ type, amount, description, priceAtTime }));
    hapticFeedback.success();
  };

  const handleCardPress = (type: AssetType, totalAmount: number) => {
    hapticFeedback.light();
    setSelectedAssetType(type);
    setSelectedAssetAmount(totalAmount);
    setShowQuickAddModal(true);
  };

  const handleQuickAdd = (amount: number, description?: string, priceAtTime?: number | null) => {
    if (selectedAssetType) {
      // Validate amount
      if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
        return;
      }
      
      const groupItems = groupedItems[selectedAssetType] || [];
      const currentTotal = groupItems.reduce((sum, item) => {
        if (!item || isNaN(item.amount) || !isFinite(item.amount)) {
          return sum;
        }
        return sum + item.amount;
      }, 0);
      
      const newAmount = currentTotal + amount;
      
      // Validate newAmount
      if (isNaN(newAmount) || !isFinite(newAmount) || newAmount < 0) {
        return;
      }

      const finalDescription = description || t('amountIncreased');
      dispatch(updateItemAmount({ type: selectedAssetType, newAmount, description: finalDescription, priceAtTime }));
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

  const handleEditPress = (type: AssetType, totalAmount: number) => {
    hapticFeedback.light();
    setSelectedAssetType(type);
    setSelectedAssetAmount(totalAmount);
    setShowQuickRemoveModal(true);
    swipeableRefs.current[type]?.close();
    currentlyOpenSwipeable.current = null;
  };

  const handleQuickRemove = (amountToRemove: number, description?: string, priceAtTime?: number | null) => {
    if (selectedAssetType) {
      // Validate amountToRemove
      if (isNaN(amountToRemove) || !isFinite(amountToRemove) || amountToRemove <= 0) {
        return;
      }
      
      const groupItems = groupedItems[selectedAssetType] || [];
      const currentTotal = groupItems.reduce((sum, item) => {
        if (!item || isNaN(item.amount) || !isFinite(item.amount)) {
          return sum;
        }
        return sum + item.amount;
      }, 0);
      
      const newAmount = Math.max(0, currentTotal - amountToRemove);
      
      // Validate newAmount
      if (isNaN(newAmount) || !isFinite(newAmount) || newAmount < 0) {
        return;
      }
      
      const finalDescription = description || t('amountDecreased');
      dispatch(updateItemAmount({ type: selectedAssetType, newAmount, description: finalDescription, priceAtTime }));
      hapticFeedback.heavy();
    }
  };

  const handleDeletePress = (type: AssetType, totalAmount: number) => {
    hapticFeedback.light();
    setSelectedAssetType(type);
    setSelectedAssetAmount(totalAmount);
    setShowQuickRemoveModal(true);
    swipeableRefs.current[type]?.close();
    currentlyOpenSwipeable.current = null;
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
      const result = await (dispatch as AppDispatch)(fetchPrices());
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }
      
      if (fetchPrices.fulfilled.match(result)) {
        hapticFeedback.success();
        // Show success message if using backup
        if (result.payload?.isBackup) {
          showToast(t('usingBackupData'), 'warning');
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

  const getCurrencySymbol = (currency: CurrencyType): string => {
    const symbols: Record<CurrencyType, string> = {
      'TL': '₺',
      'USD': '$',
      'EUR': '€',
      'ALTIN': '₲',
    };
    return symbols[currency];
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
      />
      
      <QuickAddModal
        visible={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false);
          setSelectedAssetType(null);
          setSelectedAssetAmount(0);
        }}
        onAdd={handleQuickAdd}
        assetType={selectedAssetType || '22_ayar'}
        currentAmount={selectedAssetAmount}
      />
      
      <QuickRemoveModal
        visible={showQuickRemoveModal}
        onClose={() => {
          setShowQuickRemoveModal(false);
          setSelectedAssetType(null);
          setSelectedAssetAmount(0);
        }}
        onRemove={handleQuickRemove}
        assetType={selectedAssetType || '22_ayar'}
        currentAmount={selectedAssetAmount}
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
