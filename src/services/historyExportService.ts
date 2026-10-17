import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { HistoryItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatUtils';

function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) {
    return '';
  }
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatHistoryType(type: HistoryItem['type'], t: (key: string) => string): string {
  if (type === 'add') {
    return t('csvHistoryTypeAdd');
  }
  if (type === 'remove') {
    return t('csvHistoryTypeRemove');
  }
  return t('csvHistoryTypeUpdate');
}

function formatAmount(amount: number, locale: string): string {
  const localeMap: Record<string, string> = {
    tr: 'tr-TR',
    de: 'de-DE',
    en: 'en-US',
  };
  return amount.toLocaleString(localeMap[locale] || 'tr-TR', {
    maximumFractionDigits: 4,
  });
}

export function buildHistoryCsv(
  history: HistoryItem[],
  t: (key: string) => string,
  locale: string
): string {
  const header = [
    t('csvColDate'),
    t('csvColType'),
    t('csvColAsset'),
    t('csvColAmount'),
    t('csvColValueTl'),
    t('csvColDescription'),
  ];

  const rows = [...history]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((entry) => {
      const when = formatDate(new Date(entry.date), locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const valueTl =
        entry.priceAtTime != null && isFinite(entry.priceAtTime)
          ? `${formatCurrency(entry.priceAtTime, locale)} ₺`
          : '';
      const description = (entry.description ?? entry.item.description ?? '').trim();

      return [
        when,
        formatHistoryType(entry.type, t),
        t(`assetTypes.${entry.item.type}`),
        formatAmount(entry.item.amount, locale),
        valueTl,
        description,
      ]
        .map(escapeCsvField)
        .join(',');
    });

  return `\uFEFF${header.map(escapeCsvField).join(',')}\n${rows.join('\n')}`;
}

export async function exportHistoryCsvToShare(
  history: HistoryItem[],
  t: (key: string) => string,
  locale: string
): Promise<void> {
  const csv = buildHistoryCsv(history, t, locale);
  const dateKey = new Date().toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}portfolio-history-${dateKey}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('sharing_unavailable');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: t('exportHistoryCsv'),
  });
}
