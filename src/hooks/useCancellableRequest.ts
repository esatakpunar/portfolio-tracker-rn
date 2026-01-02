/**
 * Cancellable Request Hook
 * 
 * Component unmount'ta request'leri otomatik cancel eden hook
 * AbortController kullanarak memory leak'leri önler
 */

import { useEffect, useRef, useState } from 'react';
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
  const [signal, setSignal] = useState<AbortSignal | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    // Create new AbortController for this effect
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSignal(controller.signal);
    setIsCancelled(false);

    // Cleanup function - cancel request on unmount
    return () => {
      if (abortControllerRef.current) {
        logger.debug('[CANCELLABLE_REQUEST] Cancelling request on unmount');
        abortControllerRef.current.abort();
        // Note: Don't set state here as component is unmounting
        abortControllerRef.current = null;
      }
    };
  }, []);

  const cancel = () => {
    if (abortControllerRef.current) {
      logger.debug('[CANCELLABLE_REQUEST] Manually cancelling request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsCancelled(true);
    }
  };

  return {
    signal: signal ?? undefined,
    cancel,
    isCancelled: isCancelled || (signal?.aborted ?? false),
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
  const previousSignalRef = useRef<AbortSignal | null>(null);
  const [signal, setSignal] = useState<AbortSignal | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      logger.debug('[CANCELLABLE_REQUEST] Cancelling previous request (deps changed)');
      abortControllerRef.current.abort();
      previousSignalRef.current = abortControllerRef.current.signal;
    }

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setSignal(controller.signal);
    setIsCancelled(false);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        logger.debug('[CANCELLABLE_REQUEST] Cancelling request on unmount');
        abortControllerRef.current.abort();
        // Note: Don't set state here as component is unmounting
        abortControllerRef.current = null;
      }
    };
  }, deps);

  const cancel = () => {
    if (abortControllerRef.current) {
      logger.debug('[CANCELLABLE_REQUEST] Manually cancelling request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsCancelled(true);
    }
  };

  return {
    signal: signal ?? undefined,
    cancel,
    isCancelled: isCancelled || (signal?.aborted ?? false),
    previousSignal: previousSignalRef.current ?? undefined,
  };
};

