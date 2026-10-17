import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { formatCurrency, formatDate } from '../utils/formatUtils';
import {
  dateToTransactionISO,
  getMarketUnitPrice,
  parseDecimalInput,
} from '../utils/lotEntryUtils';

export interface AddItemPayload {
  description?: string;
  priceAtTime?: number | null;
  unitBuyPrice?: number | null;
  useExplicitTotalCost?: boolean;
  transactionDate?: string;
  walletId?: string;
}

export interface AddItemWalletOption {
  id: string;
  label: string;
}

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: AssetType, amount: number, options?: AddItemPayload) => void;
  walletOptions?: AddItemWalletOption[];
  defaultWalletId?: string;
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

const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onAdd,
  walletOptions = [],
  defaultWalletId = '',
}) => {
  const { t, i18n } = useTranslation();
  const prices = useAppSelector(selectPrices);
  const [selectedType, setSelectedType] = useState<AssetType>('22_ayar');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [unitBuyPrice, setUnitBuyPrice] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [totalCostDirty, setTotalCostDirty] = useState(false);
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState(defaultWalletId);
  const [slideAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputWrapperRef = useRef<any>(null);
  
  const amountValidation = useMemo(() => validateAmount(amount), [amount]);
  const isAmountValid = amountValidation.isValid;
  
  const marketUnitPrice = useMemo(
    () => getMarketUnitPrice(selectedType, prices),
    [selectedType, prices]
  );

  const syncCostsFromUnit = (unitStr: string, amountValue: number | undefined) => {
    const unit = parseDecimalInput(unitStr);
    if (unit != null && amountValue != null && amountValue > 0) {
      const total = selectedType === 'tl' ? amountValue : unit * amountValue;
      setTotalCost(total.toFixed(2));
      setTotalCostDirty(false);
    }
  };

  useEffect(() => {
    if (totalCostDirty) {
      return;
    }
    if (marketUnitPrice != null) {
      setUnitBuyPrice(selectedType === 'tl' ? '1' : marketUnitPrice.toFixed(2));
    }
    if (amountValidation.isValid && amountValidation.value) {
      syncCostsFromUnit(
        selectedType === 'tl' ? '1' : (marketUnitPrice?.toFixed(2) ?? unitBuyPrice),
        amountValidation.value
      );
    }
  }, [amount, selectedType, marketUnitPrice, amountValidation.isValid, amountValidation.value]);

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
      setUnitBuyPrice('');
      setTotalCost('');
      setTotalCostDirty(false);
      setTransactionDate(new Date());
      setShowDatePicker(false);
      setShowTypePicker(false);
      setShowWalletPicker(false);
      setSelectedWalletId(defaultWalletId);
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, defaultWalletId]);

  const handleAdd = () => {
    const validation = validateAmount(amount);
    if (validation.isValid && validation.value !== undefined) {
      const parsedUnit = parseDecimalInput(unitBuyPrice);
      const parsedTotal = parseDecimalInput(totalCost);

      onAdd(selectedType, validation.value, {
        description: description || undefined,
        unitBuyPrice: parsedUnit,
        priceAtTime: parsedTotal,
        useExplicitTotalCost: totalCostDirty,
        transactionDate: dateToTransactionISO(transactionDate),
        walletId: selectedWalletId || defaultWalletId || undefined,
      });
      setAmount('');
      setDescription('');
      setUnitBuyPrice('');
      setTotalCost('');
      setTotalCostDirty(false);
      setSelectedType('22_ayar');
      setShowTypePicker(false);
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setUnitBuyPrice('');
    setTotalCost('');
    setTotalCostDirty(false);
    setSelectedType('22_ayar');
    setShowTypePicker(false);
    onClose();
  };

  const handleUnitChange = (text: string) => {
    setUnitBuyPrice(text);
    setTotalCostDirty(false);
    if (amountValidation.isValid && amountValidation.value) {
      syncCostsFromUnit(text, amountValidation.value);
    }
  };

  const handleTotalChange = (text: string) => {
    setTotalCost(text);
    setTotalCostDirty(true);
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
              ref={scrollViewRef}
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
                    <View style={styles.pickerButtonContent}>
                      <Text style={styles.pickerIconText}>{getAssetIcon(selectedType)}</Text>
                      <Text style={styles.pickerButtonText}>{t(`assetTypes.${selectedType}`)}</Text>
                    </View>
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
                            <Text style={[
                              styles.typeOptionIcon,
                              selectedType === type && styles.typeOptionIconSelected
                            ]}>
                              {getAssetIcon(type)}
                            </Text>
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

              {walletOptions.length > 1 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('assetWalletLabel')}</Text>
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowWalletPicker(!showWalletPicker)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerButtonText} numberOfLines={1}>
                        {walletOptions.find((w) => w.id === selectedWalletId)?.label ?? ''}
                      </Text>
                      <Text style={styles.pickerArrow}>{showWalletPicker ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showWalletPicker && (
                      <View style={styles.typePickerContainer}>
                        {walletOptions.map((wallet) => (
                          <TouchableOpacity
                            key={wallet.id}
                            style={[
                              styles.typeOption,
                              wallet.id === selectedWalletId && styles.typeOptionSelected,
                            ]}
                            onPress={() => {
                              hapticFeedback.selection();
                              setSelectedWalletId(wallet.id);
                              setShowWalletPicker(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.typeOptionText,
                                wallet.id === selectedWalletId && styles.typeOptionTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {wallet.label}
                            </Text>
                            {wallet.id === selectedWalletId && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

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
                <Text style={styles.label}>{t('transactionDate')}</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDate(transactionDate, i18n.language, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={transactionDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(_, selected) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selected) {
                        setTransactionDate(selected);
                      }
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <TouchableOpacity
                    style={styles.dateDoneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.dateDoneText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedType !== 'tl' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    {t('unitBuyPrice')} <Text style={styles.optionalText}>{t('optional')}</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={unitBuyPrice}
                      onChangeText={handleUnitChange}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.unit}>₺/{getAssetUnit(selectedType, t)}</Text>
                  </View>
                  {marketUnitPrice != null && (
                    <Text style={styles.helperText}>
                      {t('currentMarketPrice')}: {formatCurrency(marketUnitPrice, i18n.language)} ₺
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {t('totalCost')} <Text style={styles.optionalText}>{t('optional')}</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={totalCost}
                    onChangeText={handleTotalChange}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unit}>₺</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {t('description')}{' '}
                  <Text style={styles.optionalText}>{t('optional')}</Text>
                </Text>
                <View ref={descriptionInputWrapperRef}>
                  <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('descriptionPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    onFocus={() => {
                      // Scroll to input when description input is focused
                      setTimeout(() => {
                        if (descriptionInputWrapperRef.current && scrollViewRef.current) {
                          descriptionInputWrapperRef.current.measureLayout(
                            scrollViewRef.current as any,
                            (x: number, y: number) => {
                              scrollViewRef.current?.scrollTo({
                                y: y - 150, // Add some padding above
                                animated: true,
                              });
                            },
                            () => {
                              // Fallback: scroll to end
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }
                          );
                        } else {
                          // Fallback: scroll to end
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }
                      }, 400);
                    }}
                  />
                </View>
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
    borderColor: colors.textMuted,
  },
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerIconText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
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
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  typeOptionIconSelected: {
    color: colors.primaryStart,
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
    borderColor: colors.textMuted,
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
    borderWidth: 2,
    borderColor: colors.textMuted,
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
  dateButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBackground,
  },
  dateButtonText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  dateDoneButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dateDoneText: {
    color: colors.primaryStart,
    fontWeight: fontWeight.semibold,
  },
});

export default AddItemModal;
