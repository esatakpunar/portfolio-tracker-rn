import { AssetType, PortfolioItem, Prices } from '../types';
import { computeItemValueInTL } from './portfolioUtils';
import { safeAdd } from './numberUtils';

export type AllocationCategory = 'gold' | 'silver' | 'forex' | 'tl';

export interface AllocationSegment {
  category: AllocationCategory;
  valueTl: number;
  pct: number;
}

export interface PortfolioAllocationResult {
  segments: AllocationSegment[];
  totalKnownTl: number;
}

function categoryForAsset(type: AssetType): AllocationCategory {
  if (type === 'gumus') {
    return 'silver';
  }
  if (type === 'usd' || type === 'eur') {
    return 'forex';
  }
  if (type === 'tl') {
    return 'tl';
  }
  return 'gold';
}

export function computePortfolioAllocation(
  items: PortfolioItem[],
  prices: Prices
): PortfolioAllocationResult | null {
  if (!items.length) {
    return null;
  }

  const totals: Record<AllocationCategory, number> = {
    gold: 0,
    silver: 0,
    forex: 0,
    tl: 0,
  };
  for (const item of items) {
    const value = computeItemValueInTL(item, prices);
    if (value == null) {
      continue;
    }
    if (value <= 0) {
      continue;
    }
    const cat = categoryForAsset(item.type);
    totals[cat] = safeAdd(totals[cat], value);
  }

  const totalKnownTl = Object.values(totals).reduce((s, v) => safeAdd(s, v), 0);
  if (totalKnownTl <= 0) {
    return null;
  }

  const order: AllocationCategory[] = ['gold', 'forex', 'tl', 'silver'];
  const segments: AllocationSegment[] = order
    .map((category) => ({
      category,
      valueTl: totals[category],
      pct: (totals[category] / totalKnownTl) * 100,
    }))
    .filter((s) => s.valueTl > 0)
    .sort((a, b) => b.pct - a.pct);

  return { segments, totalKnownTl };
}
