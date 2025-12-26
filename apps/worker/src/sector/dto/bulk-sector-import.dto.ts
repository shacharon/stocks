import { z } from 'zod';
import { BulkSectorImportSchema } from '@stocks/shared';

export type BulkSectorImportDto = z.infer<typeof BulkSectorImportSchema>;

