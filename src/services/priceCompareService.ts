import { PortfolioItem } from '../types';
import { fetchPricesFromTruncgil } from './priceServiceTruncgil';
import { fetchPricesFromInvesting } from './priceServiceInvesting';
import { computeItemValueInTL } from '../utils/portfolioUtils';
import { safeAdd } from '../utils/numberUtils';
import { Prices } from '../types';

function computePortfolioTotalTL(items: PortfolioItem[], prices: Prices): number | null {
  if (items.length === 0) {
    return 0;
  }
  let total = 0;
  let missing = false;
  for (const item of items) {
    const value = computeItemValueInTL(item, prices);
    if (value == null) {
      missing = true;
      break;
    }
    total = safeAdd(total, value);
  }
  return missing ? null : total;
}

export interface PriceSourceCompareResult {
  truncgilTotal: number | null;
  investingTotal: number | null;
  diff: number | null;
  diffPct: number | null;
}

export async function comparePriceSources(
  items: PortfolioItem[]
): Promise<PriceSourceCompareResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const [truncgilResult, investingResult] = await Promise.allSettled([
      fetchPricesFromTruncgil(controller.signal),
      fetchPricesFromInvesting(controller.signal),
    ]);

    const truncgilTotal =
      truncgilResult.status === 'fulfilled'
        ? computePortfolioTotalTL(items, truncgilResult.value.prices)
        : null;
    const investingTotal =
      investingResult.status === 'fulfilled'
        ? computePortfolioTotalTL(items, investingResult.value.prices)
        : null;

    if (truncgilTotal == null || investingTotal == null) {
      return { truncgilTotal, investingTotal, diff: null, diffPct: null };
    }

    const diff = investingTotal - truncgilTotal;
    const diffPct = truncgilTotal !== 0 ? (diff / truncgilTotal) * 100 : null;
    return { truncgilTotal, investingTotal, diff, diffPct };
  } finally {
    clearTimeout(timeout);
  }
}
