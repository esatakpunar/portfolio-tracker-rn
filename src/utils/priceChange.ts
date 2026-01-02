/**
 * Price Change Utility
 * 
 * Fiyat değişim hesaplamaları için utility fonksiyonları
 */

/**
 * Calculate price change between current and previous price
 * 
 * @param current Current price
 * @param previous Previous price (can be null if not available)
 * @returns Price change info or null if previous price is not available
 */
export const calculatePriceChange = (
  current: number,
  previous: number | null
): { change: number; percentage: number; isPositive: boolean } | null => {
  // Validate inputs
  if (typeof current !== 'number' || isNaN(current) || !isFinite(current) || current < 0) {
    return null;
  }
  
  if (previous === null || typeof previous !== 'number' || isNaN(previous) || !isFinite(previous) || previous <= 0) {
    return null;
  }
  
  // Calculate change
  const change = current - previous;
  const percentage = (change / previous) * 100;
  
  // Handle very small changes (rounding errors)
  const isPositive = change > 0.0001;
  const isNegative = change < -0.0001;
  
  // If change is negligible, consider it as no change (but still return data)
  return {
    change,
    percentage,
    isPositive: isPositive && !isNegative,
  };
};

