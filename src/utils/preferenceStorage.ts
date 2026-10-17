import { getDatabase, waitForDatabase } from '../services/database';
import { CurrencyType, AssetType, PortfolioGoal, PortfolioGoalsByWallet } from '../types';
import {
  ALL_ONBOARDING_STEP_IDS,
  createEmptyOnboardingState,
  createLegacyUserOnboardingState,
  OnboardingState,
  OnboardingStepId,
  ONBOARDING_STEPS,
  ONBOARDING_VERSION,
} from '../types/onboarding';
import { DEFAULT_WALLET_ID } from './walletUtils';

const PREFERENCE_KEYS = {
  CURRENCY: 'pref:currency',
  ASSET_TYPE: 'pref:assetType',
  PRICE_SOURCE: 'pref:priceSource',
  ZAKAT_DEBT: 'pref:zakatDebt',
  PORTFOLIO_GOAL: 'pref:portfolioGoal',
  AUTO_BACKUP_ENABLED: 'pref:autoBackupEnabled',
  LAST_AUTO_BACKUP_AT: 'pref:lastAutoBackupAt',
  ONBOARDING: 'pref:onboarding',
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

function normalizePortfolioGoal(raw: unknown): PortfolioGoal | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const parsed = raw as PortfolioGoal;
  if (typeof parsed.target !== 'number' || parsed.target <= 0) {
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
}

function parsePortfolioGoalsJson(value: string): PortfolioGoalsByWallet {
  const parsed: unknown = JSON.parse(value);
  if (parsed && typeof parsed === 'object' && 'kind' in parsed && 'target' in parsed) {
    const legacy = normalizePortfolioGoal(parsed);
    return legacy ? { [DEFAULT_WALLET_ID]: legacy } : {};
  }
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }
  const result: PortfolioGoalsByWallet = {};
  for (const [walletId, goalRaw] of Object.entries(parsed)) {
    const goal = normalizePortfolioGoal(goalRaw);
    if (goal) {
      result[walletId] = goal;
    }
  }
  return result;
}

async function readPortfolioGoalsByWallet(): Promise<PortfolioGoalsByWallet> {
  await waitForDatabase();
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [PREFERENCE_KEYS.PORTFOLIO_GOAL]
  );
  if (!row?.value) {
    return {};
  }
  try {
    return parsePortfolioGoalsJson(row.value);
  } catch {
    return {};
  }
}

async function writePortfolioGoalsByWallet(goals: PortfolioGoalsByWallet): Promise<void> {
  await waitForDatabase();
  const db = getDatabase();
  const keys = Object.keys(goals);
  if (keys.length === 0) {
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, [PREFERENCE_KEYS.PORTFOLIO_GOAL]);
    return;
  }
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
    [PREFERENCE_KEYS.PORTFOLIO_GOAL, JSON.stringify(goals), Date.now()]
  );
}

export async function getPortfolioGoalsByWallet(): Promise<PortfolioGoalsByWallet> {
  try {
    return await readPortfolioGoalsByWallet();
  } catch {
    return {};
  }
}

export async function getPortfolioGoalForWallet(
  walletId: string
): Promise<PortfolioGoal | null> {
  try {
    const goals = await readPortfolioGoalsByWallet();
    return goals[walletId] ?? null;
  } catch {
    return null;
  }
}

export async function savePortfolioGoalForWallet(
  walletId: string,
  goal: PortfolioGoal
): Promise<void> {
  try {
    const goals = await readPortfolioGoalsByWallet();
    goals[walletId] = goal;
    await writePortfolioGoalsByWallet(goals);
  } catch {
    // Silently fail
  }
}

