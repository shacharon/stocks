/**
 * Analysis Validation Schemas (Zod)
 */

import { z } from 'zod';
import { Market } from '../contracts/enums';

// ============================================================================
// Analysis Run Schemas
// ============================================================================

export const AnalysisRunInputSchema = z.object({
  portfolioId: z.string().uuid().optional(),
  date: z.coerce.date(),
  symbols: z.array(z.string()).optional(),
});

// ============================================================================
// Decision Schemas
// ============================================================================

export const DecisionContextSchema = z.object({
  symbol: z.string(),
  market: z.nativeEnum(Market),
  buyPrice: z.number().positive(),
  currentPrice: z.number().positive(),
  prevStop: z.number().positive().optional(),
  suggestedStop: z.number().positive(),
  indicators: z.object({
    sma20: z.number().optional(),
    sma50: z.number().optional(),
    rsi14: z.number().min(0).max(100).optional(),
    atr14: z.number().positive().optional(),
    volumeAvg20: z.number().optional(),
  }),
  levels: z.object({
    supports: z.array(z.object({
      price: z.number(),
      strength: z.number(),
      touches: z.number(),
    })),
    resistances: z.array(z.object({
      price: z.number(),
      strength: z.number(),
      touches: z.number(),
    })),
  }),
  trend: z.string().optional(),
  volatilityState: z.string().optional(),
});

// ============================================================================
// Stop Calculation Schemas
// ============================================================================

export const StopCalculationInputSchema = z.object({
  buyPrice: z.number().positive(),
  prevStop: z.number().positive().optional(),
  currentPrice: z.number().positive(),
  atr: z.number().positive().optional(),
  supports: z.array(z.object({
    price: z.number(),
    strength: z.number(),
    touches: z.number(),
  })),
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
});

// Type inference (exported with Schema suffix to avoid conflicts)
export type AnalysisRunSchemaType = z.infer<typeof AnalysisRunInputSchema>;
export type DecisionContextSchemaType = z.infer<typeof DecisionContextSchema>;
export type StopCalculationSchemaType = z.infer<typeof StopCalculationInputSchema>;

