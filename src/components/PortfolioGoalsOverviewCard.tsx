import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { PortfolioGoalsByWallet, PortfolioItem, Prices, Wallet } from '../types';
import { computeGoalProgress } from '../utils/goalUtils';
import { getGoalProgressLabel, getGoalTitleText } from '../utils/goalDisplayUtils';
import { getPortfolioGoalsByWallet } from '../utils/preferenceStorage';
import { normalizeWalletId } from '../utils/walletUtils';
import { hapticFeedback } from '../utils/haptics';

interface PortfolioGoalsOverviewCardProps {
  wallets: Wallet[];
  allItems: PortfolioItem[];
  prices: Prices;
  walletLabel: (wallet: Wallet) => string;
  onOpenWallet: (walletId: string) => void;
}

interface GoalRow {
  walletId: string;
  walletLabel: string;
  goalTitle: string;
  progressLabel: string;
  pct: number;
}

const PortfolioGoalsOverviewCard: React.FC<PortfolioGoalsOverviewCardProps> = ({
  wallets,
  allItems,
  prices,
  walletLabel,
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

  const rows = useMemo((): GoalRow[] => {
    const result: GoalRow[] = [];
    for (const wallet of wallets) {
      const goal = goalsByWallet[wallet.id];
      if (!goal) {
        continue;
      }
      const walletItems = allItems.filter(
        (item) => normalizeWalletId(item.walletId) === wallet.id
      );
      const progress = computeGoalProgress(goal, walletItems, prices);
      if (!progress) {
        continue;
      }
      result.push({
        walletId: wallet.id,
        walletLabel: walletLabel(wallet),
        goalTitle: getGoalTitleText(goal, t),
        progressLabel: getGoalProgressLabel(goal, progress, i18n.language, t),
        pct: progress.pct,
      });
    }
    return result;
  }, [wallets, goalsByWallet, allItems, prices, walletLabel, t, i18n.language]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('goalOverviewTitle')}</Text>
      {rows.map((row, index) => (
        <TouchableOpacity
          key={row.walletId}
          style={[styles.row, index > 0 && styles.rowBorder]}
          onPress={() => {
            hapticFeedback.selection();
            onOpenWallet(row.walletId);
          }}
          activeOpacity={0.75}
        >
          <View style={styles.rowHeader}>
            <Text style={styles.walletName} numberOfLines={1}>
              {row.walletLabel}
            </Text>
            <Text style={styles.pct}>{row.pct.toFixed(0)}%</Text>
          </View>
          <Text style={styles.goalTitle} numberOfLines={1}>
            {row.goalTitle}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(row.pct, 2)}%` }]} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {row.progressLabel}
          </Text>
        </TouchableOpacity>
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
    marginTop: spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  walletName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  pct: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  goalTitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glassBorder,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primaryStart,
    borderRadius: 3,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default PortfolioGoalsOverviewCard;
