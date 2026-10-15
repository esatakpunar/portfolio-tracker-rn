# Zekât hesaplama v1 — Design Spec

**Date:** 2026-10-15  
**Status:** Approved (conversation)  
**Depends on:** —

## Goal

Kullanıcıya **bilgilendirme amaçlı** basit zekât tahmini: zekâta tabi varlıklar, nisab kontrolü, zekât tutarı (%2.5).

## Scope v1 (explicit)

**Zekâta dahil (toggle default on):** USD, EUR, TL nakit, altın türleri (`22_ayar`, `24_ayar`, `ceyrek`, `tam`), gümüş.

**Nisab:** Güncel gram altın fiyatı × 80 gr (yaygın basitleştirme; ayarlarda sabit açıklama). TL karşılığı `prices['24_ayar']` veya `22_ayar` — **use 24_ayar gram price × 80**.

**Haul (1 yıl):** v1 gösterim — en eski `add` tarihi uyarı metni (“1 yıl dolmadıysa danışın”); otomatik exclude yok.

**Borç:** v1 opsiyonel numeric input (Settings/Zekât ekranı), default 0; zekât matrahı = max(0, eligibleTotal − debt).

**Formula:** if eligibleTotal >= nisab → zakat = eligibleTotal × 0.025.

## UI

- Yeni ekran veya Settings içi kart: “Zekât” → breakdown by asset, nisab line, sonuç TL.
- Disclaimer (3 dil): uygulama fetva vermez, yerel uzmana danışın.

## Non-goals

- Fıkhi mezhep seçenekleri, gümüş nisab alternatifi, ticari mal envanteri.

## Manual test

- Portfolio above nisab → positive zakat.
- Below nisab → “Nisab altında” message.
