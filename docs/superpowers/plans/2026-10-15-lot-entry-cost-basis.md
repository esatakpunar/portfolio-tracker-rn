# Lot Entry (Tarih, Alış, Tag) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcı varlık eklerken alış tarihi, birim/toplam TL maliyeti ve kaynak etiketi girebilsin.

**Architecture:** `portfolioSlice` payload genişletmesi; modal UI; `priceAtTime` history’de toplam TL olarak kalır. Tag’ler `description` alanında.

**Tech Stack:** React Native 0.81, Expo 54, Redux Toolkit, i18next, `@react-native-community/datetimepicker` (eklenecek).

## Global Constraints

- Tüm kullanıcı metinleri TR/EN/DE (`src/locales/*.ts`).
- Tema: `src/theme/index.ts`.
- Maliyet hesabı LIFO ile uyumlu: history `priceAtTime` = **toplam TL**.
- Commit only when user asks.

---

### Task 1: Tag sabitleri ve çeviriler

**Files:**
- Create: `src/utils/sourceTags.ts`
- Modify: `src/locales/tr.ts`, `src/locales/en.ts`, `src/locales/de.ts`

**Interfaces:**
- Produces: `export const SOURCE_TAG_KEYS`, `export function getSourceTagLabel(key, t)`

- [ ] **Step 1:** `sourceTags.ts` — keys `ziraat`, `somut`, `yapikredi`, `banka_kasasi`, `other` + `getSourceTagLabel`.
- [ ] **Step 2:** Locale keys: `sourceTags.*`, `transactionDate`, `unitBuyPrice`, `totalCost`, `selectTag`.
- [ ] **Step 3:** Manuel — Ayarlar dışı, sadece locale dosyalarını açıp key’lerin üç dilde dolu olduğunu kontrol et.

---

### Task 2: Redux — transactionDate ve unitBuyPrice

**Files:**
- Modify: `src/store/portfolioSlice.ts` (`addItem`, `updateItemAmount` add branch)
- Modify: `src/types/index.ts` (optional payload type export)

**Interfaces:**
- Consumes: existing `getItemValueInTL`
- Produces: `addItem` accepts `{ transactionDate?: string; unitBuyPrice?: number | null; priceAtTime?: number | null }`

- [ ] **Step 1:** `resolvePriceAtTime(amount, unitBuyPrice, priceAtTime, type, prices)` helper in slice file:

```typescript
function resolvePriceAtTime(
  type: AssetType,
  amount: number,
  unitBuyPrice: number | null | undefined,
  priceAtTime: number | null | undefined,
  prices: Prices,
  useExplicitTotal: boolean
): number | null {
  if (useExplicitTotal && priceAtTime != null) return priceAtTime;
  if (unitBuyPrice != null && unitBuyPrice >= 0 && type === 'tl') return amount;
  if (unitBuyPrice != null && unitBuyPrice >= 0) return unitBuyPrice * amount;
  if (priceAtTime != null) return priceAtTime;
  return getItemValueInTL({ type, amount, id: '', date: '' }, prices);
}
```

- [ ] **Step 2:** `addItem` — set `newItem.date` from `transactionDate ?? new Date().toISOString()`; history `date` same; pass resolved `priceAtTime`.
- [ ] **Step 3:** `updateItemAmount` add branch — same date/cost fields from payload.
- [ ] **Step 4:** Manuel — Redux DevTools/log: add item with unit 6800, amount 5 → history `priceAtTime === 34000`.

---

### Task 3: AddItemModal UI

**Files:**
- Modify: `src/components/AddItemModal.tsx`
- Modify: `src/screens/PortfolioScreen.tsx` (onAdd handler passes new fields)

**Interfaces:**
- Consumes: `onAdd(type, amount, description?, priceAtTime?, transactionDate?, unitBuyPrice?)`

- [ ] **Step 1:** `npx expo install @react-native-community/datetimepicker`
- [ ] **Step 2:** State: `transactionDate: Date`, `unitBuyPrice: string`, `totalCostDirty: boolean`.
- [ ] **Step 3:** Birim fiyat değişince `priceAtTime` = unit × amount; total alanı sync; user total edit → `totalCostDirty = true`.
- [ ] **Step 4:** Tag chip row → sets `description` to translated label.
- [ ] **Step 5:** Date picker (iOS modal / Android default).
- [ ] **Step 6:** Manuel — simülatörde geçmiş tarih + Somut tag + gram altın birim fiyat.

---

### Task 4: QuickAddModal parity

**Files:**
- Modify: `src/components/QuickAddModal.tsx`
- Modify: `src/screens/PortfolioScreen.tsx` (quick add dispatch)

- [ ] **Step 1:** Aynı date + unit + tag UI (compact layout).
- [ ] **Step 2:** `updateItemAmount` dispatch with new payload fields.
- [ ] **Step 3:** Manuel — quick add ile tarih/maliyet history’de görünür.

---

**Plan self-review:** Spec requirements 1–4 covered. History undo `id` deferred to history-undo plan.
