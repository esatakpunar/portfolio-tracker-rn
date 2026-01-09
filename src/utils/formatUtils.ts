/**
 * Format utility functions for currency, dates, and numbers
 */

/**
 * Formats a number as currency based on locale
 */
export const formatCurrency = (
  value: number,
  locale: string = 'tr',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const localeMap: Record<string, string> = {
    'tr': 'tr-TR',
    'de': 'de-DE',
    'en': 'en-US',
  };

  const selectedLocale = localeMap[locale] || 'tr-TR';
  
  return value.toLocaleString(selectedLocale, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
};

/**
 * Formats a date based on locale
 */
export const formatDate = (
  date: Date,
  locale: string = 'tr',
  options?: Intl.DateTimeFormatOptions
): string => {
  const localeMap: Record<string, string> = {
    'tr': 'tr-TR',
    'de': 'de-DE',
    'en': 'en-US',
  };

  const selectedLocale = localeMap[locale] || 'tr-TR';
  
  return date.toLocaleString(selectedLocale, options);
};

/**
 * Formats a relative date (today, yesterday, X days ago)
 */
export const formatRelativeDate = (
  dateString: string,
  locale: string = 'tr',
  t: (key: string) => string
): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return formatDate(date, locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (days === 1) {
    return t('yesterday');
  } else if (days < 7) {
    return `${days} ${t('daysAgo')}`;
  } else {
    return formatDate(date, locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
};

/**
 * Formats a price change value with sign and percentage symbol
 * - Positive values (>0): "+0.18%"
 * - Negative values (<0): "-0.07%"
 * - Zero values (=0): "0.00%"
 * - Null/undefined values: "—" (em dash, indicates unavailable data)
 */
export const formatPriceChange = (change: number | null | undefined): string => {
  if (change == null || isNaN(change) || !isFinite(change)) {
    return '—'; // Em dash indicates unavailable/invalid data
  }
  
  // Format to 2 decimal places
  const formatted = Math.abs(change).toFixed(2);
  
  if (change > 0) {
    return `+${formatted}%`;
  } else if (change < 0) {
    return `-${formatted}%`;
  } else {
    return `${formatted}%`;
  }
};

/**
 * Formats last update time as relative time (e.g., "2 hours ago", "Just now")
 */
export const formatLastUpdateTime = (
  timestamp: number,
  locale: string = 'tr',
  t: (key: string) => string
): string => {
  if (!timestamp || isNaN(timestamp) || !isFinite(timestamp)) {
    return '';
  }
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (minutes < 1) {
    return t('justNow');
  } else if (minutes < 60) {
    return `${minutes} ${t('minutesAgo')}`;
  } else if (hours < 24) {
    return `${hours} ${t('hoursAgo')}`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days} ${t('daysAgo')}`;
  }
};

