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
import { validateAmount } from '../utils/validationUtils';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import { getAmountPresets } from '../utils/amountPresets';
import { AssetType } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { useAppSelector } from '../hooks/useRedux';
import { selectPrices, selectHistory } from '../store/portfolioSlice';
import { calculateAverageCost } from '../utils/portfolioUtils';
import { normalizeWalletId } from '../utils/walletUtils';
import { getAssetUnit } from '../utils/assetUtils';
import {
  dateToTransactionISO,
  getMarketUnitPrice,
  parseDecimalInput,
} from '../utils/lotEntryUtils';
import { AddItemPayload } from './AddItemModal';

export interface QuickAddWalletOption {
  id: string;
  label: string;
}

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number, options?: AddItemPayload) => void;
  assetType: AssetType;
  currentAmount: number;
  walletOptions?: QuickAddWalletOption[];
  editingWalletId?: string;
  onEditingWalletChange?: (walletId: string) => void;
  onMoveAssetWallet?: (toWalletId: string) => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  onClose,
  onAdd,
  assetType,
  currentAmount,
  walletOptions = [],
  editingWalletId = '',
  onEditingWalletChange,
  onMoveAssetWallet,
}) => {
  const { t, i18n } = useTranslation();
  const prices = useAppSelector(selectPrices);
  const history = useAppSelector(selectHistory);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [unitBuyPrice, setUnitBuyPrice] = useState('');
  const [entryTotalCost, setEntryTotalCost] = useState('');
  const [totalCostDirty, setTotalCostDirty] = useState(false);
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);
  const descriptionInputWrapperRef = useRef<any>(null);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showMoveTargetPicker, setShowMoveTargetPicker] = useState(false);
  const [pendingMoveToWalletId, setPendingMoveToWalletId] = useState<string | null>(null);

  const showWalletDropdown = walletOptions.length > 1;

  const moveTargetOptions = useMemo(
    () => walletOptions.filter((w) => w.id !== editingWalletId),
    [walletOptions, editingWalletId]
  );

  const [moveTargetId, setMoveTargetId] = useState<string>(
    () => moveTargetOptions[0]?.id ?? ''
  );

  const selectedWalletLabel =
    walletOptions.find((w) => w.id === editingWalletId)?.label ?? '';

  const fromWalletLabel =
    walletOptions.find((w) => w.id === editingWalletId)?.label ?? '';
  const pendingWalletLabel =
    pendingMoveToWalletId != null
      ? walletOptions.find((w) => w.id === pendingMoveToWalletId)?.label ?? ''
      : '';

  const showMoveSection =
    currentAmount > 0 && moveTargetOptions.length > 0 && onMoveAssetWallet != null;

  useEffect(() => {
    if (visible) {
      setShowWalletPicker(false);
      setShowMoveTargetPicker(false);
      setPendingMoveToWalletId(null);
      setMoveTargetId(moveTargetOptions[0]?.id ?? '');
    }
  }, [visible, editingWalletId, moveTargetOptions]);

  const handleWalletSelect = (walletId: string) => {
    setShowWalletPicker(false);
    hapticFeedback.selection();
    if (walletId !== editingWalletId) {
      onEditingWalletChange?.(walletId);
    }
  };

  const cancelPendingMove = () => {
    setPendingMoveToWalletId(null);
  };

  const startMoveConfirm = () => {
    if (!moveTargetId || moveTargetId === editingWalletId) {
      return;
    }
    hapticFeedback.light();
    setPendingMoveToWalletId(moveTargetId);
  };

  const confirmPendingMove = () => {
    if (!pendingMoveToWalletId) {
      return;
    }
    hapticFeedback.success();
    onMoveAssetWallet?.(pendingMoveToWalletId);
  };

  // Calculate average cost for current asset
  const walletHistory = useMemo(
    () =>
      history.filter(
        (entry) => normalizeWalletId(entry.item.walletId) === normalizeWalletId(editingWalletId)
      ),
    [history, editingWalletId]
  );

  const averageCost = useMemo(() => {
    if (currentAmount <= 0) {
      return null;
    }
    return calculateAverageCost(assetType, walletHistory, currentAmount);
  }, [assetType, walletHistory, currentAmount]);
  
  // Calculate total cost
  const holdingCostTL = useMemo(() => {
    if (averageCost == null || currentAmount <= 0) {
      return null;
    }
    return currentAmount * averageCost;
  }, [averageCost, currentAmount]);
  
  const amountValidation = useMemo(() => validateAmount(amount), [amount]);
  const isAmountValid = amountValidation.isValid;
  
  const marketUnitPrice = useMemo(
    () => getMarketUnitPrice(assetType, prices),
    [assetType, prices]
  );

  const syncCostsFromUnit = (unitStr: string, amountValue: number | undefined) => {
    const unit = parseDecimalInput(unitStr);
    if (unit != null && amountValue != null && amountValue > 0) {
      const total = assetType === 'tl' ? amountValue : unit * amountValue;
      setEntryTotalCost(total.toFixed(2));
      setTotalCostDirty(false);
    }
  };

  useEffect(() => {
    if (totalCostDirty) {
      return;
    }
    if (marketUnitPrice != null) {
      setUnitBuyPrice(assetType === 'tl' ? '1' : marketUnitPrice.toFixed(2));
    }
    if (amountValidation.isValid && amountValidation.value) {
      syncCostsFromUnit(
        assetType === 'tl' ? '1' : (marketUnitPrice?.toFixed(2) ?? unitBuyPrice),
        amountValidation.value
      );
    }
  }, [amount, assetType, marketUnitPrice, amountValidation.isValid, amountValidation.value]);

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
      onAdd(validation.value, {
        description: description || undefined,
        unitBuyPrice: parseDecimalInput(unitBuyPrice),
        priceAtTime: parseDecimalInput(entryTotalCost),
        useExplicitTotalCost: totalCostDirty,
        transactionDate: dateToTransactionISO(transactionDate),
      });
      setAmount('');
      setDescription('');
      setUnitBuyPrice('');
      setEntryTotalCost('');
      setTotalCostDirty(false);
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setUnitBuyPrice('');
    setEntryTotalCost('');
    setTotalCostDirty(false);
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
    setEntryTotalCost(text);
    setTotalCostDirty(true);
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
              {holdingCostTL != null && (
                <Text style={styles.costText}>
                  {t('averageCost')}: {formatCurrency(holdingCostTL, i18n.language)} ₺
                </Text>
              )}
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {showWalletDropdown && (
                <View style={[styles.inputContainer, styles.walletPickerContainer]}>
                  <Text style={styles.label}>{t('assetWalletLabel')}</Text>
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowWalletPicker(!showWalletPicker)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerButtonText} numberOfLines={1}>
                        {selectedWalletLabel}
                      </Text>
                      <Text style={styles.pickerArrow}>{showWalletPicker ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showWalletPicker && (
                      <View style={styles.walletPickerList}>
                        {walletOptions.map((wallet) => (
                          <TouchableOpacity
                            key={wallet.id}
                            style={[
                              styles.walletOption,
                              wallet.id === editingWalletId && styles.walletOptionSelected,
                            ]}
                            onPress={() => handleWalletSelect(wallet.id)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.walletOptionText,
                                wallet.id === editingWalletId && styles.walletOptionTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {wallet.label}
                            </Text>
                            {wallet.id === editingWalletId && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  {showMoveSection && pendingMoveToWalletId == null && (
                    <View style={styles.moveSection}>
                      <Text style={styles.moveSectionTitle}>{t('assetMoveToWalletTitle')}</Text>
                      <View style={styles.pickerWrapper}>
                        <TouchableOpacity
                          style={styles.pickerButton}
                          onPress={() => setShowMoveTargetPicker(!showMoveTargetPicker)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.pickerButtonText} numberOfLines={1}>
                            {moveTargetOptions.find((w) => w.id === moveTargetId)?.label ?? ''}
                          </Text>
                          <Text style={styles.pickerArrow}>
                            {showMoveTargetPicker ? '▲' : '▼'}
                          </Text>
                        </TouchableOpacity>
                        {showMoveTargetPicker && (
                          <View style={styles.walletPickerList}>
                            {moveTargetOptions.map((wallet) => (
                              <TouchableOpacity
                                key={wallet.id}
                                style={[
                                  styles.walletOption,
                                  wallet.id === moveTargetId && styles.walletOptionSelected,
                                ]}
                                onPress={() => {
                                  hapticFeedback.selection();
                                  setMoveTargetId(wallet.id);
                                  setShowMoveTargetPicker(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.walletOptionText,
                                    wallet.id === moveTargetId && styles.walletOptionTextSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {wallet.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.moveActionBtn}
                        onPress={startMoveConfirm}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.moveActionBtnText}>{t('assetMoveToWalletButton')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {pendingMoveToWalletId != null && (
                    <View style={styles.inlineConfirm}>
                      <Text style={styles.inlineConfirmTitle}>{t('assetMoveConfirmTitle')}</Text>
                      <Text style={styles.inlineConfirmMessage}>
                        {t('assetMoveConfirmMessage', {
                          asset: t(`assetTypes.${assetType}`),
                          from: fromWalletLabel,
                          to: pendingWalletLabel,
                        })}
                      </Text>
                      <View style={styles.inlineConfirmActions}>
                        <TouchableOpacity
                          style={[styles.inlineConfirmBtn, styles.inlineConfirmCancel]}
                          onPress={cancelPendingMove}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.inlineConfirmCancelText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.inlineConfirmBtn, styles.inlineConfirmPrimary]}
                          onPress={confirmPendingMove}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.inlineConfirmPrimaryText}>
                            {t('assetMoveToWalletButton')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

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
            </View>

            {assetType !== 'tl' && (
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
                  <Text style={styles.unit}>₺/{getAssetUnit(assetType, t)}</Text>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t('totalCost')} <Text style={styles.optionalText}>{t('optional')}</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={entryTotalCost}
                  onChangeText={handleTotalChange}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unit}>₺</Text>
              </View>
              {marketUnitPrice != null && assetType !== 'tl' && (
                <Text style={styles.helperText}>
                  {t('currentMarketPrice')}: {formatCurrency(marketUnitPrice, i18n.language)} ₺
                </Text>
              )}
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
  scrollContentContainer: {
    paddingBottom: spacing.xl,
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
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  costText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  walletPickerContainer: {
    zIndex: 10,
  },
  pickerWrapper: {
    position: 'relative',
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
  pickerButtonText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  pickerArrow: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  walletPickerList: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  walletOptionSelected: {
    backgroundColor: colors.glassBackground,
  },
  walletOptionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  walletOptionTextSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  checkmark: {
    fontSize: fontSize.base,
    color: colors.primaryStart,
    fontWeight: fontWeight.bold,
  },
  inlineConfirm: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  inlineConfirmTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inlineConfirmMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  inlineConfirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineConfirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  inlineConfirmCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  inlineConfirmCancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  inlineConfirmPrimary: {
    backgroundColor: colors.primaryStart,
  },
  inlineConfirmPrimaryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  moveSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  moveSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  moveActionBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryStart,
  },
  moveActionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryStart,
  },
});

export default QuickAddModal;
