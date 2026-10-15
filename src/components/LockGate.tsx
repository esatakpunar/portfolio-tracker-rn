import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
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
  const backgroundAt = useRef<number | null>(null);

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
            setUnlocked(false);
          }
        });
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [enabled]);

  const tryBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('appLockTitle'),
    });
    if (result.success) {
      setUnlocked(true);
      setPin('');
      setError('');
      hapticFeedback.success();
    }
  };

  const submitPin = async () => {
    const ok = await verifyPin(pin);
    if (ok) {
      setUnlocked(true);
      setPin('');
      setError('');
      hapticFeedback.success();
    } else {
      setError(t('appLockWrongPin'));
      hapticFeedback.error();
    }
  };

  if (checking) {
    return <View style={styles.gate} />;
  }

  if (!enabled || unlocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.gate}>
      <Text style={styles.title}>{t('appLockTitle')}</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        placeholder="PIN"
        placeholderTextColor={colors.textMuted}
        maxLength={6}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={submitPin}>
        <Text style={styles.buttonText}>{t('appLockUnlock')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={tryBiometric}>
        <Text style={styles.linkText}>{t('appLockBiometric')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primaryStart,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  link: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primaryStart,
  },
});

export default LockGate;
