import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { formatCurrency } from '../utils/formatUtils';
import { AssetProfitLossResult } from '../utils/portfolioUtils';

interface PortfolioProfitSummaryProps {
  data: AssetProfitLossResult;
}

const PortfolioProfitSummary: React.FC<PortfolioProfitSummaryProps> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const positive = data.profitAmount >= 0;
  const color = positive ? colors.success : colors.error;
  const sign = positive ? '+' : '−';

  const costStr = formatCurrency(data.costTL, i18n.language);
  const currentStr = formatCurrency(data.currentTL, i18n.language);
  const metaLine = `${t('profitLossMetaCost')}: ${costStr} ₺ · ${t('profitLossMetaCurrent')}: ${currentStr} ₺`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{t('totalProfitLoss')}</Text>
        <Text style={[styles.profitValue, { color }]}>
          {sign}
          {formatCurrency(Math.abs(data.profitAmount), i18n.language)} ₺ ({sign}
          {Math.abs(data.profitPct).toFixed(1)}%)
        </Text>
      </View>
      <Text
        style={styles.meta}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {metaLine}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flexShrink: 0,
  },
  profitValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: 'right',
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default PortfolioProfitSummary;
