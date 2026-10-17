# Auto Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Remind + optional one-tap export when backup stale.

**Architecture:** Preferences + `autoBackupService` calling existing `exportBackupToFile`.

**Tech Stack:** app_settings, App.tsx or Settings banner.

## Global Constraints

- Same JSON format as manual backup; user-initiated share for v1.

---

### Task 1: Preferences

**Files:** `preferenceStorage.ts`

- [x] **Step 1:** `autoBackupEnabled`, `lastAutoBackupAt`.

### Task 2: Service + banner

**Files:** Create `src/services/autoBackupService.ts`, modify `AppSettingsScreen.tsx`

- [x] **Step 1:** `shouldPromptAutoBackup()`, record timestamp on export.
- [x] **Step 2:** Settings toggle + “Yedek al” when stale.

### Task 3: Locales

- [x] **Step 1:** TR/EN/DE strings.
