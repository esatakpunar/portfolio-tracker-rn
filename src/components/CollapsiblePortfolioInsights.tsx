import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { PortfolioItem, Prices } from '../types';
import { AssetProfitLossResult } from '../utils/portfolioUtils';
import { formatCurrency } from '../utils/formatUtils';
import PortfolioProfitSummary from './PortfolioProfitSummary';
import PortfolioAllocationCard from './PortfolioAllocationCard';
import { computePortfolioAllocation } from '../utils/allocationUtils';
import { hapticFeedback } from '../utils/haptics';

interface CollapsiblePortfolioInsightsProps {
  profit: AssetProfitLossResult | null;
  items: PortfolioItem[];
  prices: Prices;
}

const CollapsiblePortfolioInsights: React.FC<CollapsiblePortfolioInsightsProps> = ({
  profit,
  items,
  prices,
}) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const allocation = useMemo(
    () => computePortfolioAllocation(items, prices),
    [items, prices]
  );
  const hasAllocation = allocation != null && allocation.segments.length > 0;
  const hasProfit = profit != null;

  const collapsedHint = useMemo(() => {
    if (hasProfit && profit) {
      const positive = profit.profitAmount >= 0;
      const sign = positive ? '+' : '−';
      return `${sign}${formatCurrency(Math.abs(profit.profitAmount), i18n.language)} ₺ (${sign}${Math.abs(profit.profitPct).toFixed(1)}%)`;
    }
    if (hasAllocation && allocation) {
      const top = allocation.segments[0];
      return `${t(`allocationCategories.${top.category}`)} ${top.pct.toFixed(0)}%`;
    }
    return '';
  }, [hasProfit, profit, hasAllocation, allocation, i18n.language, t]);

  if (!hasProfit && !hasAllocation) {
    return null;
  }

  const toggle = () => {
    hapticFeedback.selection();
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('portfolioInsightsTitle')}</Text>
          {!expanded && collapsedHint.length > 0 ? (
            <Text style={styles.headerHint} numberOfLines={1}>
              {collapsedHint}
            </Text>
          ) : null}
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.body}>
          {hasProfit && profit ? <PortfolioProfitSummary data={profit} /> : null}
          {hasAllocation ? <PortfolioAllocationCard items={items} prices={prices} /> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  header: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    gap: 0,
  },
});

export default CollapsiblePortfolioInsights;
