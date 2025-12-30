# SSL Pinning Implementation Guide

Bu dokümantasyon SSL pinning implementasyonu için rehberdir.

## Mevcut Durum

SSL pinning altyapısı hazırlandı ancak **native modül gerekiyor**. Expo managed workflow'da SSL pinning için native modül eklenmesi gerekiyor.

## Neden Native Modül Gerekli?

SSL pinning, network request'lerin certificate validation'ını kontrol etmek için native platform API'lerine ihtiyaç duyar:
- **iOS**: `NSURLSession` ve `AFNetworking` SSL pinning desteği
- **Android**: `OkHttp` certificate pinning

Expo managed workflow'da bu native API'lere direkt erişim yok, bu yüzden custom native modül gerekiyor.

## Seçenekler

### 1. Expo Dev Client ile Custom Native Module

Expo dev client kullanarak custom native modül eklenebilir:

```bash
# Expo dev client kurulumu
npx expo install expo-dev-client

# Native modül oluşturma
npx create-expo-module ssl-pinning
```

### 2. Third-Party Library

React Native için SSL pinning library'leri:
- `react-native-ssl-pinning` - Expo managed workflow'da çalışmayabilir
- `react-native-cert-pinner` - Expo managed workflow'da çalışmayabilir

### 3. EAS Build ile Native Code

EAS Build kullanarak native code eklenebilir:
- `eas build --profile development` ile native modül test edilebilir

## Implementation Steps

### Step 1: Native Module Oluştur

```typescript
// native/sslPinning.ts
import { NativeModules } from 'react-native';

interface SSLPinningModule {
  validateCertificate(url: string, hashes: string[]): Promise<boolean>;
  extractCertificateHash(url: string): Promise<string>;
}

export default NativeModules.SSLPinning as SSLPinningModule;
```

### Step 2: Certificate Hash'leri Ekle

```typescript
// src/config/certificates.ts
export const CERTIFICATE_HASHES = [
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Example hash
  // Production certificate hash'leri buraya eklenecek
];
```

### Step 3: Axios Instance'ı Güncelle

```typescript
// src/services/priceService.ts
import { createSSLPinnedAxios } from './sslPinning';
import { CERTIFICATE_HASHES } from '../config/certificates';

const axiosInstance = createSSLPinnedAxios({
  enabled: true,
  certificates: CERTIFICATE_HASHES,
});
```

## Security Best Practices

1. **Certificate Hash'leri Güvenli Tut**: Certificate hash'leri hardcode etme, environment variable'lardan al
2. **Production'da Enable Et**: Development'ta disable edilebilir, production'da mutlaka enabled olmalı
3. **Backup Certificate'ler**: Birden fazla certificate hash'i kullan (certificate rotation için)
4. **Regular Updates**: Certificate'ler expire olduğunda güncelle

## Testing

SSL pinning test etmek için:
1. Proxy tool kullan (Charles Proxy, mitmproxy)
2. Invalid certificate ile test et
3. Certificate hash validation'ı test et

## Notlar

- **Expo Managed Workflow**: Native modül eklenene kadar SSL pinning tam olarak çalışmayacak
- **Development**: Development'ta SSL pinning disable edilebilir (debugging için)
- **Production**: Production'da mutlaka enabled olmalı

## Gelecek Adımlar

1. Native SSL pinning modülü oluştur
2. Certificate hash'leri extract et ve configure et
3. Axios instance'ı SSL pinning ile güncelle
4. Test coverage ekle
5. Production'da enable et

