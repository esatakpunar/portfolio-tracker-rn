import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { TextInput } from '../components/TextInput';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';
import { useAppSelector } from '../hooks/useRedux';
import { selectItems, selectPrices } from '../store/portfolioSlice';
import { calculateZakat } from '../utils/zakatUtils';
import { formatCurrency } from '../utils/formatUtils';
import { getZakatDebt, saveZakatDebt } from '../utils/preferenceStorage';
import { hapticFeedback } from '../utils/haptics';

interface ZakatScreenProps {
  visible: boolean;
  onClose: () => void;
}

const ZakatScreen: React.FC<ZakatScreenProps> = ({ visible, onClose }) => {
  const { t, i18n } = useTranslation();
  const items = useAppSelector(selectItems);
  const prices = useAppSelector(selectPrices);
  const [debtInput, setDebtInput] = useState('0');
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
      getZakatDebt().then((d) => setDebtInput(String(d)));
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const debt = useMemo(() => {
    const n = parseFloat(debtInput.replace(',', '.'));
    return isNaN(n) || n < 0 ? 0 : n;
  }, [debtInput]);

  const result = useMemo(
    () => calculateZakat(items, prices, debt),
    [items, prices, debt]
  );

  const saveDebt = async () => {
    await saveZakatDebt(debt);
  };

  const handleClose = () => {
    hapticFeedback.light();
    onClose();
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
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>{t('zakatTitle')}</Text>
              <Text style={styles.subtitle}>{t('zakatSubtitle')}</Text>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.disclaimer}>{t('zakatDisclaimer')}</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('zakatDebt')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={debtInput}
                    onChangeText={setDebtInput}
                    onBlur={saveDebt}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.unit}>₺</Text>
                </View>
              </View>

              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{t('zakatNisab')}</Text>
                  <Text style={styles.resultValue}>
                    {formatCurrency(result.nisabTL, i18n.language)} ₺
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{t('zakatEligible')}</Text>
                  <Text style={styles.resultValue}>
                    {formatCurrency(result.eligibleTL, i18n.language)} ₺
                  </Text>
                </View>
                {result.belowNisab ? (
                  <Text style={styles.resultMuted}>{t('zakatBelowNisab')}</Text>
                ) : (
                  <View style={[styles.resultRow, styles.resultHighlight]}>
                    <Text style={styles.resultLabel}>{t('zakatAmount')}</Text>
                    <Text style={styles.resultAmount}>
                      {formatCurrency(result.zakatTL, i18n.language)} ₺
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
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
    maxHeight: '85%',
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
  },
  scrollContent: {
    maxHeight: 420,
  },
  disclaimer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  unit: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginLeft: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  resultValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  resultHighlight: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  resultAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  resultMuted: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
});

export default ZakatScreen;
