import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PortfolioItem, HistoryItem, Wallet } from '../types';
import { PortfolioBackup, PortfolioBackupV1, PortfolioBackupV2 } from '../types/backup';
import { normalizePortfolioItems, normalizeWallets } from '../utils/walletUtils';

const BACKUP_FORMAT = 'portfolio-tracker-backup' as const;

export function buildBackupPayload(
  items: PortfolioItem[],
  history: HistoryItem[],
  appVersion: string,
  wallets: Wallet[],
  activeWalletId: string
): PortfolioBackupV2 {
  return {
    format: BACKUP_FORMAT,
    version: 2,
    exportedAt: new Date().toISOString(),
    appVersion,
    data: {
      items: normalizePortfolioItems(items),
      history,
      wallets: normalizeWallets(wallets),
      activeWalletId,
    },
  };
}

function isValidItem(item: unknown): item is PortfolioItem {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const row = item as PortfolioItem;
  return (
    typeof row.id === 'string' &&
    typeof row.type === 'string' &&
    typeof row.amount === 'number' &&
    typeof row.date === 'string'
  );
}

function isValidHistoryEntry(entry: unknown): entry is HistoryItem {
  if (!entry || typeof entry !== 'object') {
    return false;
  }
  const row = entry as HistoryItem;
  return (
    (row.type === 'add' || row.type === 'remove' || row.type === 'update') &&
    row.item != null &&
    isValidItem(row.item) &&
    typeof row.date === 'string' &&
    (row.id == null || typeof row.id === 'string')
  );
}

function isValidWallet(wallet: unknown): wallet is Wallet {
  if (!wallet || typeof wallet !== 'object') {
    return false;
  }
  const row = wallet as Wallet;
  return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.createdAt === 'number';
}

function normalizeBackup(parsed: PortfolioBackup): PortfolioBackupV2 {
  if (parsed.version === 2) {
    return {
      ...parsed,
      data: {
        ...parsed.data,
        items: normalizePortfolioItems(parsed.data.items),
        wallets: normalizeWallets(parsed.data.wallets),
      },
    };
  }
  const v1 = parsed as PortfolioBackupV1;
  return {
    format: BACKUP_FORMAT,
    version: 2,
    exportedAt: v1.exportedAt,
    appVersion: v1.appVersion,
    data: {
      items: normalizePortfolioItems(v1.data.items),
      history: v1.data.history,
      wallets: normalizeWallets(undefined),
      activeWalletId: 'default',
    },
  };
}

export function parseBackupJson(
  raw: string
): { ok: true; data: PortfolioBackupV2 } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as PortfolioBackup;
    if (parsed.format !== BACKUP_FORMAT || (parsed.version !== 1 && parsed.version !== 2)) {
      return { ok: false, error: 'invalid_format' };
    }
    if (!Array.isArray(parsed.data?.items) || !Array.isArray(parsed.data?.history)) {
      return { ok: false, error: 'invalid_data' };
    }
    if (!parsed.data.items.every(isValidItem) || !parsed.data.history.every(isValidHistoryEntry)) {
      return { ok: false, error: 'invalid_entries' };
    }
    if (parsed.version === 2) {
      if (!Array.isArray(parsed.data.wallets) || !parsed.data.wallets.every(isValidWallet)) {
        return { ok: false, error: 'invalid_wallets' };
      }
    }
    return { ok: true, data: normalizeBackup(parsed) };
  } catch {
    return { ok: false, error: 'parse_error' };
  }
}

export async function exportBackupToFile(
  items: PortfolioItem[],
  history: HistoryItem[],
  appVersion: string,
  wallets: Wallet[],
  activeWalletId: string
): Promise<void> {
  const payload = buildBackupPayload(items, history, appVersion, wallets, activeWalletId);
  const json = JSON.stringify(payload, null, 2);
  const dateKey = new Date().toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}portfolio-backup-${dateKey}.json`;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('sharing_unavailable');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Portfolio backup',
  });
}

export async function importBackupFromPicker(): Promise<PortfolioBackupV2 | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'public.json', 'public.text'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const parsed = parseBackupJson(raw);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return parsed.data;
}
