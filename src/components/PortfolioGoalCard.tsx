import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from './Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { PortfolioGoal, PortfolioItem, Prices } from '../types';
import { computeGoalProgress } from '../utils/goalUtils';
import { formatCurrency } from '../utils/formatUtils';
import { getAssetUnit } from '../utils/assetUtils';
import {
  clearPortfolioGoal,
  getPortfolioGoal,
  savePortfolioGoal,
} from '../utils/preferenceStorage';
import PortfolioGoalModal from './PortfolioGoalModal';
import { hapticFeedback } from '../utils/haptics';

interface PortfolioGoalCardProps {
  items: PortfolioItem[];
  prices: Prices;
}

const PortfolioGoalCard: React.FC<PortfolioGoalCardProps> = ({ items, prices }) => {
  const { t, i18n } = useTranslation();
  const [goal, setGoal] = useState<PortfolioGoal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadGoal = useCallback(async () => {
    setGoal(await getPortfolioGoal());
  }, []);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const progress = useMemo(() => {
    if (!goal) {
      return null;
    }
    return computeGoalProgress(goal, items, prices);
  }, [goal, items, prices]);

  const openModal = () => {
    hapticFeedback.light();
    setModalVisible(true);
  };

  const handleSave = async (next: PortfolioGoal) => {
    await savePortfolioGoal(next);
    setGoal(next);
  };

  const handleClear = async () => {
    await clearPortfolioGoal();
    setGoal(null);
    setModalVisible(false);
    hapticFeedback.success();
  };

  const progressLabel = useMemo(() => {
    if (!goal || !progress) {
      return '';
    }
    const prefix = progress.mode === 'increment' ? '+' : '';
    if (goal.kind === 'portfolio_value_tl') {
      return `${prefix}${formatCurrency(progress.progressValue, i18n.language)} / ${prefix}${formatCurrency(progress.targetValue, i18n.language)} ₺`;
    }
    const unit = goal.assetType ? getAssetUnit(goal.assetType, t) : '';
    return `${prefix}${progress.progressValue.toFixed(2)} / ${prefix}${progress.targetValue} ${unit}`;
  }, [goal, progress, i18n.language, t]);

  const titleText = useMemo(() => {
    if (!goal) {
      return t('goalSetCta');
    }
    const increment = (goal.mode ?? 'absolute') === 'increment';
    if (goal.kind === 'portfolio_value_tl') {
      return increment ? t('goalTitleIncrementPortfolioTl') : t('goalTitlePortfolioTl');
    }
    const asset = t(`assetTypes.${goal.assetType}`);
    return increment ? t('goalTitleIncrementAsset', { asset }) : t('goalTitleAsset', { asset });
  }, [goal, t]);

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={openModal} activeOpacity={0.85}>
        <View style={styles.header}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.edit}>{goal ? t('edit') : t('add')}</Text>
        </View>
        {goal && progress ? (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(progress.pct, 2)}%` }]} />
            </View>
            <Text style={styles.meta}>{progressLabel}</Text>
            <Text style={styles.pct}>{progress.pct.toFixed(0)}%</Text>
          </>
        ) : (
          <Text style={styles.hint}>{t('goalHint')}</Text>
        )}
      </TouchableOpacity>

      <PortfolioGoalModal
        visible={modalVisible}
        initialGoal={goal}
        items={items}
        prices={prices}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onClear={handleClear}
      />
    </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  edit: {
    fontSize: fontSize.sm,
    color: colors.primaryStart,
    fontWeight: fontWeight.medium,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.glassBorder,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primaryStart,
    borderRadius: 4,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  pct: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});

export default PortfolioGoalCard;
