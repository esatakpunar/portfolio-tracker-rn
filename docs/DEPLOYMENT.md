# Deployment hazırlığı — Portfolio Tracker

Son analiz tarihi: **2026-10-15** (yerel değişiklikler commit edilmeden önce).

Bu doküman, mevcut working tree’deki özellik setini özetler, release öncesi kontrol listesini ve EAS ile mağaza dağıtım adımlarını içerir.

---

## 1. Release özeti

| Alan | Değer (şu an `app.json`) | Öneri |
|------|---------------------------|--------|
| Marketing version | `2.1.0` | **`2.2.0`** (yeni özellik seti) |
| iOS buildNumber | `14` | **`15`** (her App Store yüklemesinde artır) |
| Android versionCode | `2` | **`3`** (Play yüklemede artır) |
| Expo SDK | ~57 | Değişiklik yok |
| SQLite schema | **v5** | Mevcut kullanıcılar açılışta migrate edilir |

**Not:** `package.json` içindeki `"version": "1.0.0"` mağaza sürümü değil; mağaza için yalnızca `app.json` → `expo.version` / `ios.buildNumber` kullanılır (`eas.json` → `appVersionSource: local`).

---

## 2. Değişiklik analizi (fonksiyonel)

### 2.1 Platform ve bağımlılıklar

- **Expo SDK 57**, React 19.2, React Native 0.86 — önceki 54/0.81 hattından büyük sıçrama.
- iOS **deploymentTarget 16.4** (`app.json`).
- Yeni native bağımlılıklar: `expo-document-picker`, `expo-sharing`, `expo-crypto`, `expo-local-authentication`, `@react-native-community/datetimepicker`.
- **`npx expo prebuild --platform ios --clean`** ile native proje yenilenmiş olmalı (local `ios/` EAS/production build ile uyumlu).

### 2.2 Navigasyon ve ekranlar

| Sekme | Ekran | İçerik |
|--------|--------|--------|
| Portföy | `PortfolioScreen` | Varlıklar, para birimi slider, **kar/zarar şeridi** (TL kartından bağımsız) |
| Geçmiş | `HistoryScreen` | İşlemler, **swipe ile geri al**, **günlük toplamlar** toggle |
| Piyasa | `MarketsScreen` | Fiyat listesi, yenileme, kaynak seçimi, kaynak karşılaştırma |
| Ayarlar | `AppSettingsScreen` | Dil, zekât, PIN, yedekleme, sıfırlama |

`SettingsScreen.tsx` kaldırıldı; stiller `settingsScreenStyles.ts` üzerinden paylaşılıyor.

### 2.3 Veri ve iş kuralları

- **Lot / maliyet:** İşlem tarihi, birim/toplam maliyet (`lotEntryUtils`, `AddItemModal`, `QuickAddModal`). Açıklama alanı sadeleştirildi (tag chip yok).
- **Kar/zarar:** `portfolioUtils` + `PortfolioProfitSummary` (portföy header altında sabit şerit).
- **Günlük snapshot (schema v5):** `daily_portfolio_snapshots` — **bugünün satırı upsert**; varlık ekleme/çıkarma ve fiyat güncellemesinde senkron. *İşlem tarihi geçmişe dönük olsa bile günlük toplam yalnızca “bugün kaydedilen anlık portföy TL”dir.*
- **Yedekleme:** JSON export/import (`backupService`), import **replace** (merge yok).
- **PIN:** `LockGate` + `pinStorage` (App açılışı).
- **Zekât:** Bilgilendirme amaçlı modal (`ZakatScreen`, bottom sheet).
- **Fiyat:** Mevcut kaynak tercihi + `PriceSourceCompareCard`.

### 2.4 Redux / kalıcılık

- SQLite `persist:root` middleware ile senkron.
- `importBackup`, `undoHistoryEntry`, genişletilmiş `addItem` payload.
- Günlük snapshot: `store/index.ts` içinde tanımlı action set’i + `recordDailySnapshot`.

### 2.5 Çeviri

- TR / EN / DE: `markets`, `appSettings`, zekât, kilit, yedekleme, günlük toplamlar, kar/zarar anahtarları.

---

## 3. Riskler ve bilinen sınırlar

| Konu | Etki | Mitigasyon |
|------|------|------------|
| SDK 57 yükseltmesi | Eski cihaz / build cache | Temiz EAS build; TestFlight’ta smoke test |
| Schema v5 migration | İlk açılışta kısa DB migrate | Eski kullanıcıda portföy + geçmiş korunur; snapshot tablosu yeni |
| Otomatik test yok | Regresyon | Aşağıdaki manuel QA |
| `photos.zip` (untracked) | Yanlışlıkla commit | **Commit’e dahil etme** |
| `docs/superpowers/` | İç dokümantasyon | İsteğe bağlı commit |
| TypeScript | `tsc` bazı eski dosyalarda hata | Release blocker değilse EAS yine build alır; zaman varsa `locales/index.ts` i18next v4 uyumu |

