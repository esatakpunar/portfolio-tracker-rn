# History CSV Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Share history as CSV.

**Architecture:** `historyExportService` mirroring `backupService` share flow.

**Tech Stack:** expo-file-system legacy, expo-sharing.

## Global Constraints

- UTF-8 with BOM for Excel; i18n button labels only (CSV headers English).

---

### Task 1: Service

**Files:** Create `src/services/historyExportService.ts`

- [ ] **Step 1:** Escape CSV fields; build rows from `HistoryItem[]`.
- [ ] **Step 2:** `exportHistoryCsvToShare`.

### Task 2: UI entry

**Files:** Modify `HistoryScreen.tsx` or `AppSettingsScreen.tsx`, locales

- [ ] **Step 1:** Export button + error alert.
- [ ] **Step 2:** Manual share test.
