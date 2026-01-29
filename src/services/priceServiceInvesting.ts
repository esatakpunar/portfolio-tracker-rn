import { PriceData } from './priceService';

/**
 * Parse European number format (e.g., "7.703,594" -> 7703.594)
 * Used by Investing.com which uses EU format (. = thousands, , = decimal)
 */
const parseEuropeanNumber = (str: string): number | null => {
  try {
    // Remove thousand separators (.) and replace decimal separator (,) with .
    const normalized = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) || !isFinite(num) ? null : num;
  } catch {
    return null;
  }
};

/**
 * Extract value from HTML by class name
 * Looks for pattern: <div class="... {className}...">VALUE</div>
 */
const extractValue = (html: string, className: string): string | null => {
  try {
    // Match: class contains the className and capture content until next <
    const regex = new RegExp(`class="[^"]*${className}[^"]*">([^<]+)<`, 'i');
    const match = html.match(regex);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
};

/**
 * Extract percentage change from HTML and parse as number
 * Removes % sign and parses European number format
 */
const extractPercentage = (html: string, className: string): number | null => {
  const valueStr = extractValue(html, className);
  if (!valueStr) return null;

  // Remove % sign and parse as European number
  const cleanStr = valueStr.replace('%', '').trim();
  return parseEuropeanNumber(cleanStr);
};

/**
 * Gold calculation constants based on Turkish gold market standards:
 *
 * PURITY (Ayar):
 * - 24 ayar = 99.9% pure gold (≈ 1.00)
 * - 22 ayar = 91.6% pure gold (0.916)
 *
 * JEWELRY WEIGHTS (Ziynet - all 22 karat):
 * - Çeyrek (Quarter) = 1.75 grams
 * - Tam (Full) = 7.00 grams
 *
 * FORMULAS:
 * - 22_ayar_gram = 24_ayar_gram × 0.916
 * - ceyrek = 22_ayar_gram × 1.75
 * - tam = 22_ayar_gram × 7.00
 */
const GOLD_PURITY_22K = 0.916; // 22 karat purity ratio
const JEWELRY_WEIGHT_CEYREK = 1.75; // Quarter gold weight in grams
const JEWELRY_WEIGHT_TAM = 7.00; // Full gold weight in grams

/**
 * Calculate gold prices from 24 karat gram price.
 *
 * @param gold24kGram Price of 1 gram 24 karat gold in TRY
 * @returns Object with calculated prices for all gold types
 */
const calculateGoldPrices = (gold24kGram: number) => {
  // 22 ayar gram = 24 ayar × 0.916
  const gold22kGram = gold24kGram * GOLD_PURITY_22K;

  // Çeyrek = 22 ayar × 1.75 gr
  const ceyrek = gold22kGram * JEWELRY_WEIGHT_CEYREK;

  // Tam = 22 ayar × 7.00 gr
  const tam = gold22kGram * JEWELRY_WEIGHT_TAM;

  return {
    '24_ayar': gold24kGram,
    '22_ayar': gold22kGram,
    ceyrek,
    tam,
  };
};

/**
 * Fetch prices from Investing.com live currency widget.
 *
 * DATA SOURCE:
 * - EUR/TRY: Direct from widget
 * - USD/TRY: Direct from widget
 * - GAU/TRY: 24 karat gram gold price (used for calculations)
 * - Gold varieties: Calculated from 24k price using Turkish market standards
 * - Silver: Not available (set to null)
 *
 * URL format: https://tr.investingwidgets.com/live-currency-cross-rates?pairs=66,50655,18
 * - 66 = EUR/TRY
 * - 18 = USD/TRY
 * - 50655 = GAU/TRY (24 karat gold gram price in TRY)
 *
 * @param signal Optional AbortSignal for request cancellation
 */
export const fetchPricesFromInvesting = async (signal?: AbortSignal): Promise<PriceData> => {
  const url = 'https://tr.investingwidgets.com/live-currency-cross-rates?theme=darkTheme&cols=bid,ask,changePerc&pairs=66,50655,18,1230330';

  if (__DEV__) {
    console.log('[INVESTING] Fetching prices from:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    if (__DEV__) {
      console.log('[INVESTING] HTML received, length:', html.length);
    }

    // Extract BID prices (alış fiyatı - what you pay to buy)
    const eurBid = parseEuropeanNumber(extractValue(html, 'pid-66-bid') || '');
    const usdBid = parseEuropeanNumber(extractValue(html, 'pid-18-bid') || '');
    const gold24kBid = parseEuropeanNumber(extractValue(html, 'pid-50655-bid') || '');
    const silverBid = parseEuropeanNumber(extractValue(html, 'pid-1230330-bid') || '');

    // Extract ASK prices (satış fiyatı - what you get when selling)
    const eurAsk = parseEuropeanNumber(extractValue(html, 'pid-66-ask') || '');
    const usdAsk = parseEuropeanNumber(extractValue(html, 'pid-18-ask') || '');
    const gold24kAsk = parseEuropeanNumber(extractValue(html, 'pid-50655-ask') || '');
    const silverAsk = parseEuropeanNumber(extractValue(html, 'pid-1230330-ask') || '');

    // Extract percentage changes
    const eurChange = extractPercentage(html, 'pid-66-pcp');
    const usdChange = extractPercentage(html, 'pid-18-pcp');
    const goldChange = extractPercentage(html, 'pid-50655-pcp');
    const silverChange = extractPercentage(html, 'pid-1230330-pcp');

    if (__DEV__) {
      console.log('[INVESTING] Parsed bid/ask values:', {
        eur: { bid: eurBid, ask: eurAsk },
        usd: { bid: usdBid, ask: usdAsk },
        gold24k: { bid: gold24kBid, ask: gold24kAsk },
        silver: { bid: silverBid, ask: silverAsk },
        changes: { eur: eurChange, usd: usdChange, gold: goldChange, silver: silverChange },
      });
    }

    // Validate critical data (use ask prices for validation)
    if (!eurAsk || !usdAsk || !gold24kAsk) {
      throw new Error('Missing critical price data (EUR, USD, or Gold)');
    }

    // Calculate all gold ASK prices (satış fiyatı) from 24k ask price
    const goldAskPrices = calculateGoldPrices(gold24kAsk);

    // Calculate all gold BID prices (alış fiyatı) from 24k bid price
    const goldBidPrices = gold24kBid ? calculateGoldPrices(gold24kBid) : null;

    if (__DEV__) {
      console.log('[INVESTING] Calculated gold prices:', {
        ask: goldAskPrices,
        bid: goldBidPrices,
      });
    }

    return {
      // PRICES = ASK prices (satış fiyatı - what you get when selling to market)
      prices: {
        '22_ayar': goldAskPrices['22_ayar'],
        '24_ayar': goldAskPrices['24_ayar'],
        ceyrek: goldAskPrices.ceyrek,
        tam: goldAskPrices.tam,
        usd: usdAsk,
        eur: eurAsk,
        tl: 1,
        gumus: silverAsk,
      },
      // BUY PRICES = BID prices (alış fiyatı - what you pay to buy from market)
      buyPrices: {
        '22_ayar': goldBidPrices?.['22_ayar'] ?? null,
        '24_ayar': goldBidPrices?.['24_ayar'] ?? null,
        ceyrek: goldBidPrices?.ceyrek ?? null,
        tam: goldBidPrices?.tam ?? null,
        usd: usdBid,
        eur: eurBid,
        tl: 1,
        gumus: silverBid,
      },
      changes: {
        '22_ayar': goldChange, // Use same % change for all gold types
        '24_ayar': goldChange,
        ceyrek: goldChange,
        tam: goldChange,
        usd: usdChange,
        eur: eurChange,
        tl: 0,
        gumus: silverChange,
      },
      fetchedAt: Date.now(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request aborted');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (__DEV__) {
      console.error('[INVESTING] Failed to fetch prices:', errorMessage);
    }

    throw new Error(`Investing.com API failed: ${errorMessage}`);
  }
};
