# App Store Submission - Manual Tasks Guide

## Completed Tasks ✅

1. **Privacy Policy** - Created `PRIVACY_POLICY.md` with comprehensive privacy statement
2. **Support Documentation** - Created `SUPPORT.md` with user help and contact info
3. **App Configuration** - Updated `app.json` with iOS production settings
4. **EAS Configuration** - Created `eas.json` for build profiles
5. **Code Improvements** - Added financial disclaimer, removed console.logs, improved error handling
6. **App Descriptions** - Created comprehensive descriptions in Turkish, English, and German

## Remaining Manual Tasks 📋

### 1. Apple Developer Account Setup
**Status:** ⏳ Pending (Manual - You need to do this)

**Steps:**
1. Go to [developer.apple.com](https://developer.apple.com)
2. Click "Account" → "Enroll"
3. Choose "Individual" account type
4. Pay $99/year fee with credit card
5. Complete identity verification (24-48 hours)
6. Set up two-factor authentication
7. Complete Tax and Banking information in App Store Connect

**Estimated Time:** 2-3 days (mostly waiting for verification)

### 2. App Icon Verification/Creation
**Status:** ⏳ Pending (Manual - You need to verify)

**Current Icon:** `assets/icon.png`

**Requirements:**
- 1024x1024 pixels
- RGB color space (not CMYK)
- No transparency/alpha channel
- No rounded corners (iOS adds them automatically)
- High quality, professional design

**Action Required:**
1. Check if current icon meets requirements
2. If not, create new 1024x1024 icon
3. Ensure it represents your app well
4. Test how it looks on different backgrounds

### 3. Screenshots Creation
**Status:** ⏳ Pending (Manual - You need to create these)

**Required Screenshots:**
- iPhone 6.7" Display (1290 x 2796) - iPhone 15 Pro Max, 14 Pro Max
- iPhone 6.5" Display (1242 x 2688) - iPhone 11 Pro Max, XS Max  
- iPad Pro 12.9" Display (2048 x 2732)
- iPad Pro 11" Display (1668 x 2388)

**Minimum:** 3 screenshots per device size
**Maximum:** 10 screenshots per device size

**Screenshot Content Suggestions:**
1. **Main Portfolio Screen** - Show assets and total value
2. **Add Asset Modal** - Demonstrate adding new assets
3. **Settings Screen** - Show language options and disclaimer
4. **History Screen** - Show transaction history
5. **Currency Switcher** - Show different currency views

**How to Create:**
1. Run app on iOS Simulator
2. Use different device sizes
3. Take screenshots with Simulator → Device → Screenshot
4. Ensure screenshots show app functionality clearly
5. Add text overlays if needed (optional)

### 4. Privacy Policy Hosting
**Status:** ⏳ Pending (Manual - You need to host this)

**Options:**
1. **GitHub Pages** (Free)
   - Create GitHub repository
   - Enable GitHub Pages
   - Upload `PRIVACY_POLICY.md` as `index.html`
   - URL: `https://yourusername.github.io/privacy-policy`

2. **Personal Website** (If you have one)
   - Upload to your website
   - Make it publicly accessible

3. **Free Hosting Services**
   - Netlify, Vercel, or similar
   - Upload the markdown file

**Action Required:**
1. Choose hosting option
2. Upload privacy policy
3. Test URL accessibility
4. Update `app.json` with privacy policy URL

### 5. EAS Project Setup
**Status:** ⏳ Pending (Manual - You need to configure)

**Steps:**
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Initialize project: `eas init`
4. Update `eas.json` with your project ID
5. Configure iOS credentials: `eas credentials`

**Commands:**
```bash
npm install -g eas-cli
eas login
eas init
eas credentials
```

### 6. App Store Connect Setup
**Status:** ⏳ Pending (Manual - You need to create listing)

**Steps:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in app information:
   - Platform: iOS
   - Bundle ID: `com.portfoliotracker.app`
   - App Name: Portfolio Tracker
   - Primary Language: Turkish
   - Category: Finance
   - Secondary Category: Utilities

4. **App Information Tab:**
   - Privacy Policy URL (from step 4)
   - Support URL (GitHub issues or email)
   - Marketing URL (optional)

5. **Pricing and Availability:**
   - Price: Free
   - Availability: All countries

6. **App Privacy Tab:**
   - Complete privacy questionnaire
   - Declare: Data stored on device only
   - No data collection practices

7. **Version Information:**
   - Version: 1.0.0
   - Copyright: 2025 Esat Akpunar
   - Upload screenshots (from step 3)
   - Add descriptions (from `APP_STORE_DESCRIPTIONS.md`)
   - Add keywords

### 7. Production Build
**Status:** ⏳ Pending (Manual - You need to build)

**Steps:**
1. Ensure all code changes are committed
2. Run production build: `eas build --platform ios --profile production`
3. Wait for build to complete (10-20 minutes)
4. Test the build on device/simulator
5. Fix any issues if found

### 8. App Submission
**Status:** ⏳ Pending (Manual - You need to submit)

**Steps:**
1. Submit build: `eas submit --platform ios`
2. Or manually upload via Xcode/Transporter
3. Add review notes:
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
   ```

## Priority Order for Manual Tasks

1. **Apple Developer Account** (Start immediately - takes longest)
2. **Privacy Policy Hosting** (Quick - can be done today)
3. **App Icon Verification** (Quick - check current icon)
4. **Screenshots Creation** (Medium - 2-3 hours work)
5. **EAS Project Setup** (Medium - 1 hour work)
6. **App Store Connect Setup** (Medium - 2 hours work)
7. **Production Build** (Quick - automated)
8. **App Submission** (Quick - automated)

## Estimated Timeline

- **Today:** Privacy policy hosting, icon verification
- **Day 2-3:** Screenshots creation, EAS setup
- **Day 3-4:** App Store Connect setup (after Apple account approval)
- **Day 4-5:** Build and submit
- **Day 5-8:** Apple review (1-3 days)

**Total: 5-8 days** (depending on Apple account verification speed)

## Important Notes

1. **Apple Account Verification** is the longest step - start immediately
2. **Privacy Policy URL** must be publicly accessible before submission
3. **Screenshots** are crucial for App Store approval - make them professional
4. **Review Notes** help Apple understand your app - be clear and detailed
5. **First-time submissions** often get rejected - be prepared to fix and resubmit

## Support Files Created

- `PRIVACY_POLICY.md` - Complete privacy policy
- `SUPPORT.md` - User support documentation  
- `APP_STORE_DESCRIPTIONS.md` - All app store text content
- `eas.json` - Build configuration
- Updated `app.json` - Production iOS settings

All technical code improvements are complete. The remaining tasks are primarily administrative and require manual work that cannot be automated.
