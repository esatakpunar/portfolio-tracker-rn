# 📄 PRD — Modern Portfolio Tracker React Native Uygulaması

## 1. Amaç

Kullanıcının sahip olduğu varlıkları (altın, döviz, gümüş vb.) hızlı ve sezgisel bir şekilde ekleyip çıkarabildiği, toplam portföy değerini farklı para birimleri ve altın cinsinden görüntüleyebileceği **React Native** tabanlı mobil uygulama.

**Odak:** Glassmorphism tasarım dili ile modern premium ekonomi uygulaması deneyimi. Native mobil performans ve deneyim öncelikli tasarım.

## 2. Hedefler

### ✅ Tamamlanan Özellikler (v1.0):
- Modern glassmorphism UI/UX tasarımı (React Native için optimize)
- 3 ana bölüm: Portfolio, History, Settings
- Varlık ekleme/silme ve otomatik gruplandırma
- Swipe ve slider ile TL/USD/EUR/ALTIN görünümleri
- İşlem geçmişi takibi
- Ayarlar paneli ve veri sıfırlama
- AsyncStorage ile veri saklama (offline-first)
- **Çok Dilli Destek (Türkçe, İngilizce, Almanca)**
- **Otomatik dil tespiti ve AsyncStorage kaydetme**
- **Modern toast bildirim sistemi**
- **TypeScript ile tip güvenli geliştirme**
- **Redux Toolkit ile state management**
- **React Navigation ile native navigasyon**

### 🚧 Geliştirme Aşamasında:
- API entegrasyonu (şimdilik sabit fiyatlar)
- Gerçek zamanlı fiyat güncellemeleri
- Gelişmiş grafik entegrasyonu
- Push notification sistemi
- Biometric authentication

## 3. Desteklenen Varlıklar

| Kategori | Varlık Türleri | Açıklama |
|----------|---------------|----------|
| **Altın** | 22 Ayar Gram, 24 Ayar Gram, Çeyrek Altın, Tam Altın | Altın türlerinde otomatik grup karşılığı hesaplama |
| **Döviz** | USD, EUR | Ana para birimleri |
| **Değerli Metal** | Gümüş (gram) | Gram bazında gümüş takibi |

## 4. Mevcut Özellikler

### 4.1 Portfolio Bölümü
- **Swipeable Currency Slider**: FlatList ile native swipe desteği TL/USD/EUR/ALTIN değer görünümleri için
- **Otomatik Gruplandırma**: Aynı tür varlıklar otomatik olarak gruplanır
- **Gerçek Zamanlı Hesaplama**: Tüm para birimi karşılıkları anlık hesaplanır
- **Modal Ekleme Sistemi**: Header'da + FAB ile hızlı varlık ekleme
- **Native Gestures**: React Native Gesture Handler ile smooth interactions
- **Pull to Refresh**: Native refresh control (future feature)

### 4.2 History (Geçmiş) Bölümü
- **İşlem Geçmişi**: Tüm ekleme/silme işlemleri kayıtlı
- **Zaman Damgası**: Her işlem için tarih/saat bilgisi (lokalize format)
- **İkon Sistemi**: Add/Remove işlemleri görsel iconlar ile
- **FlatList Optimization**: Büyük veri setleri için optimize edilmiş liste

### 4.3 Settings (Ayarlar) Bölümü
- **Fiyat Görüntüleme**: Tüm varlık fiyatlarının görüntülenmesi
- **Dil Seçimi**: Native picker ile Türkçe, İngilizce, Almanca arasında geçiş
- **Veri Sıfırlama**: "Reset All" ile tüm portfolio verilerini temizleme
- **Native Alert**: Kritik işlemler için platform-native alert dialog
- **Toast Bildirimleri**: İşlem sonrası başarı/hata mesajları
- **Dark Theme**: Sistem teması ile uyumlu dark mode

### 4.4 Lokalizasyon Sistemi
- **i18next Integration**: Profesyonel lokalizasyon framework
- **Otomatik Dil Tespiti**: react-native-localize ile cihaz dilini algılama
- **AsyncStorage Persistence**: Kullanıcının dil tercihini kalıcı saklama
- **Gerçek Zamanlı Çeviri**: Dil değişikliği anında tüm UI elementlerini güncelleme
- **Kapsamlı Çeviri**: Tüm metin içerikleri, toast mesajları ve form elemanları
- **Number Formatting**: Locale'e göre sayı ve para birimi formatları

## 5. Kullanıcı Akışı

### 5.1 Portfolio Ana Ekran
```
Header: "Portfolio" + FAB Button
├── Swipeable Total Value Slider (TL/USD/EUR/ALTIN)
│   └── Pagination Dots
├── Asset Groups (grouped by type)
│   └── Touch to Delete
└── Bottom Tab Navigator (Portfolio/History/Settings)
```

### 5.2 Varlık Ekleme (Modal)
```
Full Screen Modal:
├── Asset Type Picker (Native dropdown)
├── Amount Input (Numeric keyboard)
├── Description Input (Optional, multiline)
└── Action Buttons (Cancel/Add)
```

