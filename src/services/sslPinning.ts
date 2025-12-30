/**
 * SSL Pinning Service
 * 
 * SSL certificate pinning için wrapper service
 * 
 * NOT: Expo managed workflow'da SSL pinning için native modül gerekiyor
 * Bu dosya şimdilik standart SSL validation kullanıyor
 * Gelecekte native SSL pinning modülü eklendiğinde buraya entegre edilebilir
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';
import { isDevelopment } from '../utils/env';

/**
 * SSL Pinning Configuration
 */
export interface SSLPinningConfig {
  enabled: boolean;
  certificates?: string[]; // Certificate hashes (SHA-256)
  allowSelfSigned?: boolean; // Development only
}

/**
 * Default SSL pinning config
 * Production'da enabled olmalı, development'ta optional
 */
const defaultSSLPinningConfig: SSLPinningConfig = {
  enabled: !isDevelopment(), // Production'da enabled
  allowSelfSigned: isDevelopment(), // Development'ta self-signed certificates allow
};

/**
 * Create axios instance with SSL pinning configuration
 * 
 * NOT: Şu an için standart SSL validation kullanıyor
 * Native SSL pinning modülü eklendiğinde bu fonksiyon güncellenecek
 */
export const createSSLPinnedAxios = (
  config: SSLPinningConfig = defaultSSLPinningConfig
): AxiosInstance => {
  const axiosConfig: AxiosRequestConfig = {
    timeout: 10000,
    validateStatus: (status) => status === 200,
    // SSL pinning için native modül gerekiyor
    // Şimdilik standart SSL validation kullanıyoruz
  };

  // Development'ta SSL pinning disabled olabilir
  if (isDevelopment() && !config.enabled) {
    logger.debug('[SSL_PINNING] SSL pinning disabled in development mode');
  } else if (config.enabled) {
    logger.debug('[SSL_PINNING] SSL pinning enabled (native module required for full implementation)');
    // TODO: Native SSL pinning modülü eklendiğinde buraya entegre et
    // Örnek:
    // if (config.certificates && config.certificates.length > 0) {
    //   axiosConfig.httpsAgent = createSSLPinningAgent(config.certificates);
    // }
  }

  return axios.create(axiosConfig);
};

/**
 * Validate certificate hash
 * 
 * NOT: Şu an için placeholder
 * Native modül eklendiğinde implement edilecek
 */
export const validateCertificate = (
  certificateHash: string,
  allowedHashes: string[]
): boolean => {
  if (!allowedHashes || allowedHashes.length === 0) {
    logger.warn('[SSL_PINNING] No allowed certificate hashes provided');
    return false;
  }

  const normalizedHash = certificateHash.toLowerCase().trim();
  const isValid = allowedHashes.some(
    (hash) => hash.toLowerCase().trim() === normalizedHash
  );

  if (!isValid) {
    logger.warn('[SSL_PINNING] Certificate hash validation failed', {
      provided: certificateHash,
      allowed: allowedHashes,
    });
  }

  return isValid;
};

/**
 * Extract certificate hash from URL
 * 
 * NOT: Şu an için placeholder
 * Native modül eklendiğinde implement edilecek
 */
export const extractCertificateHash = async (url: string): Promise<string | null> => {
  // TODO: Native modül ile certificate hash extract et
  logger.debug('[SSL_PINNING] Certificate hash extraction not implemented (requires native module)');
  return null;
};

/**
 * SSL Pinning Status
 */
export const getSSLPinningStatus = (): {
  enabled: boolean;
  nativeModuleAvailable: boolean;
  certificatesConfigured: boolean;
} => {
  return {
    enabled: defaultSSLPinningConfig.enabled,
    nativeModuleAvailable: false, // Native modül eklendiğinde true olacak
    certificatesConfigured: false, // Certificate'ler configure edildiğinde true olacak
  };
};

