# Environment Setup Guide

Bu dokümantasyon environment variable'ların nasıl kurulacağını açıklar.

## Environment Management System

Uygulama merkezi bir environment management system kullanır. Tüm environment-based configuration `src/config/environment.ts` dosyasından yönetilir.

## Environment Types

Uygulama üç farklı environment'ı destekler:

- **development**: Geliştirme ortamı
- **staging**: Test/Staging ortamı
- **production**: Production ortamı

Environment, `EXPO_PUBLIC_ENVIRONMENT` veya `NODE_ENV` environment variable'ından belirlenir.

## Environment Variables

Uygulama environment variable'ları kullanarak configuration yönetir.

### Gerekli Environment Variables

#### Environment Selection

```bash
# Set environment (development, staging, production)
# Default: development
EXPO_PUBLIC_ENVIRONMENT=production
```

#### API Configuration

```bash
# API Base URL (without trailing slash)
# If not set, uses environment-specific defaults
EXPO_PUBLIC_API_BASE_URL=https://finans.truncgil.com/v4

# API Timeout in milliseconds
# Defaults: development=20000, staging=15000, production=10000
EXPO_PUBLIC_API_TIMEOUT=10000

# API Retry Attempts
# Defaults: development=1, staging=2, production=3
EXPO_PUBLIC_API_RETRY_ATTEMPTS=3

# API Retry Delay in milliseconds
# Defaults: development=500, staging=1500, production=1000
EXPO_PUBLIC_API_RETRY_DELAY=1000

# API Cache TTL in milliseconds
# Defaults: development=60000, staging=120000, production=300000
EXPO_PUBLIC_API_CACHE_TTL=300000

# API Cache Stale Threshold in milliseconds
# Defaults: development=30000, staging=60000, production=120000
EXPO_PUBLIC_API_CACHE_STALE_THRESHOLD=120000
```

#### Sentry Configuration (Optional)

```bash
# Sentry DSN
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Enable Sentry in Development (optional, default: false)
EXPO_PUBLIC_ENABLE_SENTRY_IN_DEV=false
```

#### Feature Flags

```bash
# Enable logging (default: true in dev/staging, false in production)
EXPO_PUBLIC_ENABLE_LOGGING=true

# Enable analytics (default: true in staging/production, false in dev)
EXPO_PUBLIC_ENABLE_ANALYTICS=true
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

## Environment-Specific Defaults

Environment variable'lar set edilmezse, environment'a göre default değerler kullanılır:

### Development
- API Timeout: 20000ms (20 seconds)
- Retry Attempts: 1
- Retry Delay: 500ms
- Cache TTL: 60000ms (1 minute)
- Cache Stale Threshold: 30000ms (30 seconds)
- Logging: Enabled
- Analytics: Disabled

### Staging
- API Timeout: 15000ms (15 seconds)
- Retry Attempts: 2
- Retry Delay: 1500ms
- Cache TTL: 120000ms (2 minutes)
- Cache Stale Threshold: 60000ms (1 minute)
- Logging: Enabled
- Analytics: Enabled

### Production
- API Timeout: 10000ms (10 seconds)
- Retry Attempts: 3
- Retry Delay: 1000ms
- Cache TTL: 300000ms (5 minutes)
- Cache Stale Threshold: 120000ms (2 minutes)
- Logging: Disabled (unless explicitly enabled)
- Analytics: Enabled

## Important Notes

- **EXPO_PUBLIC_** prefix: Expo'da public environment variable'lar için `EXPO_PUBLIC_` prefix'i kullanılmalı
- **Default Values**: Environment variable'lar set edilmezse environment-specific default değerler kullanılır
- **Security**: `.env` dosyası git'e commit edilmemeli (`.gitignore`'da olmalı)
- **Production**: Production'da environment variable'lar build time'da set edilir
- **Centralized Config**: Tüm environment configuration `src/config/environment.ts` dosyasından yönetilir

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

