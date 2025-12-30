/**
 * Example Migration: Version 1 -> Version 2
 * 
 * Bu dosya örnek bir migration'dır.
 * Gerçek migration gerektiğinde bu dosyayı kopyalayıp düzenleyin.
 * 
 * Kullanım:
 * 1. Bu dosyayı kopyala: v1-to-v2.example.ts -> v1-to-v2.ts
 * 2. migrations/index.ts'te import et ve MIGRATIONS[2] = v1ToV2Migration ekle
 * 3. CURRENT_VERSION'ı 2'ye yükselt
 */

import { PersistedState } from './types';

/**
 * Version 1'den Version 2'ye migration
 * 
 * Örnek: Yeni bir field ekleme
 */
export const v1ToV2Migration = async (state: PersistedState): Promise<PersistedState> => {
  return {
    ...state,
    portfolio: {
      ...state.portfolio,
      // Yeni field'lar ekle
      // newField: defaultValue,
    },
  };
};

