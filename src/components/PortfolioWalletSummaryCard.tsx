import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { PortfolioGoalsByWallet, PortfolioItem, Prices } from '../types';
import { computeGoalProgress } from '../utils/goalUtils';
import { getPortfolioGoalsByWallet } from '../utils/preferenceStorage';
import { normalizeWalletId } from '../utils/walletUtils';
import { formatCurrency } from '../utils/formatUtils';
import { hapticFeedback } from '../utils/haptics';

export interface WalletBreakdownRow {
  id: string;
  label: string;
  totalTL: number;
}

interface PortfolioWalletSummaryCardProps {
  rows: WalletBreakdownRow[];
  allItems: PortfolioItem[];
  prices: Prices;
  onOpenWallet: (walletId: string) => void;
}

const PortfolioWalletSummaryCard: React.FC<PortfolioWalletSummaryCardProps> = ({
  rows,
  allItems,
  prices,
  onOpenWallet,
}) => {
  const { t, i18n } = useTranslation();
  const [goalsByWallet, setGoalsByWallet] = useState<PortfolioGoalsByWallet>({});

  const loadGoals = useCallback(async () => {
    setGoalsByWallet(await getPortfolioGoalsByWallet());
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const goalPctByWallet = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      const goal = goalsByWallet[row.id];
      if (!goal) {
        continue;
      }
      const walletItems = allItems.filter(
        (item) => normalizeWalletId(item.walletId) === row.id
      );
      const progress = computeGoalProgress(goal, walletItems, prices);
      if (progress) {
        map[row.id] = progress.pct;
      }
    }
    return map;
  }, [rows, goalsByWallet, allItems, prices]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('portfolioWalletBreakdownTitle')}</Text>
      {rows.map((row, index) => {
        const goalPct = goalPctByWallet[row.id];
        const hasGoal = goalPct != null;
        return (
          <TouchableOpacity
            key={row.id}
            style={[styles.row, index > 0 && styles.rowBorder]}
            onPress={() => {
              hapticFeedback.selection();
              onOpenWallet(row.id);
            }}
            activeOpacity={0.75}
          >
            <View style={styles.rowMain}>
              <Text style={styles.walletName} numberOfLines={1}>
                {row.label}
              </Text>
              <View style={styles.valueBlock}>
                {hasGoal ? (
                  <Text style={styles.goalPct}>{goalPct.toFixed(0)}%</Text>
                ) : null}
                <Text style={styles.walletValue}>
                  {formatCurrency(row.totalTL, i18n.language)} ₺
                </Text>
              </View>
            </View>
            {hasGoal ? (
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(goalPct, 2)}%` }]} />
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
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
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  walletName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    minWidth: 0,
  },
  valueBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  goalPct: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primaryStart,
  },
  walletValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassBorder,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primaryStart,
    borderRadius: 2,
  },
});

export default PortfolioWalletSummaryCard;
