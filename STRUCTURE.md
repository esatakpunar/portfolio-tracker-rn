# Portfolio Tracker React Native - Klasör Yapısı

## 📁 Proje Dosya Yapısı

```
portfolio-tracker-rn/
├── 📱 App.tsx                          # Ana uygulama entry point
├── 📄 index.ts                         # Expo entry
├── 📦 package.json                     # Dependencies
├── ⚙️ tsconfig.json                    # TypeScript config
├── 📱 app.json                         # Expo config
├── 📖 README.md                        # Proje dökümantasyonu
├── 📋 PRD.md                          # Product Requirements Document
├── 🙈 .gitignore                      # Git ignore rules
│
├── 📂 assets/                         # Uygulama assets
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
└── 📂 src/                            # Kaynak kodlar
    │
    ├── 📂 components/                 # Reusable UI Components
    │   ├── AddItemModal.tsx           # Varlık ekleme modal'ı
    │   ├── DeleteItemModal.tsx        # Silme onay modal'ı
    │   ├── LoadingSpinner.tsx         # Yükleme göstergesi
    │   ├── ToastNotification.tsx      # Toast bildirim sistemi
    │   └── index.ts                   # Component exports
    │
    ├── 📂 screens/                    # Ana Ekranlar
    │   ├── PortfolioScreen.tsx        # Portföy yönetim ekranı
    │   ├── HistoryScreen.tsx          # İşlem geçmişi ekranı
    │   └── SettingsScreen.tsx         # Ayarlar ekranı
    │
    ├── 📂 navigation/                 # Navigation Yapısı
    │   └── BottomTabNavigator.tsx     # Alt tab navigasyon
    │
    ├── 📂 store/                      # Redux State Management
    │   ├── index.ts                   # Store configuration
    │   └── portfolioSlice.ts          # Portfolio state slice
    │
    ├── 📂 locales/                    # Çok Dilli Destek
    │   ├── index.ts                   # i18next setup
    │   ├── tr.ts                      # Türkçe çeviriler
    │   ├── en.ts                      # İngilizce çeviriler
    │   └── de.ts                      # Almanca çeviriler
    │
    ├── 📂 hooks/                      # Custom React Hooks
    │   ├── useRedux.ts                # Typed Redux hooks
    │   ├── useToast.ts                # Toast notification hook
    │   └── index.ts                   # Hook exports
    │
    ├── 📂 theme/                      # Design System
    │   └── index.ts                   # Colors, spacing, typography, shadows
    │
    └── 📂 types/                      # TypeScript Type Definitions
        └── index.ts                   # Type definitions

```

## 🗂️ Dosya Sayıları

- **TypeScript Dosyaları**: 20 dosya
- **Componentler**: 4 component
- **Ekranlar**: 3 ekran
- **Store Slices**: 1 slice
- **Hooks**: 2 hook
- **Dil Dosyaları**: 3 dil (tr, en, de)

## 📊 Kod İstatistikleri

### Components (4 adet)
1. `AddItemModal.tsx` - Varlık ekleme için tam ekran modal
2. `DeleteItemModal.tsx` - Silme onayı için modal
3. `LoadingSpinner.tsx` - Yükleme durumu göstergesi
4. `ToastNotification.tsx` - Bildirim toast sistemi

### Screens (3 adet)
1. `PortfolioScreen.tsx` - Ana portföy yönetimi ve görüntüleme
2. `HistoryScreen.tsx` - İşlem geçmişi listesi
3. `SettingsScreen.tsx` - Uygulama ayarları ve dil seçimi

### Store (Redux Toolkit)
1. `portfolioSlice.ts` - Tüm portfolio state management'ı
   - Actions: addItem, removeItem, updatePrice, setLanguage, resetAll
   - Selectors: selectItems, selectPrices, selectHistory, selectTotalIn

### Locales (3 dil)
1. `tr.ts` - Türkçe (Varsayılan)
2. `en.ts` - İngilizce
3. `de.ts` - Almanca

## 🎨 Tema Sistemi

**Colors**: 15+ renk tanımı
- Primary gradient (667eea → 764ba2)
- Glass effect colors
- Status colors (success, error, warning, info)
- Text colors (primary, secondary, muted)

**Spacing**: 7 seviye (xs → xxxl)
**Border Radius**: 7 seviye (sm → full)
**Font Sizes**: 8 seviye (xs → huge)
**Font Weights**: 4 seviye (normal → bold)
**Shadows**: 4 tip (small, medium, large, glass)

## 🔧 Tech Stack

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| **Framework** | React Native | 0.81.4 |
| **Platform** | Expo | ~54.0.12 |
| **Language** | TypeScript | ~5.9.2 |
| **State** | Redux Toolkit | ^2.9.0 |
| **Navigation** | React Navigation | ^7.x |
| **i18n** | i18next | ^25.5.3 |
| **Storage** | AsyncStorage | ^2.2.0 |
| **Animations** | Reanimated | ^4.1.2 |
| **Gestures** | Gesture Handler | ^2.28.0 |

## ✅ Tamamlanan Özellikler

### Core Features
- ✅ Portfolio management (add/remove assets)
- ✅ Automatic asset grouping
- ✅ Multi-currency views (TL, USD, EUR, Gold)
- ✅ Transaction history
- ✅ Settings panel
- ✅ Data persistence (AsyncStorage)
- ✅ Reset all data functionality

### UI/UX
- ✅ Glassmorphism design
- ✅ Dark theme
- ✅ Swipeable currency slider
- ✅ Bottom tab navigation
- ✅ Modal interactions
- ✅ Toast notifications
- ✅ Loading states

### Internationalization
- ✅ 3 languages (TR, EN, DE)
- ✅ Auto language detection
- ✅ Persistent language preference
- ✅ Real-time language switching
- ✅ Localized number formatting

### Technical
- ✅ TypeScript integration
- ✅ Redux Toolkit state management
- ✅ Type-safe hooks
- ✅ Component exports
- ✅ Theme system
- ✅ Error handling

## 🚀 Çalıştırma Komutları

```bash
# Development server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android

# Web browser
npm run web

# TypeScript check
npx tsc --noEmit
```

## 📱 Platform Support

- **iOS**: iOS 13.0+
- **Android**: Android 5.0+ (API 21)
- **Web**: Modern browsers (via Expo Web)

## 🎯 Next Steps

1. ✅ Klasör yapısı oluşturuldu
2. ✅ Tüm componentler yazıldı
3. ✅ State management kuruldu
4. ✅ Navigasyon yapılandırıldı
5. ✅ Lokalizasyon entegre edildi
6. ✅ Tema sistemi hazırlandı
7. ⏳ Test etme (Expo ile çalıştırma)
8. ⏳ API entegrasyonu
9. ⏳ Grafik entegrasyonu
10. ⏳ Push notification

## 📝 Notlar

- Tüm dosyalar TypeScript ile yazıldı
- Redux Toolkit modern state management için kullanıldı
- i18next profesyonel lokalizasyon için entegre edildi
- React Navigation v7 ile native navigasyon
- AsyncStorage ile offline-first yaklaşım
- Glassmorphism design system uygulandı
- Dark theme varsayılan olarak ayarlandı

## 🔗 İlgili Linkler

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Navigation](https://reactnavigation.org/)
- [i18next](https://www.i18next.com/)
