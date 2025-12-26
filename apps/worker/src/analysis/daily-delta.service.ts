import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Market } from '@stocks/shared';

export interface DailyDelta {
  date: Date;
  market?: Market;
  
  // Price changes
  priceChanges: {
    totalSymbols: number;
    gainers: number;
    losers: number;
    unchanged: number;
    avgChange: number;
    topGainers: Array<{ symbol: string; change: number }>;
    topLosers: Array<{ symbol: string; change: number }>;
  };
  
  // Signal changes
  signalChanges: {
    totalPositions: number;
    upgraded: number;      // HOLD → BUY, BUY → STRONG_BUY
    downgraded: number;    // BUY → HOLD, STRONG_BUY → BUY
    newSignals: number;
    signalSummary: Record<string, number>;
  };
  
  // Stop-loss changes
  stopLossChanges: {
    totalStops: number;
    raised: number;
    unchanged: number;
    avgRaise: number;
  };
  
  // New activity
  newActivity: {
    newSymbols: number;
    newReports: number;
    newSectors: number;
  };
  
  // Summary
  summary: string;
}

@Injectable()
export class DailyDeltaService {
  private readonly logger = new Logger(DailyDeltaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate daily deltas
   */
  async calculateDailyDeltas(date: Date, previousDate?: Date): Promise<DailyDelta> {
    this.logger.log(`Calculating daily deltas for ${date.toISOString()}`);

    // If no previous date provided, calculate it (previous trading day - simplified to -1 day)
    if (!previousDate) {
      previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
    }

    // Calculate price changes
    const priceChanges = await this.calculatePriceChanges(date, previousDate);
    
    // Calculate signal changes
    const signalChanges = await this.calculateSignalChanges(date, previousDate);
    
    // Calculate stop-loss changes
    const stopLossChanges = await this.calculateStopLossChanges(date, previousDate);
    
    // Calculate new activity
    const newActivity = await this.calculateNewActivity(date);
    
    // Generate summary
    const summary = this.generateSummary(priceChanges, signalChanges, stopLossChanges, newActivity);

    return {
      date,
      priceChanges,
      signalChanges,
      stopLossChanges,
      newActivity,
      summary,
    };
  }

  private async calculatePriceChanges(date: Date, previousDate: Date) {
    // Get features for both dates
    const currentFeatures = await this.prisma.dailySymbolFeatures.findMany({
      where: { date },
      select: { symbol: true, market: true, close: true },
    });

    const previousFeatures = await this.prisma.dailySymbolFeatures.findMany({
      where: { date: previousDate },
      select: { symbol: true, market: true, close: true },
    });

    // Create lookup map for previous prices
    const previousPriceMap = new Map<string, number>();
    for (const feat of previousFeatures) {
      previousPriceMap.set(`${feat.symbol}_${feat.market}`, feat.close);
    }

    // Calculate changes
    const changes: Array<{ symbol: string; change: number }> = [];
    let gainers = 0;
    let losers = 0;
    let unchanged = 0;
    let totalChange = 0;

    for (const current of currentFeatures) {
      const key = `${current.symbol}_${current.market}`;
      const previousPrice = previousPriceMap.get(key);

      if (previousPrice) {
        const change = ((current.close - previousPrice) / previousPrice) * 100;
        changes.push({ symbol: current.symbol, change });
        totalChange += change;

        if (change > 0.1) gainers++;
        else if (change < -0.1) losers++;
        else unchanged++;
      }
    }

    // Sort for top gainers/losers
    changes.sort((a, b) => b.change - a.change);
    const topGainers = changes.slice(0, 5).map(c => ({
      symbol: c.symbol,
      change: Number(c.change.toFixed(2)),
    }));
    const topLosers = changes.slice(-5).reverse().map(c => ({
      symbol: c.symbol,
      change: Number(c.change.toFixed(2)),
    }));

    return {
      totalSymbols: currentFeatures.length,
      gainers,
      losers,
      unchanged,
      avgChange: changes.length > 0 ? Number((totalChange / changes.length).toFixed(2)) : 0,
      topGainers,
      topLosers,
    };
  }

  private async calculateSignalChanges(date: Date, previousDate: Date) {
    const currentDecisions = await this.prisma.portfolioDailyDecisions.findMany({
      where: { date },
      select: { portfolioId: true, symbolId: true, signal: true },
    });

    const previousDecisions = await this.prisma.portfolioDailyDecisions.findMany({
      where: { date: previousDate },
      select: { portfolioId: true, symbolId: true, signal: true },
    });

    // Create lookup for previous signals
    const previousSignalMap = new Map<string, string>();
    for (const decision of previousDecisions) {
      previousSignalMap.set(`${decision.portfolioId}_${decision.symbolId}`, decision.signal);
    }

    let upgraded = 0;
    let downgraded = 0;
    let newSignals = 0;
    const signalSummary: Record<string, number> = {};

    const signalRank: Record<string, number> = {
      STRONG_SELL: 1,
      SELL: 2,
      HOLD: 3,
      BUY: 4,
      STRONG_BUY: 5,
    };

    for (const current of currentDecisions) {
      const key = `${current.portfolioId}_${current.symbolId}`;
      const previousSignal = previousSignalMap.get(key);

      signalSummary[current.signal] = (signalSummary[current.signal] || 0) + 1;

      if (!previousSignal) {
        newSignals++;
      } else if (previousSignal !== current.signal) {
        const currentRank = signalRank[current.signal] || 0;
        const previousRank = signalRank[previousSignal] || 0;

        if (currentRank > previousRank) upgraded++;
        else if (currentRank < previousRank) downgraded++;
      }
    }

    return {
      totalPositions: currentDecisions.length,
      upgraded,
      downgraded,
      newSignals,
      signalSummary,
    };
  }

  private async calculateStopLossChanges(date: Date, previousDate: Date) {
    // Get all stop states (they don't have a date field, so we check lastUpdatedDate)
    const currentStops = await this.prisma.stopRulesState.findMany({
      where: {
        lastUpdatedDate: date,
      },
      select: { portfolioId: true, symbolId: true, currentStopLoss: true },
    });

    const previousStops = await this.prisma.stopRulesState.findMany({
      where: {
        lastUpdatedDate: {
          lte: previousDate,
        },
      },
      select: { portfolioId: true, symbolId: true, currentStopLoss: true },
    });

    // Create lookup for previous stops
    const previousStopMap = new Map<string, number>();
    for (const stop of previousStops) {
      const key = `${stop.portfolioId}_${stop.symbolId}`;
      if (!previousStopMap.has(key)) {
        previousStopMap.set(key, stop.currentStopLoss);
      }
    }

    let raised = 0;
    let unchanged = 0;
    let totalRaise = 0;

    for (const current of currentStops) {
      const key = `${current.portfolioId}_${current.symbolId}`;
      const previousStop = previousStopMap.get(key);

      if (previousStop !== undefined) {
        if (current.currentStopLoss > previousStop) {
          raised++;
          totalRaise += current.currentStopLoss - previousStop;
        } else {
          unchanged++;
        }
      }
    }

    return {
      totalStops: currentStops.length,
      raised,
      unchanged,
      avgRaise: raised > 0 ? Number((totalRaise / raised).toFixed(2)) : 0,
    };
  }

  private async calculateNewActivity(date: Date) {
    const [newSymbols, newReports, newSectors] = await Promise.all([
      // New symbols added on this date
      this.prisma.symbolUniverse.count({
        where: {
          createdAt: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lt: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
      }),
      
      // New reports generated on this date
      this.prisma.deepDiveReports.count({
        where: { date },
      }),
      
      // New sector mappings on this date
      this.prisma.symbolSectorMap.count({
        where: {
          createdAt: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lt: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return {
      newSymbols,
      newReports,
      newSectors,
    };
  }

  private generateSummary(
    priceChanges: any,
    signalChanges: any,
    stopLossChanges: any,
    newActivity: any
  ): string {
    const parts: string[] = [];

    // Price summary
    parts.push(
      `Market: ${priceChanges.gainers} gainers, ${priceChanges.losers} losers ` +
      `(avg change: ${priceChanges.avgChange > 0 ? '+' : ''}${priceChanges.avgChange}%).`
    );

    // Signal summary
    if (signalChanges.upgraded > 0 || signalChanges.downgraded > 0) {
      parts.push(
        `Signals: ${signalChanges.upgraded} upgraded, ${signalChanges.downgraded} downgraded.`
      );
    }

    // Stop-loss summary
    if (stopLossChanges.raised > 0) {
      parts.push(`Stops: ${stopLossChanges.raised} raised (avg: $${stopLossChanges.avgRaise}).`);
    }

    // New activity
    if (newActivity.newReports > 0) {
      parts.push(`New: ${newActivity.newReports} deep dive reports.`);
    }

    return parts.join(' ');
  }

  /**
   * Save daily delta to database
   */
  async saveDailyDelta(delta: DailyDelta, portfolioId?: string): Promise<void> {
    await this.prisma.dailyDeltas.create({
      data: {
        date: delta.date,
        portfolioId: portfolioId || null,
        market: delta.market || null,
        priceChanges: delta.priceChanges as any,
        signalChanges: delta.signalChanges as any,
        stopLossChanges: delta.stopLossChanges as any,
        newActivity: delta.newActivity as any,
        summary: delta.summary,
      },
    });

    this.logger.log(`Saved daily delta for ${delta.date.toISOString()}`);
  }

  /**
   * Get daily delta for a date
   */
  async getDailyDelta(date: Date, portfolioId?: string): Promise<any> {
    return this.prisma.dailyDeltas.findFirst({
      where: {
        date,
        portfolioId: portfolioId || null,
      },
    });
  }

  /**
   * Get daily deltas for a date range
   */
  async getDailyDeltasRange(
    startDate: Date,
    endDate: Date,
    portfolioId?: string
  ): Promise<any[]> {
    return this.prisma.dailyDeltas.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        portfolioId: portfolioId || null,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Get delta statistics
   */
  async getDeltaStats(): Promise<{
    totalDeltas: number;
    dateRange: { earliest: Date | null; latest: Date | null };
  }> {
    const [totalDeltas, earliest, latest] = await Promise.all([
      this.prisma.dailyDeltas.count(),
      this.prisma.dailyDeltas.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.dailyDeltas.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
    ]);

    return {
      totalDeltas,
      dateRange: {
        earliest: earliest?.date || null,
        latest: latest?.date || null,
      },
    };
  }
}

