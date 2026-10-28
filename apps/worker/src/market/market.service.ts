import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockProvider, StooqProvider, AlphaVantageProvider, TwelveDataProvider } from './providers';
import { AlphaVantageQueueService } from './alphavantage-queue.service';
import { Market, SyncResult, SyncSummary } from '@stocks/shared';

/**
 * Market Data Service
 * Manages market data fetching and storage with cache-first strategy
 * 
 * Features:
 * - Cache-first: checks DB before API calls
 * - Rate limiting: 25 Alpha Vantage requests/day
 * - Smart invalidation: today refreshes hourly, history never
 * - Queue-based throttling: 1 request/second
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly providers: Map<string, any>;

  constructor(
    private prisma: PrismaService,
    private mockProvider: MockProvider,
    private stooqProvider: StooqProvider,
    private alphaVantageProvider: AlphaVantageProvider,
    private twelveDataProvider: TwelveDataProvider,
    private avQueue: AlphaVantageQueueService,
  ) {
    this.providers = new Map();
    this.providers.set('alphavantage', alphaVantageProvider);
    this.providers.set('twelvedata', twelveDataProvider);
    this.providers.set('stooq', stooqProvider);
    this.providers.set('mock', mockProvider);
    
    this.logger.log(`Registered ${this.providers.size} market data providers`);
  }

  /**
   * Sync market data for all symbols in the universe
   * @param date - Target date (defaults to today)
   * @param lookbackDays - Number of days to fetch (default 1 for daily EOD sync)
   * @param providerName - Provider to use (default: alphavantage for US, mock for TASE)
   * @param force - Force refresh, bypass cache
   */
  async syncMarketData(
    date?: Date,
    lookbackDays: number = 1,
    providerName?: string,
    force: boolean = false,
  ): Promise<SyncSummary> {
    const startedAt = new Date();
    const targetDate = date || new Date();
    
    this.logger.log(
      `Starting market data sync for ${targetDate.toISOString().split('T')[0]}, lookback: ${lookbackDays} days, force: ${force}`
    );

    // Get all active symbols
    const symbols = await this.prisma.symbolUniverse.findMany({
      where: { isActive: true },
      orderBy: [{ market: 'asc' }, { symbol: 'asc' }],
    });

    if (symbols.length === 0) {
      this.logger.warn('No active symbols found in universe');
      return {
        totalSymbols: 0,
        successCount: 0,
        failureCount: 0,
        details: [],
        startedAt,
        completedAt: new Date(),
      };
    }

    this.logger.log(`Found ${symbols.length} active symbols to sync`);

    const fromDate = new Date(targetDate);
    fromDate.setDate(fromDate.getDate() - lookbackDays);
    const toDate = targetDate;

    const results: SyncResult[] = [];

    // Sync each symbol (no delay needed - queue handles throttling)
    for (const symbolData of symbols) {
      try {
        const result = await this.syncSymbol(
          symbolData.symbol,
          symbolData.market as Market,
          fromDate,
          toDate,
          providerName,
          force,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to sync ${symbolData.symbol}: ${error.message}`);
        results.push({
          symbol: symbolData.symbol,
          market: symbolData.market as Market,
          barsCount: 0,
          source: providerName || 'unknown',
          success: false,
          error: error.message,
        });
      }
    }

    const completedAt = new Date();
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    this.logger.log(
      `Sync complete: ${successCount} succeeded, ${failureCount} failed (${completedAt.getTime() - startedAt.getTime()}ms)`,
    );

    return {
      totalSymbols: symbols.length,
      successCount,
      failureCount,
      details: results,
      startedAt,
      completedAt,
    };
  }

  /**
   * Sync a single symbol with cache-first strategy
   */
  private async syncSymbol(
    symbol: string,
    market: Market,
    fromDate: Date,
    toDate: Date,
    providerName?: string,
    force: boolean = false,
  ): Promise<SyncResult> {
    const provider = this.selectProvider(market, providerName);
    
    this.logger.debug(`Syncing ${symbol} (${market}) using ${provider.name}`);

    // [CACHE-FIRST] Check if we already have the data
    if (!force) {
      const cacheResult = await this.checkCache(symbol, market, fromDate, toDate, provider.name);
      if (cacheResult) {
        return cacheResult;
      }
    }

    // Fetch bars (via queue if Alpha Vantage)
    let bars: any[];
    if (provider.name === 'alphavantage') {
      // Use queue for Alpha Vantage (handles throttling + rate limit)
      try {
        bars = await this.avQueue.queueFetch(symbol, market, fromDate, toDate);
      } catch (error) {
        // If rate limit hit, try to use any cached data (even stale)
        if (error.message.includes('daily limit')) {
          return await this.useStaleCacheOrFail(symbol, market, fromDate, toDate, error.message);
        }
        throw error;
      }
    } else {
      // Direct call for other providers
      bars = await provider.getDailyBars(symbol, market, fromDate, toDate);
    }

    if (bars.length === 0) {
      this.logger.warn(`No bars fetched for ${symbol}`);
      return {
        symbol,
        market,
        barsCount: 0,
        source: provider.name,
        success: true,
      };
    }

    // Upsert bars into database
    let upsertedCount = 0;
    for (const bar of bars) {
      try {
        await this.prisma.marketDailyBar.upsert({
          where: {
            symbol_market_date: {
              symbol: bar.symbol,
              market: bar.market as Market,
              date: bar.date,
            },
          },
          update: {
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: BigInt(bar.volume),
            source: provider.name,
            fetchedAt: new Date(),
          },
          create: {
            symbol: bar.symbol,
            market: bar.market as Market,
            date: bar.date,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: BigInt(bar.volume),
            source: provider.name,
            fetchedAt: new Date(),
          },
        });
        upsertedCount++;
      } catch (error) {
        this.logger.error(`Failed to upsert bar for ${symbol} on ${bar.date}: ${error.message}`);
      }
    }

    this.logger.log(`Synced ${upsertedCount}/${bars.length} bars for ${symbol}`);

    return {
      symbol,
      market,
      barsCount: upsertedCount,
      source: provider.name,
      success: true,
    };
  }

  /**
   * Check cache and return cached result if valid
   * Implements smart invalidation:
   * - Today's date: requires data fetched in last 60 minutes
   * - Historical dates: any cached data is valid (never refresh)
   */
  private async checkCache(
    symbol: string,
    market: Market,
    fromDate: Date,
    toDate: Date,
    providerName: string,
  ): Promise<SyncResult | null> {
    // Query existing bars
    const cachedBars = await this.prisma.marketDailyBar.findMany({
      where: {
        symbol,
        market,
        date: { gte: fromDate, lte: toDate },
      },
      select: { date: true, fetchedAt: true },
      orderBy: { date: 'desc' },
    });

    if (cachedBars.length === 0) {
      return null; // No cache
    }

    // [SMART INVALIDATION] For today's date, check if fetched in last 60 minutes
    const today = new Date().toISOString().split('T')[0];
    const targetDateStr = toDate.toISOString().split('T')[0];
    const isToday = targetDateStr === today;

    if (isToday) {
      // For today, require fresh data (< 60 min old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentBars = cachedBars.filter(b => b.fetchedAt >= oneHourAgo);
      
      if (recentBars.length === 0) {
        this.logger.debug(`Cache for ${symbol} is stale (> 60 min), will refresh`);
        return null;
      }
    }
    // For historical dates, any cache is valid (never refresh)

    // Check if we have sufficient coverage
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedBars = Math.ceil(daysDiff * 0.7); // ~70% trading days
    const hasSufficientCache = cachedBars.length >= expectedBars * 0.9; // 90% coverage

    if (hasSufficientCache) {
      this.logger.log(
        `✅ Using cached data for ${symbol} (${cachedBars.length} bars)${isToday ? ' - refreshed < 60 min ago' : ''}`
      );
      return {
        symbol,
        market,
        barsCount: cachedBars.length,
        source: 'cache',
        success: true,
      };
    }

    return null; // Insufficient cache
  }

  /**
   * Fallback to stale cache when rate limit is hit
   */
  private async useStaleCacheOrFail(
    symbol: string,
    market: Market,
    fromDate: Date,
    toDate: Date,
    errorMessage: string,
  ): Promise<SyncResult> {
    const staleBars = await this.prisma.marketDailyBar.count({
      where: {
        symbol,
        market,
        date: { gte: fromDate, lte: toDate },
      },
    });

    if (staleBars > 0) {
      this.logger.warn(
        `⚠️  Using stale cache for ${symbol} (${staleBars} bars) - ${errorMessage}`
      );
      return {
        symbol,
        market,
        barsCount: staleBars,
        source: 'cache-stale',
        success: true,
      };
    }

    return {
      symbol,
      market,
      barsCount: 0,
      source: 'alphavantage',
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Select appropriate provider for market
   */
  private selectProvider(market: Market, providerName?: string): any {
    if (providerName) {
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new BadRequestException(`Provider '${providerName}' not found`);
      }
      if (!provider.supportsMarket(market)) {
        throw new BadRequestException(
          `Provider '${providerName}' does not support ${market} market`
        );
      }
      return provider;
    }

    if (market === 'US') {
      return this.twelveDataProvider; // SWITCHED: Testing Twelve Data (was alphaVantageProvider)
    } else if (market === 'TASE') {
      return this.mockProvider;
    }

    throw new BadRequestException(`No provider available for ${market} market`);
  }

  /**
   * Get market data statistics including Alpha Vantage queue stats
   */
  async getStats() {
    const [totalBars, symbolCount, dateRange] = await Promise.all([
      this.prisma.marketDailyBar.count(),
      this.prisma.marketDailyBar.groupBy({
        by: ['symbol', 'market'],
      }),
      this.prisma.marketDailyBar.aggregate({
        _min: { date: true },
        _max: { date: true },
      }),
    ]);

    // Get Alpha Vantage queue stats
    const queueStats = await this.avQueue.getStats();

    return {
      totalBars,
      symbolsWithData: symbolCount.length,
      dateRange: {
        earliest: dateRange._min.date,
        latest: dateRange._max.date,
      },
      alphaVantage: queueStats,
    };
  }
}
