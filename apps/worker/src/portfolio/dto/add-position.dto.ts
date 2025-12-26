import { Market } from '@stocks/shared';

/**
 * DTO for adding a position to a portfolio
 */
export class AddPositionDto {
  symbol: string;
  market: Market;
  buyPrice: number;
  quantity?: number;
  notes?: string;
}

