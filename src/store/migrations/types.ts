/**
 * Migration Types
 */

export interface PersistedState {
  _persist?: {
    version: number;
    rehydrated: boolean;
  };
  portfolio?: any;
}

export type MigrationFunction = (state: PersistedState) => Promise<PersistedState> | PersistedState;

export interface MigrationMap {
  [version: number]: MigrationFunction;
}

