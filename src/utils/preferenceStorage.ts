import { getDatabase, waitForDatabase } from '../services/database';
import { CurrencyType, AssetType, PortfolioGoal } from '../types';

const PREFERENCE_KEYS = {
  CURRENCY: 'pref:currency',
  ASSET_TYPE: 'pref:assetType',
  PRICE_SOURCE: 'pref:priceSource',
  ZAKAT_DEBT: 'pref:zakatDebt',
  PORTFOLIO_GOAL: 'pref:portfolioGoal',
  AUTO_BACKUP_ENABLED: 'pref:autoBackupEnabled',
  LAST_AUTO_BACKUP_AT: 'pref:lastAutoBackupAt',
} as const;

export type PriceSource = 'truncgil' | 'investing' | 'auto';

export const PRICE_SOURCES = {
  AUTO: 'auto' as PriceSource,       // Try Truncgil first, fallback to Investing
  TRUNCGIL: 'truncgil' as PriceSource, // Only Truncgil
  INVESTING: 'investing' as PriceSource, // Only Investing.com
};

export async function getCurrencyPreference(): Promise<CurrencyType | null> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.CURRENCY]
    );
    
    if (row?.value) {
      const currency = row.value as CurrencyType;
      if (['TL', 'USD', 'EUR', 'ALTIN'].includes(currency)) {
        return currency;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function saveCurrencyPreference(currency: CurrencyType): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.CURRENCY, currency, Date.now()]
    );
  } catch {
    // Silently fail
  }
}

export async function getAssetTypePreference(): Promise<AssetType | null> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.ASSET_TYPE]
    );
    
    if (row?.value) {
      const assetType = row.value as AssetType;
      const validTypes: AssetType[] = ['22_ayar', '24_ayar', 'ceyrek', 'tam', 'usd', 'eur', 'tl', 'gumus'];
      if (validTypes.includes(assetType)) {
        return assetType;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function saveAssetTypePreference(assetType: AssetType): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.ASSET_TYPE, assetType, Date.now()]
    );
  } catch {
    // Silently fail
  }
}

export async function getPriceSourcePreference(): Promise<PriceSource> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.PRICE_SOURCE]
    );

    if (row?.value) {
      const source = row.value as PriceSource;
      if (['auto', 'truncgil', 'investing'].includes(source)) {
        return source;
      }
    }

    // Default to auto
    return PRICE_SOURCES.AUTO;
  } catch {
    return PRICE_SOURCES.AUTO;
  }
}

export async function savePriceSourcePreference(source: PriceSource): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();

    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.PRICE_SOURCE, source, Date.now()]
    );
  } catch {
    // Silently fail
  }
}

export async function getZakatDebt(): Promise<number> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.ZAKAT_DEBT]
    );
    if (!row?.value) {
      return 0;
    }
    const n = parseFloat(row.value);
    return isNaN(n) || n < 0 ? 0 : n;
  } catch {
    return 0;
  }
}

export async function getPortfolioGoal(): Promise<PortfolioGoal | null> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.PORTFOLIO_GOAL]
    );
    if (!row?.value) {
      return null;
    }
    const parsed = JSON.parse(row.value) as PortfolioGoal;
    if (!parsed || typeof parsed.target !== 'number' || parsed.target <= 0) {
      return null;
    }
    const mode = parsed.mode ?? 'absolute';
    if (mode === 'increment' && (parsed.baseline == null || !isFinite(parsed.baseline))) {
      return null;
    }
    if (parsed.kind === 'portfolio_value_tl') {
      return { ...parsed, mode };
    }
    if (parsed.kind === 'asset_amount' && parsed.assetType) {
      return { ...parsed, mode };
    }
    return null;
  } catch {
    return null;
  }
}

export async function savePortfolioGoal(goal: PortfolioGoal): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.PORTFOLIO_GOAL, JSON.stringify(goal), Date.now()]
    );
  } catch {
    // Silently fail
  }
}

export async function clearPortfolioGoal(): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, [
      PREFERENCE_KEYS.PORTFOLIO_GOAL,
    ]);
  } catch {
    // Silently fail
  }
}

export async function getAutoBackupEnabled(): Promise<boolean> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.AUTO_BACKUP_ENABLED]
    );
    return row?.value === 'true';
  } catch {
    return false;
  }
}

export async function setAutoBackupEnabled(enabled: boolean): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.AUTO_BACKUP_ENABLED, enabled ? 'true' : 'false', Date.now()]
    );
  } catch {
    // Silently fail
  }
}

export async function getLastAutoBackupAt(): Promise<number | null> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      [PREFERENCE_KEYS.LAST_AUTO_BACKUP_AT]
    );
    if (!row?.value) {
      return null;
    }
    const ts = parseInt(row.value, 10);
    return isNaN(ts) || ts <= 0 ? null : ts;
  } catch {
    return null;
  }
}

export async function setLastAutoBackupAt(timestamp: number): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.LAST_AUTO_BACKUP_AT, String(timestamp), Date.now()]
    );
  } catch {
    // Silently fail
  }
}

export async function saveZakatDebt(debt: number): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    const safe = isNaN(debt) || debt < 0 ? 0 : debt;
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      [PREFERENCE_KEYS.ZAKAT_DEBT, String(safe), Date.now()]
    );
  } catch {
    // Silently fail
  }
}

