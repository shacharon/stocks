import {
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MarketService } from './market.service';

/**
 * Market Data Controller
 * Endpoints for syncing and querying market data
 */
@Controller('market')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(private readonly marketService: MarketService) {}

  /**
   * POST /market/sync
   * Sync market data for all active symbols
   * 
   * Query params:
   * - date: Target date (YYYY-MM-DD, defaults to today)
   * - lookback: Number of days to fetch (default 200)
   * - provider: Provider name (optional, auto-selects by market)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncMarketData(
    @Query('date') dateStr?: string,
    @Query('lookback') lookbackStr?: string,
    @Query('provider') provider?: string,
  ) {
    this.logger.log(`POST /market/sync - date: ${dateStr}, lookback: ${lookbackStr}, provider: ${provider}`);

    // Parse date
    let date: Date | undefined;
    if (dateStr) {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }

    // Parse lookback
    let lookback = 200;
    if (lookbackStr) {
      lookback = parseInt(lookbackStr, 10);
      if (isNaN(lookback) || lookback < 1 || lookback > 1000) {
        throw new BadRequestException('Lookback must be between 1 and 1000');
      }
    }

    return this.marketService.syncMarketData(date, lookback, provider);
  }

  /**
   * GET /market/stats
   * Get market data statistics
   */
  @Get('stats')
  async getStats() {
    this.logger.log('GET /market/stats');
    return this.marketService.getStats();
  }
}

