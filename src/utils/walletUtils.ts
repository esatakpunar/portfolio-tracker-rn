import { AssetType, HistoryItem, PortfolioItem, Wallet } from '../types';
import { safeAdd } from './numberUtils';

export const DEFAULT_WALLET_ID = 'default';

/** Portfolio / history filter: aggregate all wallets. */
export const PORTFOLIO_WALLET_ALL = 'all';

export function createDefaultWallet(displayName?: string): Wallet {
  return {
    id: DEFAULT_WALLET_ID,
    name: displayName ?? 'Default',
    createdAt: Date.now(),
  };
}

export function normalizeWalletId(walletId: string | undefined): string {
  if (walletId && walletId.trim().length > 0) {
    return walletId;
  }
  return DEFAULT_WALLET_ID;
}

export function normalizePortfolioItems(items: PortfolioItem[]): PortfolioItem[] {
  return items.map((item) => ({
    ...item,
    walletId: normalizeWalletId(item.walletId),
  }));
}

export function normalizeWallets(wallets: Wallet[] | undefined): Wallet[] {
  if (!wallets?.length) {
    return [createDefaultWallet()];
  }
  const hasDefault = wallets.some((w) => w.id === DEFAULT_WALLET_ID);
  const list = hasDefault ? [...wallets] : [createDefaultWallet(), ...wallets];
  return list;
}

export function walletItemCount(items: PortfolioItem[], walletId: string): number {
  return items.filter((item) => normalizeWalletId(item.walletId) === walletId).length;
}

export function walletHasHoldingsOrHistory(
  items: PortfolioItem[],
  history: HistoryItem[],
  walletId: string
): boolean {
  if (walletItemCount(items, walletId) > 0) {
    return true;
  }
  return history.some((entry) => normalizeWalletId(entry.item.walletId) === walletId);
}

export function walletHistoryCount(history: HistoryItem[], walletId: string): number {
  return history.filter(
    (entry) => normalizeWalletId(entry.item.walletId) === walletId
  ).length;
}

export function createWalletId(): string {
  return `wallet-${Date.now()}`;
}

export function assetAmountInWallet(
  items: PortfolioItem[],
  assetType: AssetType,
  walletId: string
): number {
  const id = normalizeWalletId(walletId);
  return items
    .filter((item) => item.type === assetType && normalizeWalletId(item.walletId) === id)
    .reduce((sum, item) => safeAdd(sum, item.amount), 0);
}

/** Prefer wallet that holds the asset; else active/main wallet. */
export function resolveWalletForAssetType(
  items: PortfolioItem[],
  assetType: AssetType,
  preferredWalletId: string
): string {
  const preferred = normalizeWalletId(preferredWalletId);
  const holders = new Set<string>();
  for (const item of items) {
    if (item.type === assetType) {
      holders.add(normalizeWalletId(item.walletId));
    }
  }
  if (holders.size === 0) {
    return preferred;
  }
  if (holders.size === 1) {
    return [...holders][0];
  }
  if (holders.has(preferred)) {
    return preferred;
  }
  if (holders.has(DEFAULT_WALLET_ID)) {
    return DEFAULT_WALLET_ID;
  }
  return [...holders][0];
}
