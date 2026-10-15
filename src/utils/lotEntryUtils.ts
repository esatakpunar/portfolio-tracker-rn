import { AssetType, Prices } from '../types';

export function dateToTransactionISO(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function getMarketUnitPrice(type: AssetType, prices: Prices): number | null {
  if (type === 'tl') {
    return 1;
  }
  const price = prices[type];
  if (price == null || isNaN(price) || !isFinite(price) || price <= 0) {
    return null;
  }
  return price;
}

export function parseDecimalInput(raw: string): number | null {
  if (raw.trim() === '') {
    return null;
  }
  const normalized = raw.replace(',', '.');
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}
