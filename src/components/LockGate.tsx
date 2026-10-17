import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  AppState,
  AppStateStatus,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { isPinEnabled, verifyPin } from '../utils/pinStorage';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '../utils/haptics';

const RELOCK_MS = 5 * 60 * 1000;

interface LockGateProps {
  children: React.ReactNode;
}

const LockGate: React.FC<LockGateProps> = ({ children }) => {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const backgroundAt = useRef<number | null>(null);
  const biometricAutoTried = useRef(false);

  const refreshEnabled = useCallback(async () => {
    const on = await isPinEnabled();
    setEnabled(on);
    if (!on) {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    refreshEnabled();
  }, [refreshEnabled]);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then(async (hasHardware) => {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && enrolled);
      })
      .catch(() => setBiometricAvailable(false));
  }, []);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        backgroundAt.current = Date.now();
      }
      if (next === 'active') {
        isPinEnabled().then((on) => {
          setEnabled(on);
          if (!on) {
            setUnlocked(true);
            return;
          }
          if (
            backgroundAt.current != null &&
            Date.now() - backgroundAt.current > RELOCK_MS
          ) {
            biometricAutoTried.current = false;
            setUnlocked(false);
            setPin('');
            setError('');
          }
        });
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [enabled]);

  const markUnlocked = () => {
    setUnlocked(true);
    setPin('');
    setError('');
    hapticFeedback.success();
  };

  const tryBiometric = async () => {
    if (!biometricAvailable) {
      return;
    }
    hapticFeedback.light();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('appLockTitle'),
      cancelLabel: t('cancel'),
    });
    if (result.success) {
      markUnlocked();
    }
  };

  useEffect(() => {
    if (checking || !enabled || unlocked || !biometricAvailable || biometricAutoTried.current) {
      return;
    }
    biometricAutoTried.current = true;
    void tryBiometric();
  }, [checking, enabled, unlocked, biometricAvailable]);

  const submitPin = async () => {
    if (pin.length < 4) {
      hapticFeedback.error();
      setError(t('appLockPinTooShort'));
      return;
    }
    setSubmitting(true);
    setError('');
    const ok = await verifyPin(pin);
    setSubmitting(false);
    if (ok) {
      markUnlocked();
    } else {
      setError(t('appLockWrongPin'));
      hapticFeedback.error();
    }
  };

  if (!checking && (!enabled || unlocked)) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.gate} edges={['top', 'bottom']}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.center}>
          {checking ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <View style={[styles.card, shadows.large]}>
              <View style={styles.iconWrap}>
                <Feather name="shield" size={28} color={colors.accentLight} />
              </View>
              <Text style={styles.title}>{t('appLockTitle')}</Text>
              <Text style={styles.subtitle}>{t('appLockGateSubtitle')}</Text>

              <Text style={styles.label}>{t('appLockEnterCurrentPin')}</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={pin}
                onChangeText={(text) => {
                  setPin(text.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
                keyboardType="number-pad"
                secureTextEntry
                placeholder={t('appLockEnterCurrentPin')}
                placeholderTextColor={colors.textMuted}
                maxLength={6}
                autoFocus
                editable={!submitting}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={submitPin}
                activeOpacity={0.85}
                disabled={submitting}
              >
                <Feather name="unlock" size={18} color={colors.textPrimary} />
                <Text style={styles.primaryBtnText}>{t('appLockUnlock')}</Text>
              </TouchableOpacity>

              {biometricAvailable ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={tryBiometric}
                  activeOpacity={0.8}
                  disabled={submitting}
                >
                  <Feather name="smartphone" size={18} color={colors.accentLight} />
                  <Text style={styles.secondaryBtnText}>{t('appLockBiometric')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          <Text style={styles.footerBrand}>{t('onboardingWelcomeBrand')}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accent,
    opacity: 0.12,
  },
  glowTop: {
    top: -100,
    right: -80,
  },
  glowBottom: {
    bottom: 80,
    left: -100,
    opacity: 0.06,
  },
  card: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    alignItems: 'stretch',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    letterSpacing: 6,
    textAlign: 'center',
    backgroundColor: colors.cardBackground,
    marginBottom: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryStart,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.md,
    ...shadows.medium,
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    backgroundColor: colors.accent + '12',
  },
  secondaryBtnText: {
    color: colors.accentLight,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  footerBrand: {
    marginTop: spacing.xxxl,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default LockGate;
