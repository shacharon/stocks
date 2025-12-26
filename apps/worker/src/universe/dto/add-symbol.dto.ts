import { AddSymbolSchema, Market } from '@stocks/shared';
import { z } from 'zod';

/**
 * DTO for adding a new symbol to the universe
 * Uses Zod schema from @stocks/shared for validation
 */
export class AddSymbolDto implements z.infer<typeof AddSymbolSchema> {
  symbol: string;
  market: Market;
}

