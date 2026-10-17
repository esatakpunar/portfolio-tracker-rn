# Çoklu cüzdan — Design Spec

**Date:** 2026-10-17  
**Status:** Approved  
**Depends on:** lot-entry, daily-snapshot, zakat (rules)

## Goal

Varlıkları **cüzdan** (wallet) altında ayırmak; portföy görünümü filtrelenir.

## Data model

- `PortfolioItem.walletId: string` (default `'default'`).
- Migration: Redux restore + SQLite persist; mevcut item’lara `'default'`.
- `Wallet`: `{ id, name, createdAt }` list in `app_settings` `pref:wallets`.

## UI (v1)

- Portföy header: cüzdan seçici (chip row).
- Add modals: cüzdan seçimi (aktif cüzdan default).
- Toplamlar, K/Z, dağılım: **aktif cüzdan** kapsamı.

## Cross-feature rules

- **Günlük snapshot:** tüm cüzdanların TL toplamı (tek satır “tüm portföy”).
- **Zekât:** tüm cüzdanlar (mevcut davranış korunur).
- **Yedek JSON:** `walletId` + wallets listesi schema v2 (backup version bump).

## Non-goals

- Cüzdan bazlı PIN, paylaşım.
