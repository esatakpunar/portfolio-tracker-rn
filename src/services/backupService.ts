import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PortfolioItem, HistoryItem } from '../types';
import { PortfolioBackupV1 } from '../types/backup';

const BACKUP_FORMAT = 'portfolio-tracker-backup' as const;

export function buildBackupPayload(
  items: PortfolioItem[],
  history: HistoryItem[],
  appVersion: string
): PortfolioBackupV1 {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion,
    data: { items, history },
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

export function parseBackupJson(
  raw: string
): { ok: true; data: PortfolioBackupV1 } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as PortfolioBackupV1;
    if (parsed.format !== BACKUP_FORMAT || parsed.version !== 1) {
      return { ok: false, error: 'invalid_format' };
    }
    if (!Array.isArray(parsed.data?.items) || !Array.isArray(parsed.data?.history)) {
      return { ok: false, error: 'invalid_data' };
    }
    if (!parsed.data.items.every(isValidItem) || !parsed.data.history.every(isValidHistoryEntry)) {
      return { ok: false, error: 'invalid_entries' };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: 'parse_error' };
  }
}

export async function exportBackupToFile(
  items: PortfolioItem[],
  history: HistoryItem[],
  appVersion: string
): Promise<void> {
  const payload = buildBackupPayload(items, history, appVersion);
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

export async function importBackupFromPicker(): Promise<PortfolioBackupV1 | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
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
