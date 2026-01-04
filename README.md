# 📱 Portfolio Tracker - React Native

A modern, mobile-first portfolio tracking application built with React Native. A professional app featuring comprehensive investment tracking capabilities with glassmorphism design language.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white)

## ✨ Features

### 🎨 Premium Design System
- **Glassmorphism UI**: Modern glass effect cards and backdrop blur
- **Dark Theme**: Sophisticated dark color scheme with gradients
- **Swipe Navigation**: Touch-friendly portfolio value transitions
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Native Mobile UX**: Optimized experience for iOS and Android

### 🌍 Multi-language Support
- **3 Language Support**: Turkish, English, German
- **Auto Language Detection**: Automatically detects device language
- **Persistent Preference**: Saves language preference with AsyncStorage
- **Instant Language Switching**: UI updates without refresh

### 💎 Advanced Investment Tracking
- **Multi-Asset Portfolio**: Gold (22/24 Karat, Quarter, Full), Silver, USD, EUR
- **Smart Grouping**: Automatic consolidation of same asset types
- **Multi-Currency**: Switch between TL, USD, EUR, Gold equivalents
- **Transaction History**: Complete log of all portfolio changes
- **Real-time Calculation**: Instant portfolio value updates

### 🔧 Technical Excellence
- **React Native + Expo**: Modern mobile app framework
- **TypeScript**: Type-safe code development
- **Redux Toolkit**: Predictable state management
- **React Navigation**: Native mobile navigation
- **AsyncStorage**: Zero-latency data access
- **i18next**: Professional localization system

## 📁 Project Structure

```
src/
├── components/              # Reusable components
│   ├── AddItemModal.tsx        # Asset addition modal
│   ├── QuickAddModal.tsx       # Quick add modal
│   ├── QuickRemoveModal.tsx    # Quick remove modal
│   ├── SwipeableAssetItem.tsx  # Swipeable asset card
│   ├── TabIcon.tsx             # Tab navigation icons
│   └── ToastNotification.tsx   # Toast notification system
├── screens/                 # Screen components
│   ├── PortfolioScreen.tsx     # Main portfolio screen
│   ├── HistoryScreen.tsx       # Transaction history screen
│   └── SettingsScreen.tsx      # Settings screen
├── store/                   # Redux store
│   ├── index.ts                # Store configuration
│   └── portfolioSlice.ts       # Portfolio state management
├── navigation/              # React Navigation
│   └── BottomTabNavigator.tsx  # Bottom tab navigation
├── locales/                 # Multi-language support
│   ├── index.ts                # i18next configuration
│   ├── tr.ts                   # Turkish translations
│   ├── en.ts                   # English translations
│   └── de.ts                   # German translations
├── hooks/                   # Custom React hooks
│   ├── useRedux.ts             # Redux hooks
│   └── useToast.ts             # Toast system hook
├── theme/                   # Design system
│   └── index.ts                # Colors, spacing, typography
├── types/                   # TypeScript types
│   └── index.ts                # Type definitions
├── services/                # External services
│   └── priceService.ts         # Price fetching service
└── utils/                   # Utility functions
    └── haptics.ts              # Haptic feedback utils
```

## 🛠️ Installation

### Requirements
- Node.js ^20.19.0 || >=22.12.0
- npm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/esatakpunar/portfolio-tracker-rn.git

# Navigate to project directory
cd portfolio-tracker-rn

# Install dependencies
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

## 📦 Tech Stack

| Technology | Version | Purpose |
|-----------|----------|----------------|
| **React Native** | 0.81.4 | Mobile application framework |
| **Expo** | ~54.0.12 | Development and build platform |
| **TypeScript** | ~5.9.2 | Type-safe development |
| **Redux Toolkit** | ^2.9.0 | State management |
| **React Navigation** | ^7.x | Navigation system |
| **i18next** | ^25.5.3 | Multi-language support |
| **AsyncStorage** | ^2.2.0 | Local data storage |
| **React Native Reanimated** | ^4.1.2 | Performant animations |
| **React Native Gesture Handler** | ^2.28.0 | Advanced gestures |

## 🎯 Main Features

### Portfolio Management
- ➕ **Add Assets**: Modal-based quick asset addition
- 🔄 **Auto Grouping**: Consolidation of same asset types
- 🗑️ **Delete Assets**: Simple deletion with confirmation
- 💱 **Multi-Currency**: TL, USD, EUR, Gold views

### User Interface
- 📱 **Mobile-First**: Designed for mobile
- ⚡ **Swipe Navigation**: Touch-friendly value transitions
- 🎨 **Glassmorphism**: Modern glass effect design
- 🔄 **Smooth Transitions**: Fluid animations

### Data Management
- 💾 **AsyncStorage**: Serverless persistent data
- 📊 **Transaction History**: Complete audit trail
- ⚙️ **Settings Panel**: Price display and data management
- 🔄 **Reset**: Clear all data
- 🌐 **Language Management**: In-app language switching
- 🔔 **Toast Notifications**: User feedback

## 💰 Supported Assets

| Category | Assets | Notes |
|----------|-----------|--------|
| **Gold** | 22 Karat, 24 Karat, Quarter, Full | Automatic gram conversion |
| **Currencies** | USD, EUR | Major forex pairs |
| **Precious Metals** | Silver (gram-based) | Commodity tracking |

## 🌐 Multi-language Support

The app offers seamless transitions in 3 languages:

- **🇹🇷 Turkish**: Default language, comprehensive translation
- **🇺🇸 English**: Full UI translation with appropriate formatting
- **🇩🇪 German**: Complete localization including number formats

### Language Features
- **Auto Detection**: Detects device language preference
- **AsyncStorage Persistence**: Saves language preference locally
- **Instant Switching**: Updates immediately without refresh
- **Contextual Formatting**: Currency and date formats
- **Toast Messages**: Localized notification system

## 🎨 Design System

- **Colors**: Dark theme with gradient accents
- **Typography**: System fonts for optimal readability
- **Spacing**: 4px grid system
- **Components**: Glassmorphism cards and modals
- **Animations**: 300ms ease-out transitions

## 📱 Platform Support

- **iOS**: iOS 13.0 and above
- **Android**: Android 5.0 (API 21) and above
- **Web**: Modern browsers (with Expo web support)

## 🚀 Roadmap

### Short Term
- [x] **Multi-language Support**: Turkish, English, German ✅
- [x] **Toast Notifications**: Success/error notifications ✅
- [ ] **Real-time API**: Live price data integration
- [ ] **Edit Assets**: Update existing assets
- [ ] **Data Export**: CSV/JSON export
- [ ] **Theme Selector**: Dark/Light mode

### Medium Term
- [ ] **Charts & Graphs**: Portfolio performance charts
- [ ] **Price Alerts**: Push notification system
- [ ] **Historical Data**: Historical price analysis
- [ ] **More Currencies**: Extended currency support
- [ ] **Biometric Auth**: Touch ID / Face ID

### Long Term
- [ ] **User Accounts**: Account system for cloud sync
- [ ] **Multi-Device Sync**: Cross-device synchronization
- [ ] **Advanced Analytics**: Detailed financial analysis
- [ ] **Social Features**: Portfolio sharing
- [ ] **Widget Support**: iOS and Android widgets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Developer

**Esat Akpunar**

- GitHub: [@esatakpunar](https://github.com/esatakpunar)

## 🙏 Acknowledgments

This project is a React Native conversion of the Vue.js version. Check out the [portfolio-tracker](https://github.com/esatakpunar/portfolio-tracker) repo for the original Vue.js application.

---

⭐ Don't forget to star this project if you like it!
