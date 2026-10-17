# iOS Widget — Design Spec

**Date:** 2026-10-17  
**Status:** Approved  
**Depends on:** —

## Goal

Ana ekranda portföy **toplam TL** (ve son güncelleme zamanı) göstermek.

## v1 widget

- Small + medium: toplam TL, “Güncellendi: …” (relative veya saat).
- Veri: App Group shared storage veya `UserDefaults` suite — JSON `{ totalTl, updatedAt }`.
- App: `fetchPrices.fulfilled` ve portföy değişiminde snapshot yaz + WidgetCenter reload.

## Tech

- Expo SDK 57 widget desteği / config plugin — EAS production profile güncellemesi gerekir.
- Widget **K/Z göstermez** (maliyet hesabı yok).

## Non-goals

- Android widget v1, interaktif widget, çoklu para birimi widget’ta.
