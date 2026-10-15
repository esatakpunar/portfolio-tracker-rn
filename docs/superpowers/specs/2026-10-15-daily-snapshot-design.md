# Günlük TL toplam snapshot — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** —

## Goal

Her takvim günü için portföy toplam değeri (TL) bir kez kaydedilsin; liste halinde gösterilsin (grafik şart değil).

## Trigger

After successful `fetchPrices.fulfilled` (not backup-only failure path optional — **record when prices applied and total computable**): if no row for **today** (Europe/Istanbul calendar date), insert snapshot.

## Storage

SQLite table (schema v5):

```sql
CREATE TABLE daily_portfolio_snapshots (
  date TEXT PRIMARY KEY,  -- YYYY-MM-DD Europe/Istanbul
  total_tl REAL NOT NULL,
  recorded_at INTEGER NOT NULL
);
```

Redux optional mirror `snapshots: DailySnapshot[]` loaded at startup for UI; write-through on insert.

## UI

- New section in History tab or Settings sub-screen “Günlük toplam”: FlatList `date → formatCurrency(total_tl)`.
- Empty state when no snapshots.

## Rules

- One row per calendar day (first successful record wins; same-day later opens do not update — per conversation).
- If total TL null/0 and no items, skip insert.

## Non-goals

- Intraday updates, charts, export v1 (export v2 can add `dailySnapshots`).

## Manual test

- Change device date / mock: two days → two rows.
- Same day reopen → still one row.
