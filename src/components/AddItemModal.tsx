import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { getAssetIcon, getAssetUnit } from '../utils/assetUtils';
import { validateAmount } from '../utils/validationUtils';
import { getAmountPresets } from '../utils/amountPresets';
import { AssetType } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { useAppSelector } from '../hooks/useRedux';
import { selectPrices } from '../store/portfolioSlice';
import { formatCurrency } from '../utils/formatUtils';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: AssetType, amount: number, description?: string, priceAtTime?: number | null) => void;
}

const assetTypes: AssetType[] = [
  '22_ayar',
  '24_ayar',
  'ceyrek',
  'tam',
  'usd',
  'eur',
  'tl',
  'gumus'
];

const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose, onAdd }) => {
  const { t, i18n } = useTranslation();
  const prices = useAppSelector(selectPrices);
  const [selectedType, setSelectedType] = useState<AssetType>('22_ayar');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [priceAtTime, setPriceAtTime] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  
  const amountValidation = useMemo(() => validateAmount(amount), [amount]);
  const isAmountValid = amountValidation.isValid;
  
  // Calculate default price based on current prices and amount
  const calculateDefaultPrice = useMemo(() => {
    if (!amount || !amountValidation.isValid || !amountValidation.value) {
      return null;
    }
    
    const amountValue = amountValidation.value;
    if (selectedType === 'tl') {
      return amountValue;
    } else if (selectedType === 'usd') {
      const usdPrice = prices.usd;
      return (usdPrice != null && usdPrice > 0) ? amountValue * usdPrice : null;
    } else if (selectedType === 'eur') {
      const eurPrice = prices.eur;
      return (eurPrice != null && eurPrice > 0) ? amountValue * eurPrice : null;
    } else {
      const price = prices[selectedType];
      return (price != null && price > 0) ? amountValue * price : null;
    }
  }, [amount, selectedType, prices, amountValidation]);
  
  // Update priceAtTime when amount or type changes
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
      // Reset to default when modal opens
      setSelectedType('24_ayar');
      setAmount('');
      setDescription('');
      setPriceAtTime('');
      setShowTypePicker(false);
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
      
      onAdd(selectedType, validation.value, description || undefined, parsedPriceAtTime);
      setAmount('');
      setDescription('');
      setPriceAtTime('');
      setSelectedType('22_ayar');
      setShowTypePicker(false);
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setPriceAtTime('');
    setSelectedType('22_ayar');
    setShowTypePicker(false);
    onClose();
  };

  const presets = useMemo(() => getAmountPresets(selectedType), [selectedType]);
  
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
              <Text style={styles.title}>{t('addNewAsset')}</Text>
              <Text style={styles.subtitle}>{t('addNewAssetSubtitle')}</Text>
            </View>

            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('assetType')}</Text>
                <View style={styles.pickerWrapper}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowTypePicker(!showTypePicker)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerButtonText}>
                      {getAssetIcon(selectedType)} {t(`assetTypes.${selectedType}`)}
                    </Text>
                    <Text style={styles.pickerArrow}>{showTypePicker ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {showTypePicker && (
                    <View style={styles.typePickerContainer}>
                      <ScrollView 
                        style={styles.typePickerScroll}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {assetTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.typeOption,
                              selectedType === type && styles.typeOptionSelected
                            ]}
                            onPress={() => {
                              setSelectedType(type);
                              setShowTypePicker(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.typeOptionIcon}>{getAssetIcon(type)}</Text>
                            <Text style={[
                              styles.typeOptionText,
                              selectedType === type && styles.typeOptionTextSelected
                            ]}>
                              {t(`assetTypes.${type}`)}
                            </Text>
                            {selectedType === type && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('amount')}:</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                  <Text style={styles.unit}>{getAssetUnit(selectedType, t)}</Text>
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
                  returnKeyType="done"
                />
              </View>
            </ScrollView>

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
    maxHeight: '90%',
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
  scrollContent: {
    flexGrow: 0,
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
  pickerWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.primaryStart,
  },
  pickerButtonText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  pickerArrow: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  typePickerContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxHeight: 250,
  },
  typePickerScroll: {
    maxHeight: 250,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  typeOptionSelected: {
    backgroundColor: colors.glassBackground,
  },
  typeOptionIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  typeOptionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  typeOptionTextSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primaryStart,
    fontWeight: fontWeight.bold,
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
    marginTop: spacing.md,
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

export default AddItemModal;
