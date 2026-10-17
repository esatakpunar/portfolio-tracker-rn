import { AssetType, PortfolioItem, Prices } from '../types';
import { computePortfolioAllocation, AllocationCategory } from './allocationUtils';
import { computeItemValueInTL } from './portfolioUtils';
import { formatCurrency } from './formatUtils';
import { safeAdd } from './numberUtils';
import { getAssetColor, getAssetIcon } from './assetUtils';
import { colors } from '../theme';
import de from '../locales/de';
import en from '../locales/en';
import tr from '../locales/tr';

const localeMaps = { tr, en, de } as const;

function assetLabel(lang: string, type: AssetType): string {
  const pack = localeMaps[lang as keyof typeof localeMaps] ?? tr;
  return pack.assetTypes[type] ?? type;
}

function categoryLabel(lang: string, category: AllocationCategory): string {
  const pack = localeMaps[lang as keyof typeof localeMaps] ?? tr;
  return pack.allocationCategories[category] ?? category;
}

/** Matches `PortfolioAllocationCard` bar colors. */
export const ALLOCATION_BAR_COLORS: Record<AllocationCategory, string> = {
  gold: colors.warning,
  silver: colors.textSecondary,
  forex: colors.accent,
  tl: colors.success,
};

/** Max width for stacked bar segments (medium widget ~340pt minus padding). */
const ALLOCATION_BAR_TOTAL_WIDTH = 248;

export interface WidgetAllocationSegmentPayload {
  label: string;
  pct: number;
  color: string;
  barWidth: number;
  valueLine: string;
}

export interface WidgetHoldingRowPayload {
  icon: string;
  color: string;
  title: string;
  meta: string;
}

export interface WidgetSnapshotContent {
  brandShort: string;
  totalLabel: string;
  totalLine: string;
  updatedFormatted: string;
  assetsLine: string;
  allocationLine: string;
  alloc1Label: string;
  alloc1Pct: number;
  alloc1Color: string;
  alloc1BarWidth: number;
  alloc2Label: string;
  alloc2Pct: number;
  alloc2Color: string;
  alloc2BarWidth: number;
  alloc3Label: string;
  alloc3Pct: number;
  alloc3Color: string;
  alloc3BarWidth: number;
  holding1Icon: string;
  holding1Color: string;
  holding1Title: string;
  holding1Meta: string;
  holding2Icon: string;
  holding2Color: string;
  holding2Title: string;
  holding2Meta: string;
  holdingLine1: string;
  holdingLine2: string;
  changeLine: string;
}

const emptyAllocationSegment = (): WidgetAllocationSegmentPayload => ({
  label: '',
  pct: 0,
  color: '',
  barWidth: 0,
  valueLine: '',
});

const emptyHoldingRow = (): WidgetHoldingRowPayload => ({
  icon: '',
  color: '',
  title: '',
  meta: '',
});

export function buildAllocationSegments(
  items: PortfolioItem[],
  prices: Prices,
  lang: string,
  maxSegments: number = 3
): WidgetAllocationSegmentPayload[] {
  const allocation = computePortfolioAllocation(items, prices);
  if (!allocation?.segments.length) {
    return [];
  }
  return allocation.segments.slice(0, maxSegments).map((s) => {
    const pct = Math.round(s.pct);
    return {
      label: categoryLabel(lang, s.category),
      pct,
      color: ALLOCATION_BAR_COLORS[s.category],
      barWidth: Math.max(6, Math.round((pct / 100) * ALLOCATION_BAR_TOTAL_WIDTH)),
      valueLine: `${formatCurrency(s.valueTl, lang)} ₺`,
    };
  });
}

export function buildTopHoldingRows(
  items: PortfolioItem[],
  prices: Prices,
  totalTl: number,
  lang: string,
  maxRows: number = 2
): WidgetHoldingRowPayload[] {
  const byType = new Map<AssetType, number>();
  for (const item of items) {
    const value = computeItemValueInTL(item, prices);
    if (value == null || value <= 0) {
      continue;
    }
    byType.set(item.type, safeAdd(byType.get(item.type) ?? 0, value));
  }

  const sorted = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxRows);
  return sorted.map(([type, valueTl]) => {
    const pct = totalTl > 0 ? Math.round((valueTl / totalTl) * 100) : 0;
    const title = assetLabel(lang, type).replace(/\s*\([^)]*\)\s*/g, '').trim();
    return {
      icon: getAssetIcon(type),
      color: getAssetColor(type),
      title,
      meta: `${formatCurrency(valueTl, lang)} ₺ · ${pct}%`,
    };
  });
}

export function packAllocationSegments(segments: WidgetAllocationSegmentPayload[]): {
  alloc1: WidgetAllocationSegmentPayload;
  alloc2: WidgetAllocationSegmentPayload;
  alloc3: WidgetAllocationSegmentPayload;
} {
  const padded = [...segments];
  while (padded.length < 3) {
    padded.push(emptyAllocationSegment());
  }
  return { alloc1: padded[0], alloc2: padded[1], alloc3: padded[2] };
}

