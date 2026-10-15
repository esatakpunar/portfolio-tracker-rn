import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useAppSelector } from '../hooks/useRedux';
import { selectItems } from '../store/portfolioSlice';
import { comparePriceSources } from '../services/priceCompareService';
import { formatCurrency } from '../utils/formatUtils';
import { hapticFeedback } from '../utils/haptics';

const PriceSourceCompareCard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const items = useAppSelector(selectItems);
  const [loading, setLoading] = useState(false);
  const [truncgilTotal, setTruncgilTotal] = useState<number | null>(null);
  const [investingTotal, setInvestingTotal] = useState<number | null>(null);
  const [diff, setDiff] = useState<number | null>(null);

  const runCompare = async () => {
    if (loading || items.length === 0) {
      return;
    }
    setLoading(true);
    hapticFeedback.light();
    try {
      const result = await comparePriceSources(items);
      setTruncgilTotal(result.truncgilTotal);
      setInvestingTotal(result.investingTotal);
      setDiff(result.diff);
      hapticFeedback.success();
    } catch {
      hapticFeedback.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.button} onPress={runCompare} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>{t('comparePriceSources')}</Text>
        )}
      </TouchableOpacity>
      {truncgilTotal != null && (
        <Text style={styles.line}>
          Truncgil: {formatCurrency(truncgilTotal, i18n.language)} ₺
        </Text>
      )}
      {investingTotal != null && (
        <Text style={styles.line}>
          Investing: {formatCurrency(investingTotal, i18n.language)} ₺
        </Text>
      )}
      {diff != null && (
        <Text style={styles.diff}>
          {t('priceSourceDifference')}: {diff >= 0 ? '+' : '−'}
          {formatCurrency(Math.abs(diff), i18n.language)} ₺
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.sm,
  },
  button: {
    backgroundColor: colors.primaryStart,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  line: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  diff: {
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
});

export default PriceSourceCompareCard;
