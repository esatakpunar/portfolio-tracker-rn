import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { validateRemoveAmount } from '../utils/validationUtils';
import { formatCurrency } from '../utils/formatUtils';
import { AssetType } from '../types';

interface QuickRemoveModalProps {
  visible: boolean;
  onClose: () => void;
  onRemove: (amount: number, description?: string) => void;
  assetType: AssetType;
  currentAmount: number;
}

const QuickRemoveModal: React.FC<QuickRemoveModalProps> = React.memo(({
  visible,
  onClose,
  onRemove,
  assetType,
  currentAmount,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const handleRemove = () => {
    const validation = validateRemoveAmount(amount, currentAmount);
    if (validation.isValid && validation.value !== undefined) {
      onRemove(validation.value, description || undefined);
      setAmount('');
      setDescription('');
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    onClose();
  };

  const handleMaxAmount = () => {
    const safeAmount = isNaN(currentAmount) || !isFinite(currentAmount) || currentAmount <= 0 
      ? 0 
      : currentAmount;
    setAmount(safeAmount.toString());
  };

  const getAssetLabel = () => {
    return t(`assetTypes.${assetType}`);
  };

  const getUnit = () => {
    if (assetType === 'ceyrek' || assetType === 'tam') {
      return t('units.piece');
    }
    if (assetType === 'tl') {
      return 'TL';
    }
    if (assetType === 'usd') {
      return 'USD';
    }
    if (assetType === 'eur') {
      return 'EUR';
    }
    return t('units.gram');
  };

  const amountValidation = useMemo(
    () => validateRemoveAmount(amount, currentAmount),
    [amount, currentAmount]
  );
  
  const isValidAmount = () => {
    return amountValidation.isValid;
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>{getAssetLabel()}</Text>
              <Text style={styles.subtitle}>
                {t('currentAmount')}: {formatCurrency(
                  isNaN(currentAmount) || !isFinite(currentAmount) ? 0 : currentAmount,
                  'tr'
                )} {getUnit()}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('amountToRemove')}:</Text>
                <TouchableOpacity onPress={handleMaxAmount} activeOpacity={0.7}>
                  <Text style={styles.maxButton}>
                    Max: {formatCurrency(
                      isNaN(currentAmount) || !isFinite(currentAmount) ? 0 : currentAmount,
                      'tr'
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputWrapper,
                amount && !isValidAmount() && styles.inputWrapperError,
              ]}>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <Text style={styles.unit}>{getUnit()}</Text>
              </View>
              {amount && !isValidAmount() && (
                <Text style={styles.errorText}>
                  {t('invalidAmount')}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('note')} <Text style={styles.optionalText}>{t('optional')}</Text>
              </Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder={t('notePlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.removeButton,
                  !isValidAmount() && styles.removeButtonDisabled,
                ]}
                onPress={handleRemove}
                disabled={!isValidAmount()}
                activeOpacity={0.8}
              >
                <Text style={styles.removeButtonText}>{t('remove')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
});

QuickRemoveModal.displayName = 'QuickRemoveModal';

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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  maxButton: {
    fontSize: fontSize.sm,
    color: colors.primaryStart,
    fontWeight: fontWeight.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
  },
  inputWrapperError: {
    borderColor: '#dc2626',
  },
  input: {
    flex: 1,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    fontWeight: fontWeight.semibold,
  },
  unit: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: '#dc2626',
    marginTop: spacing.xs,
  },
  optionalText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  descriptionInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
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
  removeButton: {
    backgroundColor: colors.error,
  },
  removeButtonDisabled: {
    opacity: 0.5,
  },
  removeButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default QuickRemoveModal;
