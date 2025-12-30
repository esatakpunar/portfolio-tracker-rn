import { Middleware } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';

/**
 * Critical actions that need race condition protection
 * These actions modify portfolio state and could cause data inconsistency if executed concurrently
 */
const CRITICAL_ACTIONS = [
  'portfolio/updateItemAmount',
  'portfolio/addItem',
  'portfolio/removeItem',
  'portfolio/resetAll',
] as const;

/**
 * Lock state for critical actions
 * Maps action type to lock status
 */
const actionLocks = new Map<string, boolean>();

/**
 * Check if an action is currently locked
 */
const isActionLocked = (actionType: string): boolean => {
  return actionLocks.get(actionType) === true;
};

/**
 * Lock an action type
 */
const lockAction = (actionType: string): void => {
  actionLocks.set(actionType, true);
  logger.debug(`[RACE_CONDITION] Action locked: ${actionType}`);
};

/**
 * Unlock an action type
 */
const unlockAction = (actionType: string): void => {
  actionLocks.set(actionType, false);
  logger.debug(`[RACE_CONDITION] Action unlocked: ${actionType}`);
};

/**
 * Check if an action is critical and needs protection
 */
const isCriticalAction = (actionType: string): boolean => {
  return CRITICAL_ACTIONS.some(critical => actionType.startsWith(critical));
};

/**
 * Redux middleware to prevent race conditions in critical portfolio actions
 * 
 * This middleware ensures that critical actions (like updateItemAmount, addItem, etc.)
 * are executed sequentially, preventing data inconsistency from concurrent operations.
 * 
 * If a critical action is already in progress, subsequent actions of the same type
 * will be skipped until the current one completes.
 */
export const raceConditionMiddleware: Middleware = () => (next) => (action) => {
  const actionType = action.type;

  // Only protect critical actions
  if (!isCriticalAction(actionType)) {
    return next(action);
  }

  // Check if this action type is already locked
  if (isActionLocked(actionType)) {
    logger.warn(`[RACE_CONDITION] Action skipped (already in progress): ${actionType}`, {
      actionType,
      payload: action.payload,
    });
    // Return the current state (no-op) to prevent state changes
    return action;
  }

  // Lock this action type
  lockAction(actionType);

  try {
    // Execute the action
    const result = next(action);
    
    // If the action returns a promise (async thunk), handle it
    if (result && typeof result.then === 'function') {
      return result
        .then((resolved: any) => {
          unlockAction(actionType);
          return resolved;
        })
        .catch((error: any) => {
          unlockAction(actionType);
          logger.error(`[RACE_CONDITION] Action failed: ${actionType}`, error);
          throw error;
        });
    }
    
    // Synchronous action - unlock immediately
    unlockAction(actionType);
    return result;
  } catch (error) {
    // Unlock on error
    unlockAction(actionType);
    logger.error(`[RACE_CONDITION] Action error: ${actionType}`, error);
    throw error;
  }
};

