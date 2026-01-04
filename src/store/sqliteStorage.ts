import { getDatabase, waitForDatabase } from '../services/database';

const REDUX_PERSIST_KEY = 'redux_persist:root';

export async function getItem(key: string): Promise<string | null> {
  try {
    if (key !== 'persist:root') {
      return null;
    }

    await waitForDatabase();

    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM app_settings WHERE key = ?`,
        [REDUX_PERSIST_KEY]
      );

      return row?.value || null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (key !== 'persist:root') {
      return;
    }

    await waitForDatabase();

    try {
      const db = getDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)`,
        [REDUX_PERSIST_KEY, value, Date.now()]
      );
    } catch {
      // Silently fail - storage errors shouldn't break the app
    }
  } catch {
    // Silently fail
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (key !== 'persist:root') {
      return;
    }

    await waitForDatabase();

    try {
      const db = getDatabase();
      await db.runAsync(
        `DELETE FROM app_settings WHERE key = ?`,
        [REDUX_PERSIST_KEY]
      );
    } catch {
      // Silently fail
    }
  } catch {
    // Silently fail
  }
}

export async function getAllKeys(): Promise<string[]> {
  try {
    await waitForDatabase();

    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{ key: string }>(
        `SELECT key FROM app_settings WHERE key LIKE 'redux_persist:%'`
      );

      return rows.map(row => {
        if (row.key === REDUX_PERSIST_KEY) {
          return 'persist:root';
        }
        return row.key.replace('redux_persist:', 'persist:');
      });
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}

export const sqliteStorage = {
  getItem,
  setItem,
  removeItem,
  getAllKeys,
};

