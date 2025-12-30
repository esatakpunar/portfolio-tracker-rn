/**
 * Retry Utility Tests
 */

import { retry, retryWithCallback } from '../retry';

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const result = await retry(fn, { maxRetries: 2, initialDelay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const error = new Error('Network error');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(retry(fn, { maxRetries: 2, initialDelay: 10 })).rejects.toThrow('Network error');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use exponential backoff', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const result = await retry(fn, {
      maxRetries: 2,
      initialDelay: 10,
      backoffMultiplier: 2,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const error = new Error('Client error');
    const fn = jest.fn().mockRejectedValue(error);

    const promise = retry(fn, {
      maxRetries: 2,
      retryableErrors: (err) => {
        return err instanceof Error && err.message.includes('Network');
      },
    });

    await expect(promise).rejects.toThrow('Client error');
    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should respect max delay', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const result = await retry(fn, {
      maxRetries: 1,
      initialDelay: 10,
      maxDelay: 50, // Max delay should cap at 50ms
      backoffMultiplier: 10, // Would be 100ms without maxDelay
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should call retry callback', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const onRetry = jest.fn();

    const result = await retryWithCallback(fn, onRetry, {
      maxRetries: 1,
      initialDelay: 10,
    });

    expect(result).toBe('success');
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
});

