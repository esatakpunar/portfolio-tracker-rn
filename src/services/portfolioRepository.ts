import { getDatabase } from './database';
import { PortfolioItem, HistoryItem, Prices, PriceChanges, AssetType } from '../types';

/**
 * Portfolio Repository - Domain-specific CRUD operations for portfolio data
 * All operations use SQLite transactions where needed for atomicity
 */

// Get all portfolio items
export async function getAllItems(): Promise<PortfolioItem[]> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      type: string;
      amount: number;
      description: string | null;
      date: string;
    }>(
      `SELECT id, type, amount, description, date 
       FROM portfolio_items 
       ORDER BY created_at ASC`
    );

    return rows.map(row => ({
      id: row.id,
      type: row.type as AssetType,
      amount: row.amount,
      description: row.description || undefined,
      date: row.date,
    }));
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error getting items:', error);
    }
    return [];
  }
}

// Add a new portfolio item and create history entry (transaction)
export async function addItem(item: Omit<PortfolioItem, 'id' | 'date'>): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();
    const id = now.toString();
    const date = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      // Insert item
      await db.runAsync(
        `INSERT INTO portfolio_items (id, type, amount, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, item.type, item.amount, item.description || null, date, now]
      );

      // Insert history entry
      const historyId = `${now}_add`;
      await db.runAsync(
        `INSERT INTO portfolio_history 
         (id, type, item_id, item_type, item_amount, item_description, item_date, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          historyId,
          'add',
          id,
          item.type,
          item.amount,
          item.description || null,
          date,
          item.description || null,
          date,
          now,
        ]
      );
    });

    if (__DEV__) {
      console.log('[REPOSITORY] Item added:', id);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error adding item:', error);
    }
    throw error;
  }
}

// Remove a portfolio item and create history entry (transaction)
export async function removeItem(itemId: string): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();
    const date = new Date().toISOString();

    // First get the item to be removed for history
    const item = await db.getFirstAsync<{
      type: string;
      amount: number;
      description: string | null;
      date: string;
    }>(
      `SELECT type, amount, description, date 
       FROM portfolio_items 
       WHERE id = ?`,
      [itemId]
    );

    if (!item) {
      if (__DEV__) {
        console.warn('[REPOSITORY] Item not found for removal:', itemId);
      }
      return;
    }

    await db.withTransactionAsync(async () => {
      // Delete item
      await db.runAsync(
        `DELETE FROM portfolio_items WHERE id = ?`,
        [itemId]
      );

      // Insert history entry
      const historyId = `${now}_remove`;
      await db.runAsync(
        `INSERT INTO portfolio_history 
         (id, type, item_id, item_type, item_amount, item_description, item_date, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          historyId,
          'remove',
          itemId,
          item.type,
          item.amount,
          item.description || null,
          item.date,
          null,
          date,
          now,
        ]
      );
    });

    if (__DEV__) {
      console.log('[REPOSITORY] Item removed:', itemId);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error removing item:', error);
    }
    throw error;
  }
}

// Update item amount (handles partial removal/addition with LIFO logic)
// This is a complex operation that may involve multiple items
export async function updateItemAmount(
  type: AssetType,
  newAmount: number,
  description?: string
): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();
    const date = new Date().toISOString();

    // Get current total for this asset type
    const itemsOfType = await db.getAllAsync<{
      id: string;
      amount: number;
    }>(
      `SELECT id, amount FROM portfolio_items WHERE type = ? ORDER BY created_at ASC`,
      [type]
    );

    const currentTotal = itemsOfType.reduce((sum, item) => sum + item.amount, 0);
    const difference = newAmount - currentTotal;

    // If difference is negligible, do nothing
    if (Math.abs(difference) < 0.000001) {
      return;
    }

    await db.withTransactionAsync(async () => {
      if (difference > 0) {
        // Adding more assets - create new item
        const id = now.toString();
        await db.runAsync(
          `INSERT INTO portfolio_items (id, type, amount, description, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, type, difference, description || null, date, now]
        );

        // History entry
        const historyId = `${now}_add`;
        await db.runAsync(
          `INSERT INTO portfolio_history 
           (id, type, item_id, item_type, item_amount, item_description, item_date, description, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            'add',
            id,
            type,
            difference,
            description || null,
            date,
            description || null,
            date,
            now,
          ]
        );
      } else {
        // Removing assets - LIFO (remove from end, newest first)
        const amountToRemove = Math.abs(difference);
        let remainingToRemove = amountToRemove;

        // Iterate backwards through items
        for (let i = itemsOfType.length - 1; i >= 0 && remainingToRemove > 0; i--) {
          const item = itemsOfType[i];
          if (item.amount <= remainingToRemove) {
            // Remove entire item
            remainingToRemove -= item.amount;
            await db.runAsync(`DELETE FROM portfolio_items WHERE id = ?`, [item.id]);
          } else {
            // Reduce amount
            const newAmount = item.amount - remainingToRemove;
            await db.runAsync(
              `UPDATE portfolio_items SET amount = ? WHERE id = ?`,
              [newAmount, item.id]
            );
            remainingToRemove = 0;
          }
        }

        // History entry
        const historyId = `${now}_remove`;
        await db.runAsync(
          `INSERT INTO portfolio_history 
           (id, type, item_id, item_type, item_amount, item_description, item_date, description, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            'remove',
            null,
            type,
            amountToRemove,
            null,
            date,
            description || null,
            date,
            now,
          ]
        );
      }
    });

    if (__DEV__) {
      console.log('[REPOSITORY] Item amount updated:', type, newAmount);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error updating item amount:', error);
    }
    throw error;
  }
}