export function packHoldingRows(rows: WidgetHoldingRowPayload[]): {
  row1: WidgetHoldingRowPayload;
  row2: WidgetHoldingRowPayload;
} {
  const padded = [...rows];
  while (padded.length < 2) {
    padded.push(emptyHoldingRow());
  }
  return { row1: padded[0], row2: padded[1] };
}

export function packHoldingRows4(rows: WidgetHoldingRowPayload[]): {
  row1: WidgetHoldingRowPayload;
  row2: WidgetHoldingRowPayload;
  row3: WidgetHoldingRowPayload;
  row4: WidgetHoldingRowPayload;
} {
  const padded = [...rows];
  while (padded.length < 4) {
    padded.push(emptyHoldingRow());
  }
  return { row1: padded[0], row2: padded[1], row3: padded[2], row4: padded[3] };
}

export function packAllocationSegments4(segments: WidgetAllocationSegmentPayload[]): {
  alloc1: WidgetAllocationSegmentPayload;
  alloc2: WidgetAllocationSegmentPayload;
  alloc3: WidgetAllocationSegmentPayload;
  alloc4: WidgetAllocationSegmentPayload;
} {
  const padded = [...segments];
  while (padded.length < 4) {
    padded.push(emptyAllocationSegment());
  }
  return { alloc1: padded[0], alloc2: padded[1], alloc3: padded[2], alloc4: padded[3] };
}

export function buildAllocationLine(
  items: PortfolioItem[],
  prices: Prices,
  lang: string
): string {
  const allocation = computePortfolioAllocation(items, prices);
  if (!allocation?.segments.length) {
    return '';
  }
  return allocation.segments
    .slice(0, 3)
    .map((s) => `${categoryLabel(lang, s.category)} ${Math.round(s.pct)}%`)
    .join(' · ');
}

export function buildTopHoldingLines(
  items: PortfolioItem[],
  prices: Prices,
  totalTl: number,
  lang: string,
  maxLines: number = 2
): string[] {
  const byType = new Map<AssetType, number>();
  for (const item of items) {
    const value = computeItemValueInTL(item, prices);
    if (value == null || value <= 0) {
      continue;
    }
    byType.set(item.type, safeAdd(byType.get(item.type) ?? 0, value));
  }

  const sorted = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxLines);
  return sorted.map(([type, valueTl]) => {
    const pct = totalTl > 0 ? Math.round((valueTl / totalTl) * 100) : 0;
    const shortName = assetLabel(lang, type).replace(/\s*\([^)]*\)\s*/g, '').trim();
    return `${shortName} · ${formatCurrency(valueTl, lang)} ₺ (${pct}%)`;
  });
}

export function buildChangeLine(
  totalTl: number,
  previousTotalTl: number | null,
  lang: string,
  options?: { compact?: boolean }
): string {
  if (previousTotalTl == null || previousTotalTl <= 0) {
    return '';
  }
  const diff = totalTl - previousTotalTl;
  if (!isFinite(diff) || Math.abs(diff) < 0.5) {
    if (options?.compact) {
      const flat: Record<string, string> = { tr: '0 ₺', en: '0 ₺', de: '0 €' };
      return flat[lang] ?? flat.tr;
    }
    const flat: Record<string, string> = {
      tr: 'Dünden değişim yok',
      en: 'Unchanged since yesterday',
      de: 'Unverändert seit gestern',
    };
    return flat[lang] ?? flat.tr;
  }
  const sign = diff > 0 ? '+' : '−';
  if (options?.compact) {
    return `${sign}${formatCurrency(Math.abs(diff), lang, { maximumFractionDigits: 0 })} ₺`;
  }
  const since: Record<string, string> = {
    tr: 'dünden',
    en: 'vs yesterday',
    de: 'seit gestern',
  };
  return `${sign}${formatCurrency(Math.abs(diff), lang)} ₺ ${since[lang] ?? since.tr}`;
}

/** Very short delta for systemSmall (e.g. +6,8K ₺). */
export function buildChangeLineSmall(
  totalTl: number,
  previousTotalTl: number | null,
  lang: string
): string {
  if (previousTotalTl == null || previousTotalTl <= 0) {
    return '';
  }
  const diff = totalTl - previousTotalTl;
  if (!isFinite(diff) || Math.abs(diff) < 0.5) {
    return '—';
  }
  const sign = diff > 0 ? '+' : '−';
  const abs = Math.abs(diff);
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}M ₺`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 1000).toFixed(1).replace('.', ',')}K ₺`;
  }
  return `${sign}${formatCurrency(abs, lang, { maximumFractionDigits: 0 })} ₺`;
}
