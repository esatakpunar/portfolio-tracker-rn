# Quick Command Reference for App Store Submission

## EAS Setup Commands

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Initialize EAS project (creates project ID)
eas init

# Configure iOS credentials
eas credentials

# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Run on web
npm run web
```

## Screenshot Creation Commands

```bash
# Start iOS simulator
npm run ios

# In Simulator:
# Device → Screenshot (Cmd+S)
# Or Device → Screenshot → Save to Desktop
```

## Required Screenshot Sizes

- **iPhone 6.7"**: 1290 x 2796 (iPhone 15 Pro Max, 14 Pro Max)
- **iPhone 6.5"**: 1242 x 2688 (iPhone 11 Pro Max, XS Max)
- **iPad Pro 12.9"**: 2048 x 2732
- **iPad Pro 11"**: 1668 x 2388

## App Store Connect URLs

- **Main Portal**: https://appstoreconnect.apple.com
- **Developer Account**: https://developer.apple.com
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

## Important Bundle Identifiers

- **iOS Bundle ID**: `com.portfoliotracker.app`
- **App Name**: Portfolio Tracker
- **Version**: 1.0.0
- **Build Number**: 1

## Privacy Policy Hosting Options

1. **GitHub Pages** (Recommended - Free)
   ```bash
   # Create new repository
   # Enable GitHub Pages in settings
   # Upload PRIVACY_POLICY.md as index.html
   ```

2. **Netlify** (Free)
   - Drag and drop PRIVACY_POLICY.md
   - Get instant URL

3. **Vercel** (Free)
   - Connect GitHub repository
   - Deploy automatically

## Testing Checklist

Before submitting, test:
- [ ] App launches without crashes
- [ ] All screens work properly
- [ ] Add/remove assets functionality
- [ ] Language switching works
- [ ] Settings screen displays disclaimer
- [ ] Reset all data works
- [ ] Price refresh works
- [ ] Offline functionality

## Common Issues & Solutions

### Build Errors
```bash
# Clear cache and rebuild
eas build --platform ios --profile production --clear-cache
```

### Credential Issues
```bash
# Reset credentials
eas credentials --clear-credentials
eas credentials
```

### Submission Errors
```bash
# Check build status
eas build:list

# Download build manually if needed
eas build:download [BUILD_ID]
```

## Review Notes Template

```
This is a personal portfolio tracking app that helps users track their investments in gold, silver, and currencies.

Key Points:
- All data is stored locally on the device using AsyncStorage
- No user accounts or authentication required  
- Price data is fetched from public API (finans.truncgil.com) for informational purposes only
- Users can manually add/remove assets and view portfolio value
- App includes data deletion feature (Reset All in Settings)
- Supports Turkish, English, and German languages

No special credentials needed for testing. Simply add assets using the + button.

Financial Disclaimer: Prices shown are for informational purposes only. Users should seek professional financial advice before making investment decisions.
```

## File Checklist

Before submission, ensure you have:
- [ ] `PRIVACY_POLICY.md` (created ✅)
- [ ] `SUPPORT.md` (created ✅)  
- [ ] `APP_STORE_DESCRIPTIONS.md` (created ✅)
- [ ] `eas.json` (created ✅)
- [ ] Updated `app.json` (completed ✅)
- [ ] App icon 1024x1024 (verify current)
- [ ] Screenshots for all required sizes
- [ ] Privacy policy hosted publicly
- [ ] Apple Developer Account active
- [ ] App Store Connect listing created

## Timeline Reminder

- **Day 1**: Apple Developer Account + Privacy Policy Hosting
- **Day 2**: Screenshots + EAS Setup  
- **Day 3**: App Store Connect Setup
- **Day 4**: Build + Submit
- **Day 5-8**: Apple Review

**Total: 5-8 days** (Apple account verification is the bottleneck)
