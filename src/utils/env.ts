/**
 * Environment utilities
 * 
 * __DEV__ React Native'de Metro bundler tarafından inject edilir
 * Ama bazen çalışmayabilir, bu yüzden güvenli bir wrapper kullanıyoruz
 */

/**
 * Development mode kontrolü
 * Güvenli bir şekilde __DEV__'i kontrol eder
 */
export const isDevelopment = (): boolean => {
  try {
    // @ts-ignore - __DEV__ global olarak tanımlı olabilir
    if (typeof __DEV__ !== 'undefined') {
      // @ts-ignore
      return __DEV__;
    }
    
    // Fallback: process.env.NODE_ENV kontrolü
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV !== 'production';
    }
    
    // Son çare: default olarak development kabul et (güvenli taraf)
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

