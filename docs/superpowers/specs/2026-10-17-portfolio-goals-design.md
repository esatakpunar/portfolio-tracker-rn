# Portföy hedefleri — Design Spec

**Date:** 2026-10-17  
**Status:** Approved  
**Depends on:** —

## Goal

Kullanıcı **tek aktif hedef** tanımlar; portföy ekranında ilerleme görür.

## Goal types (v1)

| Kind | Progress |
|------|----------|
| `asset_amount` | Seçilen `AssetType` için toplam miktar / hedef miktar |
| `portfolio_value_tl` | `selectTotalTL` / hedef TL |

## Storage

- SQLite `app_settings` key `pref:portfolioGoal` — JSON `PortfolioGoal | null`.
- `preferenceStorage`: get/save/clear.

## UI

- `PortfolioGoalCard`: progress bar, hedef metni, “Düzenle” → bottom sheet `PortfolioGoalModal`.
- Hedef yoksa: “Hedef belirle” CTA (aynı modal).
- Modal: tür seçimi (miktar vs TL), varlık picker (miktar hedefinde), sayısal hedef.

## Non-goals

- Çoklu eşzamanlı hedef, bildirim, tarih hedefi.

## i18n

TR / EN / DE tüm label ve placeholder’lar.
