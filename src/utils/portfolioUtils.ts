/**
 * Portfolio utility functions for calculating average cost and profit/loss
 */

import { HistoryItem, AssetType, Prices, PortfolioItem, CurrencyType } from '../types';
import { safeAdd } from './numberUtils';

export function computeItemValueInTL(item: PortfolioItem, prices: Prices): number | null {
  if (!item?.type || isNaN(item.amount) || !isFinite(item.amount) || item.amount < 0) {
    return 0;
  }
  if (item.type === 'tl') {
    return item.amount;
  }
  if (item.type === 'usd') {
    const usdPrice = prices.usd;
    if (usdPrice == null || isNaN(usdPrice) || !isFinite(usdPrice) || usdPrice <= 0) {
      return null;
    }
    return item.amount * usdPrice;
  }
  if (item.type === 'eur') {
    const eurPrice = prices.eur;
    if (eurPrice == null || isNaN(eurPrice) || !isFinite(eurPrice) || eurPrice <= 0) {
      return null;
    }
    return item.amount * eurPrice;
  }
  const price = prices[item.type];
  if (price == null || isNaN(price) || !isFinite(price) || price <= 0) {
    return null;
  }
  return item.amount * price;
}

export interface AssetProfitLossResult {
  profitAmount: number;
  profitPct: number;
  costTL: number;
  currentTL: number;
}

/** Convert a TL monetary amount to display currency (uses current FX/gold prices). */
export function convertFromTL(
  valueTL: number,
  targetCurrency: CurrencyType,
  prices: Prices
): number | null {
  if (isNaN(valueTL) || !isFinite(valueTL) || valueTL < 0) {
    return 0;
  }
  switch (targetCurrency) {
    case 'TL':
      return valueTL;
    case 'USD': {
      const usdPrice = prices.usd;
      if (usdPrice == null || isNaN(usdPrice) || !isFinite(usdPrice) || usdPrice <= 0) {
        return null;
      }
      return valueTL / usdPrice;
    }
    case 'EUR': {
      const eurPrice = prices.eur;
      if (eurPrice == null || isNaN(eurPrice) || !isFinite(eurPrice) || eurPrice <= 0) {
        return null;
      }
      return valueTL / eurPrice;
    }
    case 'ALTIN': {
      const altinPrice = prices['24_ayar'];
      if (altinPrice == null || isNaN(altinPrice) || !isFinite(altinPrice) || altinPrice <= 0) {
        return null;
      }
      return valueTL / altinPrice;
    }
    default:
      return valueTL;
  }
}

export function getAssetProfitLoss(
  assetType: AssetType,
  items: PortfolioItem[],
  history: HistoryItem[],
  prices: Prices
): AssetProfitLossResult | null {
  const typeItems = items.filter((i) => i.type === assetType);
  const amount = typeItems.reduce((sum, i) => safeAdd(sum, i.amount), 0);
  if (amount <= 0) {
    return null;
  }

  let currentTL = 0;
  for (const item of typeItems) {
    const value = computeItemValueInTL(item, prices);
    if (value == null) {
      return null;
    }
    currentTL = safeAdd(currentTL, value);
  }

  const averageCost = calculateAverageCost(assetType, history, amount);
  const profit = calculateProfitLoss(currentTL, averageCost, amount);
  if (profit == null || averageCost == null) {
    return null;
  }

  return {
    profitAmount: profit.amount,
    profitPct: profit.percentage,
    costTL: amount * averageCost,
    currentTL,
  };
}

export function getPortfolioProfitLoss(
  items: PortfolioItem[],
  history: HistoryItem[],
  prices: Prices
): AssetProfitLossResult | null {
  const typesWithHoldings = [
    ...new Set(items.filter((i) => i.amount > 0).map((i) => i.type)),
  ];
  if (typesWithHoldings.length === 0) {
    return null;
  }

  let costTL = 0;
  let currentTL = 0;
  for (const type of typesWithHoldings) {
    const row = getAssetProfitLoss(type, items, history, prices);
    if (!row) {
      return null;
    }
    costTL = safeAdd(costTL, row.costTL);
    currentTL = safeAdd(currentTL, row.currentTL);
  }

  const profitAmount = currentTL - costTL;
  const profitPct = costTL > 0 ? (profitAmount / costTL) * 100 : 0;
  if (isNaN(profitAmount) || !isFinite(profitAmount) || isNaN(profitPct) || !isFinite(profitPct)) {
    return null;
  }

  return { profitAmount, profitPct, costTL, currentTL };
}

/**
 * Calculate weighted average cost for an asset type based on history
 * Uses LIFO logic - calculates cost of currently held items
 * 
 * @param assetType - The asset type to calculate average cost for
 * @param history - Array of history items
 * @param currentAmount - Current total amount of this asset type
 * @returns Average cost per unit in TL, or null if no cost data available
 */
