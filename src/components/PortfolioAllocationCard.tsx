import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { PortfolioItem, Prices } from '../types';
import { computePortfolioAllocation, AllocationCategory } from '../utils/allocationUtils';
import { formatCurrency } from '../utils/formatUtils';

interface PortfolioAllocationCardProps {
  items: PortfolioItem[];
  prices: Prices;
}

const BAR_COLORS: Record<AllocationCategory, string> = {
  gold: colors.warning,
  silver: colors.textSecondary,
  forex: colors.primaryStart,
  tl: colors.success,
};

const PortfolioAllocationCard: React.FC<PortfolioAllocationCardProps> = ({ items, prices }) => {
  const { t, i18n } = useTranslation();
  const result = useMemo(() => computePortfolioAllocation(items, prices), [items, prices]);

  if (!result || result.segments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('allocationTitle')}</Text>
      {result.segments.map((seg) => (
        <View key={seg.category} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.label}>{t(`allocationCategories.${seg.category}`)}</Text>
            <Text style={styles.pct}>{seg.pct.toFixed(0)}%</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(seg.pct, 2)}%`, backgroundColor: BAR_COLORS[seg.category] },
              ]}
            />
          </View>
          <Text style={styles.value}>{formatCurrency(seg.valueTl, i18n.language)} ₺</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  pct: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glassBorder,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  value: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default PortfolioAllocationCard;
