/**
 * Rounds a number to a specified number of decimal places.
 * Uses epsilon to handle floating point rounding errors.
 */
export const roundToDecimals = (num: number, decimals: number = 2): number => {
  return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Safely adds two numbers to avoid floating point precision errors.
 */
export const safeAdd = (a: number, b: number): number => {
  // Convert to integers, add, then convert back
  const factor = 1000000; // Support up to 6 decimal places safely
  return (Math.round(a * factor) + Math.round(b * factor)) / factor;
};

/**
 * Safely subtracts two numbers to avoid floating point precision errors.
 */
export const safeSubtract = (a: number, b: number): number => {
  const factor = 1000000;
  return (Math.round(a * factor) - Math.round(b * factor)) / factor;
};

/**
 * Safely multiplies two numbers.
 */
export const safeMultiply = (a: number, b: number): number => {
  return roundToDecimals(a * b, 6);
};

/**
 * Safely divides two numbers.
 */
export const safeDivide = (a: number, b: number): number => {
  if (b === 0) return 0;
  return roundToDecimals(a / b, 6);
};
