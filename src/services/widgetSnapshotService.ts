import { Platform } from 'react-native';
import { formatCurrency } from '../utils/formatUtils';

const WIDGET_TITLE: Record<string, string> = {
  tr: 'Portföy Toplam',
  en: 'Portfolio Total',
  de: 'Portfolio Gesamt',
};

const WIDGET_UPDATED: Record<string, string> = {
  tr: 'Güncellendi',
  en: 'Updated',
  de: 'Aktualisiert',
};

function formatWidgetUpdatedAt(updatedAt: number, language: string): string {
  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'tr-TR';
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt));
  const prefix = WIDGET_UPDATED[language] ?? WIDGET_UPDATED.tr;
  return `${prefix}: ${time}`;
}

/** Push total TL to the iOS home screen widget (no-op off iOS / without native module). */
export async function syncWidgetPortfolioSnapshot(
  totalTl: number,
  language: string = 'tr'
): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }
  if (!isFinite(totalTl) || totalTl <= 0) {
    return;
  }

  try {
    const widgetModule = await import('../widgets/PortfolioTotalWidget');
    const PortfolioTotalWidget = widgetModule.default;
    const updatedAt = Date.now();
    const lang = language in WIDGET_TITLE ? language : 'tr';

    PortfolioTotalWidget.updateSnapshot({
      titleLabel: WIDGET_TITLE[lang],
      totalFormatted: formatCurrency(totalTl, lang),
      updatedFormatted: formatWidgetUpdatedAt(updatedAt, lang),
    });
    PortfolioTotalWidget.reload();
  } catch {
    // Widget extension not linked (Expo Go, web, etc.)
  }
}
