import { getDatabase, waitForDatabase } from './database';

export function getTodayDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Upserts today's snapshot so intraday portfolio changes are reflected in daily totals. */
export async function recordDailySnapshot(totalTl: number): Promise<void> {
  if (!isFinite(totalTl) || totalTl <= 0) {
    return;
  }
  await waitForDatabase();
  const db = getDatabase();
  const dateKey = getTodayDateKey();
  const recordedAt = Date.now();
  await db.runAsync(
    `INSERT INTO daily_portfolio_snapshots (date, total_tl, recorded_at) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET total_tl = excluded.total_tl, recorded_at = excluded.recorded_at`,
    [dateKey, totalTl, recordedAt]
  );
}

/** @deprecated Use recordDailySnapshot */
export async function recordSnapshotIfMissing(totalTl: number): Promise<void> {
  await recordDailySnapshot(totalTl);
}

export async function getAllSnapshots(): Promise<{ date: string; totalTl: number }[]> {
  await waitForDatabase();
  const db = getDatabase();
  const rows = await db.getAllAsync<{ date: string; total_tl: number }>(
    `SELECT date, total_tl FROM daily_portfolio_snapshots ORDER BY date DESC`
  );
  return rows.map((row) => ({ date: row.date, totalTl: row.total_tl }));
}
