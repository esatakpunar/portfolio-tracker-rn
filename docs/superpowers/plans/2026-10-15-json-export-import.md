# JSON Export / Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Replace-only backup: export `items` + `history` JSON; import replaces Redux state.

**Architecture:** `backupService.ts` validate + serialize; Settings UI; expo file + sharing.

**Tech Stack:** expo-file-system, expo-sharing, expo-document-picker.

## Global Constraints

- Format `portfolio-tracker-backup` version `1`; no merge; confirm Alert on import.

---

### Task 1: Schema types and validation

**Files:**
- Create: `src/types/backup.ts`
- Create: `src/services/backupService.ts`

**Interfaces:**
- Produces: `export function buildBackupPayload(items, history): PortfolioBackupV1`
- Produces: `export function parseBackupJson(raw: string): { ok: true, data } | { ok: false, error: string }`

- [ ] **Step 1:** Types:

```typescript
export interface PortfolioBackupV1 {
  format: 'portfolio-tracker-backup';
  version: 1;
  exportedAt: string;
  appVersion: string;
  data: { items: PortfolioItem[]; history: HistoryItem[] };
}
```

- [ ] **Step 2:** `parseBackupJson` — JSON.parse, check format/version, validate arrays and required item fields (`id`, `type`, `amount`, `date`).
- [ ] **Step 3:** `buildBackupPayload` from app.json version.

---

### Task 2: File export/import IO

**Files:**
- Modify: `src/services/backupService.ts`

- [ ] **Step 1:** `npx expo install expo-file-system expo-sharing expo-document-picker`
- [ ] **Step 2:** `exportBackupToFile(items, history)` → write cache `portfolio-backup-YYYY-MM-DD.json`, `Sharing.shareAsync`.
- [ ] **Step 3:** `importBackupFromPicker(): Promise<PortfolioBackupV1 | null>` — DocumentPicker, read UTF-8, parse.

---

### Task 3: Redux import action

**Files:**
- Modify: `src/store/portfolioSlice.ts`

- [ ] **Step 1:** `importBackup: (state, action: PayloadAction<{ items; history }>)` — replace items/history, keep prices/language.
- [ ] **Step 2:** Export action creator.

---

### Task 4: Settings UI

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/locales/tr.ts`, `en.ts`, `de.ts`

- [ ] **Step 1:** Section “Veri yedekleme”: Export / Import buttons.
- [ ] **Step 2:** Import flow: Alert warning → pick file → parse error toast → dispatch `importBackup` → `fetchPrices`.
- [ ] **Step 3:** Manuel — export file, reset app, import, verify counts match.

---
