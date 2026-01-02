/**
 * Validation utility functions for user inputs
 * 
 * Enhanced validation with real-time feedback and better error messages
 * Zod schema'ları ile runtime validation
 */

import { z } from 'zod';

export enum ValidationErrorType {
  EMPTY = 'EMPTY',
  INVALID_FORMAT = 'INVALID_FORMAT',
  TOO_SMALL = 'TOO_SMALL',
  TOO_LARGE = 'TOO_LARGE',
  EXCEEDS_LIMIT = 'EXCEEDS_LIMIT',
  NONE = 'NONE',
}

/**
 * Amount validation schema
 */
export const amountSchema = z
  .string()
  .min(1, 'Amount cannot be empty')
  .refine(
    (val) => {
      const normalized = val.replace(',', '.');
      const num = parseFloat(normalized);
      return !isNaN(num) && num > 0;
    },
    { message: 'Invalid number format or must be greater than 0' }
  )
  .refine(
    (val) => {
      const normalized = val.replace(',', '.');
      const num = parseFloat(normalized);
      return num <= 1e12; // Max 1 trillion
    },
    { message: 'Amount exceeds maximum limit' }
  );

/**
 * Remove amount validation schema (with current amount context)
 */
export const removeAmountSchema = (currentAmount: number) =>
  amountSchema.refine(
    (val) => {
      const normalized = val.replace(',', '.');
      const num = parseFloat(normalized);
      return num <= currentAmount;
    },
    { message: 'Amount exceeds current amount' }
  );

export interface ValidationResult {
  isValid: boolean;
  value?: number;
  error?: string;
  errorType?: ValidationErrorType;
  errorKey?: string; // i18n key for error message
}

/**
 * Validates if a string represents a valid positive number
 * Enhanced with better error messages and error types
 */
export const validateAmount = (amount: string): ValidationResult => {
  // Empty check
  if (!amount || amount.trim() === '') {
    return {
      isValid: false,
      error: 'Amount cannot be empty',
      errorType: ValidationErrorType.EMPTY,
      errorKey: 'validation.amountEmpty',
    };
  }

  // Replace comma with dot for Turkish locale
  const normalized = amount.replace(',', '.');
  const num = parseFloat(normalized);

  // Invalid format check
  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Invalid number format',
      errorType: ValidationErrorType.INVALID_FORMAT,
      errorKey: 'validation.amountInvalidFormat',
    };
  }

  // Too small check
  if (num <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0',
      errorType: ValidationErrorType.TOO_SMALL,
      errorKey: 'validation.amountTooSmall',
    };
  }

  // Too large check (JavaScript safe integer limit)
  if (num > Number.MAX_SAFE_INTEGER) {
    return {
      isValid: false,
      error: 'Amount is too large',
      errorType: ValidationErrorType.TOO_LARGE,
      errorKey: 'validation.amountTooLarge',
    };
  }

  // Reasonable upper limit check (1 trillion)
  const MAX_REASONABLE_AMOUNT = 1e12;
  if (num > MAX_REASONABLE_AMOUNT) {
    return {
      isValid: false,
      error: 'Amount exceeds maximum limit',
      errorType: ValidationErrorType.EXCEEDS_LIMIT,
      errorKey: 'validation.amountExceedsLimit',
    };
  }

  return {
    isValid: true,
    value: num,
    errorType: ValidationErrorType.NONE,
  };
};

/**
 * Validates if amount to remove is valid
 * Enhanced with better error messages
 */
export const validateRemoveAmount = (
  amount: string,
  currentAmount: number
): ValidationResult => {
  const validation = validateAmount(amount);
  
  if (!validation.isValid) {
    return validation;
  }

  // Check if amount exceeds current amount
  if (validation.value! > currentAmount) {
    return {
      isValid: false,
      error: 'Amount exceeds current amount',
      errorType: ValidationErrorType.EXCEEDS_LIMIT,
      errorKey: 'validation.amountExceedsCurrent',
    };
  }

  return validation;
};

/**
 * Real-time validation with debouncing support
 * Returns validation result that can be used for immediate feedback
 */
export const validateAmountRealTime = (
  amount: string,
  options?: {
    min?: number;
    max?: number;
    allowEmpty?: boolean;
  }
): ValidationResult => {
  const { min = 0, max = 1e12, allowEmpty = false } = options || {};

  // Allow empty for real-time (user is still typing)
  if (allowEmpty && (!amount || amount.trim() === '')) {
    return {
      isValid: true, // Valid for real-time (not final)
      errorType: ValidationErrorType.NONE,
    };
  }

  const validation = validateAmount(amount);
  
  if (!validation.isValid) {
    return validation;
  }

  // Additional min/max checks if provided
  if (validation.value! < min) {
    return {
      isValid: false,
      error: `Amount must be at least ${min}`,
      errorType: ValidationErrorType.TOO_SMALL,
      errorKey: 'validation.amountBelowMinimum',
    };
  }

  if (validation.value! > max) {
    return {
      isValid: false,
      error: `Amount must not exceed ${max}`,
      errorType: ValidationErrorType.EXCEEDS_LIMIT,
      errorKey: 'validation.amountAboveMaximum',
    };
  }

  return validation;
};

/**
 * Safely parses a number from string input
 */
export const parseAmount = (amount: string): number => {
  const normalized = amount.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

