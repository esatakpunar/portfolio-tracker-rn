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

- [x] **Step 1:** `walletId` on items; normalize missing → default.

### Task 2: Wallet CRUD prefs

**Files:** `preferenceStorage.ts`, wallet utils

- [x] **Step 1:** List/create/rename/delete wallets (Redux + `walletUtils`).

### Task 3: UI

**Files:** `PortfolioScreen`, modals, selectors

- [x] **Step 1:** Active wallet chips; filter groupedItems.
- [x] **Step 2:** Add flow sets walletId (active wallet).

### Task 4: Backup bump (optional same release)

**Files:** `backup.ts`, `backupService.ts`

- [x] **Step 1:** version 2 with wallets array.
