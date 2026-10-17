# iOS Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Home screen widget showing total TL.

**Architecture:** Native widget target + shared payload writer in JS.

**Tech Stack:** Expo widgets / prebuild, EAS production.

## Global Constraints

- No P/L on widget; reload on price fetch + portfolio change.

---

### Task 1: Shared payload writer

**Files:** Create `src/services/widgetSnapshotService.ts`, modify `store/index.ts`

- [x] **Step 1:** Write formatted total + updated time via `updateSnapshot`.
- [x] **Step 2:** Hook same triggers as daily snapshot (`store/index.ts`).

### Task 2: Native widget

**Files:** `app.json` plugins, ios widget extension via prebuild docs

- [x] **Step 1:** `PortfolioTotalWidget` + `expo-widgets` plugin in `app.json`.
- [ ] **Step 2:** EAS production build + TestFlight widget QA.

### Task 3: Manual QA

- [ ] **Step 1:** Device TestFlight widget refresh.
