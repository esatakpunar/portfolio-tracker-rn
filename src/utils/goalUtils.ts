import { AssetType, PortfolioGoal, PortfolioItem, Prices } from '../types';
import { computeItemValueInTL } from './portfolioUtils';
import { safeAdd } from './numberUtils';

export interface GoalProgress {
  /** Progress numerator (toward target) */
  progressValue: number;
  /** Target denominator */
  targetValue: number;
  pct: number;
  mode: 'absolute' | 'increment';
}

export function sumAssetAmount(items: PortfolioItem[], assetType: AssetType): number {
  return items
    .filter((i) => i.type === assetType)
    .reduce((sum, i) => safeAdd(sum, i.amount), 0);
}

export function sumPortfolioValueTl(items: PortfolioItem[], prices: Prices): number {
  return items.reduce((sum, item) => {
    const value = computeItemValueInTL(item, prices);
    return value != null ? safeAdd(sum, value) : sum;
  }, 0);
}

function getRawCurrent(
  goal: PortfolioGoal,
  items: PortfolioItem[],
  prices: Prices
): number | null {
  if (goal.kind === 'portfolio_value_tl') {
    return sumPortfolioValueTl(items, prices);
  }
  if (goal.kind === 'asset_amount' && goal.assetType) {
    return sumAssetAmount(items, goal.assetType);
  }
  return null;
}

export function computeBaselineForGoal(
  goal: Omit<PortfolioGoal, 'baseline' | 'mode'>,
  items: PortfolioItem[],
  prices: Prices
): number {
  return getRawCurrent({ ...goal, target: 1 }, items, prices) ?? 0;
}

export function computeGoalProgress(
  goal: PortfolioGoal,
  items: PortfolioItem[],
  prices: Prices
): GoalProgress | null {
  if (!goal.target || goal.target <= 0) {
    return null;
  }

  const raw = getRawCurrent(goal, items, prices);
  if (raw == null) {
    return null;
  }

  const mode = goal.mode ?? 'absolute';

  if (mode === 'increment') {
    const baseline = goal.baseline ?? 0;
    const progressValue = Math.max(0, raw - baseline);
    const pct = Math.min(100, (progressValue / goal.target) * 100);
    return {
      progressValue,
      targetValue: goal.target,
      pct,
      mode: 'increment',
    };
  }

  const pct = Math.min(100, (raw / goal.target) * 100);
  return {
    progressValue: raw,
    targetValue: goal.target,
    pct,
    mode: 'absolute',
  };
}
