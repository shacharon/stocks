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
   * - lookback: Number of days to fetch (default 1 for daily EOD sync)
   * - provider: Provider name (optional, auto-selects by market)
   * - force: Force refresh, bypass cache (default false)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncMarketData(
    @Query('date') dateStr?: string,
    @Query('lookback') lookbackStr?: string,
    @Query('provider') provider?: string,
    @Query('force') forceStr?: string,
  ) {
    this.logger.log(
      `POST /market/sync - date: ${dateStr}, lookback: ${lookbackStr}, provider: ${provider}, force: ${forceStr}`
    );

    // Parse date
    let date: Date | undefined;
    if (dateStr) {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }

    // Parse lookback (default to 1 for daily EOD sync)
    let lookback = 1;
    if (lookbackStr) {
      lookback = parseInt(lookbackStr, 10);
      if (isNaN(lookback) || lookback < 1 || lookback > 1000) {
        throw new BadRequestException('Lookback must be between 1 and 1000');
      }
    }

    // Parse force flag
    const force = forceStr === 'true' || forceStr === '1';

    return this.marketService.syncMarketData(date, lookback, provider, force);
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


