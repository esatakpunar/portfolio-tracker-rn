# Profit / Loss UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Portföy ekranında toplam ve varlık bazında kar/zarar (TL + %) göster.

**Architecture:** Pure functions in `portfolioUtils`; Redux selectors; `PortfolioProfitSummary` + group row snippet.

**Tech Stack:** Redux Toolkit, existing `calculateAverageCost` / `calculateProfitLoss`.

## Global Constraints

- i18n TR/EN/DE; theme tokens; hide P/L when cost unknown (spec rule).

---

### Task 1: Aggregation helpers

**Files:**
- Modify: `src/utils/portfolioUtils.ts`

**Interfaces:**
- Produces:
  - `export function getAssetProfitLoss(type, items, history, prices): { costTL, currentTL, amount, profit: { amount, percentage } } | null`
  - `export function getPortfolioProfitLoss(items, history, prices): { costTL, currentTL, profit } | null`

- [ ] **Step 1:** Implement `getAssetProfitLoss` — sum items by type, `currentTL` via price × amount (reuse slice logic pattern from `getItemValueInTL` — import or duplicate minimal helper in utils to avoid circular deps).
- [ ] **Step 2:** `getPortfolioProfitLoss` — sum cost/current for types where `getAssetProfitLoss` non-null; return null if any held type with amount>0 lacks cost.
- [ ] **Step 3:** Manuel — console.log with fixture history from dev app.

---

### Task 2: Selectors

**Files:**
- Modify: `src/store/portfolioSlice.ts`

- [ ] **Step 1:** `selectProfitLossByAssetType: (type) => (state) => ...`
- [ ] **Step 2:** `selectPortfolioProfitLoss`

---

### Task 3: PortfolioProfitSummary component

**Files:**
- Create: `src/components/PortfolioProfitSummary.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1:** Card: cost, value, profit amount, profit %; colors `colors.success` / `colors.error`.
- [ ] **Step 2:** Locale keys: reuse `profitLoss`, `averageCost`; add `totalCost`, `currentValue` if missing.

---

### Task 4: PortfolioScreen integration

**Files:**
- Modify: `src/screens/PortfolioScreen.tsx`

- [ ] **Step 1:** Place summary below total header.
- [ ] **Step 2:** In `renderAssetGroup`, call selector per type; subline `% · ±₺`.
- [ ] **Step 3:** Manuel — portfolio with priced history shows green/red; empty cost hides block.

---
