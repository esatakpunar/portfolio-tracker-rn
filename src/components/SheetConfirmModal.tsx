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
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { hapticFeedback } from '../utils/haptics';

export type SheetConfirmVariant = 'primary' | 'danger';

export interface SheetConfirmPanelProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: SheetConfirmVariant;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Bottom-sheet confirm body (no Modal wrapper) — embed in another sheet. */
export const SheetConfirmPanel: React.FC<SheetConfirmPanelProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const cancelText = cancelLabel ?? t('cancel');
  const confirmDanger = variant === 'danger';

  const handleConfirm = () => {
    hapticFeedback.success();
    onConfirm();
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            confirmDanger ? styles.confirmButtonDanger : styles.confirmButtonPrimary,
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

interface SheetConfirmModalProps extends SheetConfirmPanelProps {
  visible: boolean;
  onClose: () => void;
}

const SheetConfirmModal: React.FC<SheetConfirmModalProps> = ({
  visible,
  onClose,
  ...panelProps
}) => {
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
            onStartShouldSetResponder={() => true}
          >
            <SheetConfirmPanel {...panelProps} onCancel={onClose} />
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    ...shadows.large,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  confirmButtonPrimary: {
    backgroundColor: colors.primaryStart,
  },
  confirmButtonDanger: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default SheetConfirmModal;
