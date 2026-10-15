import { AssetType, PortfolioItem, Prices } from '../types';
import { computeItemValueInTL } from './portfolioUtils';
import { safeAdd } from './numberUtils';

const ZAKAT_ELIGIBLE: AssetType[] = [
  '22_ayar',
  '24_ayar',
  'ceyrek',
  'tam',
  'usd',
  'eur',
  'tl',
  'gumus',
];

const NISAB_GOLD_GRAMS = 80;

export interface ZakatResult {
  eligibleTL: number;
  nisabTL: number;
  zakatTL: number;
  belowNisab: boolean;
  breakdown: Partial<Record<AssetType, number>>;
}

export function calculateZakat(
  items: PortfolioItem[],
  prices: Prices,
  debtTL: number
): ZakatResult {
  const breakdown: Partial<Record<AssetType, number>> = {};
  let eligibleTL = 0;

  for (const item of items) {
    if (!ZAKAT_ELIGIBLE.includes(item.type) || item.amount <= 0) {
      continue;
    }
    const value = computeItemValueInTL(item, prices);
    if (value == null || value <= 0) {
      continue;
    }
    breakdown[item.type] = safeAdd(breakdown[item.type] ?? 0, value);
    eligibleTL = safeAdd(eligibleTL, value);
  }

  const gramPrice = prices['24_ayar'];
  const nisabTL =
    gramPrice != null && gramPrice > 0 ? gramPrice * NISAB_GOLD_GRAMS : 0;

  const netEligible = Math.max(0, eligibleTL - Math.max(0, debtTL));
  const belowNisab = nisabTL <= 0 || netEligible < nisabTL;
  const zakatTL = belowNisab ? 0 : netEligible * 0.025;

  return {
    eligibleTL: netEligible,
    nisabTL,
    zakatTL,
    belowNisab,
    breakdown,
  };
}
