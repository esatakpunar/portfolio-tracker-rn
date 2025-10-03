import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { selectPrices, resetAll, setLanguage, selectLanguage, fetchPrices } from '../store/portfolioSlice';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { availableLanguages, saveLanguage } from '../locales';
import { AssetType } from '../types';
import { hapticFeedback } from '../utils/haptics';

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const prices = useAppSelector(selectPrices);
  const currentLanguage = useAppSelector(selectLanguage);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  const handleRefreshPrices = async () => {
    hapticFeedback.light();
    setIsRefreshingPrices(true);
    try {
      await dispatch(fetchPrices() as any);
      hapticFeedback.success();
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

  const getPriceIcon = (key: AssetType): string => {
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
    return iconMap[key] || '₲';
  };

  const getPriceColor = (key: AssetType): string => {
    const colorMap: Record<AssetType, string> = {
      'tl': '#dc2626',
      'usd': '#10b981',
      'eur': '#3b82f6',
      'gumus': '#6b7280',
      'tam': '#f59e0b',
      'ceyrek': '#f59e0b',
      '22_ayar': '#f59e0b',
      '24_ayar': '#f59e0b',
    };
    return colorMap[key] || colors.primaryStart;
  };

  const renderPriceItem = (key: AssetType, value: number) => {
    const priceColor = getPriceColor(key);
    
    return (
      <View key={key} style={styles.priceItem}>
        <View style={styles.priceItemLeft}>
          <View style={[
            styles.priceIconContainer,
            { 
              backgroundColor: priceColor + '20',
              borderColor: priceColor + '40',
            }
          ]}>
            <Text style={[styles.priceIcon, { color: priceColor }]}>
              {getPriceIcon(key)}
            </Text>
          </View>
          <Text style={styles.priceLabel}>{t(`assetTypes.${key}`)}</Text>
        </View>
        
        {isRefreshingPrices ? (
          <ActivityIndicator size="small" color={colors.primaryStart} />
        ) : (
          <View style={styles.priceValueContainer}>
            <Text style={styles.priceValue}>
              {value.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.priceCurrency}>₺</Text>
          </View>
        )}
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
          <Text style={styles.languageIcon}>🌐</Text>
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
              <Text style={styles.sectionIcon}>💰</Text>
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('refreshPrices')}</Text>
              <Text style={styles.sectionSubtitle}>Current market prices</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.refreshButton, isRefreshingPrices && styles.refreshButtonDisabled]}
            onPress={handleRefreshPrices}
            disabled={isRefreshingPrices}
          >
            <View style={styles.refreshButtonContent}>
              <Text style={styles.refreshButtonIcon}>
                {isRefreshingPrices ? '⏳' : '🔄'}
              </Text>
              <Text style={styles.refreshButtonText}>{t('refresh')}</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.pricesContainer}>
            {Object.entries(prices)
              .filter(([key]) => key !== 'tl')
              .map(([key, value]) =>
                renderPriceItem(key as AssetType, value)
              )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.error + '20' }]}>
              <Text style={styles.sectionIcon}>⚠️</Text>
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>Danger Zone</Text>
              <Text style={styles.sectionSubtitle}>Reset all data</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetAll}
          >
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonIcon}>🗑️</Text>
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
    ...shadows.glass,
  },
  languageIcon: {
    fontSize: 24,
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
  sectionIcon: {
    fontSize: 24,
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
  },
  refreshButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: colors.primaryStart,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...shadows.glass,
  },
  refreshButtonDisabled: {
    borderColor: colors.textMuted,
    opacity: 0.5,
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  refreshButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  priceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
  },
  priceIcon: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
  },
  priceLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  priceCurrency: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  dangerButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.glass,
  },
  dangerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  dangerButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
});

export default SettingsScreen;
