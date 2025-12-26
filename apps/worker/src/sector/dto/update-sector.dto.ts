import { z } from 'zod';
import { UpdateSectorSchema } from '@stocks/shared';

export type UpdateSectorDto = z.infer<typeof UpdateSectorSchema>;

