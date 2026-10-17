import { TFunction } from 'i18next';
import { PortfolioGoal } from '../types';
import { GoalProgress } from './goalUtils';
import { formatCurrency } from './formatUtils';
import { getAssetUnit } from './assetUtils';

export function getGoalTitleText(goal: PortfolioGoal | null, t: TFunction): string {
  if (!goal) {
    return t('goalSetCta');
  }
  const increment = (goal.mode ?? 'absolute') === 'increment';
  if (goal.kind === 'portfolio_value_tl') {
    return increment ? t('goalTitleIncrementPortfolioTl') : t('goalTitlePortfolioTl');
  }
  const asset = t(`assetTypes.${goal.assetType}`);
  return increment ? t('goalTitleIncrementAsset', { asset }) : t('goalTitleAsset', { asset });
}

export function getGoalProgressLabel(
  goal: PortfolioGoal,
  progress: GoalProgress,
  language: string,
  t: TFunction
): string {
  const prefix = progress.mode === 'increment' ? '+' : '';
  if (goal.kind === 'portfolio_value_tl') {
    return `${prefix}${formatCurrency(progress.progressValue, language)} / ${prefix}${formatCurrency(progress.targetValue, language)} ₺`;
  }
  const unit = goal.assetType ? getAssetUnit(goal.assetType, t) : '';
  return `${prefix}${progress.progressValue.toFixed(2)} / ${prefix}${progress.targetValue} ${unit}`;
}