### 5.3 Navigation Flow
```
Bottom Tab Navigation:
├── Portfolio (Ana ekran - Asset management)
├── History (İşlem geçmişi - Transaction log)
└── Settings (Ayarlar - App settings)
```

## 6. Teknik Gereksinimler

### 6.1 Mevcut Tech Stack
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **React Native** | 0.81.4 | Core mobile framework |
| **Expo** | ~54.0.12 | Development platform & build tool |
| **TypeScript** | ~5.9.2 | Type-safe development |
| **Redux Toolkit** | ^2.9.0 | State management (Vuex yerine) |
| **React Navigation** | ^7.x | Native navigation (Vue Router yerine) |
| **i18next** | ^25.5.3 | Internationalization |
| **AsyncStorage** | ^2.2.0 | Local storage (localStorage yerine) |
| **React Native Reanimated** | ^4.1.2 | High-performance animations |
| **React Native Gesture Handler** | ^2.28.0 | Native gesture system |

### 6.2 Proje Yapısı
```
src/
├── components/          # Reusable components
│   ├── AddItemModal.tsx    # Varlık ekleme modal'ı
│   ├── DeleteItemModal.tsx # Silme onay modal'ı
│   ├── LoadingSpinner.tsx  # Loading state
│   └── ToastNotification.tsx # Toast sistemi
├── screens/             # Screen components
│   ├── PortfolioScreen.tsx # Portfolio ana ekranı
│   ├── HistoryScreen.tsx   # Geçmiş ekranı
│   └── SettingsScreen.tsx  # Ayarlar ekranı
├── store/              # Redux Toolkit
│   ├── index.ts           # Store configuration
│   └── portfolioSlice.ts  # Portfolio state slice
├── navigation/         # React Navigation
│   └── BottomTabNavigator.tsx # Tab navigation
├── locales/            # i18next
│   ├── index.ts           # i18n setup
│   ├── tr.ts              # Türkçe
│   ├── en.ts              # English
│   └── de.ts              # Deutsch
├── hooks/              # Custom hooks
│   ├── useRedux.ts        # Typed Redux hooks
│   └── useToast.ts        # Toast hook
├── theme/              # Design system
│   └── index.ts           # Colors, spacing, typography
└── types/              # TypeScript types
    └── index.ts           # Type definitions
```

### 6.3 State Management (Redux Toolkit)
```typescript
State:
├── items: PortfolioItem[]      # Portfolio varlıkları
├── prices: Prices              # Varlık fiyatları
├── history: HistoryItem[]      # İşlem geçmişi
└── currentLanguage: string     # Aktif dil

Actions (Slice):
├── addItem()           # Varlık ekleme
├── removeItem()        # Varlık silme
├── updatePrice()       # Fiyat güncelleme
├── setLanguage()       # Dil değiştirme
├── resetAll()          # Tüm veriyi sıfırlama
└── loadPersistedData() # AsyncStorage'dan yükleme

Selectors:
├── selectItems         # Portfolio items
├── selectPrices        # Current prices
├── selectHistory       # Transaction history
├── selectLanguage      # Current language
├── selectTotalTL       # Total in TL
└── selectTotalIn(currency) # Total in specific currency
```

## 7. UI/UX Design System

### 7.1 Glassmorphism Tasarım (React Native)
- **Backdrop Blur**: Modern cam efekti (iOS native blur, Android polyfill)
- **Semi-transparent Backgrounds**: `rgba(255, 255, 255, 0.08)`
- **Subtle Borders**: Hafif beyaz borderlar
- **Native Shadows**: Platform-specific shadow sistem

### 7.2 Renk Paleti
```typescript
Primary Gradient: #667eea → #764ba2
Background: #0f172a (Dark theme)
Background Dark: #020617
Glass: rgba(255, 255, 255, 0.08)
Text Primary: #f8fafc
Text Secondary: #cbd5e1
Text Muted: #64748b
Border: rgba(255, 255, 255, 0.1)
Success: #10b981
Error: #ef4444
Warning: #f59e0b
```

### 7.3 Typography
- **Font Family**: System fonts (SF Pro iOS, Roboto Android)
- **Font Weights**: 400, 500, 600, 700
- **Font Scales**: xs(12), sm(14), base(16), lg(18), xl(20), xxl(24), xxxl(32), huge(40)

### 7.4 Spacing & Layout
- **Space Scale**: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32), xxxl(40)
- **Border Radius**: sm(6), md(8), lg(12), xl(16), xxl(20), full(9999)
- **Container**: Max-width 500px, center aligned
- **Safe Area**: React Native Safe Area Context kullanımı

### 7.5 Animations
- **Fast**: 150ms
- **Normal**: 300ms
- **Slow**: 500ms
- **React Native Reanimated**: 60fps smooth animations
- **Gesture Animations**: Native gesture handler ile fluid interactions

## 8. Öne Çıkan Özellikler

