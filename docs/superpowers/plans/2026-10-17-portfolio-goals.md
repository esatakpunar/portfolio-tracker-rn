# Portfolio Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Single active portfolio goal with progress UI.

**Architecture:** Types + preferenceStorage JSON; utils for progress; modal + card.

**Tech Stack:** SQLite app_settings, bottom sheet modal pattern.

## Global Constraints

- One active goal; i18n TR/EN/DE.

---

### Task 1: Types and storage

**Files:** Modify `src/types/index.ts`, `src/utils/preferenceStorage.ts`

- [x] **Step 1:** `PortfolioGoal` type.
- [x] **Step 2:** `getPortfolioGoal`, `savePortfolioGoal`, `clearPortfolioGoal`.

### Task 2: goalUtils

**Files:** Create `src/utils/goalUtils.ts`

- [x] **Step 1:** `computeGoalProgress(goal, items, prices)` → `{ current, target, pct }`.

### Task 3: UI

**Files:** Create `PortfolioGoalCard.tsx`, `PortfolioGoalModal.tsx`; modify `PortfolioScreen.tsx`

- [x] **Step 1:** Card + modal (AddItemModal-style sheet).
- [x] **Step 2:** Load/save on open; clear goal action.

### Task 4: Locales

**Files:** `tr.ts`, `en.ts`, `de.ts`

- [x] **Step 1:** All goal strings.
