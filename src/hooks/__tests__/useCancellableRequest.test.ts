/**
 * Cancellable Request Hook Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCancellableRequest, useCancellableRequestWithDeps } from '../useCancellableRequest';

describe('useCancellableRequest', () => {
  it('should create AbortController signal', () => {
    const { result } = renderHook(() => useCancellableRequest());
    
    expect(result.current.signal).toBeDefined();
    expect(result.current.isCancelled).toBe(false);
  });

  it('should cancel request on unmount', () => {
    const { result, unmount } = renderHook(() => useCancellableRequest());
    
    // Wait for signal to be created
    expect(result.current.signal).toBeDefined();
    expect(result.current.isCancelled).toBe(false);
    
    // Store signal reference before unmount
    const signalBeforeUnmount = result.current.signal;
    
    act(() => {
      unmount();
    });
    
    // After unmount, signal should be aborted
    // Note: We check the signal's aborted property directly
    expect(signalBeforeUnmount?.aborted).toBe(true);
  });

  it('should manually cancel request', () => {
    const { result } = renderHook(() => useCancellableRequest());
    
    expect(result.current.isCancelled).toBe(false);
    
    act(() => {
      result.current.cancel();
    });
    
    expect(result.current.isCancelled).toBe(true);
    expect(result.current.signal?.aborted).toBe(true);
  });
});

describe('useCancellableRequestWithDeps', () => {
  it('should create new AbortController when deps change', () => {
    const { result, rerender } = renderHook(
      ({ deps }) => useCancellableRequestWithDeps(deps),
      { initialProps: { deps: [1] } }
    );
    
    const firstSignal = result.current.signal;
    
    act(() => {
      rerender({ deps: [2] });
    });
    
    // New signal should be created
    expect(result.current.signal).toBeDefined();
    expect(result.current.signal).not.toBe(firstSignal);
  });

  it('should cancel previous request when deps change', () => {
    const { result, rerender } = renderHook(
      ({ deps }) => useCancellableRequestWithDeps(deps),
      { initialProps: { deps: [1] } }
    );
    
    // Wait for first signal to be created
    expect(result.current.signal).toBeDefined();
    const firstSignal = result.current.signal;
    
    act(() => {
      rerender({ deps: [2] });
    });
    
    // Previous signal should be aborted
    expect(firstSignal?.aborted).toBe(true);
    // New signal should be created
    expect(result.current.signal).toBeDefined();
    expect(result.current.signal).not.toBe(firstSignal);
  });
});