---

## 4. Release öncesi kontrol listesi

### Kod ve repo

- [ ] `photos.zip` `.gitignore`’a veya silinmiş (commit dışı).
- [ ] `app.json`: `version` + `ios.buildNumber` (+ Android `versionCode`) güncellendi.
- [ ] `CHANGELOG.md`’ye **2.2.0** maddeleri eklendi (isteğe bağlı ama önerilir).
- [ ] `CLAUDE.md` / README: 3 sekme → 4 sekme, SDK 57 (isteğe bağlı).
- [ ] Tüm değişiklikler commit + push (`main` veya release branch).

### Yerel doğrulama

```bash
npm ci
npm run ios   # veya: npx expo start → cihaz/simulator
```

- [ ] Soğuk açılış: DB init, fiyat çekimi, LockGate (PIN kapalı/açık).
- [ ] Mevcut kullanıcı simülasyonu: schema v4→v5 migrate (eski yükleme varsa).

### Manuel QA (kritik yollar)

| # | Senaryo | Beklenen |
|---|---------|----------|
| 1 | Varlık ekle (tarih, maliyet, açıklama) | Geçmiş + portföy + K/Z güncellenir |
| 2 | Aynı gün 3 ekleme → Günlük toplamlar | Bugün satırı **son** toplam TL |
| 3 | Dün tarihli ekleme | Geçmişte dün; günlük toplamda **bugün** güncellenir (dün satırı otomatik oluşmaz) |
| 4 | Geçmişte swipe undo | Varlık geri alınır, snapshot güncellenir |
| 5 | Piyasa: yenile + kaynak değiştir | Fiyatlar ve portföy değerleri tutarlı |
| 6 | Ayarlar: export → sil → import | Veri replace; fiyat yenilenir |
| 7 | PIN aç/kapa | Kill app → kilit ekranı |
| 8 | Zekât modal | Bottom sheet, borç kaydı kalıcı |
| 9 | TR / EN / DE | Tab etiketleri: Piyasa + Ayarlar |

---

## 5. EAS build ve App Store

Önkoşul: `eas-cli` girişi, Apple sertifikaları EAS’te yapılandırılmış.

```bash
# Production iOS (App Store / TestFlight)
eas build --profile production --platform ios

# İç test (ad hoc / internal)
eas build --profile preview --platform ios
```

Build tamamlanınca:

```bash
eas submit --platform ios --profile production
```

**Submit metadata:** `eas.json` → ASC App ID `6754292674`, Team `ZJUV6ZYP44`.

### App Store Connect notları (öneri)

- **What’s New (TR):** Yeni Ayarlar sekmesi, işlem maliyeti ve kar/zarar, günlük portföy özeti, yedekleme, isteğe bağlı PIN, zekât tahmini, fiyat kaynağı karşılaştırma.
- **Review:** Offline çalışır; ağ yalnızca fiyat API’si için. PIN cihazda saklanır.

---

## 6. Android (opsiyonel)

`versionCode` artırıldıktan sonra:

```bash
eas build --profile production --platform android
```

Play Console’a manuel veya EAS Submit ile yükleme.

---

## 7. Rollback planı

- App Store: önceki build TestFlight / phased release ile geri alınabilir.
- Veri: kullanıcı JSON yedek almadıysa schema geri dönüşü desteklenmez; **import yalnızca forward**.
- Kritik bug: hotfix branch → buildNumber +1 → hızlı submit.

---

## 8. Commit öncesi dosya durumu (referans)

**Silinen:** `src/screens/SettingsScreen.tsx`, `SourceTagChips`, `sourceTags`.

**Yeni / önemli:** `MarketsScreen`, `AppSettingsScreen`, `ZakatScreen`, `LockGate`, `backupService`, `dailySnapshotService`, `lotEntryUtils`, `docs/superpowers/*`.

**Commit dışı bırak:** `photos.zip`.

---

## 9. Hızlı sürüm bump (release anında)

`app.json` içinde örnek:

```json
"version": "2.2.0",
"ios": { "buildNumber": "15" },
"android": { "versionCode": 3 }
```

Ardından commit mesajı örneği:

```
Release 2.2.0: markets/settings split, cost basis, backups, daily snapshots, app lock
```

---

Sorular veya store metni / ekran görüntüsü listesi gerekiyorsa bu dosyaya eklenebilir.
