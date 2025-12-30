# CI/CD Pipeline Documentation

Bu dokümantasyon CI/CD pipeline setup'ını açıklar.

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Her push ve pull request'te çalışır:

**Jobs:**
- **Test**: Jest testlerini çalıştırır, coverage raporu oluşturur
- **Lint**: ESLint ve TypeScript type checking
- **Build Check**: Build'in başarılı olup olmadığını kontrol eder

**Triggers:**
- Push to `main`, `develop`, `sprint-*` branches
- Pull requests to `main`, `develop`

### 2. Build Workflow (`.github/workflows/build.yml`)

Production build'leri oluşturur:

**Jobs:**
- **Build Android**: EAS Build ile Android APK/AAB oluşturur
- **Build iOS**: EAS Build ile iOS IPA oluşturur

**Triggers:**
- Push to `main` branch
- Tags matching `v*` pattern
- Manual trigger (workflow_dispatch)

## Setup Instructions

### 1. GitHub Secrets

GitHub repository settings'den şu secrets'ları ekle:

```
EXPO_TOKEN - Expo access token (EAS Build için)
CODECOV_TOKEN - Codecov token (optional, coverage için)
```

### 2. Expo Token Oluştur

```bash
# Expo CLI ile login
npx expo login

# Token oluştur
npx eas build:configure
```

Token'ı GitHub Secrets'a ekle: `EXPO_TOKEN`

### 3. Workflow'ları Test Et

```bash
# Local'de test et
npm test
npm run type-check

# GitHub'da test et
git push origin main
```

## Workflow Details

### CI Workflow

```yaml
- Test: Jest testleri, coverage raporu
- Lint: ESLint, TypeScript checking
- Build Check: Build validation
```

### Build Workflow

```yaml
- Build Android: EAS Build ile Android build
- Build iOS: EAS Build ile iOS build
```

## Customization

### Test Coverage Threshold

`package.json`'da coverage threshold ekle:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### Linter Configuration

ESLint eklemek için:

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

`.eslintrc.js` oluştur ve `package.json`'da lint script'ini güncelle.

## Troubleshooting

### Build Failures

1. EAS Token kontrol et
2. EAS Build configuration kontrol et (`eas.json`)
3. Dependencies kontrol et

### Test Failures

1. Test timeout'ları kontrol et
2. Mock'ları kontrol et
3. Environment variables kontrol et

### Lint Failures

1. ESLint config kontrol et
2. TypeScript errors kontrol et
3. Formatting issues kontrol et

## Best Practices

1. **Fast Feedback**: CI workflow'ları hızlı olmalı (< 5 dakika)
2. **Parallel Jobs**: Test, lint, build check parallel çalışmalı
3. **Cache**: npm cache kullan (setup-node action)
4. **Fail Fast**: Kritik hatalarda hemen fail et
5. **Notifications**: Build failures için notification setup et

## Future Improvements

- [ ] Code quality checks (SonarQube, CodeClimate)
- [ ] Automated dependency updates (Dependabot)
- [ ] Security scanning (Snyk, npm audit)
- [ ] Performance testing
- [ ] E2E testing (Detox, Maestro)

