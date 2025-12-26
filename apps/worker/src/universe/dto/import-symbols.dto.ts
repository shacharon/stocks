import { ImportSymbolsSchema, Market } from '@stocks/shared';
import { z } from 'zod';

/**
 * DTO for bulk importing symbols
 * Uses Zod schema from @stocks/shared for validation
 */
export class ImportSymbolsDto implements z.infer<typeof ImportSymbolsSchema> {
  symbols: Array<{
    symbol: string;
    market: Market;
  }>;
}

/**
 * Result of a bulk import operation
 */
export interface ImportResult {
  total: number;
  added: number;
  skipped: number;
  errors: Array<{
    symbol: string;
    market: string;
    error: string;
  }>;
  duration: number; // milliseconds
}

