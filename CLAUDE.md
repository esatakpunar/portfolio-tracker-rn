# CLAUDE.md - Portfolio Tracker React Native

This document provides guidance for AI assistants working with this codebase.

## Project Overview

Portfolio Tracker is a React Native mobile application for tracking investment portfolios (gold, silver, currencies). It features a modern glassmorphism UI design, multi-language support (Turkish, English, German), and offline-first data persistence using SQLite.

**Current Version:** 1.1.0 (Build 12)

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.81.4 | Mobile framework |
| Expo | 54.0.17 | Development platform |
| TypeScript | ~5.9.2 | Type-safe development |
| Redux Toolkit | ^2.9.0 | State management |
| React Navigation | ^7.x | Navigation system |
| i18next | ^25.5.3 | Internationalization |
| expo-sqlite | ~16.0.10 | Local database |
| React Native Gesture Handler | ^2.28.0 | Gestures |

## Project Structure

```
portfolio-tracker-rn/
├── App.tsx                    # App entry point, initialization
├── index.ts                   # Expo entry point
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── tsconfig.json              # TypeScript configuration
├── assets/                    # App icons, splash screens
└── src/
    ├── components/            # Reusable UI components
    │   ├── AddItemModal.tsx       # Asset addition modal
    │   ├── QuickAddModal.tsx      # Quick add modal
    │   ├── QuickRemoveModal.tsx   # Quick remove modal
    │   ├── SwipeableAssetItem.tsx # Swipeable list item
    │   ├── Text.tsx               # Custom text component
    │   ├── TextInput.tsx          # Custom input component
    │   ├── TabIcon.tsx            # Tab bar icons
    │   ├── ToastNotification.tsx  # Toast system
    │   ├── ErrorBoundary.tsx      # Error handling
    │   ├── EmptyState.tsx         # Empty state display
    │   ├── PriceChangeIndicator.tsx # Price change UI
    │   └── index.ts               # Barrel export
    ├── screens/               # Screen components
    │   ├── PortfolioScreen.tsx    # Main portfolio view
    │   ├── HistoryScreen.tsx      # Transaction history
    │   └── SettingsScreen.tsx     # App settings
    ├── store/                 # Redux state management
    │   ├── index.ts               # Store configuration
    │   ├── portfolioSlice.ts      # Portfolio state slice
    │   └── sqliteStorage.ts       # SQLite persistence adapter
    ├── services/              # Business logic & APIs
    │   ├── database.ts            # SQLite database setup
    │   ├── priceService.ts        # Price fetching from API
    │   ├── priceBackupService.ts  # Price backup/restore
    │   └── portfolioRepository.ts # Data access layer
    ├── navigation/            # React Navigation
    │   └── BottomTabNavigator.tsx # Bottom tab navigation
    ├── locales/               # i18next translations
    │   ├── index.ts               # i18n configuration
    │   ├── tr.ts                  # Turkish translations
    │   ├── en.ts                  # English translations
    │   └── de.ts                  # German translations
    ├── hooks/                 # Custom React hooks
    │   ├── useRedux.ts            # Typed Redux hooks
    │   ├── useToast.ts            # Toast notification hook
    │   └── index.ts               # Barrel export
    ├── theme/                 # Design system
    │   └── index.ts               # Colors, spacing, typography
    ├── types/                 # TypeScript definitions
    │   └── index.ts               # Shared types
    └── utils/                 # Utility functions
        ├── assetUtils.ts          # Asset icons/colors
        ├── formatUtils.ts         # Currency/date formatting
        ├── numberUtils.ts         # Safe math operations
        ├── validationUtils.ts     # Input validation
        ├── amountPresets.ts       # Quick amount presets
        ├── haptics.ts             # Haptic feedback
        └── preferenceStorage.ts   # User preferences
```

## Key Types

