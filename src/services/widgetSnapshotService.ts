import { Platform } from 'react-native';
import { PortfolioItem, Prices } from '../types';
import { formatCurrency } from '../utils/formatUtils';
import {
  buildAllocationLine,
  buildAllocationSegments,
  buildChangeLine,
  buildChangeLineSmall,
  buildTopHoldingLines,
  buildTopHoldingRows,
  packAllocationSegments4,
  packHoldingRows,
  packHoldingRows4,
} from '../utils/widgetPayloadUtils';
import { getAllSnapshots, getTodayDateKey } from './dailySnapshotService';
import PortfolioTotalWidget from '../widgets/PortfolioTotalWidget';

const WIDGET_BRAND_SHORT: Record<string, string> = {
  tr: 'Portföy',
  en: 'Portfolio',
  de: 'Portfolio',
};

const WIDGET_TOTAL_LABEL: Record<string, string> = {
  tr: 'Toplam değer',
  en: 'Total value',
  de: 'Gesamtwert',
};

const WIDGET_ASSETS: Record<string, (count: number) => string> = {
  tr: (count) => (count === 1 ? '1 varlık türü' : `${count} varlık türü`),
  en: (count) => (count === 1 ? '1 asset type' : `${count} asset types`),
  de: (count) => (count === 1 ? '1 Anlageart' : `${count} Anlagearten`),
};

const WIDGET_ALLOCATION_TITLE: Record<string, string> = {
  tr: 'Dağılım',
  en: 'Allocation',
  de: 'Allokation',
};

const WIDGET_HOLDINGS_TITLE: Record<string, string> = {
  tr: 'Varlıklar',
  en: 'Holdings',
  de: 'Bestand',
};

function formatWidgetUpdatedAtCompact(updatedAt: number, language: string): string {
  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'tr-TR';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt));
}

async function getPreviousDayTotalTl(): Promise<number | null> {
  try {
    const snapshots = await getAllSnapshots();
    const todayKey = getTodayDateKey();
    const previous = snapshots.find((row) => row.date !== todayKey);
    return previous?.totalTl ?? null;
  } catch {
    return null;
  }
}

/** Push portfolio summary to the iOS home screen widget. */
export async function syncWidgetPortfolioSnapshot(
  totalTl: number,
  language: string,
  items: PortfolioItem[],
  prices: Prices
): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  if (!isFinite(totalTl) || totalTl <= 0 || !items.length) {
    return;
  }

  try {
    const lang = language in WIDGET_BRAND_SHORT ? language : 'tr';
    const assetTypeCount = new Set(
      items.filter((item) => item.amount > 0).map((item) => item.type)
    ).size;
    const formatted = formatCurrency(totalTl, lang);
    const holdings = buildTopHoldingLines(items, prices, totalTl, lang, 2);
    const holdingRows = packHoldingRows(buildTopHoldingRows(items, prices, totalTl, lang, 2));
    const holdingRows4 = packHoldingRows4(buildTopHoldingRows(items, prices, totalTl, lang, 3));
    const allocPacked = packAllocationSegments4(buildAllocationSegments(items, prices, lang, 4));
    const previousTotal = await getPreviousDayTotalTl();

    PortfolioTotalWidget.updateSnapshot({
      brandShort: WIDGET_BRAND_SHORT[lang] ?? WIDGET_BRAND_SHORT.tr,
      totalLabel: WIDGET_TOTAL_LABEL[lang] ?? WIDGET_TOTAL_LABEL.tr,
      totalLine: `${formatted} ₺`,
      updatedFormatted: formatWidgetUpdatedAtCompact(Date.now(), lang),
      assetsLine: (WIDGET_ASSETS[lang] ?? WIDGET_ASSETS.tr)(assetTypeCount),
      allocationSectionTitle: WIDGET_ALLOCATION_TITLE[lang] ?? WIDGET_ALLOCATION_TITLE.tr,
      holdingsSectionTitle: WIDGET_HOLDINGS_TITLE[lang] ?? WIDGET_HOLDINGS_TITLE.tr,
      allocationLine: buildAllocationLine(items, prices, lang),
      alloc1Label: allocPacked.alloc1.label,
      alloc1Pct: allocPacked.alloc1.pct,
      alloc1Color: allocPacked.alloc1.color,
      alloc1BarWidth: allocPacked.alloc1.barWidth,
      alloc1ValueLine: allocPacked.alloc1.valueLine,
      alloc2Label: allocPacked.alloc2.label,
      alloc2Pct: allocPacked.alloc2.pct,
      alloc2Color: allocPacked.alloc2.color,
      alloc2BarWidth: allocPacked.alloc2.barWidth,
      alloc2ValueLine: allocPacked.alloc2.valueLine,
      alloc3Label: allocPacked.alloc3.label,
      alloc3Pct: allocPacked.alloc3.pct,
      alloc3Color: allocPacked.alloc3.color,
      alloc3BarWidth: allocPacked.alloc3.barWidth,
      alloc3ValueLine: allocPacked.alloc3.valueLine,
      alloc4Label: allocPacked.alloc4.label,
      alloc4Pct: allocPacked.alloc4.pct,
      alloc4Color: allocPacked.alloc4.color,
      alloc4BarWidth: allocPacked.alloc4.barWidth,
      alloc4ValueLine: allocPacked.alloc4.valueLine,
      holding1Icon: holdingRows.row1.icon,
      holding1Color: holdingRows.row1.color,
      holding1Title: holdingRows.row1.title,
      holding1Meta: holdingRows.row1.meta,
      holding2Icon: holdingRows.row2.icon,
      holding2Color: holdingRows.row2.color,
      holding2Title: holdingRows.row2.title,
      holding2Meta: holdingRows.row2.meta,
      holding3Icon: holdingRows4.row3.icon,
      holding3Color: holdingRows4.row3.color,
      holding3Title: holdingRows4.row3.title,
      holding3Meta: holdingRows4.row3.meta,
      holding4Icon: holdingRows4.row4.icon,
      holding4Color: holdingRows4.row4.color,
      holding4Title: holdingRows4.row4.title,
      holding4Meta: holdingRows4.row4.meta,
      holdingLine1: holdings[0] ?? '',
      holdingLine2: holdings[1] ?? '',
      changeLine: buildChangeLine(totalTl, previousTotal, lang),
      changeLineSmall: buildChangeLineSmall(totalTl, previousTotal, lang),
    });
    PortfolioTotalWidget.reload();
  } catch {
    // Widget extension not linked (Expo Go, web, etc.)
  }
}
