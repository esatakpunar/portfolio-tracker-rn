/**
 * Migration Types
 * 
 * Proper type definitions for state migration system
 */

import { PortfolioState } from '../../store/portfolioSlice';

/**
 * Persisted state structure
 * Redux Persist'in beklediği state yapısı
 */
export interface PersistedState {
  _persist?: {
    version: number;
    rehydrated: boolean;
  };
  portfolio?: PortfolioState;
}

/**
 * Migration function type
 * State'i bir versiyondan diğerine migrate eden fonksiyon
 */
export type MigrationFunction = (state: PersistedState) => Promise<PersistedState> | PersistedState;

/**
 * Migration map
 * Version number'dan migration function'a mapping
 */
export interface MigrationMap {
  [version: number]: MigrationFunction;
}

