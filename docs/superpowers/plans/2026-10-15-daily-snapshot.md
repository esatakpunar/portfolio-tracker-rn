# Daily TL Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Günde bir kez toplam TL snapshot kaydet ve listele.

**Architecture:** SQLite table + service; hook after `fetchPrices.fulfilled`; UI list.

**Tech Stack:** expo-sqlite, SCHEMA_VERSION 5.

## Global Constraints

- Timezone: `Europe/Istanbul` for date key `YYYY-MM-DD`.
- One insert per day (first wins).

---

### Task 1: Database migration

**Files:**
- Modify: `src/services/database.ts`

- [ ] **Step 1:** `SCHEMA_VERSION = 5`; migration create `daily_portfolio_snapshots`.
- [ ] **Step 2:** `createSchema` includes table for fresh installs.

---

### Task 2: Snapshot service

**Files:**
- Create: `src/services/dailySnapshotService.ts`

**Interfaces:**
- Produces: `getTodayDateKey(): string`
- Produces: `recordSnapshotIfMissing(totalTl: number): Promise<void>`
- Produces: `getAllSnapshots(): Promise<{ date: string; totalTl: number }[]>`

- [ ] **Step 1:** Implement date key with `Intl` or manual offset for Istanbul.
- [ ] **Step 2:** `INSERT OR IGNORE` or check-then-insert.

---

### Task 3: Trigger on price fetch

**Files:**
- Modify: `src/store/portfolioSlice.ts` (`fetchPrices.fulfilled`)
- Modify: `App.tsx` or middleware — avoid circular import: call service from fulfilled extraReducer with `getState()` total

- [ ] **Step 1:** After prices applied and not partial failure, compute `selectTotalTL` equivalent inline, call `recordSnapshotIfMissing`.
- [ ] **Step 2:** Skip if `items.length === 0`.

---

### Task 4: UI list

**Files:**
- Create: `src/screens/DailyTotalsScreen.tsx` OR section in `HistoryScreen.tsx`
- Modify: `src/navigation/BottomTabNavigator.tsx` if new screen
- Modify: locales

- [ ] **Step 1:** FlatList snapshots newest first.
- [ ] **Step 2:** Entry from History header link “Günlük toplamlar”.
- [ ] **Step 3:** Manuel — two days mock → two rows.

---
