import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { hapticFeedback } from '../utils/haptics';
import { verifyPin } from '../utils/pinStorage';

export type AppLockPinModalMode = 'enable' | 'disable';

interface AppLockPinModalProps {
  visible: boolean;
  mode: AppLockPinModalMode;
  onClose: () => void;
  onEnable: (pin: string) => Promise<void>;
  onDisableVerified: () => Promise<void>;
}

const AppLockPinModal: React.FC<AppLockPinModalProps> = ({
  visible,
  mode,
  onClose,
  onEnable,
  onDisableVerified,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(0));
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      setPin('');
      setPinError(null);
      setSaving(false);
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    hapticFeedback.light();
    onClose();
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      hapticFeedback.error();
      setPinError(t('appLockPinTooShort'));
      return;
    }
    setSaving(true);
    try {
      if (mode === 'disable') {
        const ok = await verifyPin(pin);
        if (!ok) {
          hapticFeedback.error();
          setPinError(t('appLockWrongPin'));
          return;
        }
        await onDisableVerified();
      } else {
        await onEnable(pin);
      }
      hapticFeedback.success();
      onClose();
    } catch {
      hapticFeedback.error();
      setPinError(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const isDisable = mode === 'disable';
  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <View style={styles.handle} />
              <View
                style={[
                  styles.iconWrap,
                  isDisable && { backgroundColor: colors.error + '22' },
                ]}
              >
                <Feather
                  name={isDisable ? 'unlock' : 'lock'}
                  size={22}
                  color={isDisable ? colors.error : colors.accentLight}
                />
              </View>
              <Text style={styles.title}>
                {isDisable ? t('appLockDisable') : t('appLockTitle')}
              </Text>
              <Text style={styles.subtitle}>
                {isDisable ? t('appLockEnterPinToDisable') : t('appLockSubtitle')}
              </Text>
            </View>

            <Text style={styles.label}>
              {isDisable ? t('appLockEnterCurrentPin') : t('appLockSetPin')}
            </Text>
            <TextInput
              style={[styles.input, pinError ? styles.inputError : null]}
              value={pin}
              onChangeText={(text) => {
                setPin(text.replace(/\D/g, '').slice(0, 6));
                if (pinError) setPinError(null);
              }}
              placeholder={isDisable ? t('appLockEnterCurrentPin') : t('appLockSetPin')}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  isDisable && styles.saveBtnDanger,
                  saving && styles.saveBtnDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {isDisable ? t('appLockDisable') : t('appLockEnable')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    ...shadows.large,
  },
  header: { alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.lg },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    letterSpacing: 4,
    textAlign: 'center',
    backgroundColor: colors.cardBackground,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryStart,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  saveBtnDanger: {
    backgroundColor: colors.error,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default AppLockPinModal;
