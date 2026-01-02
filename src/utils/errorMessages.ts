/**
 * Error Messages Utility
 * 
 * User-friendly error messages için utility functions
 * API errors, network errors, ve diğer error türlerini handle eder
 */

import axios from 'axios';
import { useTranslation } from 'react-i18next';

export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
}

/**
 * Determine error type from error object
 */
export const getErrorType = (error: unknown): ErrorType => {
  if (axios.isCancel(error)) {
    return ErrorType.CANCELLED;
  }

  if (axios.isAxiosError(error)) {
    // Network error (no response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return ErrorType.TIMEOUT;
      }
      return ErrorType.NETWORK;
    }

    // HTTP status code based errors
    const status = error.response.status;
    if (status >= 500) {
      return ErrorType.SERVER_ERROR;
    }
    if (status >= 400 && status < 500) {
      if (status === 422 || status === 400) {
        return ErrorType.VALIDATION_ERROR;
      }
      return ErrorType.CLIENT_ERROR;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }
  }

  return ErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message
 * 
 * @param error Error object
 * @param t Translation function (from useTranslation)
 * @returns ErrorInfo object with user-friendly message
 */
export const getUserFriendlyError = (error: unknown, t: (key: string) => string): ErrorInfo => {
  const errorType = getErrorType(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return {
        type: ErrorType.NETWORK,
        message: error instanceof Error ? error.message : 'Network error',
        userMessage: t('errorNetwork'),
        recoverable: true,
        retryable: true,
      };

    case ErrorType.TIMEOUT:
      return {
        type: ErrorType.TIMEOUT,
        message: error instanceof Error ? error.message : 'Request timeout',
        userMessage: t('errorTimeout'),
        recoverable: true,
        retryable: true,
      };

    case ErrorType.SERVER_ERROR:
      return {
        type: ErrorType.SERVER_ERROR,
        message: axios.isAxiosError(error) && error.response
          ? `Server error: ${error.response.status}`
          : 'Server error',
        userMessage: t('errorServer'),
        recoverable: true,
        retryable: true,
      };

    case ErrorType.CLIENT_ERROR:
      return {
        type: ErrorType.CLIENT_ERROR,
        message: axios.isAxiosError(error) && error.response
          ? `Client error: ${error.response.status}`
          : 'Client error',
        userMessage: t('errorClient'),
        recoverable: false,
        retryable: false,
      };

    case ErrorType.VALIDATION_ERROR:
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: error instanceof Error ? error.message : 'Validation error',
        userMessage: t('errorValidation'),
        recoverable: true,
        retryable: false,
      };

    case ErrorType.CANCELLED:
      return {
        type: ErrorType.CANCELLED,
        message: 'Request cancelled',
        userMessage: '', // Don't show cancelled errors to user
        recoverable: false,
        retryable: false,
      };

    default:
      return {
        type: ErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: t('errorUnknown'),
        recoverable: false,
        retryable: true,
      };
  }
};

/**
 * Check if error should be shown to user
 */
export const shouldShowError = (error: unknown): boolean => {
  const errorType = getErrorType(error);
  
  // Don't show cancelled errors
  if (errorType === ErrorType.CANCELLED) {
    return false;
  }

  return true;
};

/**
 * Get error message for logging (technical)
 */
export const getTechnicalErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return `[${error.code || 'UNKNOWN'}] ${error.message} - ${error.config?.url || 'No URL'}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
};

