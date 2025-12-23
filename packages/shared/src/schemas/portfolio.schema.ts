/**
 * Portfolio Validation Schemas (Zod)
 */

import { z } from 'zod';
import { Market } from '../contracts/enums';

// ============================================================================
// Portfolio Schemas
// ============================================================================

export const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(5000).optional(),
});

export const UpdatePortfolioSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(5000).optional(),
});

// ============================================================================
// Position Schemas
// ============================================================================

export const CreatePositionSchema = z.object({
  symbol: z.string().min(1).max(50).trim().toUpperCase(),
  market: z.nativeEnum(Market),
  buyPrice: z.number().positive().min(0.01),
  quantity: z.number().positive().optional(),
  notes: z.string().max(5000).optional(),
});

export const UpdatePositionSchema = z.object({
  symbol: z.string().min(1).max(50).trim().toUpperCase().optional(),
  market: z.nativeEnum(Market).optional(),
  buyPrice: z.number().positive().min(0.01).optional(),
  quantity: z.number().positive().optional(),
  notes: z.string().max(5000).optional(),
});

// Type inference (exported with Schema suffix to avoid conflicts)
export type CreatePortfolioSchemaType = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioSchemaType = z.infer<typeof UpdatePortfolioSchema>;
export type CreatePositionSchemaType = z.infer<typeof CreatePositionSchema>;
export type UpdatePositionSchemaType = z.infer<typeof UpdatePositionSchema>;