export function calculateAverageCost(
  assetType: AssetType,
  history: HistoryItem[],
  currentAmount: number
): number | null {
  // Validate inputs
  if (!assetType || !history || !Array.isArray(history) || currentAmount <= 0) {
    return null;
  }

  // For TL, cost is always 1:1 (1 TL = 1 TL)
  if (assetType === 'tl') {
    return 1;
  }

  // Track remaining amount to calculate (LIFO - start from most recent)
  let remainingAmount = currentAmount;
  let totalCost = 0;
  let hasValidCostData = false;

  // Process history in reverse chronological order (most recent first)
  // This implements LIFO: we calculate cost of items that are still held
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Most recent first
  });

  for (const historyItem of sortedHistory) {
    if (remainingAmount <= 0) {
      break; // We've accounted for all current items
    }

    // Only process items of the same type
    if (historyItem.item.type !== assetType) {
      continue;
    }

    if (historyItem.type === 'add') {
      // Add operation: this item was purchased
      const itemAmount = historyItem.item.amount || 0;
      const priceAtTime = historyItem.priceAtTime;

      // Skip if no valid cost data
      if (priceAtTime == null || isNaN(priceAtTime) || !isFinite(priceAtTime) || priceAtTime <= 0) {
        continue;
      }

      if (itemAmount > 0 && itemAmount <= remainingAmount) {
        // This entire purchase is still held
        totalCost += priceAtTime;
        remainingAmount -= itemAmount;
        hasValidCostData = true;
      } else if (itemAmount > 0 && remainingAmount > 0) {
        // Partial purchase is still held (proportional cost)
        const proportion = remainingAmount / itemAmount;
        totalCost += priceAtTime * proportion;
        remainingAmount = 0;
        hasValidCostData = true;
      }
    } else if (historyItem.type === 'remove') {
      // Remove operation: these items were sold, so they're not in current holdings
      const itemAmount = historyItem.item.amount || 0;
      if (itemAmount > 0) {
        // Adjust remaining amount (these items were removed, so we need to account for more)
        remainingAmount += itemAmount;
      }
    }
    // 'update' type is handled by the add/remove operations that created it
  }

  // If we couldn't account for all current items, or no valid cost data
  if (remainingAmount > 0 || !hasValidCostData) {
    return null;
  }

  // Calculate average cost per unit
  if (currentAmount <= 0) {
    return null;
  }

  const averageCost = totalCost / currentAmount;
  
  // Validate result
  if (isNaN(averageCost) || !isFinite(averageCost) || averageCost <= 0) {
    return null;
  }

  return averageCost;
}

/**
 * Calculate profit/loss for an asset
 * 
 * @param currentValueTL - Current value of the asset in TL
 * @param averageCost - Average cost per unit in TL
 * @param amount - Current amount of the asset
 * @returns Object with profit/loss amount and percentage, or null if calculation not possible
 */
export function calculateProfitLoss(
  currentValueTL: number | null,
  averageCost: number | null,
  amount: number
): { amount: number; percentage: number } | null {
  // Validate inputs
  if (
    currentValueTL == null ||
    isNaN(currentValueTL) ||
    !isFinite(currentValueTL) ||
    averageCost == null ||
    isNaN(averageCost) ||
    !isFinite(averageCost) ||
    averageCost <= 0 ||
    isNaN(amount) ||
    !isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  const totalCost = amount * averageCost;
  
  if (isNaN(totalCost) || !isFinite(totalCost) || totalCost <= 0) {
    return null;
  }

  const profitLossAmount = currentValueTL - totalCost;
  const profitLossPercentage = (profitLossAmount / totalCost) * 100;

  // Validate results
  if (isNaN(profitLossAmount) || !isFinite(profitLossAmount) || 
      isNaN(profitLossPercentage) || !isFinite(profitLossPercentage)) {
    return null;
  }

  return {
    amount: profitLossAmount,
    percentage: profitLossPercentage,
  };
}

/**
 * Calculate total cost for an asset type
 * 
 * @param assetType - The asset type
 * @param amount - Current amount
 * @param averageCost - Average cost per unit
 * @returns Total cost in TL, or null if calculation not possible
 */
export function calculateTotalCost(
  assetType: AssetType,
  amount: number,
  averageCost: number | null
): number | null {
  if (assetType === 'tl') {
    // For TL, cost equals amount (1:1)
    return amount;
  }

  if (averageCost == null || isNaN(averageCost) || !isFinite(averageCost) || averageCost <= 0) {
    return null;
  }

  if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
    return null;
  }

  const totalCost = amount * averageCost;

  if (isNaN(totalCost) || !isFinite(totalCost) || totalCost < 0) {
    return null;
  }

  return totalCost;
}
