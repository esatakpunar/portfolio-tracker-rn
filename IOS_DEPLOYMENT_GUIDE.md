# iOS Production Deployment Guide

Bu guide, Portfolio Tracker uygulamasını Apple App Store'a yayınlamak için gereken tüm adımları içerir.

## ✅ Deployment Öncesi Checklist

### 1. Version ve Build Number Güncelleme

#### app.json dosyasını güncelle:
```json
{
  "expo": {
    "version": "1.1.0",  // ← Semantic versioning: major.minor.patch
    "ios": {
      "buildNumber": "12"  // ← Her build için artırılmalı (şu an: 12)
    }
  }
}
```

**Version artırma kuralları:**
- **Patch (1.0.X)**: Bug fix'ler için (1.0.1 → 1.0.2)
- **Minor (1.X.0)**: Yeni özellikler için (1.0.0 → 1.1.0)
- **Major (X.0.0)**: Breaking changes için (1.0.0 → 2.0.0)

**Build Number kuralı:**
- Her yeni build için 1 artırılmalı (12 → 13)
- Build number asla azalmamalı

---

## 📋 Deployment Adımları

### Adım 1: Kod Değişikliklerini Kaydet
```bash
git add .
git commit -m "chore: version bump to 1.1.0 (build 13)"
git push origin main
```

### Adım 2: Version ve Build Number'ı Güncelle

**app.json** dosyasında:
```json
"version": "1.2.0",          // ← Önceki: 1.1.0
"buildNumber": "13"          // ← Önceki: 12
```

> **ÖNEMLİ**: Build number her zaman artan olmalı. Apple aynı build number'ı kabul etmez.

### Adım 3: Production Build Oluştur

```bash
# iOS için production build
eas build --platform ios --profile production
```

**Build süresi:** ~10-20 dakika
**Nerede kontrol edilir:** https://expo.dev/accounts/esatakpunar/projects/portfolio-tracker-rn/builds

### Adım 4: Build'in Başarılı Olduğunu Doğrula

1. EAS Dashboard'da build durumunu kontrol et
2. Build başarılı olduysa ✅ yeşil tik göreceksin
3. Build logları hata içeriyorsa tekrar dene

### Adım 5: App Store'a Submit Et

```bash
# Otomatik submit (recommended)
eas submit --platform ios --latest
```

**Alternatif - Manuel submit:**
```bash
# Build ID ile submit
eas submit --platform ios --id [BUILD_ID]
```

### Adım 6: App Store Connect'te İşlemleri Tamamla

1. **App Store Connect'e giriş yap:** https://appstoreconnect.apple.com
2. **My Apps** → **Portfolio Tracker** seçin
3. Yeni build'in işlendiğini bekleyin (~5-15 dakika)
4. **TestFlight** sekmesinde build'i test edin (opsiyonel ama önerilen)

### Adım 7: Yeni Versiyon Oluştur

1. App Store Connect'te **+ Version or Platform** butonuna tıkla
2. Yeni version numarasını gir (örn: 1.2.0)
3. **What's New** (Sürüm Notları) ekle:

```
Türkçe:
- Yeni özellik açıklamaları
- Düzeltilen hatalar
- Performans iyileştirmeleri

English:
- New feature descriptions
- Bug fixes
- Performance improvements
```

4. Screenshots ve app preview'ları kontrol et (değişiklik yoksa dokunma)
5. **Save** → **Submit for Review**

### Adım 8: Review İçin Gönder

1. App Information'ı kontrol et
2. Pricing and Availability doğrula
3. **Submit for Review** butonuna tıkla
4. Export Compliance sorularını cevapla:
   - "Does your app use encryption?" → **No** (ITSAppUsesNonExemptEncryption: false)

---

## 🔍 Önemli Notlar

### Mevcut Konfigürasyon
- **Current Version:** 1.1.0
- **Current Build Number:** 12
- **Bundle ID:** com.portfoliotracker.app
- **Apple Team ID:** ZJUV6ZYP44
- **Apple ID:** esatakpunar@gmail.com
- **ASC App ID:** 6754292674

### EAS Credentials
EAS otomatik olarak credentials'ları yönetir. Manuel işlem gerekmez.

### Build Profile'ları
```json
{
  "production": {
    "ios": {
      "resourceClass": "m-medium"  // Orta seviye build makinesi
    }
  }
}
```

---

## 🚨 Sık Karşılaşılan Sorunlar

### Problem 1: Build Number Hatası
```
Error: Build number must be greater than previous build
```
**Çözüm:** `app.json`'da `buildNumber`'ı artır (örn: 12 → 13)

### Problem 2: Bundle Identifier Conflict
**Çözüm:** Bundle ID değişmemeli: `com.portfoliotracker.app`

### Problem 3: Certificate/Provisioning Profile Hatası
```bash
# Credentials'ları sıfırla
eas credentials
```

### Problem 4: Build Timeout
**Çözüm:** Tekrar dene veya resourceClass'ı `m1-large` olarak değiştir

---

## 📊 Review Süresi

- **Ortalama review süresi:** 24-48 saat
- **İlk review genellikle:** 1-3 gün
- **Reddedilirse:** Düzeltip tekrar gönder

### Review Durumu Kontrolü
1. App Store Connect → App Store tab
2. **Status** kolonunu kontrol et:
   - 🟡 **Waiting for Review**
   - 🔵 **In Review**
   - 🟢 **Ready for Sale**
   - 🔴 **Rejected** (düzeltilmesi gereken sorunlar var)

---

## 🎯 Hızlı Komutlar Özeti

```bash
# 1. Version'ı güncelle (app.json'da manuel)

# 2. Build oluştur
eas build --platform ios --profile production

# 3. Submit et
eas submit --platform ios --latest

# 4. Build durumunu kontrol et
eas build:list --platform ios --limit 5

# 5. Credentials yönetimi (gerekirse)
eas credentials
```

---

## 📝 Deployment Changelog Template

Her deployment sonrası `CHANGELOG.md` güncellemesi yapın:

```markdown
## [1.2.0] - 2026-01-26

### Added
- Yeni özellikler

### Changed
- Değişen özellikler

### Fixed
- Düzeltilen hatalar

### Build Info
- Build Number: 13
- Platform: iOS
- Release Date: 2026-01-26
```

---

## ⚡ Express Deployment (Hızlı Yol)

Tüm adımları tek seferde yapmak için:

```bash
# 1. Version'ı güncelle (app.json'da buildNumber: 13)

# 2. Commit & Push
git add . && git commit -m "chore: bump version to 1.2.0 (build 13)" && git push

# 3. Build ve Submit
eas build --platform ios --profile production --auto-submit
```

`--auto-submit` flag'i build başarılı olunca otomatik olarak App Store'a submit eder.

---

## 📞 Yardım ve Kaynaklar

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **EAS Dashboard:** https://expo.dev/accounts/esatakpunar/projects/portfolio-tracker-rn

---

## ✨ Son Kontrol Listesi

- [ ] `app.json` version güncellendi
- [ ] `app.json` buildNumber artırıldı
- [ ] Değişiklikler commit edildi
- [ ] `eas build` çalıştırıldı
- [ ] Build başarılı oldu ✅
- [ ] `eas submit` çalıştırıldı
- [ ] App Store Connect'te yeni version oluşturuldu
- [ ] Sürüm notları eklendi
- [ ] Submit for Review tıklandı
- [ ] CHANGELOG.md güncellendi

**Başarılar! 🚀**
