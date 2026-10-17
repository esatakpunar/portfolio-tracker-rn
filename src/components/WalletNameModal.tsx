import React, { useEffect, useState } from 'react';
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
import { hapticFeedback } from '../utils/haptics';
import { SheetConfirmPanel } from './SheetConfirmModal';

export type WalletNameModalMode = 'add' | 'rename';

type WalletModalScreen = 'form' | 'deleteConfirm' | 'deleteWithContentsConfirm';

export interface WalletTransferTarget {
  id: string;
  label: string;
}

interface WalletNameModalProps {
  visible: boolean;
  mode: WalletNameModalMode;
  initialName: string;
  /** Current wallet label — used in move-all confirm copy (rename mode). */
  currentWalletLabel?: string;
  showDelete?: boolean;
  deleteBlocked?: boolean;
  deleteHoldingsCount?: number;
  deleteHistoryCount?: number;
  showTransfer?: boolean;
  transferTargets?: WalletTransferTarget[];
  onClose: () => void;
  onSubmit: (name: string) => void;
  onConfirmDelete?: () => void;
  onConfirmDeleteWithContents?: () => void;
  onMoveAll?: (toWalletId: string) => void;
}

const WalletNameModal: React.FC<WalletNameModalProps> = ({
  visible,
  mode,
  initialName,
  currentWalletLabel = '',
  showDelete = false,
  deleteBlocked = false,
  deleteHoldingsCount = 0,
  deleteHistoryCount = 0,
  showTransfer = false,
  transferTargets = [],
  onClose,
  onSubmit,
  onConfirmDelete,
  onConfirmDeleteWithContents,
  onMoveAll,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(0));
  const [name, setName] = useState(initialName);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [showTransferPicker, setShowTransferPicker] = useState(false);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [screen, setScreen] = useState<WalletModalScreen>('form');

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSelectedTransferId(transferTargets[0]?.id ?? null);
      setShowTransferPicker(false);
      setShowMoveConfirm(false);
      setScreen('form');
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, initialName, slideAnim, transferTargets]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;
  const canMove = showTransfer && selectedTransferId != null && transferTargets.length > 0;

  const selectedTransferLabel =
    transferTargets.find((w) => w.id === selectedTransferId)?.label ?? '';

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    hapticFeedback.success();
    onSubmit(trimmed);
    onClose();
  };

  const handleDismiss = () => {
    if (screen === 'deleteConfirm' || screen === 'deleteWithContentsConfirm') {
      setScreen('form');
      return;
    }
    setShowMoveConfirm(false);
    onClose();
  };

  const confirmMoveAll = () => {
    if (!canMove || !onMoveAll || !selectedTransferId) {
      return;
    }
    hapticFeedback.success();
    onMoveAll(selectedTransferId);
    setShowMoveConfirm(false);
    onClose();
  };

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const title = mode === 'add' ? t('walletsModalTitleAdd') : t('walletsModalTitleRename');
  const subtitle =
    mode === 'add' ? t('walletsModalSubtitleAdd') : t('walletsModalSubtitleRename');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleDismiss}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
            onStartShouldSetResponder={() => true}
          >
            {screen === 'deleteConfirm' ? (
              <SheetConfirmPanel
                title={t('walletsDeleteConfirmTitle')}
                message={t('walletsDeleteConfirmMessage')}
                confirmLabel={t('walletsDelete')}
                variant="danger"
                onCancel={() => setScreen('form')}
                onConfirm={() => onConfirmDelete?.()}
              />
            ) : screen === 'deleteWithContentsConfirm' ? (
              <SheetConfirmPanel
                title={t('walletsDeleteWithContentsConfirmTitle')}
                message={t('walletsDeleteWithContentsConfirmMessage', {
                  wallet: currentWalletLabel,
                  holdings: deleteHoldingsCount,
                  history: deleteHistoryCount,
                })}
                confirmLabel={t('walletsDeleteWithContents')}
                variant="danger"
                onCancel={() => setScreen('form')}
                onConfirm={() => onConfirmDeleteWithContents?.()}
              />
            ) : (
              <>
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('walletsNameLabel')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('walletsNamePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    autoFocus={mode === 'add'}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {showTransfer && transferTargets.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('walletsMoveAllTitle')}</Text>
                  <Text style={styles.helperText}>{t('walletsMoveAllHint')}</Text>
                  <View style={styles.pickerWrapper}>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowTransferPicker(!showTransferPicker)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pickerButtonText} numberOfLines={1}>
                        {selectedTransferLabel}
                      </Text>
                      <Text style={styles.pickerArrow}>{showTransferPicker ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showTransferPicker && (
                      <View style={styles.walletPickerList}>
                        {transferTargets.map((target) => (
                          <TouchableOpacity
                            key={target.id}
                            style={[
                              styles.walletOption,
                              target.id === selectedTransferId && styles.walletOptionSelected,
                            ]}
                            onPress={() => {
                              hapticFeedback.selection();
                              setSelectedTransferId(target.id);
                              setShowTransferPicker(false);
                              setShowMoveConfirm(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.walletOptionText,
                                target.id === selectedTransferId && styles.walletOptionTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {target.label}
                            </Text>
                            {target.id === selectedTransferId && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {!showMoveConfirm ? (
                    <TouchableOpacity
                      style={[styles.secondaryActionBtn, !canMove && styles.secondaryActionBtnDisabled]}
                      onPress={() => {
                        if (!canMove) {
                          return;
                        }
                        hapticFeedback.light();
                        setShowMoveConfirm(true);
                      }}
                      disabled={!canMove}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.secondaryActionBtnText}>{t('walletsMoveAllButton')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inlineConfirm}>
                      <Text style={styles.inlineConfirmTitle}>{t('walletsMoveConfirmTitle')}</Text>
                      <Text style={styles.inlineConfirmMessage}>
                        {t('walletsMoveConfirmMessage', {
                          from: currentWalletLabel,
                          to: selectedTransferLabel,
                        })}
                      </Text>
                      <View style={styles.inlineConfirmActions}>
                        <TouchableOpacity
                          style={[styles.inlineConfirmBtn, styles.inlineConfirmCancel]}
                          onPress={() => setShowMoveConfirm(false)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.inlineConfirmCancelText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.inlineConfirmBtn, styles.inlineConfirmPrimary]}
                          onPress={confirmMoveAll}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.inlineConfirmPrimaryText}>
                            {t('walletsMoveAllButton')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {showDelete && (
                <View style={styles.inputContainer}>
                  {deleteBlocked && (
                    <Text style={styles.helperText}>{t('walletsDeleteNotEmpty')}</Text>
                  )}
                  {!deleteBlocked && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        hapticFeedback.warning();
                        setShowMoveConfirm(false);
                        setScreen('deleteConfirm');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteText}>{t('walletsDelete')}</Text>
                    </TouchableOpacity>
                  )}
                  {deleteBlocked && onConfirmDeleteWithContents != null && (
                    <TouchableOpacity
                      style={styles.deleteWithContentsBtn}
                      onPress={() => {
                        hapticFeedback.warning();
                        setShowMoveConfirm(false);
                        setScreen('deleteWithContentsConfirm');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteWithContentsText}>
                        {t('walletsDeleteWithContents')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, !canSave && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
              </>
            )}
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
    marginBottom: spacing.lg,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollContentContainer: {
    paddingBottom: spacing.md,
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
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  input: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    fontWeight: fontWeight.semibold,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
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
  secondaryActionBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryStart,
    backgroundColor: colors.glassBackground,
  },
  secondaryActionBtnDisabled: {
    opacity: 0.45,
  },
  secondaryActionBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primaryStart,
  },
  deleteBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deleteBtnDisabled: {
    opacity: 0.45,
    borderColor: colors.textMuted,
  },
  deleteText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  deleteWithContentsBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  deleteWithContentsText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.error,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
  saveButton: {
    backgroundColor: colors.primaryStart,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default WalletNameModal;
