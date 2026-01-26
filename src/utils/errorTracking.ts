/**
 * Error tracking utility for production monitoring
 * Currently logs to console in dev, can be extended with Sentry or similar
 */

interface ErrorContext {
  component?: string;
  action?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Tracks an error for monitoring
 * In production, this should send to error tracking service (Sentry, etc.)
 */
export const trackError = (error: Error | string, context?: ErrorContext): void => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const errorData = {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  };

  if (__DEV__) {
    console.error('[ERROR_TRACKING]', errorData);
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context });
    // For now, we'll just log to console in production too
    // TODO: Integrate with error tracking service (Sentry, Bugsnag, etc.)
    console.error('[ERROR_TRACKING]', errorData);
  }
};

/**
 * Tracks price fetch failures specifically
 */
export const trackPriceFetchError = (
  error: Error | string,
  provider?: string,
  attemptNumber?: number,
  isBackupUsed?: boolean
): void => {
  trackError(error, {
    component: 'PriceService',
    action: 'fetchPrices',
    additionalInfo: {
      provider,
      attemptNumber,
      isBackupUsed,
    },
  });
};

/**
 * Tracks network-related errors
 */
export const trackNetworkError = (error: Error | string, url?: string): void => {
  trackError(error, {
    component: 'Network',
    action: 'request',
    additionalInfo: {
      url,
    },
  });
};
