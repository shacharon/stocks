import { UpdateSymbolSchema } from '@stocks/shared';
import { z } from 'zod';

/**
 * DTO for updating an existing symbol
 * Uses Zod schema from @stocks/shared for validation
 */
export class UpdateSymbolDto implements z.infer<typeof UpdateSymbolSchema> {
  name?: string;
  isActive?: boolean;
}