### 8.1 Modern Mobile UX Patterns
- **Native Swipe Navigation**: FlatList horizontal paging
- **Pull to Refresh**: Native refresh control
- **Bottom Tab Navigation**: iOS ve Android için optimize
- **Modal Interactions**: Full screen modal'lar
- **Native Alerts**: Platform-specific dialogs
- **Haptic Feedback**: Touch feedback (future)
- **Biometric Auth**: Face ID / Touch ID (future)

### 8.2 Performance Optimizations
- **AsyncStorage**: Instant data persistence
- **Component Memoization**: React.memo optimization
- **FlatList Virtualization**: Büyük listeler için
- **Redux Toolkit**: Optimized state updates
- **TypeScript**: Compile-time optimization
- **Native Animations**: Reanimated 60fps performance

### 8.3 Mobile-First Features
- **Offline Support**: AsyncStorage ile offline-first
- **Auto Update**: Expo OTA updates
- **Push Notifications**: Firebase integration (future)
- **Biometric Login**: Native biometric APIs (future)
- **Share Feature**: Native share API (future)

## 9. Platform Desteği

### 9.1 iOS
- **Minimum**: iOS 13.0
- **Optimize**: iPhone ve iPad
- **Features**: Native blur, haptic feedback, Face ID/Touch ID

### 9.2 Android
- **Minimum**: Android 5.0 (API 21)
- **Optimize**: Modern Android cihazlar
- **Features**: Material Design components, Fingerprint auth

### 9.3 Web (Expo Web)
- **Support**: Modern browsers
- **Limitations**: Bazı native özellikler çalışmaz

## 10. Gelecek Roadmap

### 10.1 Kısa Vadeli (1-2 Hafta)
- [x] Multi-language Support ✅
- [x] Toast Notifications ✅
- [x] TypeScript Integration ✅
- [ ] Real-time API Integration
- [ ] Edit Asset Feature
- [ ] Export Data (CSV/JSON)
- [ ] Dark/Light Theme Toggle
- [ ] Haptic Feedback

### 10.2 Orta Vadeli (1-2 Ay)
- [ ] Charts & Graphs (Victory Native)
- [ ] Price Alerts (Push Notifications)
- [ ] Historical Data
- [ ] Multi-currency Support
- [ ] Biometric Authentication
- [ ] Widget Support (iOS/Android)
- [ ] Share Feature

### 10.3 Uzun Vadeli (3+ Ay)
- [ ] User Accounts (Firebase)
- [ ] Cloud Sync
- [ ] Advanced Analytics
- [ ] Social Features
- [ ] Apple Watch / Wear OS
- [ ] Siri / Google Assistant Shortcuts

## 11. Teknik Notlar

### 11.1 Fiyat Sistemi (Mevcut)
```typescript
Sabit Fiyatlar (TL):
├── 22 Ayar: 2300 TL/gram
├── 24 Ayar: 2500 TL/gram
├── Çeyrek: 4000 TL/adet
├── Tam: 16000 TL/adet
├── USD: 34 TL
├── EUR: 36 TL
└── Gümüş: 30 TL/gram
```

### 11.2 Hesaplama Mantığı
- **Altın Karşılık**: Gram bazında karşılık hesaplama
- **Para Birimi Çevirimi**: TL üzerinden çapraz kur hesaplama
- **Otomatik Gruplandırma**: Aynı tür varlıkların toplanması
- **Real-time Updates**: Redux selectors ile memoized calculations

## 12. Vue.js'den React Native'e Dönüşüm

### 12.1 Teknoloji Karşılıkları
| Vue.js | React Native | Açıklama |
|--------|--------------|----------|
| Vuex | Redux Toolkit | State management |
| Vue Router | React Navigation | Navigation |
| localStorage | AsyncStorage | Data persistence |
| v-for | FlatList | List rendering |
| v-if | Conditional rendering | Conditional UI |
| @click | onPress | Touch events |
| Composition API | React Hooks | Component logic |
| SCSS | StyleSheet | Styling |
| Vite | Metro | Bundler |

### 12.2 Yeni Avantajlar
- **Native Performance**: 60fps smooth animations
- **Platform APIs**: Camera, biometric, push notifications
- **TypeScript**: Full type safety
- **Mobile-First**: Touch gestures, native components
- **Offline-First**: Built-in offline support
- **App Store**: Native app distribution

## 13. Geliştirme Notları

### 13.1 Best Practices
- TypeScript strict mode kullanımı
- Component memoization ile performance
- FlatList virtualization için keyExtractor
- AsyncStorage için try-catch blocks
- Platform-specific code ile optimize
- Safe Area insets kullanımı

### 13.2 Testing Strategy (Future)
- Unit tests: Jest
- Component tests: React Native Testing Library
- E2E tests: Detox
- Performance tests: Flipper

---

**Not**: Bu PRD, Vue.js versiyonundan React Native'e dönüştürülen Portfolio Tracker uygulamasının teknik dokümantasyonudur. Tüm özellikler mobile-first yaklaşım ile yeniden tasarlanmıştır.
