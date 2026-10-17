# Portföy dağılımı — Design Spec

**Date:** 2026-10-17  
**Status:** Approved  
**Depends on:** —

## Goal

Portföyde varlıkların TL değerine göre **yüzde dağılımını** göstermek (grafik kütüphanesi yok; yatay bar + liste).

## UI

- `PortfolioScreen`: K/Z şeridinin altında, varlık listesinin üstünde `PortfolioAllocationCard`.
- Boş portföy veya tüm fiyatlar bilinmiyorsa kart gizlenir veya kısa empty state.
- Kategoriler (v1): **Altın** (22/24/çeyrek/tam), **Gümüş**, **Döviz** (USD/EUR), **TL**.
- `unknown` bucket: fiyatı null olan kalemlerin TL değeri toplamda yok; alt satırda “Bilinmeyen: X ₺” (varsa).

## Logic

- Pure function `computePortfolioAllocation(items, prices)` → segments sorted by pct desc.
- Toplam payda: yalnızca fiyatı bilinen kalemlerin TL toplamı.

## Non-goals

- Zaman serisi, pie chart SVG, hedef/alert.

## i18n

TR / EN / DE: `allocationTitle`, `allocationUnknown`, kategori etiketleri.
