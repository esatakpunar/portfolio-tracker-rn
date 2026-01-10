import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
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
import { selectPrices, selectBuyPrices, selectPriceChanges, resetAll, setLanguage, selectLanguage, fetchPrices, selectPriceDataFetchedAt, selectIsUsingBackupPriceData, selectHasPartialPriceUpdate } from '../store/portfolioSlice';
import { AppDispatch } from '../store';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { availableLanguages, saveLanguage } from '../locales';
import { formatCurrency, formatLastUpdateTime } from '../utils/formatUtils';
import { getLastUpdateTime } from '../services/priceBackupService';
import { AssetType } from '../types';
import { hapticFeedback } from '../utils/haptics';
import PriceChangeIndicator from '../components/PriceChangeIndicator';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const prices = useAppSelector(selectPrices);
  const buyPrices = useAppSelector(selectBuyPrices);
  const priceChanges = useAppSelector(selectPriceChanges);
  const currentLanguage = useAppSelector(selectLanguage);
  const priceDataFetchedAt = useAppSelector(selectPriceDataFetchedAt);
  const isUsingBackupPriceData = useAppSelector(selectIsUsingBackupPriceData);
  const hasPartialPriceUpdate = useAppSelector(selectHasPartialPriceUpdate);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  // Load last update time on mount
  useEffect(() => {
    const initializePreferences = async () => {
      try {
        const updateTime = await getLastUpdateTime();
        setLastUpdateTime(updateTime);
      } catch (error) {
        // Ignore error
      }
    };
    
    initializePreferences();
  }, []);

  // Update last update time when prices are refreshed
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
    hapticFeedback.light();
    setIsRefreshingPrices(true);
    try {
      const result = await (dispatch as AppDispatch)(fetchPrices());
      if (fetchPrices.fulfilled.match(result)) {
        hapticFeedback.success();
        const updateTime = await getLastUpdateTime();
        setLastUpdateTime(updateTime);
      } else {
        hapticFeedback.error();
        Alert.alert(t('error'), t('pricesUpdateFailed'));
      }
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(t('error'), t('pricesUpdateFailed'));
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  const handleResetAll = () => {
    hapticFeedback.warning();
    Alert.alert(
      t('resetAllData'),
      t('confirmDeleteMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
          onPress: () => hapticFeedback.light(),
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            hapticFeedback.heavy();
            dispatch(resetAll());
          },
        },
      ]
    );
  };

  const handleLanguageChange = async (languageCode: string) => {
    hapticFeedback.selection();
    await i18n.changeLanguage(languageCode);
    dispatch(setLanguage(languageCode));
    await saveLanguage(languageCode);
    setShowLanguagePicker(false);
  };


  const renderPriceItem = (key: AssetType) => {
    const sellPrice = prices[key];
    const buyPrice = buyPrices[key];
    const change = priceChanges[key];
    
    const isSellPriceAvailable = sellPrice != null && !isNaN(sellPrice) && isFinite(sellPrice) && sellPrice >= 0;
    const isBuyPriceAvailable = buyPrice != null && !isNaN(buyPrice) && isFinite(buyPrice) && buyPrice >= 0;
    
    return (
      <View key={key} style={styles.priceCard}>
        <View style={styles.priceCardContent}>
          <View style={styles.priceCardRow}>
            <View style={styles.priceCardLeft}>
              <Text style={styles.priceCardLabel}>{t(`assetTypes.${key}`)}</Text>
              {isRefreshingPrices ? (
                <View style={styles.skeletonMainPrice} />
              ) : (
                isSellPriceAvailable ? (
                  <Text style={styles.priceCardMainValue}>
                    {formatCurrency(sellPrice, i18n.language)} ₺
                  </Text>
                ) : (
                  <Text style={styles.priceCardMainUnavailable}>—</Text>
                )
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

  const currentLanguageName = availableLanguages.find(
    lang => lang.code === currentLanguage
  )?.name || 'Türkçe';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('settingsSubtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => {
            hapticFeedback.light();
            setShowLanguagePicker(!showLanguagePicker);
          }}
        >
          <Feather name="globe" size={24} color={colors.primaryStart} />
        </TouchableOpacity>
      </View>

      {showLanguagePicker && (
        <View style={styles.languagePickerOverlay}>
          <View style={styles.languagePicker}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageOptionText,
                  currentLanguage === lang.code && styles.languageOptionTextSelected
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionIconWrapper}>
              <Feather name="dollar-sign" size={24} color={colors.primaryStart} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('refreshPrices')}</Text>
              {(priceDataFetchedAt || lastUpdateTime) && (
                <Text style={styles.sectionSubtitle}>
                  {t('lastUpdated')}: {formatLastUpdateTime(priceDataFetchedAt || lastUpdateTime || 0, i18n.language, t)}
                  {isUsingBackupPriceData && (
                    <Text style={styles.backupWarningText}> • {t('usingBackupData')}</Text>
                  )}
                  {hasPartialPriceUpdate && (
                    <Text style={styles.partialUpdateWarningText}> • {t('partialPriceUpdate')}</Text>
                  )}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.refreshIconButton, isRefreshingPrices && styles.refreshIconButtonDisabled]}
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
                // Priority order: usd, eur first, then others
                const priority: Record<string, number> = {
                  usd: 1,
                  eur: 2,
                };
                const priorityA = priority[keyA] || 999;
                const priorityB = priority[keyB] || 999;
                return priorityA - priorityB;
              })
              .map(([key]) =>
                renderPriceItem(key as AssetType)
              )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.error + '20' }]}>
              <Feather name="alert-triangle" size={24} color={colors.error} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('dangerZone')}</Text>
              <Text style={styles.sectionSubtitle}>{t('resetAllDataSubtitle')}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetAll}
          >
            <View style={styles.dangerButtonContent}>
              <Feather name="trash-2" size={20} color={colors.error} />
              <Text style={styles.dangerButtonText}>{t('resetAllData')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 88,
  },
  headerContent: {
    flex: 1,
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
  languageButton: {
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
  languagePickerOverlay: {
    position: 'absolute',
    top: 140,
    right: spacing.lg,
    zIndex: 1000,
  },
  languagePicker: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    minWidth: 150,
    ...shadows.medium,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  sectionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryStart + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionHeaderContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backupWarningText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },
  partialUpdateWarningText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },
  refreshIconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.primaryStart,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  refreshIconButtonDisabled: {
    borderColor: colors.textMuted,
    opacity: 0.5,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  languageOptionSelected: {
    backgroundColor: colors.glassBackground,
  },
  languageOptionFlag: {
    fontSize: fontSize.xl,
    marginRight: spacing.md,
  },
  languageOptionText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  languageOptionTextSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  pricesContainer: {
    // Cards will have marginBottom in priceCard style
  },
  priceCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  priceCardContent: {
    width: '100%',
  },
  priceCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  priceCardRight: {
    alignItems: 'flex-end',
  },
  priceCardBadge: {
    marginBottom: spacing.xs,
  },
  priceCardLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  skeletonMainPrice: {
    width: 120,
    height: fontSize.xxl + 4,
    backgroundColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  skeletonBuyPrice: {
    width: 80,
    height: fontSize.sm + 2,
    backgroundColor: colors.textMuted + '30',
    borderRadius: borderRadius.sm,
  },
  priceCardMainValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  priceCardMainUnavailable: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  priceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceCardFooterLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  priceCardFooterValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  priceCardFooterUnavailable: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  priceCurrency: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  priceUnavailable: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  dangerButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.medium,
  },
  dangerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dangerButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
});

export default SettingsScreen;
