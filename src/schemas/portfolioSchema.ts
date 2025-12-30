/**
 * Portfolio Schema
 * 
 * Portfolio state validation için Zod schema'ları
 */

import { z } from 'zod';
import { assetTypeSchema } from './pricesSchema';

/**
 * Portfolio item schema
 */
export const portfolioItemSchema = z.object({
  id: z.string().min(1),
  type: assetTypeSchema,
  amount: z.number().positive().finite(),
  date: z.string().datetime(),
  description: z.string().optional(),
}).strict();

/**
 * History item schema
 */
export const historyItemSchema = z.object({
  type: z.enum(['add', 'remove']),
  item: portfolioItemSchema,
  date: z.string().datetime(),
  description: z.string().optional(),
}).strict();

/**
 * Portfolio state schema
 */
export const portfolioStateSchema = z.object({
  items: z.array(portfolioItemSchema),
  prices: z.object({
    '22_ayar': z.number().nonnegative().finite(),
    '24_ayar': z.number().nonnegative().finite(),
    ceyrek: z.number().nonnegative().finite(),
    tam: z.number().nonnegative().finite(),
    usd: z.number().nonnegative().finite(),
    eur: z.number().nonnegative().finite(),
    tl: z.literal(1),
    gumus: z.number().nonnegative().finite(),
  }).strict(),
  history: z.array(historyItemSchema),
  currentLanguage: z.string().min(2).max(5), // Language codes like 'tr', 'en'
}).strict();

/**
 * Validate portfolio item
 */
export const validatePortfolioItem = (data: unknown): z.infer<typeof portfolioItemSchema> => {
  return portfolioItemSchema.parse(data);
};

/**
 * Safe validate portfolio item
 */
export const safeValidatePortfolioItem = (data: unknown): {
  success: boolean;
  data?: z.infer<typeof portfolioItemSchema>;
  error?: z.ZodError;
} => {
  const result = portfolioItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

/**
 * Validate portfolio state
 */
export const validatePortfolioState = (data: unknown): z.infer<typeof portfolioStateSchema> => {
  return portfolioStateSchema.parse(data);
};

/**
 * Safe validate portfolio state
 */
export const safeValidatePortfolioState = (data: unknown): {
  success: boolean;
  data?: z.infer<typeof portfolioStateSchema>;
  error?: z.ZodError;
} => {
  const result = portfolioStateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};

