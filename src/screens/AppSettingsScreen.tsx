import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { TextInput } from '../components/TextInput';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import {
  resetAll,
  setLanguage,
  selectLanguage,
  fetchPrices,
  selectItems,
  selectHistory,
  importBackup,
} from '../store/portfolioSlice';
import { exportBackupToFile, importBackupFromPicker } from '../services/backupService';
import { shouldPromptAutoBackup } from '../services/autoBackupService';
import {
  getAutoBackupEnabled,
  setAutoBackupEnabled,
  getLastAutoBackupAt,
  setLastAutoBackupAt,
} from '../utils/preferenceStorage';
import appConfig from '../../app.json';
import { AppDispatch } from '../store';
import { colors } from '../theme';
import { availableLanguages, saveLanguage } from '../locales';
import { hapticFeedback } from '../utils/haptics';
import ZakatScreen from './ZakatScreen';
import { isPinEnabled, setPin, clearPin } from '../utils/pinStorage';
import { settingsScreenStyles as styles } from './settingsScreenStyles';

const AppSettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);
  const portfolioItems = useAppSelector(selectItems);
  const portfolioHistory = useAppSelector(selectHistory);
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [showZakat, setShowZakat] = useState(false);
  const [pinEnabled, setPinEnabledState] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState(false);
  const [lastAutoBackupAt, setLastAutoBackupAtState] = useState<number | null>(null);
  const [dismissedStaleBanner, setDismissedStaleBanner] = useState(false);

  const refreshAutoBackupPrefs = async () => {
    const [enabled, lastAt] = await Promise.all([
      getAutoBackupEnabled(),
      getLastAutoBackupAt(),
    ]);
    setAutoBackupEnabledState(enabled);
    setLastAutoBackupAtState(lastAt);
  };

  useEffect(() => {
    isPinEnabled().then(setPinEnabledState).catch(() => {});
    refreshAutoBackupPrefs().catch(() => {});
  }, []);

  const showStaleBackupBanner =
    !dismissedStaleBanner && shouldPromptAutoBackup(autoBackupEnabled, lastAutoBackupAt);

  const handleAutoBackupToggle = async (value: boolean) => {
    hapticFeedback.selection();
    setAutoBackupEnabledState(value);
    setDismissedStaleBanner(false);
    await setAutoBackupEnabled(value);
  };

  const handleSavePin = async () => {
    if (newPin.length < 4) {
      Alert.alert(t('error'), t('appLockPinTooShort'));
      return;
    }
    await setPin(newPin);
    setPinEnabledState(true);
    setNewPin('');
    hapticFeedback.success();
  };

  const handleDisablePin = async () => {
    Alert.alert(t('appLockDisable'), t('appLockDisableConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await clearPin();
          setPinEnabledState(false);
          hapticFeedback.success();
        },
      },
    ]);
  };

  const handleExportBackup = async () => {
    if (isBackupBusy) return;
    setIsBackupBusy(true);
    hapticFeedback.light();
    try {
      await exportBackupToFile(portfolioItems, portfolioHistory, appConfig.expo.version);
      const now = Date.now();
      await setLastAutoBackupAt(now);
      setLastAutoBackupAtState(now);
      setDismissedStaleBanner(true);
      hapticFeedback.success();
    } catch {
      hapticFeedback.error();
      Alert.alert(t('error'), t('backupExportFailed'));
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleImportBackup = () => {
    Alert.alert(t('importBackupTitle'), `${t('importBackupMessage')}\n\n${t('backupSensitiveWarning')}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('importBackup'),
        style: 'destructive',
        onPress: async () => {
          if (isBackupBusy) return;
          setIsBackupBusy(true);
          try {
            const backup = await importBackupFromPicker();
            if (!backup) return;
            dispatch(importBackup(backup.data));
            await (dispatch as AppDispatch)(fetchPrices());
            hapticFeedback.success();
          } catch {
            hapticFeedback.error();
            Alert.alert(t('error'), t('backupImportFailed'));
          } finally {
            setIsBackupBusy(false);
          }
        },
      },
    ]);
  };

  const handleResetAll = () => {
    hapticFeedback.warning();
    Alert.alert(t('resetAllData'), t('confirmDeleteMessage'), [
      { text: t('cancel'), style: 'cancel', onPress: () => hapticFeedback.light() },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          hapticFeedback.heavy();
          dispatch(resetAll());
        },
      },
    ]);
  };

  const handleLanguageChange = async (languageCode: string) => {
    hapticFeedback.selection();
    await i18n.changeLanguage(languageCode);
    dispatch(setLanguage(languageCode));
    await saveLanguage(languageCode);
    setShowLanguagePicker(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('appSettingsTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('appSettingsSubtitle')}</Text>
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
                  currentLanguage === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageOptionText,
                    currentLanguage === lang.code && styles.languageOptionTextSelected,
                  ]}
                >
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
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.success + '20' }]}>
              <Feather name="heart" size={24} color={colors.success} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('zakatTitle')}</Text>
              <Text style={styles.sectionSubtitle}>{t('zakatSubtitle')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.backupButton} onPress={() => setShowZakat(true)}>
            <Text style={styles.backupButtonText}>{t('zakatOpen')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.accent + '20' }]}>
              <Feather name="shield" size={24} color={colors.accent} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('appLockTitle')}</Text>
              <Text style={styles.sectionSubtitle}>{t('appLockSubtitle')}</Text>
            </View>
          </View>
          {pinEnabled ? (
            <TouchableOpacity style={styles.backupButton} onPress={handleDisablePin}>
              <Text style={styles.backupButtonText}>{t('appLockDisable')}</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <TextInput
                style={styles.pinInput}
                value={newPin}
                onChangeText={setNewPin}
                placeholder={t('appLockSetPin')}
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={styles.backupButton} onPress={handleSavePin}>
                <Text style={styles.backupButtonText}>{t('appLockEnable')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.primaryStart + '20' }]}>
              <Feather name="download" size={24} color={colors.primaryStart} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={styles.sectionTitle}>{t('dataBackup')}</Text>
              <Text style={styles.sectionSubtitle}>{t('dataBackupSubtitle')}</Text>
            </View>
          </View>
          <View style={styles.autoBackupToggleRow}>
            <View style={styles.autoBackupToggleText}>
              <Text style={styles.autoBackupToggleLabel}>{t('autoBackupToggle')}</Text>
              <Text style={styles.autoBackupToggleHint}>{t('autoBackupToggleHint')}</Text>
            </View>
            <Switch
              value={autoBackupEnabled}
              onValueChange={handleAutoBackupToggle}
              trackColor={{ false: colors.glassBorder, true: colors.primaryStart + '80' }}
              thumbColor={autoBackupEnabled ? colors.primaryStart : colors.textMuted}
            />
          </View>
          {showStaleBackupBanner && (
            <View style={styles.autoBackupBanner}>
              <Text style={styles.autoBackupBannerText}>{t('autoBackupStaleBanner')}</Text>
              <View style={styles.autoBackupBannerActions}>
                <TouchableOpacity
                  style={styles.autoBackupBannerPrimary}
                  onPress={handleExportBackup}
                  disabled={isBackupBusy}
                >
                  <Text style={styles.autoBackupBannerPrimaryText}>{t('autoBackupExportNow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.light();
                    setDismissedStaleBanner(true);
                  }}
                >
                  <Text style={styles.autoBackupBannerDismiss}>{t('autoBackupDismiss')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {lastAutoBackupAt != null && (
            <Text style={styles.autoBackupLastLine}>
              {t('autoBackupLastBackup', {
                date: new Date(lastAutoBackupAt).toLocaleDateString(i18n.language),
              })}
            </Text>
          )}
          <View style={styles.backupRow}>
            <TouchableOpacity
              style={styles.backupButton}
              onPress={handleExportBackup}
              disabled={isBackupBusy}
            >
              <Text style={styles.backupButtonText}>{t('exportBackup')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backupButton, styles.backupButtonSecondary]}
              onPress={handleImportBackup}
              disabled={isBackupBusy}
            >
              <Text style={styles.backupButtonText}>{t('importBackup')}</Text>
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.dangerButton} onPress={handleResetAll}>
            <View style={styles.dangerButtonContent}>
              <Feather name="trash-2" size={20} color={colors.error} />
              <Text style={styles.dangerButtonText}>{t('resetAllData')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ZakatScreen visible={showZakat} onClose={() => setShowZakat(false)} />
    </SafeAreaView>
  );
};

export default AppSettingsScreen;
