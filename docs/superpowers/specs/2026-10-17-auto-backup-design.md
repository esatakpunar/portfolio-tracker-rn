# Otomatik yedekleme — Design Spec

**Date:** 2026-10-17  
**Status:** Approved  
**Depends on:** json-export-import

## Goal

Kullanıcı verisini periyodik / olay tetiklemeli **JSON yedek** ile kaybetme riskini azaltmak.

## v1 scope

- Ayarlar: toggle “Otomatik yedek”, sıklık: `7 gün` (tek seçenek).
- Tetikleyiciler: uygulama açılışı (App.tsx veya settings mount) — son yedek `exportedAt` > 7 gün ise **hatırlatma banner** (zorunlu değil).
- Opsiyonel v1.1 same release: arka planda cache’e yaz + kullanıcıya “Son otomatik yedek: …” + tek dokunuş share.

## Storage

- `pref:autoBackupEnabled`, `pref:lastAutoBackupAt` in `app_settings`.
- Yedek içeriği: mevcut `PortfolioBackupV1` formatı.

## Non-goals

- iCloud silent write without user action (App Store sandbox kısıtları), şifreli yedek.
