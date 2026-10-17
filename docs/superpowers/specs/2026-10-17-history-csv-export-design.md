# Geçmiş CSV dışa aktarma — Design Spec

**Date:** 2026-10-17  
**Status:** Approved  
**Depends on:** —

## Goal

İşlem geçmişini **CSV** olarak paylaşmak (Excel / vergi arşivi).

## UI

- `HistoryScreen` header aksiyonu veya `AppSettingsScreen` veri bölümü: “CSV dışa aktar”.
- `expo-sharing` ile share sheet (backup export pattern).

## CSV columns (v1)

`date`, `type`, `assetType`, `amount`, `priceAtTime`, `description`, `historyId`

## Logic

- `historyExportService.ts`: `buildHistoryCsv(history)`, `exportHistoryCsvToShare(history)`.
- UTF-8 BOM optional for Excel TR compatibility.

## Non-goals

- PDF, filtre, import CSV.
