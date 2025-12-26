import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateFeatures } from './indicators/technical-indicators';
import { Market, num } from '@stocks/shared';

@Injectable()
export class FeatureFactoryService {
  private readonly logger = new Logger(FeatureFactoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate and store features for a specific symbol on a specific date
   */
  async calculateFeaturesForSymbol(
    symbol: string,
    market: Market,
    runDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.debug(`Calculating features for ${symbol} (${market}) on ${runDate.toISOString()}`);

      // Fetch historical bars (200 days lookback for technical indicators)
      const startDate = new Date(runDate);
      startDate.setDate(startDate.getDate() - 300); // Get 300 days to ensure we have 200 trading days

      const bars = await this.prisma.marketDailyBar.findMany({
        where: {
          symbol,
          market,
          date: {
            lte: runDate,
            gte: startDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      if (bars.length === 0) {
        this.logger.warn(`No bars found for ${symbol} (${market})`);
        return { success: false, error: 'No historical data available' };
      }

      this.logger.debug(`Found ${bars.length} bars for ${symbol}`);

      // Convert Prisma bars to plain objects with numbers for calculation
      const barsForCalculation = bars.map(bar => ({
        date: bar.date,
        open: num(bar.open),
        high: num(bar.high),
        low: num(bar.low),
        close: num(bar.close),
        volume: Number(bar.volume),
      }));

      // Calculate technical features
      const features = calculateFeatures(barsForCalculation);

      // Get the latest bar for price data
      const latestBar = bars[bars.length - 1];

      // Upsert features to database
      await this.prisma.dailySymbolFeatures.upsert({
        where: {
          symbol_market_date: {
            symbol,
            market,
            date: runDate,
          },
        },
        create: {
          symbol,
          market,
          date: runDate,
          closePrice: latestBar.close,
          volume: latestBar.volume,
          sma20: features.sma_20,
          sma50: features.sma_50,
          sma200: features.sma_200,
          ema12: features.ema_12,
          ema26: features.ema_26,
          rsi14: features.rsi_14,
          macd: features.macd,
          macdSignal: features.macd_signal,
          macdHistogram: features.macd_histogram,
          bbUpper: features.bb_upper,
          bbMiddle: features.bb_middle,
          bbLower: features.bb_lower,
          atr14: features.atr_14,
          volumeSma20: features.volume_sma_20,
          volumeRatio: features.volume_ratio,
        },
        update: {
          closePrice: latestBar.close,
          volume: latestBar.volume,
          sma20: features.sma_20,
          sma50: features.sma_50,
          sma200: features.sma_200,
          ema12: features.ema_12,
          ema26: features.ema_26,
          rsi14: features.rsi_14,
          macd: features.macd,
          macdSignal: features.macd_signal,
          macdHistogram: features.macd_histogram,
          bbUpper: features.bb_upper,
          bbMiddle: features.bb_middle,
          bbLower: features.bb_lower,
          atr14: features.atr_14,
          volumeSma20: features.volume_sma_20,
          volumeRatio: features.volume_ratio,
        },
      });

      this.logger.log(`✅ Features calculated for ${symbol} (${market})`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error calculating features for ${symbol}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate features for all symbols in the universe
   */
  async calculateFeaturesForUniverse(
    runDate: Date
  ): Promise<{ total: number; successful: number; failed: number; errors: string[] }> {
    this.logger.log(`Starting feature calculation for universe on ${runDate.toISOString()}`);

    // Get all active symbols
    const symbols = await this.prisma.symbolUniverse.findMany({
      where: {
        isActive: true,
      },
      select: {
        symbol: true,
        market: true,
      },
    });

    this.logger.log(`Processing ${symbols.length} symbols`);

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sym of symbols) {
      const result = await this.calculateFeaturesForSymbol(sym.symbol, sym.market as Market, runDate);
      if (result.success) {
        successful++;
      } else {
        failed++;
        errors.push(`${sym.symbol} (${sym.market}): ${result.error}`);
      }
    }

    this.logger.log(
      `Feature calculation complete: ${successful} successful, ${failed} failed out of ${symbols.length} total`
    );

    return {
      total: symbols.length,
      successful,
      failed,
      errors,
    };
  }

  /**
   * Get features for a specific symbol and date
   */
  async getFeatures(symbol: string, market: Market, date: Date): Promise<any> {
    return this.prisma.dailySymbolFeatures.findUnique({
      where: {
        symbol_market_date: {
          symbol,
          market,
          date,
        },
      },
    });
  }

  /**
   * Get features for a symbol across a date range
   */
  async getFeaturesHistory(
    symbol: string,
    market: Market,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return this.prisma.dailySymbolFeatures.findMany({
      where: {
        symbol,
        market,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Get statistics about feature calculation coverage
   */
  async getFeatureStats(): Promise<{
    totalFeatures: number;
    uniqueSymbols: number;
    dateRange: { earliest: Date | null; latest: Date | null };
  }> {
    const [totalFeatures, symbols, earliest, latest] = await Promise.all([
      this.prisma.dailySymbolFeatures.count(),
      this.prisma.dailySymbolFeatures.groupBy({
        by: ['symbol', 'market'],
      }),
      this.prisma.dailySymbolFeatures.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.dailySymbolFeatures.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
    ]);

    return {
      totalFeatures,
      uniqueSymbols: symbols.length,
      dateRange: {
        earliest: earliest?.date || null,
        latest: latest?.date || null,
      },
    };
  }
}

