# History Undo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Geçmiş satırından envanter tutarlı geri alma.

**Architecture:** `HistoryItem.id`; `undoHistoryEntry` reducer; Swipeable on HistoryScreen.

**Tech Stack:** react-native-gesture-handler (existing), Redux.

## Global Constraints

- Undo removes history row; recalculates items; no orphan lots.

---

### Task 1: HistoryItem.id migration

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/store/portfolioSlice.ts` (addItem/remove/update push history with `id: Date.now().toString()` or uuid)
- Modify: `App.tsx` restore path — `ensureHistoryIds(history)` before dispatch

**Interfaces:**
- Produces: `export function ensureHistoryIds(history: HistoryItem[]): HistoryItem[]`

- [ ] **Step 1:** Add `id: string` to `HistoryItem`.
- [ ] **Step 2:** All history pushes include unique `id`.
- [ ] **Step 3:** On restore, map entries missing id → `hist-${created}-${Math.random()}`.

---

### Task 2: undoHistoryEntry reducer

**Files:**
- Modify: `src/store/portfolioSlice.ts`

- [ ] **Step 1:** Find by id; if `add` → `removeItem` by `item.id`; if `remove` → push item back to `items`; filter history entry out.
- [ ] **Step 2:** If `update` with `previousAmount` — optional v1 skip with Alert “unsupported”.
- [ ] **Step 3:** Manuel — add then undo → empty portfolio.

---

### Task 3: HistoryScreen UI

**Files:**
- Modify: `src/screens/HistoryScreen.tsx`
- Modify: `src/locales/*.ts` (`undoTransaction`, `undoConfirm`)

- [ ] **Step 1:** Swipeable row or long press menu → Alert confirm → dispatch undo.
- [ ] **Step 2:** Haptic success/error.
- [ ] **Step 3:** Manuel — remove undo restores balance.

---