// Get all prices
export async function getPrices(): Promise<Prices> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      asset_type: string;
      price: number;
    }>(`SELECT asset_type, price FROM portfolio_prices`);

    // Default prices (from portfolioSlice.ts)
    const defaultPrices: Prices = {
      '22_ayar': 2300,
      '24_ayar': 2500,
      ceyrek: 4000,
      tam: 16000,
      usd: 34,
      eur: 36,
      tl: 1,
      gumus: 30,
    };

    // Merge with database values
    const prices: Partial<Prices> = { ...defaultPrices };
    rows.forEach(row => {
      if (row.asset_type in defaultPrices) {
        prices[row.asset_type as keyof Prices] = row.price;
      }
    });

    return prices as Prices;
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error getting prices:', error);
    }
    // Return default prices on error
    return {
      '22_ayar': 2300,
      '24_ayar': 2500,
      ceyrek: 4000,
      tam: 16000,
      usd: 34,
      eur: 36,
      tl: 1,
      gumus: 30,
    };
  }
}

// Set all prices (transaction for atomicity)
export async function setPrices(prices: Partial<Prices>): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      for (const [assetType, price] of Object.entries(prices)) {
        if (typeof price === 'number' && !isNaN(price) && isFinite(price) && price >= 0) {
          await db.runAsync(
            `INSERT OR REPLACE INTO portfolio_prices (asset_type, price, updated_at)
             VALUES (?, ?, ?)`,
            [assetType, price, now]
          );
        }
      }
    });

    if (__DEV__) {
      console.log('[REPOSITORY] Prices updated');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error setting prices:', error);
    }
    throw error;
  }
}

// Get all price changes
export async function getPriceChanges(): Promise<PriceChanges> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      asset_type: string;
      change: number;
    }>(`SELECT asset_type, change FROM portfolio_price_changes`);

    // Default changes (all zeros)
    const defaultChanges: PriceChanges = {
      '22_ayar': 0,
      '24_ayar': 0,
      ceyrek: 0,
      tam: 0,
      usd: 0,
      eur: 0,
      tl: 0,
      gumus: 0,
    };

    // Merge with database values
    const changes: Partial<PriceChanges> = { ...defaultChanges };
    rows.forEach(row => {
      if (row.asset_type in defaultChanges) {
        changes[row.asset_type as keyof PriceChanges] = row.change;
      }
    });

    return changes as PriceChanges;
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error getting price changes:', error);
    }
    // Return default changes on error
    return {
      '22_ayar': 0,
      '24_ayar': 0,
      ceyrek: 0,
      tam: 0,
      usd: 0,
      eur: 0,
      tl: 0,
      gumus: 0,
    };
  }
}

// Set all price changes (transaction for atomicity)
export async function setPriceChanges(changes: Partial<PriceChanges>): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      for (const [assetType, change] of Object.entries(changes)) {
        if (typeof change === 'number' && !isNaN(change) && isFinite(change)) {
          await db.runAsync(
            `INSERT OR REPLACE INTO portfolio_price_changes (asset_type, change, updated_at)
             VALUES (?, ?, ?)`,
            [assetType, change, now]
          );
        }
      }
    });

    if (__DEV__) {
      console.log('[REPOSITORY] Price changes updated');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error setting price changes:', error);
    }
    throw error;
  }
}

// Get all history items
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      type: string;
      item_id: string | null;
      item_type: string;
      item_amount: number;
      item_description: string | null;
      item_date: string;
      previous_amount: number | null;
      description: string | null;
      date: string;
    }>(
      `SELECT id, type, item_id, item_type, item_amount, item_description, item_date, 
              previous_amount, description, date
       FROM portfolio_history 
       ORDER BY date DESC, created_at DESC`
    );

    return rows.map(row => ({
      type: row.type as 'add' | 'remove' | 'update',
      item: {
        id: row.item_id || row.id,
        type: row.item_type as AssetType,
        amount: row.item_amount,
        description: row.item_description || undefined,
        date: row.item_date,
      },
      date: row.date,
      description: row.description || undefined,
      previousAmount: row.previous_amount || undefined,
    }));
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error getting history:', error);
    }
    return [];
  }
}

// Clear all portfolio data (transaction)
export async function clearAll(): Promise<void> {
  try {
    const db = getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM portfolio_items`);
      await db.runAsync(`DELETE FROM portfolio_history`);
      // Note: We don't clear prices and price_changes as they can be refreshed from API
    });

    if (__DEV__) {
      console.log('[REPOSITORY] All portfolio data cleared');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error clearing all data:', error);
    }
    throw error;
  }
}

// Get language setting
export async function getLanguage(): Promise<string> {
  try {
    const db = getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = ?`,
      ['current_language']
    );

    return row?.value || 'tr'; // Default to Turkish
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error getting language:', error);
    }
    return 'tr';
  }
}

// Set language setting
export async function setLanguage(languageCode: string): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();

    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)`,
      ['current_language', languageCode, now]
    );

    if (__DEV__) {
      console.log('[REPOSITORY] Language set:', languageCode);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[REPOSITORY] Error setting language:', error);
    }
    throw error;
  }
}

