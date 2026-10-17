# Multi-Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Filter portfolio by wallet; persist walletId on items.

**Architecture:** Schema via item field + wallet list in settings; migration on load.

**Tech Stack:** Redux slice, backup v2 optional later.

## Global Constraints

- Default wallet `default`; snapshot/zakat rules per spec.

---

### Task 1: Types + migration

**Files:** `types/index.ts`, `portfolioSlice.ts`, `App.tsx` restore

- [ ] **Step 1:** `walletId` on items; normalize missing → default.

### Task 2: Wallet CRUD prefs

**Files:** `preferenceStorage.ts`, wallet utils

- [ ] **Step 1:** List/create/rename/delete wallets (min: list + select).

### Task 3: UI

**Files:** `PortfolioScreen`, modals, selectors

- [ ] **Step 1:** Active wallet chips; filter groupedItems.
- [ ] **Step 2:** Add flow sets walletId.

### Task 4: Backup bump (optional same release)

**Files:** `backup.ts`, `backupService.ts`

- [ ] **Step 1:** version 2 with wallets array.
