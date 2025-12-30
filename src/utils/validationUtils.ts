/**
 * Validation utility functions for user inputs
 * 
 * Zod schema'ları ile runtime validation
 */

import { z } from 'zod';

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

/**
 * Validates if a string represents a valid positive number
 */
export const validateAmount = (amount: string): { isValid: boolean; value?: number; error?: string } => {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount cannot be empty' };
  }

  // Replace comma with dot for Turkish locale
  const normalized = amount.replace(',', '.');
  const num = parseFloat(normalized);

  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid number format' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (num > Number.MAX_SAFE_INTEGER) {
    return { isValid: false, error: 'Amount is too large' };
  }

  // Check for reasonable upper limit (1 trillion)
  const MAX_REASONABLE_AMOUNT = 1e12;
  if (num > MAX_REASONABLE_AMOUNT) {
    return { isValid: false, error: 'Amount exceeds maximum limit' };
  }

  return { isValid: true, value: num };
};

/**
 * Validates if amount to remove is valid
 */
export const validateRemoveAmount = (
  amount: string,
  currentAmount: number
): { isValid: boolean; value?: number; error?: string } => {
  const validation = validateAmount(amount);
  
  if (!validation.isValid) {
    return validation;
  }

  if (validation.value! > currentAmount) {
    return { isValid: false, error: 'Amount exceeds current amount' };
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

