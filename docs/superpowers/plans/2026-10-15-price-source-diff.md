# Price Source Diff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Truncgil vs Investing toplam portföy TL farkını göster.

**Architecture:** One-shot dual fetch service; UI card in Settings or Portfolio.

**Tech Stack:** Existing `fetchPricesFromTruncgil`, `fetchPricesFromInvesting`, portfolio total helper.

## Global Constraints

- Does not change user's `priceSource` preference.

---

### Task 1: Compare service

**Files:**
- Create: `src/services/priceCompareService.ts`

**Interfaces:**
- Produces: `export async function comparePriceSources(items: PortfolioItem[]): Promise<{ truncgilTotal: number | null; investingTotal: number | null; diff: number | null; diffPct: number | null }>`

- [ ] **Step 1:** Parallel fetch with AbortSignal timeout 15s each.
- [ ] **Step 2:** Reuse `getItemValueInTL` logic — extract shared `computeTotalTL(items, prices)` to `portfolioUtils.ts` if not already from P/L task.

---

### Task 2: UI card

**Files:**
- Create: `src/components/PriceSourceCompareCard.tsx`
- Modify: `src/screens/SettingsScreen.tsx` or `PortfolioScreen.tsx`
- Modify: locales (`comparePriceSources`, `difference`)

- [ ] **Step 1:** Button triggers loading state, displays two totals + delta.
- [ ] **Step 2:** Manuel — WiFi on, both APIs return numbers.

---
