import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { addItem, updateItemAmount, selectItems, selectPrices, selectPriceChanges, selectTotalIn, fetchPrices } from '../store/portfolioSlice';
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

const { width } = Dimensions.get('window');
const CURRENCIES: CurrencyType[] = ['TL', 'USD', 'EUR', 'ALTIN'];

const PortfolioScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectItems);
  const prices = useAppSelector(selectPrices);
  const priceChanges = useAppSelector(selectPriceChanges);
  
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showQuickRemoveModal, setShowQuickRemoveModal] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [selectedAssetAmount, setSelectedAssetAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const currentlyOpenSwipeable = useRef<string | null>(null);

  // Bounds check for currency index to prevent out-of-bounds access
  const safeCurrencyIndex = useMemo(() => {
    const index = Math.max(0, Math.min(currentCurrencyIndex, CURRENCIES.length - 1));
    return index;
  }, [currentCurrencyIndex]);
  
  const currentCurrency = CURRENCIES[safeCurrencyIndex] || CURRENCIES[0];
  const totalValue = useAppSelector(selectTotalIn(currentCurrency));
  
  // Validate totalValue
  const safeTotalValue = useMemo(() => {
    if (isNaN(totalValue) || !isFinite(totalValue) || totalValue < 0) {
      return 0;
    }
    return totalValue;
  }, [totalValue]);

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

  const handleAddItem = (type: AssetType, amount: number, description?: string) => {
    // Validate inputs
    if (!type || isNaN(amount) || !isFinite(amount) || amount <= 0) {
      return;
    }
    dispatch(addItem({ type, amount, description }));
    hapticFeedback.success();
  };

  const handleCardPress = (type: AssetType, totalAmount: number) => {
    hapticFeedback.light();
    setSelectedAssetType(type);
    setSelectedAssetAmount(totalAmount);
    setShowQuickAddModal(true);
  };

  const handleQuickAdd = (amount: number, description?: string) => {
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
      dispatch(updateItemAmount({ type: selectedAssetType, newAmount, description: finalDescription }));
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

  const handleQuickRemove = (amountToRemove: number, description?: string) => {
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
      dispatch(updateItemAmount({ type: selectedAssetType, newAmount, description: finalDescription }));
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
    hapticFeedback.light();
    setRefreshing(true);
    try {
      const result = await (dispatch as AppDispatch)(fetchPrices());
      if (fetchPrices.fulfilled.match(result)) {
        hapticFeedback.success();
      } else {
        hapticFeedback.error();
      }
    } catch (error) {
      hapticFeedback.error();
    } finally {
      setRefreshing(false);
    }
  };

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
      'TL': '#dc2626',
      'USD': '#10b981',
      'EUR': '#3b82f6',
      'ALTIN': '#f59e0b',
    };
    return colors_map[currency];
  };

  const renderCurrencySlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <FlatList
          data={CURRENCIES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            // Bounds check to prevent invalid index
            const safeIndex = Math.max(0, Math.min(index, CURRENCIES.length - 1));
            if (safeIndex !== currentCurrencyIndex && safeIndex >= 0 && safeIndex < CURRENCIES.length) {
              hapticFeedback.selection();
              setCurrentCurrencyIndex(safeIndex);
            }
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
                        {formatCurrency(safeTotalValue, i18n.language)}
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
                              {formatCurrency(getCurrencyPrice(currency), i18n.language)} ₺
                            </Text>
                            <View style={styles.changeIndicatorWrapper}>
                              <PriceChangeIndicator change={getCurrencyChange(currency)} />
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.priceInfoContainer}>
                          <Text style={styles.currentValueLabel}>{t('totalAssets')}</Text>
                          <Text style={styles.totalAssetsText}>
                            {uniqueAssetCount} {uniqueAssetCount === 1 ? t('asset') : t('assets')}
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
  ): number => {
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
      const usdPrice = prices.usd || 0;
      return usdPrice > 0 ? valueTL / usdPrice : 0;
    }
    if (targetCurrency === 'EUR') {
      const eurPrice = prices.eur || 0;
      return eurPrice > 0 ? valueTL / eurPrice : 0;
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
        const altinPrice = prices['24_ayar'] || 0;
        return altinPrice > 0 ? valueTL / altinPrice : 0;
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

  const getCurrencyChange = (currency: CurrencyType): number => {
    const changeMap: Record<CurrencyType, keyof typeof priceChanges> = {
      'TL': 'tl',
      'USD': 'usd',
      'EUR': 'eur',
      'ALTIN': '24_ayar', // Gram altın için 24 ayar change değeri
    };
    return priceChanges[changeMap[currency]] ?? 0;
  };

  const getCurrencyPrice = (currency: CurrencyType): number => {
    const priceMap: Record<CurrencyType, keyof typeof prices> = {
      'TL': 'tl',
      'USD': 'usd',
      'EUR': 'eur',
      'ALTIN': '24_ayar', // Gram altın için 24 ayar fiyatı
    };
    return prices[priceMap[currency]] ?? 0;
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
    
    const pricePerUnit = prices[type] || 0;
    if (isNaN(pricePerUnit) || !isFinite(pricePerUnit) || pricePerUnit <= 0) {
      return null;
    }
    
    const totalValueTL = totalAmount * pricePerUnit;
    const convertedValue = convertToTargetCurrency(totalValueTL, currentCurrency, type, totalAmount);
    
    // Validate converted value
    if (isNaN(convertedValue) || !isFinite(convertedValue)) {
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
            <Text style={styles.addButtonIcon}>+</Text>
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
            <Text style={styles.sectionTitle}>{t('assets')}</Text>
            
            {items.length === 0 ? (
              <EmptyState
                icon="💼"
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
    ...shadows.glass,
  },
  addButtonIcon: {
    fontSize: 28,
    color: colors.primaryStart,
    fontWeight: fontWeight.bold,
    marginTop: -2,
  },
  content: {
    flex: 1,
  },
  sliderContainer: {
    marginVertical: spacing.xl,
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
    ...shadows.glass,
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
    backgroundColor: colors.glassBorder,
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
    ...shadows.glass,
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
    ...shadows.glass,
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
    backgroundColor: '#f59e0b',
  },
  iconUSD: {
    backgroundColor: '#10b981',
  },
  iconEUR: {
    backgroundColor: '#3b82f6',
  },
  iconTL: {
    backgroundColor: '#dc2626',
  },
  iconSilver: {
    backgroundColor: '#6b7280',
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
  totalAssetsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});

export default PortfolioScreen;
