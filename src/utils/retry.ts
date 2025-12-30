/**
 * Retry Utility
 * 
 * Exponential backoff ile retry mekanizması
 * Network hatalarında otomatik retry yapar
 */

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: (error: unknown) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }
    return false;
  },
};

/**
 * Calculate delay for retry attempt with exponential backoff
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number => {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise that resolves with function result
 * @throws Last error if all retries fail
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Success - log if retried
      if (attempt > 0) {
        logger.debug(`[RETRY] Success after ${attempt} retry(ies)`);
      }
      
      return result;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!config.retryableErrors(error)) {
        logger.debug('[RETRY] Error is not retryable, stopping');
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt >= config.maxRetries) {
        logger.warn(`[RETRY] Max retries (${config.maxRetries}) exceeded`);
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      logger.debug(`[RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
};

/**
 * Retry with custom error handler
 * 
 * @param fn - Function to retry
 * @param onRetry - Callback called on each retry
 * @param options - Retry options
 */
export const retryWithCallback = async <T>(
  fn: () => Promise<T>,
  onRetry: (attempt: number, error: unknown) => void,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!config.retryableErrors(error)) {
        throw error;
      }

      if (attempt >= config.maxRetries) {
        throw error;
      }

      // Call retry callback
      onRetry(attempt + 1, error);

      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
};

