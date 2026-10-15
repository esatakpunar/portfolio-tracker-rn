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

## Bilinçli olarak kapsam dışı

- Grafik / teknik analiz
- JSON import **merge**
- Canlı çok cihaz senkronu (cloud)

## Kararlar (tüm spec’lerde geçerli)

- **Veri kaynağı:** Redux `portfolio` slice + `app_settings.persist:root` (SQLite). `portfolioRepository` tabloları günlük akışta kullanılmıyor; yeni kalıcı veri ya slice’a ya migration ile SQLite tablosuna eklenir.
- **i18n:** TR / EN / DE zorunlu.
- **Tema:** `src/theme` sabitleri; dark glass UI.
- **Test:** Projede otomatik test yok; planlarda manuel doğrulama adımları kullanılır.