export async function clearPortfolioGoalForWallet(walletId: string): Promise<void> {
  try {
    const goals = await readPortfolioGoalsByWallet();
    if (!(walletId in goals)) {
      return;
    }
    delete goals[walletId];
    await writePortfolioGoalsByWallet(goals);
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

const VALID_ONBOARDING_STEP_SET = new Set<string>(ALL_ONBOARDING_STEP_IDS);

function normalizeOnboardingState(raw: unknown): OnboardingState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const parsed = raw as OnboardingState;
  if (typeof parsed.version !== 'number' || !Array.isArray(parsed.completedSteps)) {
    return null;
  }
  const completedSteps = parsed.completedSteps.filter(
    (id): id is OnboardingStepId =>
      typeof id === 'string' && VALID_ONBOARDING_STEP_SET.has(id)
  );
  const welcomeCompletedAt =
    parsed.welcomeCompletedAt == null || typeof parsed.welcomeCompletedAt === 'number'
      ? parsed.welcomeCompletedAt
      : null;
  const dismissedAt =
    parsed.dismissedAt == null || typeof parsed.dismissedAt === 'number'
      ? parsed.dismissedAt
      : null;
  return {
    version: parsed.version,
    welcomeCompletedAt,
    dismissedAt,
    completedSteps,
    currencySwipeSeen: parsed.currencySwipeSeen === true,
  };
}

async function readOnboardingStateRaw(): Promise<OnboardingState | null> {
  await waitForDatabase();
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [PREFERENCE_KEYS.ONBOARDING]
  );
  if (!row?.value) {
    return null;
  }
  try {
    return normalizeOnboardingState(JSON.parse(row.value));
  } catch {
    return null;
  }
}

async function writeOnboardingState(state: OnboardingState): Promise<void> {
  await waitForDatabase();
  const db = getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
    [PREFERENCE_KEYS.ONBOARDING, JSON.stringify(state), Date.now()]
  );
}

export interface GetOnboardingStateOptions {
  /** When unset in DB and count > 0, mark all steps complete (existing portfolio). */
  portfolioItemCount?: number;
  /** Settings “replay tour”: do not auto-migrate legacy completion. */
  forceFresh?: boolean;
}

export async function getOnboardingState(
  options?: GetOnboardingStateOptions
): Promise<OnboardingState> {
  try {
    const existing = await readOnboardingStateRaw();
    if (existing) {
      if (existing.version < ONBOARDING_VERSION) {
        const upgraded: OnboardingState = {
          ...existing,
          version: ONBOARDING_VERSION,
        };
        await writeOnboardingState(upgraded);
        return upgraded;
      }
      return existing;
    }

    const itemCount = options?.portfolioItemCount ?? 0;
    if (!options?.forceFresh && itemCount > 0) {
      const migrated = createLegacyUserOnboardingState();
      await writeOnboardingState(migrated);
      return migrated;
    }

    return createEmptyOnboardingState();
  } catch {
    return createEmptyOnboardingState();
  }
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  try {
    await writeOnboardingState({
      ...state,
      version: ONBOARDING_VERSION,
    });
  } catch {
    // Silently fail
  }
}

export async function completeOnboardingStep(
  stepId: OnboardingStepId,
  options?: GetOnboardingStateOptions
): Promise<OnboardingState> {
  const state = await getOnboardingState(options);
  if (state.completedSteps.includes(stepId)) {
    return state;
  }
  const now = Date.now();
  const next: OnboardingState = {
    ...state,
    completedSteps: [...state.completedSteps, stepId],
    version: ONBOARDING_VERSION,
  };
  if (stepId === ONBOARDING_STEPS.WELCOME_DONE) {
    next.welcomeCompletedAt = now;
  }
  if (stepId === ONBOARDING_STEPS.SEE_TOTAL_CURRENCY) {
    next.currencySwipeSeen = true;
  }
  await saveOnboardingState(next);
  return next;
}

export async function dismissOnboardingChecklist(
  options?: GetOnboardingStateOptions
): Promise<OnboardingState> {
  const state = await getOnboardingState(options);
  const next: OnboardingState = {
    ...state,
    dismissedAt: Date.now(),
  };
  await saveOnboardingState(next);
  return next;
}

export async function resetOnboarding(): Promise<void> {
  try {
    await waitForDatabase();
    const db = getDatabase();
    await db.runAsync(`DELETE FROM app_settings WHERE key = ?`, [PREFERENCE_KEYS.ONBOARDING]);
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

