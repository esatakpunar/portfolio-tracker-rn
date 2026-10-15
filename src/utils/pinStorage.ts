import * as Crypto from 'expo-crypto';
import { getDatabase, waitForDatabase } from '../services/database';

const PIN_ENABLED_KEY = 'app_pin_enabled';
const PIN_HASH_KEY = 'app_pin_hash';
const PIN_SALT_KEY = 'app_pin_salt';

async function setSetting(key: string, value: string): Promise<void> {
  await waitForDatabase();
  const db = getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, value, Date.now()]
  );
}

async function getSetting(key: string): Promise<string | null> {
  await waitForDatabase();
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
}

export async function isPinEnabled(): Promise<boolean> {
  const v = await getSetting(PIN_ENABLED_KEY);
  return v === '1';
}

export async function setPinEnabled(enabled: boolean): Promise<void> {
  await setSetting(PIN_ENABLED_KEY, enabled ? '1' : '0');
}

export async function setPin(pin: string): Promise<void> {
  const salt = Math.random().toString(36).slice(2);
  const hash = await hashPin(pin, salt);
  await setSetting(PIN_SALT_KEY, salt);
  await setSetting(PIN_HASH_KEY, hash);
  await setPinEnabled(true);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const salt = await getSetting(PIN_SALT_KEY);
  const stored = await getSetting(PIN_HASH_KEY);
  if (!salt || !stored) {
    return false;
  }
  const hash = await hashPin(pin, salt);
  return hash === stored;
}

export async function clearPin(): Promise<void> {
  await setSetting(PIN_HASH_KEY, '');
  await setSetting(PIN_SALT_KEY, '');
  await setPinEnabled(false);
}
