/**
 * useToast Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useToast } from '../useToast';

// Mock setTimeout
jest.useFakeTimers();

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toEqual([]);
  });

  it('should add toast when showToast is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('should add multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message 1', 'info');
      result.current.showToast('Message 2', 'error');
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].message).toBe('Message 1');
    expect(result.current.toasts[1].message).toBe('Message 2');
  });

  it('should use default type "info" when type is not provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toasts[0].type).toBe('info');
  });

  it('should remove toast after 3 seconds', async () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  it('should remove toast manually with removeToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not remove other toasts when removing one', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message 1', 'info');
      result.current.showToast('Message 2', 'error');
    });

    const firstToastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(firstToastId);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Message 2');
  });

  it('should generate unique IDs for each toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message 1');
      result.current.showToast('Message 2');
    });

    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });

  it('should support all toast types', () => {
    const { result } = renderHook(() => useToast());
    const types = ['success', 'error', 'info', 'warning'] as const;

    act(() => {
      types.forEach((type) => {
        result.current.showToast(`Message ${type}`, type);
      });
    });

    expect(result.current.toasts).toHaveLength(4);
    types.forEach((type, index) => {
      expect(result.current.toasts[index].type).toBe(type);
    });
  });
});

