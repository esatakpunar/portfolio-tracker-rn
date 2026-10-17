# Portfolio Allocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** TL bazlı kategori dağılımı kartı on Portfolio screen.

**Architecture:** Pure `allocationUtils`; presentational `PortfolioAllocationCard`.

**Tech Stack:** React Native, existing theme/i18n.

## Global Constraints

- i18n TR/EN/DE; theme constants; no chart library.
- Categories: gold, silver, forex, tl.

---

### Task 1: allocationUtils

**Files:** Create `src/utils/allocationUtils.ts`

- [x] **Step 1:** `AllocationCategory`, `AllocationSegment`, `computePortfolioAllocation`.
- [x] **Step 2:** Map asset types to categories; handle null prices → unknown bucket.

### Task 2: PortfolioAllocationCard

**Files:** Create `src/components/PortfolioAllocationCard.tsx`

- [x] **Step 1:** List + horizontal bar per segment.
- [x] **Step 2:** Hide when no priced total.

### Task 3: Integrate + locales

**Files:** Modify `PortfolioScreen.tsx`, `tr.ts`, `en.ts`, `de.ts`

- [x] **Step 1:** Place below profit summary.
- [ ] **Step 2:** Manual test with mixed assets.