```typescript
// Asset types supported by the application
type AssetType = '22_ayar' | '24_ayar' | 'ceyrek' | 'tam' | 'usd' | 'eur' | 'tl' | 'gumus';

// Currency display types
type CurrencyType = 'TL' | 'USD' | 'EUR' | 'ALTIN';

// Portfolio item structure
interface PortfolioItem {
  id: string;
  type: AssetType;
  amount: number;
  description?: string;
  date: string;
}

// History item structure
interface HistoryItem {
  type: 'add' | 'remove' | 'update';
  item: PortfolioItem;
  date: string;
  description?: string;
  previousAmount?: number;
}
```

## Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run web version
npm run web
```

## EAS Build Commands

```bash
# Development build (iOS simulator)
eas build --profile development --platform ios

# Preview build (internal distribution)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

## Code Conventions

### Component Structure

Components follow this pattern:
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/Text';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('translationKey')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Use theme values
    padding: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
});

export default MyComponent;
```

### Redux Pattern

Use typed hooks from `src/hooks/useRedux.ts`:
```typescript
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { selectItems, addItem, removeItem } from '../store/portfolioSlice';

const dispatch = useAppDispatch();
const items = useAppSelector(selectItems);

// Dispatch actions
dispatch(addItem({ type: 'usd', amount: 100 }));
```

### Internationalization

All user-facing strings must use i18next:
```typescript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// Use translation keys
<Text>{t('portfolio')}</Text>
<Text>{t('assetTypes.usd')}</Text>

// Access current language
const currentLang = i18n.language; // 'tr', 'en', or 'de'
```

### Theme Usage

Always use theme constants instead of hardcoded values:
```typescript
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme';

// Colors
backgroundColor: colors.background        // #0f172a
color: colors.textPrimary                  // #f8fafc
borderColor: colors.glassBorder           // rgba(255, 255, 255, 0.1)

// Spacing (4px grid)
padding: spacing.lg                        // 16
margin: spacing.sm                         // 8

// Border radius
borderRadius: borderRadius.lg              // 12

// Font sizes
fontSize: fontSize.base                    // 16

// Shadows
...shadows.glass                           // Spread shadow object
```

### Error Handling

Silent error handling is preferred for non-critical operations:
```typescript
try {
  await someOperation();
} catch (error) {
  // Silently fail - app will continue with fallback behavior
}
```

For user-facing errors, use Alert:
```typescript
import { Alert } from 'react-native';
import { hapticFeedback } from '../utils/haptics';

hapticFeedback.error();
Alert.alert(t('error'), t('errorMessage'));
```

### Haptic Feedback

Use haptic feedback for user interactions:
```typescript
import { hapticFeedback } from '../utils/haptics';

hapticFeedback.light();     // Light tap
hapticFeedback.medium();    // Medium tap
hapticFeedback.heavy();     // Heavy tap
hapticFeedback.success();   // Success notification
hapticFeedback.warning();   // Warning notification
hapticFeedback.error();     // Error notification
hapticFeedback.selection(); // Selection change
```

### Input Validation

Always validate numeric inputs:
```typescript
import { safeAdd, safeSubtract } from '../utils/numberUtils';

// Use safe math operations
const result = safeAdd(a, b);
const diff = safeSubtract(a, b);

