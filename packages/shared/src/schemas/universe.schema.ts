/**
 * Universe Validation Schemas (Zod)
 */

import { z } from 'zod';
import { Market } from '../contracts/enums';

// ============================================================================
// Symbol Universe Schemas
// ============================================================================

export const AddSymbolSchema = z.object({
  symbol: z.string().min(1).max(50).trim().toUpperCase(),
  market: z.nativeEnum(Market),
});

export const UpdateSymbolSchema = z.object({
  isActive: z.boolean().optional(),
});

export const ImportSymbolsSchema = z.object({
  symbols: z.array(
    z.object({
      symbol: z.string().min(1).max(50).trim().toUpperCase(),
      market: z.nativeEnum(Market),
    })
  ).min(1).max(1000),
});

// ============================================================================
// Sector Map Schemas
// ============================================================================

export const UpdateSectorSchema = z.object({
  sector: z.string().min(1).max(100).trim(),
  industry: z.string().max(100).trim().optional(),
});

export const BulkSectorImportSchema = z.object({
  mappings: z.array(
    z.object({
      symbol: z.string().min(1).max(50).trim().toUpperCase(),
      sector: z.string().min(1).max(100).trim(),
      industry: z.string().max(100).trim().optional(),
    })
  ).min(1).max(1000),
});

// Type inference (exported with Schema suffix to avoid conflicts)
export type AddSymbolSchemaType = z.infer<typeof AddSymbolSchema>;
export type UpdateSymbolSchemaType = z.infer<typeof UpdateSymbolSchema>;
export type ImportSymbolsSchemaType = z.infer<typeof ImportSymbolsSchema>;
export type UpdateSectorSchemaType = z.infer<typeof UpdateSectorSchema>;
export type BulkSectorImportSchemaType = z.infer<typeof BulkSectorImportSchema>;

