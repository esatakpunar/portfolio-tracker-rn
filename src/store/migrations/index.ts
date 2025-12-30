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
 * Validate state structure
 */
export const validateState = (state: PersistedState | undefined): boolean => {
  if (!state) {
    return false;
  }

  // Portfolio state validation
  if (!state.portfolio) {
    return false;
  }

  const portfolio = state.portfolio;

  // Required fields kontrolü
  if (
    !Array.isArray(portfolio.items) ||
    typeof portfolio.prices !== 'object' ||
    !Array.isArray(portfolio.history) ||
    typeof portfolio.currentLanguage !== 'string'
  ) {
    return false;
  }

  return true;
};

