import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import {
  selectPrices,
  selectBuyPrices,
  selectPriceChanges,
  fetchPrices,
  selectPriceDataFetchedAt,
  selectIsUsingBackupPriceData,
  selectHasPartialPriceUpdate,
  selectPriceSource,
} from '../store/portfolioSlice';
import { AppDispatch } from '../store';
import { colors } from '../theme';
import { formatCurrency, formatLastUpdateTime } from '../utils/formatUtils';
import { getLastUpdateTime } from '../services/priceBackupService';
import { AssetType } from '../types';
import { hapticFeedback } from '../utils/haptics';
import PriceChangeIndicator from '../components/PriceChangeIndicator';
import { getPriceSourcePreference, savePriceSourcePreference, PriceSource, PRICE_SOURCES } from '../utils/preferenceStorage';
import PriceSourceCompareCard from '../components/PriceSourceCompareCard';
import { settingsScreenStyles as styles } from './settingsScreenStyles';

const MarketsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const prices = useAppSelector(selectPrices);
  const buyPrices = useAppSelector(selectBuyPrices);
  const priceChanges = useAppSelector(selectPriceChanges);
  const priceDataFetchedAt = useAppSelector(selectPriceDataFetchedAt);
  const isUsingBackupPriceData = useAppSelector(selectIsUsingBackupPriceData);
  const hasPartialPriceUpdate = useAppSelector(selectHasPartialPriceUpdate);
  const priceSource = useAppSelector(selectPriceSource);
  const [showPriceSourcePicker, setShowPriceSourcePicker] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [priceSourcePreference, setPriceSourcePreference] = useState<PriceSource>(PRICE_SOURCES.AUTO);
  const lastRefreshTimeRef = React.useRef<number>(0);
  const DEBOUNCE_DELAY_MS = 2500;

  useEffect(() => {
    const initializePreferences = async () => {
      try {
        const updateTime = await getLastUpdateTime();
        setLastUpdateTime(updateTime);
        const source = await getPriceSourcePreference();
        setPriceSourcePreference(source);
      } catch {
        // Ignore error
      }
    };
    initializePreferences();
  }, []);

  useEffect(() => {
    const updateLastUpdateTime = async () => {
      const updateTime = await getLastUpdateTime();
      setLastUpdateTime(updateTime);
    };
    if (!isRefreshingPrices) {
      updateLastUpdateTime();
    }
  }, [isRefreshingPrices]);

  const handleRefreshPrices = async () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < DEBOUNCE_DELAY_MS || isRefreshingPrices) {
      return;
    }
    lastRefreshTimeRef.current = now;
    hapticFeedback.light();
    setIsRefreshingPrices(true);
    try {
      const result = await (dispatch as AppDispatch)(fetchPrices());
      if (fetchPrices.fulfilled.match(result)) {
        hapticFeedback.success();
        setLastUpdateTime(await getLastUpdateTime());
        if (result.payload?.isBackup) {
          Alert.alert(t('warning'), t('usingBackupData'));
        } else if (
          result.payload &&
          'hasPartialPriceUpdate' in result.payload &&
          result.payload.hasPartialPriceUpdate
        ) {
          Alert.alert(t('warning'), t('partialPriceUpdate'));
        }
      } else {
        hapticFeedback.error();
        const errorMessage = fetchPrices.rejected.match(result)
          ? (result.payload as string) || t('pricesUpdateFailed')
          : t('pricesUpdateFailed');
        Alert.alert(t('error'), errorMessage);
      }
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(
        t('error'),
        error instanceof Error ? error.message : t('pricesUpdateFailed')
      );
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  const handlePriceSourceChange = async (source: PriceSource) => {
    hapticFeedback.selection();
    await savePriceSourcePreference(source);
    setPriceSourcePreference(source);
    setShowPriceSourcePicker(false);
  };

  const renderPriceItem = (key: AssetType) => {
    const sellPrice = prices[key];
    const buyPrice = buyPrices[key];
    const change = priceChanges[key];
    const isSellPriceAvailable =
      sellPrice != null && !isNaN(sellPrice) && isFinite(sellPrice) && sellPrice >= 0;
    const isBuyPriceAvailable =
      buyPrice != null && !isNaN(buyPrice) && isFinite(buyPrice) && buyPrice >= 0;

    return (
      <View key={key} style={styles.priceCard}>
        <View style={styles.priceCardContent}>
          <View style={styles.priceCardRow}>
            <View style={styles.priceCardLeft}>
              <Text style={styles.priceCardLabel}>{t(`assetTypes.${key}`)}</Text>
              {isRefreshingPrices ? (
                <View style={styles.skeletonMainPrice} />
              ) : isSellPriceAvailable ? (
                <Text style={styles.priceCardMainValue}>
                  {formatCurrency(sellPrice, i18n.language)} ₺
                </Text>
              ) : (
                <Text style={styles.priceCardMainUnavailable}>—</Text>
              )}
            </View>
            <View style={styles.priceCardRight}>
              {isRefreshingPrices ? (
                <>
                  <View style={styles.skeletonBadge} />
                  <View style={styles.priceCardFooter}>
                    <Text style={styles.priceCardFooterLabel}>{t('buyPrice')}:</Text>
                    <View style={styles.skeletonBuyPrice} />
                  </View>
                </>
              ) : (
                <>
                  {change != null && (
                    <View style={styles.priceCardBadge}>
                      <PriceChangeIndicator change={change} />
                    </View>
                  )}
                  <View style={styles.priceCardFooter}>
                    <Text style={styles.priceCardFooterLabel}>{t('buyPrice')}:</Text>
                    {isBuyPriceAvailable ? (
                      <Text style={styles.priceCardFooterValue}>
                        {formatCurrency(buyPrice, i18n.language)} ₺
                      </Text>
                    ) : (
                      <Text style={styles.priceCardFooterUnavailable}>—</Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('marketsTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('marketsSubtitle')}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionIconWrapper}>
              <Feather name="dollar-sign" size={24} color={colors.primaryStart} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('refreshPrices')}</Text>
              {(priceDataFetchedAt || lastUpdateTime) && (
                <>
                  <Text style={styles.sectionSubtitle}>
                    {t('lastUpdated')}:{' '}
                    {formatLastUpdateTime(
                      priceDataFetchedAt || lastUpdateTime || 0,
                      i18n.language,
                      t
                    )}
                    {priceSource && (
                      <Text style={styles.priceSourceText}> • {priceSource}</Text>
                    )}
                  </Text>
                  {isUsingBackupPriceData && (
                    <Text style={styles.backupWarningText}>⚠️ {t('usingBackupData')}</Text>
                  )}
                  {hasPartialPriceUpdate && !isUsingBackupPriceData && (
                    <Text style={styles.partialUpdateWarningText}>
                      ⚠️ {t('partialPriceUpdate')}
                    </Text>
                  )}
                </>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.refreshIconButton,
                isRefreshingPrices && styles.refreshIconButtonDisabled,
              ]}
              onPress={handleRefreshPrices}
              disabled={isRefreshingPrices}
            >
              {isRefreshingPrices ? (
                <ActivityIndicator size="small" color={colors.primaryStart} />
              ) : (
                <Feather name="refresh-cw" size={18} color={colors.primaryStart} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.pricesContainer}>
            {Object.entries(prices)
              .filter(([key]) => key !== 'tl')
              .sort(([keyA], [keyB]) => {
                const priority: Record<string, number> = { usd: 1, eur: 2 };
                return (priority[keyA] || 999) - (priority[keyB] || 999);
              })
              .map(([key]) => renderPriceItem(key as AssetType))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.accent + '20' }]}>
              <Feather name="database" size={24} color={colors.accent} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('priceSource')}</Text>
              <Text style={styles.sectionSubtitle}>{t('priceSourceSubtitle')}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.priceSourceButton}
            onPress={() => {
              hapticFeedback.light();
              setShowPriceSourcePicker(!showPriceSourcePicker);
            }}
          >
            <View style={styles.priceSourceContent}>
              <View style={styles.priceSourceLeft}>
                <Text style={styles.priceSourceLabel}>
                  {priceSourcePreference === PRICE_SOURCES.AUTO && t('priceSourceAuto')}
                  {priceSourcePreference === PRICE_SOURCES.TRUNCGIL && t('priceSourceTruncgil')}
                  {priceSourcePreference === PRICE_SOURCES.INVESTING && t('priceSourceInvesting')}
                </Text>
                <Text style={styles.priceSourceDesc}>
                  {priceSourcePreference === PRICE_SOURCES.AUTO && t('priceSourceAutoDesc')}
                  {priceSourcePreference === PRICE_SOURCES.TRUNCGIL && t('priceSourceTruncgilDesc')}
                  {priceSourcePreference === PRICE_SOURCES.INVESTING && t('priceSourceInvestingDesc')}
                </Text>
              </View>
              <Feather name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {showPriceSourcePicker && (
            <View style={styles.priceSourceOptions}>
              {(
                [
                  [PRICE_SOURCES.AUTO, 'priceSourceAuto', 'priceSourceAutoDesc'],
                  [PRICE_SOURCES.TRUNCGIL, 'priceSourceTruncgil', 'priceSourceTruncgilDesc'],
                  [PRICE_SOURCES.INVESTING, 'priceSourceInvesting', 'priceSourceInvestingDesc'],
                ] as const
              ).map(([source, labelKey, descKey]) => (
                <TouchableOpacity
                  key={source}
                  style={[
                    styles.priceSourceOption,
                    priceSourcePreference === source && styles.priceSourceOptionSelected,
                  ]}
                  onPress={() => handlePriceSourceChange(source)}
                >
                  <View style={styles.priceSourceOptionContent}>
                    <Text
                      style={[
                        styles.priceSourceOptionLabel,
                        priceSourcePreference === source && styles.priceSourceOptionLabelSelected,
                      ]}
                    >
                      {t(labelKey)}
                    </Text>
                    <Text style={styles.priceSourceOptionDesc}>{t(descKey)}</Text>
                  </View>
                  {priceSourcePreference === source && (
                    <Feather name="check" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.primaryStart + '20' }]}>
              <Feather name="bar-chart-2" size={24} color={colors.primaryStart} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('comparePriceSources')}</Text>
              <Text style={styles.sectionSubtitle}>{t('comparePriceSourcesDesc')}</Text>
            </View>
          </View>
          <PriceSourceCompareCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MarketsScreen;
