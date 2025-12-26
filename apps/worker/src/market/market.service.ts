import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockProvider, StooqProvider } from './providers';
import { Market, SyncResult, SyncSummary } from '@stocks/shared';

/**
 * Market Data Service
 * Manages market data fetching and storage
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly providers: Map<string, any>;

  constructor(
    private prisma: PrismaService,
    private mockProvider: MockProvider,
    private stooqProvider: StooqProvider,
  ) {
    // Register providers
    this.providers = new Map();
    this.providers.set('mock', mockProvider);
    this.providers.set('stooq', stooqProvider);
    
    this.logger.log(`Registered ${this.providers.size} market data providers`);
  }

  /**
   * Sync market data for all symbols in the universe
   * @param date - Target date (defaults to today)
   * @param lookbackDays - Number of days to fetch (default 200)
   * @param providerName - Provider to use (default: stooq for US, mock for TASE)
   */
  async syncMarketData(
    date?: Date,
    lookbackDays: number = 200,
    providerName?: string,
  ): Promise<SyncSummary> {
    const startedAt = new Date();
    const targetDate = date || new Date();
    
    this.logger.log(`Starting market data sync for ${targetDate.toISOString().split('T')[0]}, lookback: ${lookbackDays} days`);

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

    // Calculate date range
    const toDate = new Date(targetDate);
    const fromDate = new Date(targetDate);
    fromDate.setDate(fromDate.getDate() - lookbackDays);

    const results: SyncResult[] = [];

    // Sync each symbol
    for (const symbolData of symbols) {
      try {
        const result = await this.syncSymbol(
          symbolData.symbol,
          symbolData.market as Market,
          fromDate,
          toDate,
          providerName,
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
   * Sync a single symbol
   */
  private async syncSymbol(
    symbol: string,
    market: Market,
    fromDate: Date,
    toDate: Date,
    providerName?: string,
  ): Promise<SyncResult> {
    // Select provider
    const provider = this.selectProvider(market, providerName);
    
    this.logger.debug(`Syncing ${symbol} (${market}) using ${provider.name}`);

    // Fetch bars
    const bars = await provider.getDailyBars(symbol, market, fromDate, toDate);

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
   * Select appropriate provider for market
   */
  private selectProvider(market: Market, providerName?: string): any {
    if (providerName) {
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new BadRequestException(`Provider '${providerName}' not found`);
      }
      if (!provider.supportsMarket(market)) {
        throw new BadRequestException(`Provider '${providerName}' does not support ${market} market`);
      }
      return provider;
    }

    // Auto-select provider based on market
    if (market === 'US') {
      return this.stooqProvider;
    } else if (market === 'TASE') {
      return this.mockProvider; // TASE provider not implemented yet
    }

    throw new BadRequestException(`No provider available for ${market} market`);
  }

  /**
   * Get market data statistics
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

    return {
      totalBars,
      symbolsWithData: symbolCount.length,
      dateRange: {
        earliest: dateRange._min.date,
        latest: dateRange._max.date,
      },
    };
  }
}

