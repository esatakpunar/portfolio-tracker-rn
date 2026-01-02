/**
 * Cancellable Request Hook
 * 
 * Component unmount'ta request'leri otomatik cancel eden hook
 * AbortController kullanarak memory leak'leri önler
 */

import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

/**
 * Hook for cancellable async requests
 * 
 * Automatically cancels requests when component unmounts
 * 
 * @returns AbortController signal and cleanup function
 * 
 * @example
 * ```tsx
 * const { signal, cancel } = useCancellableRequest();
 * 
 * useEffect(() => {
 *   fetchData(signal)
 *     .then(setData)
 *     .catch(handleError);
 *   
 *   return cancel; // Cleanup on unmount
 * }, []);
 * ```
 */
export const useCancellableRequest = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this effect
    abortControllerRef.current = new AbortController();

    // Cleanup function - cancel request on unmount
    return () => {
      if (abortControllerRef.current) {
        logger.debug('[CANCELLABLE_REQUEST] Cancelling request on unmount');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const cancel = () => {
    if (abortControllerRef.current) {
      logger.debug('[CANCELLABLE_REQUEST] Manually cancelling request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    signal: abortControllerRef.current?.signal,
    cancel,
    isCancelled: abortControllerRef.current?.signal.aborted ?? false,
  };
};

/**
 * Hook for cancellable async requests with dependency array
 * 
 * Creates a new AbortController when dependencies change
 * 
 * @param deps Dependency array (like useEffect)
 * @returns AbortController signal and cleanup function
 * 
 * @example
 * ```tsx
 * const { signal } = useCancellableRequestWithDeps([userId]);
 * 
 * useEffect(() => {
 *   fetchUserData(userId, signal)
 *     .then(setUserData)
 *     .catch(handleError);
 * }, [userId, signal]);
 * ```
 */
export const useCancellableRequestWithDeps = (deps: React.DependencyList) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      logger.debug('[CANCELLABLE_REQUEST] Cancelling previous request (deps changed)');
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        logger.debug('[CANCELLABLE_REQUEST] Cancelling request on unmount');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, deps);

  const cancel = () => {
    if (abortControllerRef.current) {
      logger.debug('[CANCELLABLE_REQUEST] Manually cancelling request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    signal: abortControllerRef.current?.signal,
    cancel,
    isCancelled: abortControllerRef.current?.signal.aborted ?? false,
  };
};

