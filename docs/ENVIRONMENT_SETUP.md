# Environment Setup Guide

Bu dokümantasyon environment variable'ların nasıl kurulacağını açıklar.

## Environment Variables

Uygulama environment variable'ları kullanarak configuration yönetir.

### Gerekli Environment Variables

#### API Configuration

```bash
# API Base URL (without trailing slash)
EXPO_PUBLIC_API_BASE_URL=https://finans.truncgil.com/v4

# API Timeout in milliseconds (default: 10000)
EXPO_PUBLIC_API_TIMEOUT=10000

# API Retry Attempts (default: 3)
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3

# API Retry Delay in milliseconds (default: 1000)
EXPO_PUBLIC_API_RETRY_DELAY=1000
```

#### Sentry Configuration (Optional)

```bash
# Sentry DSN
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Enable Sentry in Development (optional, default: false)
EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV=false
```

## Setup Instructions

### 1. Create .env file

Proje root'unda `.env` dosyası oluştur:

```bash
cp .env.example .env
```

### 2. Set Environment Variables

`.env` dosyasını düzenle ve değerleri ayarla:

```bash
EXPO_PUBLIC_API_BASE_URL=https://finans.truncgil.com/v4
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3
EXPO_PUBLIC_API_RETRY_DELAY=1000
```

### 3. Restart Development Server

Environment variable'ları değiştirdikten sonra development server'ı yeniden başlat:

```bash
npm start -- --clear
```

## Important Notes

- **EXPO_PUBLIC_** prefix: Expo'da public environment variable'lar için `EXPO_PUBLIC_` prefix'i kullanılmalı
- **Default Values**: Environment variable'lar set edilmezse default değerler kullanılır
- **Security**: `.env` dosyası git'e commit edilmemeli (`.gitignore`'da olmalı)
- **Production**: Production'da environment variable'lar build time'da set edilir

## Example .env File

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://finans.truncgil.com/v4
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3
EXPO_PUBLIC_API_RETRY_DELAY=1000

# Sentry Configuration (Optional)
# EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
# EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV=false
```

