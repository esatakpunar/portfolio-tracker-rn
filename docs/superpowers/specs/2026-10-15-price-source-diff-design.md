# Çoklu fiyat kaynağı fark karşılaştırması — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** —

## Goal

Aynı portföy envanteri ile **Truncgil** ve **Investing.com** fiyatlarından hesaplanan toplam TL değerini yan yana göster; fark ₺ ve %.

## Behavior

- Settings or Portfolio “Fiyat farkı” card: button “Karşılaştır” triggers parallel fetch (existing `fetchPricesFromTruncgil`, `fetchPricesFromInvesting`) without changing user’s selected source preference.
- Compute `totalTL(items, pricesA)` and `totalTL(items, pricesB)` using same helper as `selectTotalTL`.
- Show last compared timestamp; cache last result in memory (optional SQLite cache v1 skip).

## Error handling

- One provider fails → show partial with warning.
- Rate limit / timeout → existing error tracking.

## Non-goals

- Per-asset diff table (v1 total only).
- Changing default price source automatically.

## Manual test

- Both APIs succeed → two totals + delta.
- Airplane mode → error message.
