import { getDatabase, waitForDatabase } from './database';
import { Prices, PriceChanges, BuyPrices } from '../types';
import { PriceData } from './priceService';

export async function saveBackup(prices: Prices, buyPrices: BuyPrices | undefined, changes: PriceChanges): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    const now = Date.now();
    const pricesJson = JSON.stringify(prices);
    const buyPricesJson = buyPrices ? JSON.stringify(buyPrices) : null;
    const changesJson = JSON.stringify(changes);

    if (!pricesJson || !changesJson) {
      throw new Error('Failed to serialize price data');
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO price_backup 
       (id, prices_json, buy_prices_json, changes_json, fetched_at, updated_at) 
       VALUES (1, ?, ?, ?, ?, ?)`,
      [pricesJson, buyPricesJson, changesJson, now, now]
    );
  } catch (error) {
    throw error;
  }
}

export async function getBackup(): Promise<PriceData | null> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    const row = await db.getFirstAsync<{
      prices_json: string;
      buy_prices_json: string | null;
      changes_json: string;
      fetched_at: number;
    }>(
      `SELECT prices_json, buy_prices_json, changes_json, fetched_at 
       FROM price_backup 
       WHERE id = 1`
    );

    if (!row) {
      return null;
    }

    // Finance-safe: Check backup age - reject backups older than 24 hours
    const MAX_BACKUP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    const backupAge = Date.now() - row.fetched_at;
    
    if (backupAge > MAX_BACKUP_AGE_MS) {
      // Backup is too old, return null to force fresh fetch
      return null;
    }

    let prices: Prices;
    let buyPrices: BuyPrices | undefined;
    let changes: PriceChanges;

    try {
      prices = JSON.parse(row.prices_json);
      if (row.buy_prices_json) {
        buyPrices = JSON.parse(row.buy_prices_json);
      }
      changes = JSON.parse(row.changes_json);
    } catch (parseError) {
      return null;
    }

    if (!prices || typeof prices !== 'object' || !changes || typeof changes !== 'object') {
      return null;
    }

    const requiredPriceKeys: (keyof Prices)[] = [
      '22_ayar',
      '24_ayar',
      'ceyrek',
      'tam',
      'usd',
      'eur',
      'tl',
      'gumus',
    ];

    const requiredChangeKeys: (keyof PriceChanges)[] = [
      '22_ayar',
      '24_ayar',
      'ceyrek',
      'tam',
      'usd',
      'eur',
      'tl',
      'gumus',
    ];

    for (const key of requiredPriceKeys) {
      // Prices can be number or null (null indicates unavailable/invalid data)
      if (!(key in prices) || (prices[key] !== null && typeof prices[key] !== 'number')) {
        return null;
      }
    }

    for (const key of requiredChangeKeys) {
      // Changes can be number or null (null indicates unavailable/invalid data)
      if (!(key in changes) || (changes[key] !== null && typeof changes[key] !== 'number')) {
        return null;
      }
    }

    const allPricesValid = Object.values(prices).every(
      (price) => price === null || (typeof price === 'number' && !isNaN(price) && isFinite(price) && price >= 0)
    );

    const allChangesValid = Object.values(changes).every(
      (change) => change === null || (typeof change === 'number' && !isNaN(change) && isFinite(change))
    );

    if (!allPricesValid || !allChangesValid) {
      return null;
    }

    // Validate buyPrices if present
    if (buyPrices) {
      const requiredBuyPriceKeys: (keyof BuyPrices)[] = [
        '22_ayar',
        '24_ayar',
        'ceyrek',
        'tam',
        'usd',
        'eur',
        'tl',
        'gumus',
      ];

      for (const key of requiredBuyPriceKeys) {
        if (!(key in buyPrices) || (buyPrices[key] !== null && typeof buyPrices[key] !== 'number')) {
          buyPrices = undefined; // Invalidate buyPrices if structure is wrong
          break;
        }
      }

      if (buyPrices) {
        const allBuyPricesValid = Object.values(buyPrices).every(
          (price) => price === null || (typeof price === 'number' && !isNaN(price) && isFinite(price) && price >= 0)
        );

        if (!allBuyPricesValid) {
          buyPrices = undefined; // Invalidate buyPrices if values are invalid
        }
      }
    }

    return {
      prices,
      buyPrices,
      changes,
      fetchedAt: row.fetched_at,
    };
  } catch (error) {
    return null;
  }
}

export async function hasBackup(): Promise<boolean> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    const row = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM price_backup WHERE id = 1`
    );

    return !!row;
  } catch (error) {
    return false;
  }
}

export async function getLastUpdateTime(): Promise<number | null> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    const row = await db.getFirstAsync<{ fetched_at: number }>(
      `SELECT fetched_at FROM price_backup WHERE id = 1`
    );

    return row?.fetched_at || null;
  } catch (error) {
    return null;
  }
}

