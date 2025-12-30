/**
 * Prices Schema
 * 
 * API response ve state validation için Zod schema'ları
 */

import { z } from 'zod';

/**
 * Asset type schema
 */
export const assetTypeSchema = z.enum([
  '22_ayar',
  '24_ayar',
  'ceyrek',
  'tam',
  'usd',
  'eur',
  'tl',
  'gumus',
]);

/**
 * Prices schema - API response validation
 */
export const pricesSchema = z.object({
  '22_ayar': z.number().nonnegative().finite(),
  '24_ayar': z.number().nonnegative().finite(),
  ceyrek: z.number().nonnegative().finite(),
  tam: z.number().nonnegative().finite(),
  usd: z.number().nonnegative().finite(),
  eur: z.number().nonnegative().finite(),
  tl: z.literal(1), // TL always 1
  gumus: z.number().nonnegative().finite(),
}).strict(); // Strict mode - extra fields not allowed

/**
 * API Response schema - Raw API response structure
 */
export const apiResponseSchema = z.object({
  USD: z.object({
    Buying: z.string().optional(),
  }).optional(),
  EUR: z.object({
    Buying: z.string().optional(),
  }).optional(),
  GUMUS: z.object({
    Buying: z.string().optional(),
  }).optional(),
  TAMALTIN: z.object({
    Buying: z.string().optional(),
  }).optional(),
  CEYREKALTIN: z.object({
    Buying: z.string().optional(),
  }).optional(),
  YIA: z.object({
    Buying: z.string().optional(),
  }).optional(), // 22 ayar
  GRA: z.object({
    Buying: z.string().optional(),
  }).optional(), // 24 ayar (gram altın)
}).passthrough(); // Allow extra fields

/**
 * Validate prices object
 */
export const validatePrices = (data: unknown): z.infer<typeof pricesSchema> => {
  return pricesSchema.parse(data);
};

/**
 * Safe validate prices - returns result instead of throwing
 */
export const safeValidatePrices = (data: unknown): {
  success: boolean;
  data?: z.infer<typeof pricesSchema>;
  error?: z.ZodError;
} => {
  const result = pricesSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Validate API response
 */
export const validateApiResponse = (data: unknown): z.infer<typeof apiResponseSchema> => {
  return apiResponseSchema.parse(data);
};

/**
 * Safe validate API response
 */
export const safeValidateApiResponse = (data: unknown): {
  success: boolean;
  data?: z.infer<typeof apiResponseSchema>;
  error?: z.ZodError;
} => {
  const result = apiResponseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

