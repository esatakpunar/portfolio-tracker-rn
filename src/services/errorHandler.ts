/**
 * Error Handler Service
 * 
 * Centralized error handling service
 * User-friendly error messages ve toast notifications için
 */

import { getUserFriendlyError, shouldShowError, ErrorInfo, getTechnicalErrorMessage } from '../utils/errorMessages';
import { logger } from '../utils/logger';
import { captureException } from '../config/sentry';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  reportToSentry?: boolean;
  context?: Record<string, any>;
}

/**
 * Error handler service
 * 
 * Handles errors and provides user-friendly feedback
 */
class ErrorHandler {
  /**
   * Handle error with user-friendly message
   * 
   * @param error Error object
   * @param t Translation function
   * @param showToast Toast notification callback
   * @param options Error handling options
   * @returns ErrorInfo object
   */
  handleError = (
    error: unknown,
    t: (key: string) => string,
    showToast?: (message: string, type?: 'error' | 'warning' | 'success' | 'info') => void,
    options: ErrorHandlerOptions = {}
  ): ErrorInfo => {
    const {
      showToast: shouldShowToast = true,
      logError: shouldLogError = true,
      reportToSentry: shouldReportToSentry = true,
      context = {},
    } = options;

    // Check if error should be shown to user
    if (!shouldShowError(error)) {
      // Still log cancelled errors for debugging
      if (shouldLogError) {
        logger.debug('[ERROR_HANDLER] Error cancelled, not showing to user', {
          error: getTechnicalErrorMessage(error),
          context,
        });
      }
      return getUserFriendlyError(error, t);
    }

    const errorInfo = getUserFriendlyError(error, t);

    // Log error
    if (shouldLogError) {
      logger.error('[ERROR_HANDLER] Error occurred', error, {
        errorType: errorInfo.type,
        technicalMessage: getTechnicalErrorMessage(error),
        userMessage: errorInfo.userMessage,
        recoverable: errorInfo.recoverable,
        retryable: errorInfo.retryable,
        context,
      });
    }

    // Report to Sentry (if not cancelled and should report)
    if (shouldReportToSentry && errorInfo.type !== 'CANCELLED') {
      try {
        if (error instanceof Error) {
          captureException(error, {
            errorType: errorInfo.type,
            userMessage: errorInfo.userMessage,
            ...context,
          });
        } else {
          captureException(new Error(getTechnicalErrorMessage(error)), {
            errorType: errorInfo.type,
            userMessage: errorInfo.userMessage,
            ...context,
          });
        }
      } catch (sentryError) {
        logger.warn('[ERROR_HANDLER] Failed to report to Sentry', sentryError);
      }
    }

    // Show toast notification
    if (shouldShowToast && showToast && errorInfo.userMessage) {
      showToast(errorInfo.userMessage, 'error');
    }

    return errorInfo;
  };

  /**
   * Handle API error specifically
   */
  handleApiError = (
    error: unknown,
    t: (key: string) => string,
    showToast?: (message: string, type?: 'error' | 'warning' | 'success' | 'info') => void,
    context?: Record<string, any>
  ): ErrorInfo => {
    return this.handleError(error, t, showToast, {
      showToast: true,
      logError: true,
      reportToSentry: true,
      context: {
        ...context,
        source: 'API',
      },
    });
  };

  /**
   * Handle network error specifically
   */
  handleNetworkError = (
    error: unknown,
    t: (key: string) => string,
    showToast?: (message: string, type?: 'error' | 'warning' | 'success' | 'info') => void,
    context?: Record<string, any>
  ): ErrorInfo => {
    return this.handleError(error, t, showToast, {
      showToast: true,
      logError: true,
      reportToSentry: false, // Don't report network errors to Sentry (too noisy)
      context: {
        ...context,
        source: 'Network',
      },
    });
  };

  /**
   * Handle validation error specifically
   */
  handleValidationError = (
    error: unknown,
    t: (key: string) => string,
    showToast?: (message: string, type?: 'error' | 'warning' | 'success' | 'info') => void,
    context?: Record<string, any>
  ): ErrorInfo => {
    return this.handleError(error, t, showToast, {
      showToast: true,
      logError: true,
      reportToSentry: false, // Don't report validation errors to Sentry
      context: {
        ...context,
        source: 'Validation',
      },
    });
  };
}

export const errorHandler = new ErrorHandler();
export default errorHandler;

