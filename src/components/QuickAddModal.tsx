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
import { getAmountPresets } from '../utils/amountPresets';
import { AssetType } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { useAppSelector } from '../hooks/useRedux';
import { selectPrices } from '../store/portfolioSlice';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number, description?: string, priceAtTime?: number | null) => void;
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
  const { t, i18n } = useTranslation();
  const prices = useAppSelector(selectPrices);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [priceAtTime, setPriceAtTime] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));
  
  const amountValidation = useMemo(() => validateAmount(amount), [amount]);
  const isAmountValid = amountValidation.isValid;
  
  // Calculate default price based on current prices and amount
  const calculateDefaultPrice = useMemo(() => {
    if (!amount || !amountValidation.isValid || !amountValidation.value) {
      return null;
    }
    
    const amountValue = amountValidation.value;
    if (assetType === 'tl') {
      return amountValue;
    } else if (assetType === 'usd') {
      const usdPrice = prices.usd;
      return (usdPrice != null && usdPrice > 0) ? amountValue * usdPrice : null;
    } else if (assetType === 'eur') {
      const eurPrice = prices.eur;
      return (eurPrice != null && eurPrice > 0) ? amountValue * eurPrice : null;
    } else {
      const price = prices[assetType];
      return (price != null && price > 0) ? amountValue * price : null;
    }
  }, [amount, assetType, prices, amountValidation]);
  
  // Update priceAtTime when amount changes
  useEffect(() => {
    if (calculateDefaultPrice != null) {
      setPriceAtTime(calculateDefaultPrice.toFixed(2));
    } else {
      setPriceAtTime('');
    }
  }, [calculateDefaultPrice]);

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
      // Parse priceAtTime
      let parsedPriceAtTime: number | null = null;
      if (priceAtTime.trim() !== '') {
        const normalized = priceAtTime.replace(',', '.');
        const parsed = parseFloat(normalized);
        if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) {
          parsedPriceAtTime = parsed;
        }
      }
      
      onAdd(validation.value, description || undefined, parsedPriceAtTime);
      setAmount('');
      setDescription('');
      setPriceAtTime('');
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setPriceAtTime('');
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

  const presets = useMemo(() => getAmountPresets(assetType), [assetType]);
  
  const handlePresetPress = (presetValue: number) => {
    hapticFeedback.light();
    setAmount(presetValue.toString());
  };

  const isPresetSelected = (presetValue: number): boolean => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount === presetValue;
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
              {presets.length > 0 && (
                <View style={styles.presetsContainer}>
                  {presets.map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetButton,
                        isPresetSelected(preset) && styles.presetButtonActive,
                      ]}
                      onPress={() => handlePresetPress(preset)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          isPresetSelected(preset) && styles.presetButtonTextActive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('priceAtTime')} <Text style={styles.optionalText}>{t('optional')}</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={priceAtTime}
                  onChangeText={setPriceAtTime}
                  placeholder={calculateDefaultPrice != null ? formatCurrency(calculateDefaultPrice, i18n.language) : "0.00"}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <Text style={styles.unit}>₺</Text>
              </View>
              {calculateDefaultPrice != null && (
                <Text style={styles.helperText}>
                  {t('currentMarketPrice')}: {formatCurrency(calculateDefaultPrice, i18n.language)} ₺
                </Text>
              )}
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
  presetsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  presetButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  presetButtonActive: {
    backgroundColor: colors.primaryStart + '20',
    borderColor: colors.primaryStart,
    borderWidth: 2,
  },
  presetButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  presetButtonTextActive: {
    color: colors.primaryStart,
    fontWeight: fontWeight.bold,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

export default QuickAddModal;
