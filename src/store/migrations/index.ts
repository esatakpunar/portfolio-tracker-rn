/**
 * Migration System
 * 
 * State structure değişikliklerinde data kaybını önlemek için
 * versioned migration system
 */

import { PersistedState, MigrationFunction, MigrationMap } from './types';
import { logger } from '../../utils/logger';
import { initialState } from '../portfolioSlice';

/**
 * Migration functions for each version
 * Her version için migration function tanımla
 */
const MIGRATIONS: MigrationMap = {
  // Version 1 -> 2 migration (örnek)
  // 2: async (state: PersistedState) => {
  //   return {
  //     ...state,
  //     portfolio: {
  //       ...state.portfolio,
  //       // Yeni field'lar ekle
  //     }
  //   };
  // },
};

/**
 * Get current version from state
 */
const getStateVersion = (state: PersistedState | undefined): number => {
  if (!state || !state._persist) {
    return 0; // No version info, assume version 0
  }
  return state._persist.version || 0;
};

/**
 * Migrate state from old version to current version
 */
export const migrateState = async (
  state: PersistedState | undefined,
  currentVersion: number
): Promise<PersistedState> => {
  // State yoksa veya version 0 ise, initialState döndür
  if (!state) {
    logger.debug('[MIGRATION] No state found, using initialState');
    return {
      _persist: {
        version: currentVersion,
        rehydrated: false,
      },
      portfolio: initialState,
    };
  }

  const stateVersion = getStateVersion(state);
  
  // Zaten güncel version'da
  if (stateVersion >= currentVersion) {
    logger.debug(`[MIGRATION] State already at version ${stateVersion}, no migration needed`);
    return state;
  }

  logger.debug(`[MIGRATION] Migrating from version ${stateVersion} to ${currentVersion}`);

  let migratedState = state;

  // Her version için migration uygula
  for (let version = stateVersion + 1; version <= currentVersion; version++) {
    const migration = MIGRATIONS[version];
    
    if (migration) {
      try {
        logger.debug(`[MIGRATION] Applying migration for version ${version}`);
        migratedState = await migration(migratedState);
        
        // Version'ı güncelle
        if (!migratedState._persist) {
          migratedState._persist = {
            version: version,
            rehydrated: false,
          };
        } else {
          migratedState._persist.version = version;
        }
        
        logger.debug(`[MIGRATION] Migration to version ${version} completed`);
      } catch (error) {
        logger.error(`[MIGRATION] Failed to migrate to version ${version}`, error);
        // Migration başarısız, initialState kullan
        return {
          _persist: {
            version: currentVersion,
            rehydrated: false,
          },
          portfolio: initialState,
        };
      }
    } else {
      // Migration function yok, version'ı güncelle ama state'i olduğu gibi bırak
      logger.warn(`[MIGRATION] No migration function for version ${version}, skipping`);
      if (!migratedState._persist) {
        migratedState._persist = {
          version: version,
          rehydrated: false,
        };
      } else {
        migratedState._persist.version = version;
      }
    }
  }

  logger.debug(`[MIGRATION] Migration completed, final version: ${currentVersion}`);
  return migratedState;
};

/**
 * Normalize state - eksik field'ları default değerlerle doldur
 * Kullanıcı verilerini (items) korur, sadece eksik field'ları doldurur
 */
export const normalizeState = (state: PersistedState | undefined): PersistedState | null => {
  if (!state || !state.portfolio) {
    return null;
  }

  const portfolio = state.portfolio;
  const normalized: PersistedState = {
    _persist: state._persist || {
      version: 1,
      rehydrated: false,
    },
    portfolio: {
      // Items'ı koru - kullanıcı verileri
      items: Array.isArray(portfolio.items) ? portfolio.items : [],
      
      // Prices'i koru veya default değerlerle doldur
      prices: (typeof portfolio.prices === 'object' && 
               portfolio.prices !== null && 
               !Array.isArray(portfolio.prices)) 
        ? portfolio.prices 
        : initialState.prices,
      
      // History'yi koru
      history: Array.isArray(portfolio.history) ? portfolio.history : [],
      
      // Language'i koru veya default değerle doldur
      currentLanguage: typeof portfolio.currentLanguage === 'string' 
        ? portfolio.currentLanguage 
        : initialState.currentLanguage,
    },
  };

  return normalized;
};

/**
 * Validate state structure - kritik hataları kontrol et
 * 
 * Strateji:
 * 1. State yoksa veya portfolio yoksa -> false (kritik hata)
 * 2. Items geçersizse -> false (kullanıcı verileri bozuk)
 * 3. Diğer field'lar eksik/geçersizse -> true (normalize edilebilir)
 * 
 * Bu sayede kullanıcı verilerini (items) koruruz, sadece kritik hatalarda false döneriz
 */
export const validateState = (state: PersistedState | undefined): boolean => {
  if (!state) {
    return false;
  }

  // Portfolio state validation - kritik
  if (!state.portfolio) {
    return false;
  }

  const portfolio = state.portfolio;

  // KRİTİK: Items geçersizse -> false (kullanıcı verileri bozuk, korunamaz)
  if (!Array.isArray(portfolio.items)) {
    logger.warn('[VALIDATE_STATE] Items is not an array - kritik hata');
    return false;
  }

  // Items içindeki her item'ı kontrol et - kritik
  for (const item of portfolio.items) {
    if (!item || typeof item !== 'object') {
      logger.warn('[VALIDATE_STATE] Invalid item in items array - kritik hata');
      return false;
    }
    if (!item.id || typeof item.id !== 'string') {
      logger.warn('[VALIDATE_STATE] Item missing id - kritik hata');
      return false;
    }
    if (!item.type || typeof item.type !== 'string') {
      logger.warn('[VALIDATE_STATE] Item missing type - kritik hata');
      return false;
    }
    if (typeof item.amount !== 'number' || isNaN(item.amount) || !isFinite(item.amount)) {
      logger.warn('[VALIDATE_STATE] Item has invalid amount - kritik hata');
      return false;
    }
  }

  // Diğer field'lar eksik/geçersizse normalize edilebilir -> true
  // Bu sayede kullanıcı verilerini (items) koruruz
  return true;
};