// Validate before use
if (isNaN(value) || !isFinite(value) || value < 0) {
  return; // Invalid input, ignore
}
```

## Database Schema

SQLite database (`portfolio.db`) with schema version 2:

```sql
-- Portfolio items
CREATE TABLE portfolio_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Prices cache
CREATE TABLE portfolio_prices (
  asset_type TEXT PRIMARY KEY,
  price REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Transaction history
CREATE TABLE portfolio_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  item_id TEXT,
  item_type TEXT NOT NULL,
  item_amount REAL NOT NULL,
  item_description TEXT,
  item_date TEXT NOT NULL,
  previous_amount REAL,
  description TEXT,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- App settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Price backup (single row table)
CREATE TABLE price_backup (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  prices_json TEXT NOT NULL,
  changes_json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## State Management

Redux store structure:
```typescript
{
  portfolio: {
    items: PortfolioItem[],      // Portfolio assets
    prices: Prices,              // Current prices
    priceChanges: PriceChanges,  // Price change percentages
    history: HistoryItem[],      // Transaction history
    currentLanguage: string      // 'tr' | 'en' | 'de'
  }
}
```

Key selectors:
- `selectItems` - All portfolio items
- `selectPrices` - Current asset prices
- `selectPriceChanges` - Price change percentages
- `selectHistory` - Transaction history
- `selectLanguage` - Current language
- `selectTotalTL` - Total portfolio value in TL
- `selectTotalIn(currency)` - Total in specific currency

Key actions:
- `addItem({ type, amount, description? })` - Add asset
- `removeItem(id)` - Remove asset by ID
- `updateItemAmount({ type, newAmount, description? })` - Update asset amount
- `updatePrice({ key, value })` - Update single price
- `setPrices(prices)` - Set multiple prices
- `setLanguage(code)` - Change language
- `resetAll()` - Clear all data
- `fetchPrices()` - Async thunk to fetch prices from API

## External API

Price data is fetched from: `https://finans.truncgil.com/v4/today.json`

Response mapping:
- USD -> `data.USD.Buying`
- EUR -> `data.EUR.Buying`
- Silver -> `data.GUMUS.Buying`
- Full Gold -> `data.TAMALTIN.Buying`
- Quarter Gold -> `data.CEYREKALTIN.Buying`
- 22k Gold -> `data.YIA.Buying`
- 24k Gold -> `data.GRA.Buying`

## Important Notes

1. **Font Scaling Disabled**: Font scaling is disabled globally in `App.tsx` to ensure consistent UI across devices.

2. **Dark Theme Only**: The app uses dark theme (`userInterfaceStyle: "dark"` in app.json).

3. **Offline-First**: Data is persisted to SQLite. The app works fully offline with cached prices.

4. **Price Backup**: Prices are backed up to SQLite. If API fails, cached prices are used.

5. **State Restoration**: App state is restored from SQLite on startup in `App.tsx`.

6. **No Tests Currently**: The project doesn't have a test suite yet.

7. **Path Aliases**: TypeScript path aliases are configured but not consistently used:
   - `@/*` -> `src/*`
   - `@components/*` -> `src/components/*`
   - etc.

## Common Tasks

### Adding a New Asset Type

1. Add type to `AssetType` in `src/types/index.ts`
2. Add price keys to `Prices` and `PriceChanges` interfaces
3. Add initial price in `portfolioSlice.ts`
4. Add translations in all locale files (`tr.ts`, `en.ts`, `de.ts`)
5. Add icon/color in `src/utils/assetUtils.ts`
6. Update API mapping in `src/services/priceService.ts`

### Adding a New Screen

1. Create screen component in `src/screens/`
2. Add to navigation in `src/navigation/BottomTabNavigator.tsx`
3. Add route type to `RootStackParamList` in `src/types/index.ts`
4. Add tab icon in the navigator

### Adding a New Translation

1. Add key-value pairs to all locale files:
   - `src/locales/tr.ts` (Turkish)
   - `src/locales/en.ts` (English)
   - `src/locales/de.ts` (German)
2. Use with `t('newKey')` in components

### Modifying Database Schema

1. Increment `SCHEMA_VERSION` in `src/services/database.ts`
2. Add migration logic in `migrateSchema()` function
3. Update `createSchema()` for fresh installs

## Build & Release

- **Bundle ID (iOS)**: `com.portfoliotracker.app`
- **Package (Android)**: `com.portfoliotracker.app`
- **Apple Team ID**: `ZJUV6ZYP44`
- **ASC App ID**: `6754292674`

App Store submission uses EAS Submit:
```bash
eas submit --platform ios
```
