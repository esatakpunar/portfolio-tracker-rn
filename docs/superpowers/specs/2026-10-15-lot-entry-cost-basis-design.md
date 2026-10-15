# Lot girişi: tarih, alış maliyeti, tag — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** —

## Goal

Her varlık girişinde kullanıcı **alış tarihi**, **maliyet** ve **kaynak etiketi** (Ziraat, Somut, …) girebilsin; geçmişe dönük kayıt mümkün olsun.

## Current state

- `PortfolioItem.date` ve history `date` her zaman ekleme anı.
- `priceAtTime` history’de **işlemin toplam TL maliyeti** (AddItemModal / QuickAdd otomatik: miktar × güncel birim fiyat).
- `description` serbest metin; preset yok.

## Requirements

1. **Transaction date:** Kullanıcı tarih seçer (date picker); varsayılan bugün. `PortfolioItem.date` ve ilgili history kaydının `date` / `item.date` bu değer olur (ISO string, gün seçimi local timezone).
2. **Cost input:**
   - **Birim alış fiyatı** (₺/gr, ₺/USD, …) + miktar → sistem `priceAtTime` = birim × miktar (TL toplam maliyet) olarak history’ye yazar (mevcut LIFO mantığı korunur).
   - TL varlığı: birim = 1, sadece miktar = maliyet.
   - Kullanıcı toplam maliyeti doğrudan da düzenleyebilir (mevcut alan); birim değişince toplam güncellenir, tersi isteğe bağlı (birim öncelikli).
3. **Tags:** Sabit öneriler: `Ziraat`, `Somut`, `Yapıkredi`, `Banka Kasası`, `Diğer`. Chip seçimi + “Diğer” için serbest metin. Depolama: `PortfolioItem.description` (ve history description) — ayrı DB kolonu v1’de gerekmez.
4. **Modals:** `AddItemModal`, `QuickAddModal` (QuickRemove maliyet girişi gerektirmez; tarih opsiyonel değil sadece add tarafında).

## Non-goals

- FIFO seçeneği (LIFO kalır).
- Çoklu para birimi maliyet (hepsi TL maliyet).

## Data model

```typescript
// No new types required if description holds tag text.
// Optional future: tag?: string separate from description — YAGNI for v1.

interface HistoryItem {
  // unchanged; priceAtTime remains total TL cost of that lot transaction
}
```

Slice changes: `addItem` / `updateItemAmount` (add branch) payload:

```typescript
{
  type, amount, description?,
  transactionDate?: string,  // ISO; default now
  unitBuyPrice?: number | null,  // TL per unit; if set, priceAtTime = unit * amount (tl: unit ignored)
  priceAtTime?: number | null,   // override total if user edits total field directly
}
```

**Precedence:** If `priceAtTime` explicitly provided by user (dirty total field), use it. Else if `unitBuyPrice` set, `priceAtTime = unitBuyPrice * amount`. Else current behavior (spot × amount).

## UI/UX

- Date: `@react-native-community/datetimepicker` or Expo-compatible picker (evaluate `expo` 54 — use community datetimepicker if already transitive, else add dependency).
- Unit price label uses `getAssetUnit()` + ₺.
- Tag chips above description field; selecting chip fills description unless user typed custom.

## Error handling

- Invalid date → default today.
- Invalid unit/total → block submit (existing amount validation).
- Silent persist failures unchanged.

## Migration

- Existing items: unchanged; no backfill.

## Manual test

- Add 5g gold with date 01.10.2026, unit 6800 → history shows correct date and priceAtTime 34000.
- Tag Somut → history list shows description.
- Quick add same fields.
