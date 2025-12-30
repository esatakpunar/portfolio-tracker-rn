/**
 * Environment utilities
 * 
 * __DEV__ React Native'de Metro bundler tarafından inject edilir
 * Ama bazen çalışmayabilir, bu yüzden güvenli bir wrapper kullanıyoruz
 */

// Global __DEV__ type declaration
declare global {
  const __DEV__: boolean | undefined;
}

/**
 * Development mode kontrolü
 * Güvenli bir şekilde __DEV__'i kontrol eder
 */
export const isDevelopment = (): boolean => {
  try {
    // Global __DEV__ kontrolü (Metro bundler tarafından inject edilir)
    // @ts-ignore - Runtime'da global olabilir
    const globalDev = typeof global !== 'undefined' && (global as any).__DEV__;
    if (typeof globalDev === 'boolean') {
      return globalDev;
    }
    
    // Window object kontrolü (web için)
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const windowDev = window.__DEV__;
      if (typeof windowDev === 'boolean') {
        return windowDev;
      }
    }
    
    // Fallback: process.env.NODE_ENV kontrolü
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV !== 'production';
    }
    
    // Son çare: default olarak development kabul et (güvenli taraf)
    // Production'da logger zaten console'a yazmıyor, bu yüzden güvenli
    return true;
  } catch (e) {
    // Hata durumunda development kabul et (güvenli taraf)
    return true;
  }
};

/**
 * Production mode kontrolü
 */
export const isProduction = (): boolean => {
  return !isDevelopment();
};

