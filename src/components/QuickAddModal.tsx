import React, { useState, useEffect, useMemo } from 'react';
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
import { TextInput } from './TextInput';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { validateAmount } from '../utils/validationUtils';
import { formatCurrency } from '../utils/formatUtils';
import { AssetType } from '../types';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number, description?: string) => void;
  assetType: AssetType;
  currentAmount: number;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  onClose,
  onAdd,
  assetType,
  currentAmount,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));
  
  const amountValidation = useMemo(() => validateAmount(amount), [amount]);
  const isAmountValid = amountValidation.isValid;

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

  const handleAdd = () => {
    const validation = validateAmount(amount);
    if (validation.isValid && validation.value !== undefined) {
      onAdd(validation.value, description || undefined);
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
              <Text style={styles.label}>{t('amountToAdd')}:</Text>
              <View style={styles.inputWrapper}>
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
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('description')} <Text style={styles.optionalText}>{t('optional')}</Text>
              </Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder={t('descriptionPlaceholder')}
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
                  styles.addButton,
                  !isAmountValid && styles.addButtonDisabled,
                ]}
                onPress={handleAdd}
                disabled={!isAmountValid}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.primaryStart,
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
  addButton: {
    backgroundColor: colors.primaryStart,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default QuickAddModal;
