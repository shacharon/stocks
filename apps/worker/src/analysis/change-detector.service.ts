import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Market, num, num0, pctDiff, gt, lt } from '@stocks/shared';

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  STRONG_BUY = 'STRONG_BUY',
  STRONG_SELL = 'STRONG_SELL',
}

export interface ChangeDetectionResult {
  symbol: string;
  market: Market;
  signal: SignalType;
  confidence: number; // 0-100
  reasons: string[];
  changesDetected: {
    rsiChange?: number;
    priceChange?: number;
    volumeSpike?: boolean;
    smaBreakout?: string;
    bbPosition?: string;
  };
}

@Injectable()
export class ChangeDetectorService {
  private readonly logger = new Logger(ChangeDetectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Detect changes for a symbol on a specific date
   */
  async detectChanges(
    symbol: string,
    market: Market,
    date: Date
  ): Promise<ChangeDetectionResult | null> {
    // Get current features
    const currentFeatures = await this.prisma.dailySymbolFeatures.findUnique({
      where: {
        symbol_market_date: {
          symbol,
          market,
          date,
        },
      },
    });

    if (!currentFeatures) {
      this.logger.debug(`No features found for ${symbol} on ${date.toISOString()}`);
      return null;
    }

    // Get previous day's features for comparison
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousFeatures = await this.prisma.dailySymbolFeatures.findFirst({
      where: {
        symbol,
        market,
        date: {
          lt: date,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Analyze changes
    const reasons: string[] = [];
    const changesDetected: ChangeDetectionResult['changesDetected'] = {};
    let signalScore = 0; // Positive = bullish, Negative = bearish

    // 1. RSI Analysis
    if (currentFeatures.rsi14 !== null) {
      const rsi = num(currentFeatures.rsi14);
      changesDetected.rsiChange = previousFeatures?.rsi14
        ? rsi - num(previousFeatures.rsi14)
        : null;

      if (gt(rsi, 70)) {
        reasons.push('RSI overbought (>70)');
        signalScore -= 15;
      } else if (lt(rsi, 30)) {
        reasons.push('RSI oversold (<30)');
        signalScore += 20;
      } else if (gt(rsi, 60)) {
        reasons.push('RSI strong (>60)');
        signalScore += 10;
      } else if (lt(rsi, 40)) {
        reasons.push('RSI weak (<40)');
        signalScore -= 10;
      }

      // RSI momentum
      if (changesDetected.rsiChange !== null) {
        if (changesDetected.rsiChange > 10) {
          reasons.push(`RSI surge (+${changesDetected.rsiChange.toFixed(1)})`);
          signalScore += 10;
        } else if (changesDetected.rsiChange < -10) {
          reasons.push(`RSI drop (${changesDetected.rsiChange.toFixed(1)})`);
          signalScore -= 10;
        }
      }
    }

    // 2. Price vs SMA Analysis
    if (currentFeatures.closePrice && currentFeatures.sma20 && currentFeatures.sma50) {
      const price = num(currentFeatures.closePrice);
      const sma20 = num(currentFeatures.sma20);
      const sma50 = num(currentFeatures.sma50);

      // Price vs SMA20
      if (gt(price, sma20)) {
        const distancePct = pctDiff(price, sma20);
        if (distancePct > 5) {
          reasons.push(`Price well above SMA20 (+${distancePct.toFixed(1)}%)`);
          signalScore += 10;
        } else {
          reasons.push('Price above SMA20');
          signalScore += 5;
        }
        changesDetected.smaBreakout = 'ABOVE_SMA20';
      } else {
        const distancePct = pctDiff(sma20, price);
        if (distancePct > 5) {
          reasons.push(`Price well below SMA20 (-${distancePct.toFixed(1)}%)`);
          signalScore -= 10;
        } else {
          reasons.push('Price below SMA20');
          signalScore -= 5;
        }
        changesDetected.smaBreakout = 'BELOW_SMA20';
      }

      // Golden/Death Cross (SMA20 vs SMA50)
      if (gt(sma20, sma50)) {
        const crossPct = pctDiff(sma20, sma50);
        if (crossPct > 2) {
          reasons.push('Golden Cross confirmed (SMA20 > SMA50)');
          signalScore += 15;
        }
      } else {
        const crossPct = pctDiff(sma50, sma20);
        if (crossPct > 2) {
          reasons.push('Death Cross confirmed (SMA20 < SMA50)');
          signalScore -= 15;
        }
      }
    }

    // 3. Bollinger Bands Position
    if (
      currentFeatures.closePrice &&
      currentFeatures.bbUpper &&
      currentFeatures.bbMiddle &&
      currentFeatures.bbLower
    ) {
      const price = num(currentFeatures.closePrice);
      const bbUpper = num(currentFeatures.bbUpper);
      const bbLower = num(currentFeatures.bbLower);
      const bbMiddle = num(currentFeatures.bbMiddle);

      if (lt(price, bbLower)) {
        reasons.push('Price below lower Bollinger Band');
        signalScore += 15;
        changesDetected.bbPosition = 'BELOW_LOWER';
      } else if (gt(price, bbUpper)) {
        reasons.push('Price above upper Bollinger Band');
        signalScore -= 10;
        changesDetected.bbPosition = 'ABOVE_UPPER';
      } else if (gt(price, bbMiddle)) {
        changesDetected.bbPosition = 'ABOVE_MIDDLE';
      } else {
        changesDetected.bbPosition = 'BELOW_MIDDLE';
      }
    }

    // 4. Volume Analysis
    if (currentFeatures.volumeRatio !== null) {
      const volRatio = num(currentFeatures.volumeRatio);
      if (gt(volRatio, 2)) {
        reasons.push(`High volume spike (${volRatio.toFixed(1)}x avg)`);
        signalScore += 10;
        changesDetected.volumeSpike = true;
      } else if (gt(volRatio, 1.5)) {
        reasons.push(`Elevated volume (${volRatio.toFixed(1)}x avg)`);
        signalScore += 5;
      }
    }

    // 5. Price Change
    if (previousFeatures?.closePrice && currentFeatures.closePrice) {
      const priceChange = pctDiff(currentFeatures.closePrice, previousFeatures.closePrice);
      changesDetected.priceChange = priceChange;

      if (priceChange > 5) {
        reasons.push(`Strong price gain (+${priceChange.toFixed(1)}%)`);
        signalScore += 10;
      } else if (priceChange < -5) {
        reasons.push(`Sharp price drop (${priceChange.toFixed(1)}%)`);
        signalScore -= 15;
      }
    }

    // 6. MACD Analysis
    if (currentFeatures.macd !== null && currentFeatures.macdHistogram !== null) {
      if (gt(currentFeatures.macdHistogram, 0)) {
        reasons.push('MACD histogram positive');
        signalScore += 5;
      } else {
        reasons.push('MACD histogram negative');
        signalScore -= 5;
      }
    }

    // Determine signal based on score
    let signal: SignalType;
    let confidence: number;

    if (signalScore >= 40) {
      signal = SignalType.STRONG_BUY;
      confidence = Math.min(90, 50 + signalScore);
    } else if (signalScore >= 20) {
      signal = SignalType.BUY;
      confidence = Math.min(80, 50 + signalScore * 0.8);
    } else if (signalScore <= -40) {
      signal = SignalType.STRONG_SELL;
      confidence = Math.min(90, 50 + Math.abs(signalScore));
    } else if (signalScore <= -20) {
      signal = SignalType.SELL;
      confidence = Math.min(80, 50 + Math.abs(signalScore) * 0.8);
    } else {
      signal = SignalType.HOLD;
      confidence = Math.max(40, 70 - Math.abs(signalScore) * 2);
    }

    return {
      symbol,
      market,
      signal,
      confidence: Math.round(confidence),
      reasons,
      changesDetected,
    };
  }

  /**
   * Detect changes for all positions in a portfolio
   */
  async detectChangesForPortfolio(
    portfolioId: string,
    date: Date
  ): Promise<{
    portfolioId: string;
    date: string;
    totalPositions: number;
    processed: number;
    signals: Record<SignalType, number>;
    results: ChangeDetectionResult[];
  }> {
    this.logger.log(`Detecting changes for portfolio ${portfolioId} on ${date.toISOString()}`);

    // Get all positions
    const positions = await this.prisma.portfolioPosition.findMany({
      where: {
        portfolioId,
      },
      include: {
        symbol: true,
      },
    });

    const results: ChangeDetectionResult[] = [];
    const signals: Record<SignalType, number> = {
      BUY: 0,
      SELL: 0,
      HOLD: 0,
      STRONG_BUY: 0,
      STRONG_SELL: 0,
    };

    for (const position of positions) {
      const result = await this.detectChanges(
        position.symbol.symbol,
        position.symbol.market as Market,
        date
      );

      if (result) {
        results.push(result);
        signals[result.signal]++;
      }
    }

    return {
      portfolioId,
      date: date.toISOString(),
      totalPositions: positions.length,
      processed: results.length,
      signals,
      results,
    };
  }

  /**
   * Save portfolio daily decisions to database
   */
  async savePortfolioDailyDecisions(
    portfolioId: string,
    date: Date,
    results: ChangeDetectionResult[]
  ): Promise<void> {
    this.logger.log(`Saving ${results.length} decisions for portfolio ${portfolioId}`);

    for (const result of results) {
      // Get position to retrieve buyPrice and symbolId
      const symbolRecord = await this.prisma.symbolUniverse.findFirst({
        where: {
          symbol: result.symbol,
          market: result.market,
        },
      });

      if (!symbolRecord) {
        this.logger.warn(`Symbol ${result.symbol} not found in universe`);
        continue;
      }

      const position = await this.prisma.portfolioPosition.findFirst({
        where: {
          portfolioId,
          symbolId: symbolRecord.id,
        },
      });

      if (!position) {
        this.logger.warn(`Position not found for ${result.symbol} in portfolio ${portfolioId}`);
        continue;
      }

      // Calculate stop-loss (simple: 10% below buy price for now)
      const stopLoss = num(position.buyPrice) * 0.90;

      await this.prisma.portfolioDecision.upsert({
        where: {
          portfolioId_symbolId_date: {
            portfolioId,
            symbolId: position.symbolId,
            date,
          },
        },
        create: {
          portfolioId,
          symbolId: position.symbolId,
          date,
          market: result.market,
          signal: result.signal,
          confidence: result.confidence,
          reasons: result.reasons,
          buyPrice: position.buyPrice,
          currentPrice: 0, // Will be updated by market data sync
          suggestedStop: stopLoss,
        },
        update: {
          signal: result.signal,
          confidence: result.confidence,
          reasons: result.reasons,
          buyPrice: position.buyPrice,
          currentPrice: 0,
          suggestedStop: stopLoss,
        },
      });
    }

    this.logger.log(`Saved ${results.length} decisions to portfolio_daily_decisions`);
  }

  /**
   * Get daily decisions for a portfolio
   */
  async getPortfolioDailyDecisions(
    portfolioId: string,
    date: Date
  ): Promise<any[]> {
    return this.prisma.portfolioDecision.findMany({
      where: {
        portfolioId,
        date,
      },
      orderBy: {
        confidence: 'desc',
      },
    });
  }

  /**
   * Get decision statistics
   */
  async getDecisionStats(): Promise<{
    totalDecisions: number;
    dateRange: { earliest: Date | null; latest: Date | null };
    signalCounts: Record<string, number>;
  }> {
    const [totalDecisions, earliest, latest, bySignal] = await Promise.all([
      this.prisma.portfolioDecision.count(),
      this.prisma.portfolioDecision.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.portfolioDecision.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
      this.prisma.portfolioDecision.groupBy({
        by: ['signal'],
        _count: true,
      }),
    ]);

    const signalCounts: Record<string, number> = {};
    for (const item of bySignal) {
      signalCounts[item.signal] = item._count;
    }

    return {
      totalDecisions,
      dateRange: {
        earliest: earliest?.date || null,
        latest: latest?.date || null,
      },
      signalCounts,
    };
  }
}

