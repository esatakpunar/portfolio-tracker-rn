# JSON export / import (replace) — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** Lot entry fields in export schema (optional fields backward compatible)

## Goal

Bir kullanıcı portföyünü JSON dosyası olarak dışa aktarır; aile üyesi **tüm mevcut veriyi silip** dosyayı içe aktarır.

## Requirements

1. **Export payload** (`format: portfolio-tracker-backup`, `version: 1`):

```json
{
  "format": "portfolio-tracker-backup",
  "version": 1,
  "exportedAt": "ISO-8601",
  "appVersion": "from app.json",
  "data": {
    "items": "PortfolioItem[]",
    "history": "HistoryItem[]"
  }
}
```

2. **Exclude:** prices, buyPrices, priceChanges, fetch flags, language (importer keeps device language).
3. **Import:** Validate format/version; Alert confirm; `resetAll` + `setItems` + `setHistory`; trigger persist; `fetchPrices()`.
4. **Share:** iOS/Android share sheet; filename `portfolio-backup-YYYY-MM-DD.json`.
5. **Security copy:** Alert text — dosya hassas veri içerir, güvenli kanal kullanın.

## Non-goals

- Merge, conflict resolution.
- Encrypted export (v2).

## Dependencies

- `expo-file-system`, `expo-sharing`, `expo-document-picker` (or platform Share API if sufficient).

## Manual test

- Export → import on second install/simulator → items/history match.
- Import invalid JSON → error toast/alert, state unchanged.
- Import confirm cancel → unchanged.
