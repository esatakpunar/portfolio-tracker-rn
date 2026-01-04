import { getDatabase, waitForDatabase } from '../services/database';
import { CurrencyType } from '../types';
import { AssetType } from '../types';

const PREFERENCE_KEYS = {
  CURRENCY: 'pref:currency',
  ASSET_TYPE: 'pref:assetType',
} as const;

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

