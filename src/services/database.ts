import * as SQLite from 'expo-sqlite';

// Database singleton instance
let db: SQLite.SQLiteDatabase | null = null;

// Database initialization promise - tracks when init is complete
let initPromise: Promise<void> | null = null;

// Schema version
const SCHEMA_VERSION = 2;

/**
 * Initialize the database and create schema if needed
 * This should be called once at app startup before any database operations
 * Can be called multiple times safely - returns the same promise if already initializing
 */
export async function initDatabase(): Promise<void> {
  // If already initializing, return the existing promise
  if (initPromise) {
    return initPromise;
  }

  // If already initialized, return immediately
  if (db) {
    return Promise.resolve();
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Open database (creates if doesn't exist)
      db = await SQLite.openDatabaseAsync('portfolio.db');

      // Check current schema version
      const versionResult = await db.getFirstAsync<{ version: number }>(
        "SELECT version FROM schema_version LIMIT 1"
      ).catch(() => null);

      const currentVersion = versionResult?.version || 0;

      if (currentVersion === 0) {
        await createSchema(db);
        await setSchemaVersion(db, SCHEMA_VERSION);
      } else if (currentVersion < SCHEMA_VERSION) {
        await migrateSchema(db, currentVersion, SCHEMA_VERSION);
        await setSchemaVersion(db, SCHEMA_VERSION);
      }
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Wait for database initialization if not ready yet
 * This is useful for storage adapters that might be called before init completes
 */
export async function waitForDatabase(): Promise<void> {
  if (db) {
    return Promise.resolve();
  }
  if (initPromise) {
    // Wait for existing initialization
    try {
      await initPromise;
      return Promise.resolve();
    } catch (error) {
      initPromise = null;
      return initDatabase();
    }
  }
  return initDatabase();
}

/**
 * Get the database instance
 * Throws error if database is not initialized
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 * Useful for cleanup or testing
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Create initial database schema
 */
async function createSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create schema version table first
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  // Create portfolio_items table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Create index on type for grouping queries
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_portfolio_items_type 
    ON portfolio_items(type);
  `);

  // Create portfolio_prices table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS portfolio_prices (
      asset_type TEXT PRIMARY KEY,
      price REAL NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create portfolio_price_changes table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS portfolio_price_changes (
      asset_type TEXT PRIMARY KEY,
      change REAL NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create portfolio_history table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS portfolio_history (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      item_id TEXT,
      item_type TEXT NOT NULL,
      item_amount REAL NOT NULL,
      item_description TEXT,
      item_date TEXT NOT NULL,
      previous_amount REAL,
      description TEXT,
      date TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Create index on date for sorting queries
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_portfolio_history_date 
    ON portfolio_history(date DESC);
  `);

  // Create app_settings table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create price_backup table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS price_backup (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      prices_json TEXT NOT NULL,
      changes_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

/**
 * Set schema version
 */
async function setSchemaVersion(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  // Check if version row exists
  const existing = await database.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1"
  ).catch(() => null);

  if (existing) {
    await database.runAsync(
      "UPDATE schema_version SET version = ?",
      [version]
    );
  } else {
    await database.runAsync(
      "INSERT INTO schema_version (version) VALUES (?)",
      [version]
    );
  }
}

/**
 * Migrate schema from old version to new version
 * Currently no migrations needed, but structure is ready for future changes
 */
async function migrateSchema(
  database: SQLite.SQLiteDatabase,
  fromVersion: number,
  toVersion: number
): Promise<void> {
  // Migration from version 1 to 2: Add price_backup table
  if (fromVersion < 2) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS price_backup (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        prices_json TEXT NOT NULL,
        changes_json TEXT NOT NULL,
        fetched_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    
    // Optional: Migrate existing data from portfolio_prices and portfolio_price_changes
    // This is optional since those tables are typically empty
    // If needed, we could read from those tables and create a backup entry
  }
}

