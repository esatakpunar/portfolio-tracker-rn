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
import { AssetType, PortfolioGoal, PortfolioGoalKind, PortfolioGoalMode, PortfolioItem, Prices } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { parseDecimalInput } from '../utils/lotEntryUtils';
import { getAssetIcon } from '../utils/assetUtils';
import { computeBaselineForGoal } from '../utils/goalUtils';

const ASSET_TYPES: AssetType[] = [
  '22_ayar',
  '24_ayar',
  'ceyrek',
  'tam',
  'usd',
  'eur',
  'tl',
  'gumus',
];

interface PortfolioGoalModalProps {
  visible: boolean;
  initialGoal: PortfolioGoal | null;
  items: PortfolioItem[];
  prices: Prices;
  onClose: () => void;
  onSave: (goal: PortfolioGoal) => void;
  onClear: () => void;
}

const PortfolioGoalModal: React.FC<PortfolioGoalModalProps> = ({
  visible,
  initialGoal,
  items,
  prices,
  onClose,
  onSave,
  onClear,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(new Animated.Value(0));
  const [kind, setKind] = useState<PortfolioGoalKind>('asset_amount');
  const [mode, setMode] = useState<PortfolioGoalMode>('increment');
  const [assetType, setAssetType] = useState<AssetType>('24_ayar');
  const [targetInput, setTargetInput] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      if (initialGoal) {
        setKind(initialGoal.kind);
        setMode(initialGoal.mode ?? 'absolute');
        setAssetType(initialGoal.assetType ?? '24_ayar');
        setTargetInput(String(initialGoal.target));
      } else {
        setKind('asset_amount');
        setMode('increment');
        setAssetType('24_ayar');
        setTargetInput('');
      }
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, initialGoal]);

  const handleSave = () => {
    const target = parseDecimalInput(targetInput);
    if (target == null || target <= 0) {
      return;
    }
    hapticFeedback.success();
    const base = {
      kind,
      target,
      mode,
      ...(kind === 'asset_amount' ? { assetType } : {}),
    } as Omit<PortfolioGoal, 'baseline'>;

    if (mode === 'increment') {
      const baseline =
        initialGoal?.mode === 'increment' &&
        initialGoal.baseline != null &&
        initialGoal.kind === kind &&
        initialGoal.assetType === (kind === 'asset_amount' ? assetType : undefined)
          ? initialGoal.baseline
          : computeBaselineForGoal(base, items, prices);
      onSave({ ...base, baseline });
    } else {
      onSave(base as PortfolioGoal);
    }
    onClose();
  };

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
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>{t('goalModalTitle')}</Text>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>{t('goalKindLabel')}</Text>
              <View style={styles.kindRow}>
                <TouchableOpacity
                  style={[styles.kindChip, kind === 'asset_amount' && styles.kindChipActive]}
                  onPress={() => setKind('asset_amount')}
                >
                  <Text style={[styles.kindText, kind === 'asset_amount' && styles.kindTextActive]}>
                    {t('goalKindAmount')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.kindChip, kind === 'portfolio_value_tl' && styles.kindChipActive]}
                  onPress={() => setKind('portfolio_value_tl')}
                >
                  <Text
                    style={[styles.kindText, kind === 'portfolio_value_tl' && styles.kindTextActive]}
                  >
                    {t('goalKindValueTl')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>{t('goalModeLabel')}</Text>
              <View style={styles.kindRow}>
                <TouchableOpacity
                  style={[styles.kindChip, mode === 'increment' && styles.kindChipActive]}
                  onPress={() => setMode('increment')}
                >
                  <Text style={[styles.kindText, mode === 'increment' && styles.kindTextActive]}>
                    {t('goalModeIncrement')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.kindChip, mode === 'absolute' && styles.kindChipActive]}
                  onPress={() => setMode('absolute')}
                >
                  <Text style={[styles.kindText, mode === 'absolute' && styles.kindTextActive]}>
                    {t('goalModeAbsolute')}
                  </Text>
                </TouchableOpacity>
              </View>
              {mode === 'increment' ? (
                <Text style={styles.modeHint}>{t('goalModeIncrementHint')}</Text>
              ) : null}

              {kind === 'asset_amount' && (
                <>
                  <Text style={styles.label}>{t('assetType')}</Text>
                  <View style={styles.assetGrid}>
                    {ASSET_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.assetChip, assetType === type && styles.assetChipActive]}
                        onPress={() => setAssetType(type)}
                      >
                        <Text style={styles.assetIcon}>{getAssetIcon(type)}</Text>
                        <Text
                          style={[styles.assetLabel, assetType === type && styles.assetLabelActive]}
                          numberOfLines={1}
                        >
                          {t(`assetTypes.${type}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>
                {mode === 'increment' ? t('goalTargetLabelIncrement') : t('goalTargetLabelAbsolute')}
              </Text>
              <TextInput
                style={styles.input}
                value={targetInput}
                onChangeText={setTargetInput}
                keyboardType="decimal-pad"
                placeholder={kind === 'portfolio_value_tl' ? '500000' : '100'}
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>

            <View style={styles.actions}>
              {initialGoal ? (
                <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
                  <Text style={styles.clearText}>{t('goalClear')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>{t('save')}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '85%',
    ...shadows.large,
  },
  header: { alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.md },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  kindRow: { flexDirection: 'row', gap: spacing.sm },
  kindChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  kindChipActive: { borderColor: colors.primaryStart, backgroundColor: colors.primaryStart + '15' },
  kindText: { color: colors.textSecondary, fontSize: fontSize.sm },
  kindTextActive: { color: colors.textPrimary, fontWeight: fontWeight.semibold },
  modeHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  assetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  assetChip: {
    width: '47%',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assetChipActive: { borderColor: colors.primaryStart },
  assetIcon: { fontSize: fontSize.lg },
  assetLabel: { flex: 1, fontSize: fontSize.xs, color: colors.textSecondary },
  assetLabelActive: { color: colors.textPrimary, fontWeight: fontWeight.medium },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  clearBtn: { padding: spacing.md },
  clearText: { color: colors.error, fontWeight: fontWeight.medium },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  cancelText: { color: colors.textPrimary },
  saveBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryStart,
    alignItems: 'center',
  },
  saveText: { color: colors.textPrimary, fontWeight: fontWeight.semibold },
});

export default PortfolioGoalModal;
