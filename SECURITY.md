# Security Notes

## Current Status

### ✅ Resolved
- **tar**: Updated to latest version (security vulnerabilities fixed)
- **undici**: Updated to latest version (resource exhaustion vulnerability fixed)
- **Dependencies**: 27 packages updated to latest compatible versions

### ⚠️ Remaining Issues (Non-Critical)

#### eas-cli Related Vulnerabilities (devDependency)
Current version: `16.28.0` (latest)

The following vulnerabilities are in eas-cli's nested dependencies:
- `diff` (low severity): DoS vulnerability
- `node-forge` (high severity): ASN.1 parsing issues
- `tar` (high severity): Path traversal issues

**Why not critical:**
- eas-cli is a devDependency only used for builds/deployments
- Not included in production app bundle
- Latest eas-cli version (16.28.0) is already installed
- npm audit suggests downgrade to 13.4.2 (incorrect recommendation)

**Action:** Monitor eas-cli updates for fixes to nested dependencies.

## Node.js Version

### Current
- Node.js: `v20.2.0`
- npm: `9.6.6`

### Recommended
- Node.js: `≥20.19.4` (LTS)
- npm: `≥9.6.6`

### Upgrade Instructions

#### Using nvm (Recommended)
```bash
# Install nvm if not installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use recommended Node version
nvm install 20.19.4
nvm use 20.19.4
nvm alias default 20.19.4

# Verify
node --version  # Should show v20.19.4
```

#### Using Homebrew (macOS)
```bash
brew update
brew upgrade node
```

#### After Upgrading Node
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild native modules
npx expo prebuild --clean
```

## Regular Maintenance

### Weekly
```bash
# Check for outdated packages
npm outdated

# Update minor/patch versions
npm update
```

### Monthly
```bash
# Security audit
npm audit

# Fix non-breaking vulnerabilities
npm audit fix
```

### Before Production Deployment
```bash
# Full security check
npm audit --production

# Ensure all critical/high vulnerabilities are addressed
```

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Contact the maintainer directly
3. Include detailed reproduction steps
4. Allow time for fix before public disclosure

## Best Practices Applied

### Network & Error Handling
- ✅ Graceful degradation for network failures
- ✅ Comprehensive error tracking system
- ✅ Detailed debug logging in development
- ✅ Offline data backup mechanism
- ✅ Request cancellation support
- ✅ Exponential backoff retry logic

### Data Validation
- ✅ Finance-safe number parsing
- ✅ Input sanitization
- ✅ Type validation for API responses
- ✅ Backup data integrity checks

### Production Security
- ✅ No sensitive data in logs (production)
- ✅ Error tracking prepared for external service
- ✅ Secure local data storage (SQLite)
- ✅ No hardcoded credentials

## Dependencies Security Notes

### Critical Dependencies
- **expo**: Framework foundation - keep updated
- **react**: 18.2.0 (LTS) - Stable, production-ready
- **react-native**: 0.76.5 - React 18 compatible, stable
- **axios**: API client - security-critical, always update
- **@reduxjs/toolkit**: State management - update regularly

### React Version Policy
- ✅ Using React 18.2.0 (LTS) for stability
- ❌ React 19.x avoided - too new, not battle-tested for RN
- React 18.2.0 is recommended until React 19 matures in RN ecosystem

### Native Modules
- **@react-native-community/netinfo**: Network detection
- **expo-sqlite**: Local database
- **react-native-gesture-handler**: Touch interactions

**Important:** After updating native modules, always run:
```bash
npx expo prebuild --clean
# iOS
npx pod-install
```

## Last Security Review
Date: 2026-01-26
Reviewer: Claude Code
Status: ✅ No critical production vulnerabilities
