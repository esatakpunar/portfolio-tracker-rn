# Portfolio Tracker — Feature Specs & Plans

Bu klasör konuşmalardan çıkan özelliklerin **tasarım spec’leri** ve **implementasyon planlarını** içerir.

## Uygulama sırası

| Sıra | Spec | Plan | Bağımlılık |
|------|------|------|------------|
| 1 | lot-entry-cost-basis | ✅ Implemented | — |
| 2 | profit-loss-ui | ✅ Implemented | 1 |
| 3 | json-export-import | ✅ Implemented | 1 |
| 4 | history-undo | ✅ Implemented | 1 |
| 5 | daily-snapshot | ✅ Implemented | — |
| 6 | zakat-v1 | ✅ Implemented | — |
| 7 | app-lock | ✅ Implemented | — |
| 8 | price-source-diff | ✅ Implemented | — |

## Roadmap v2 (2026-10-17)

Master plan: `plans/2026-10-17-roadmap-v2-subagent-driven.md`

| Sıra | Spec | Plan | Durum |
|------|------|------|--------|
| 1a | portfolio-allocation | 2026-10-17-portfolio-allocation | ✅ Implemented |
| 1b | portfolio-goals | 2026-10-17-portfolio-goals | ✅ Implemented |
| 2 | history-csv-export | 2026-10-17-history-csv-export | ✅ Implemented |
| 3 | auto-backup | 2026-10-17-auto-backup | ⏳ |
| 4 | ios-widget | 2026-10-17-ios-widget | ⏳ |
| 5 | multi-wallet | 2026-10-17-multi-wallet | ⏳ |

Kapsam dışı (v2): fiyat uyarıları, işlem tarihi piyasa satırı, zekât hatırlatıcı.

## Bilinçli olarak kapsam dışı

- Grafik / teknik analiz
- JSON import **merge**
- Canlı çok cihaz senkronu (cloud)

## Kararlar (tüm spec’lerde geçerli)

- **Veri kaynağı:** Redux `portfolio` slice + `app_settings.persist:root` (SQLite). `portfolioRepository` tabloları günlük akışta kullanılmıyor; yeni kalıcı veri ya slice’a ya migration ile SQLite tablosuna eklenir.
- **i18n:** TR / EN / DE zorunlu.
- **Tema:** `src/theme` sabitleri; dark glass UI.
- **Test:** Projede otomatik test yok; planlarda manuel doğrulama adımları kullanılır.
