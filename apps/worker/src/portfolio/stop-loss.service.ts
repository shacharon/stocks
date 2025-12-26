import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Market, num, gt, lt } from '@stocks/shared';

export interface StopLossCalculation {
  portfolioId: string;
  symbolId: string;
  date: Date;
  currentPrice: number;
  buyPrice: number;
  
  // Stop-loss values
  initialStopLoss: number;      // Original stop-loss
  currentStopLoss: number;      // Current (never decreases)
  recommendedStopLoss: number;  // Based on ATR
  
  // Metrics
  atr: number | null;
  atrMultiplier: number;
  stopLossPercent: number;      // % below current price
  
  // Status
  stopLossType: string;         // FIXED, ATR_TRAILING, PERCENTAGE
  shouldUpdate: boolean;        // Whether stop should be raised
  riskAmount: number;           // $ at risk if stop hit
}

@Injectable()
export class StopLossService {
  private readonly logger = new Logger(StopLossService.name);

  // Configuration
  private readonly DEFAULT_STOP_PERCENT = 0.10;  // 10% below buy price
  private readonly ATR_MULTIPLIER = 2.0;          // 2x ATR for stop distance
  private readonly MIN_STOP_PERCENT = 0.05;      // Minimum 5% stop
  private readonly MAX_STOP_PERCENT = 0.20;      // Maximum 20% stop

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate stop-loss for a position
   */
  async calculateStopLoss(
    portfolioId: string,
    symbolId: string,
    date: Date
  ): Promise<StopLossCalculation> {
    // Get position details
    const position = await this.prisma.portfolioPosition.findFirst({
      where: {
        portfolioId,
        symbolId,
      },
      include: {
        symbol: true,
      },
    });

    if (!position) {
      throw new Error(`Position not found for symbol ${symbolId} in portfolio ${portfolioId}`);
    }

    // Get current features (for price and ATR)
    const features = await this.prisma.dailySymbolFeatures.findUnique({
      where: {
        symbol_market_date: {
          symbol: position.symbol.symbol,
          market: position.symbol.market as Market,
          date,
        },
      },
    });

    if (!features) {
      throw new Error(
        `No features found for ${position.symbol.symbol} on ${date.toISOString()}`
      );
    }

    const currentPrice = num(features.closePrice);
    const buyPrice = num(position.buyPrice);
    const atr = features.atr14 ? num(features.atr14) : null;

    // Get existing stop-loss state (if any)
    const existingState = await this.prisma.stopRulesState.findUnique({
      where: {
        portfolioId_symbolId: {
          portfolioId,
          symbolId,
        },
      },
    });

    // Calculate initial stop-loss (if no existing state)
    let initialStopLoss: number;
    if (existingState) {
      initialStopLoss = num(existingState.initialStopLoss);
    } else {
      initialStopLoss = buyPrice * (1 - this.DEFAULT_STOP_PERCENT);
    }

    // Calculate recommended stop-loss based on ATR
    let recommendedStopLoss: number;
    let stopLossType: string;
    let atrMultiplier = this.ATR_MULTIPLIER;

    if (atr && atr > 0) {
      // ATR-based trailing stop
      const atrStopDistance = atr * atrMultiplier;
      recommendedStopLoss = currentPrice - atrStopDistance;
      stopLossType = 'ATR_TRAILING';

      // Ensure stop is not too tight or too wide
      const minStop = currentPrice * (1 - this.MAX_STOP_PERCENT);
      const maxStop = currentPrice * (1 - this.MIN_STOP_PERCENT);

      if (recommendedStopLoss < minStop) {
        recommendedStopLoss = minStop;
        stopLossType = 'ATR_TRAILING_CAPPED';
      } else if (recommendedStopLoss > maxStop) {
        recommendedStopLoss = maxStop;
        stopLossType = 'ATR_TRAILING_MIN';
      }
    } else {
      // Fallback to percentage-based stop
      recommendedStopLoss = currentPrice * (1 - this.DEFAULT_STOP_PERCENT);
      stopLossType = 'PERCENTAGE';
      atrMultiplier = 0;
    }

    // CRITICAL: Apply never-decreases invariant
    let currentStopLoss: number;
    let shouldUpdate = false;

    if (existingState) {
      // Never decrease the stop-loss
      const existingStop = num(existingState.currentStopLoss);
      currentStopLoss = Math.max(existingStop, recommendedStopLoss);
      shouldUpdate = recommendedStopLoss > existingStop;
    } else {
      // First time: use recommended or initial, whichever is higher
      currentStopLoss = Math.max(initialStopLoss, recommendedStopLoss);
      shouldUpdate = true; // Always update on first calculation
    }

    // Calculate metrics
    const stopLossPercent = ((currentPrice - currentStopLoss) / currentPrice) * 100;
    const riskAmount = (currentPrice - currentStopLoss) * num(position.quantity);

    return {
      portfolioId,
      symbolId,
      date,
      currentPrice,
      buyPrice,
      initialStopLoss: Number(initialStopLoss.toFixed(2)),
      currentStopLoss: Number(currentStopLoss.toFixed(2)),
      recommendedStopLoss: Number(recommendedStopLoss.toFixed(2)),
      atr,
      atrMultiplier,
      stopLossPercent: Number(stopLossPercent.toFixed(2)),
      stopLossType,
      shouldUpdate,
      riskAmount: Number(riskAmount.toFixed(2)),
    };
  }

  /**
   * Update stop-loss state in database
   */
  async updateStopLoss(calculation: StopLossCalculation): Promise<void> {
    if (!calculation.shouldUpdate) {
      this.logger.debug(
        `No update needed for position ${calculation.symbolId} (stop already at ${calculation.currentStopLoss})`
      );
      return;
    }

    await this.prisma.stopRulesState.upsert({
      where: {
        portfolioId_symbolId: {
          portfolioId: calculation.portfolioId,
          symbolId: calculation.symbolId,
        },
      },
      create: {
        portfolioId: calculation.portfolioId,
        symbolId: calculation.symbolId,
        initialStopLoss: calculation.initialStopLoss,
        currentStopLoss: calculation.currentStopLoss,
        lastUpdatedDate: calculation.date,
        stopLossType: calculation.stopLossType,
        atrMultiplier: calculation.atrMultiplier,
      },
      update: {
        currentStopLoss: calculation.currentStopLoss,
        lastUpdatedDate: calculation.date,
        stopLossType: calculation.stopLossType,
        atrMultiplier: calculation.atrMultiplier,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Updated stop-loss for symbol ${calculation.symbolId}: ${calculation.currentStopLoss} ` +
      `(${calculation.stopLossPercent}% below current price)`
    );
  }

  /**
   * Calculate and update stop-losses for all positions in a portfolio
   */
  async updatePortfolioStopLosses(
    portfolioId: string,
    date: Date
  ): Promise<{
    portfolioId: string;
    date: string;
    totalPositions: number;
    updated: number;
    unchanged: number;
    calculations: StopLossCalculation[];
  }> {
    this.logger.log(`Updating stop-losses for portfolio ${portfolioId} on ${date.toISOString()}`);

    // Get all positions
    const positions = await this.prisma.portfolioPosition.findMany({
      where: {
        portfolioId,
      },
      include: {
        symbol: true,
      },
    });

    const calculations: StopLossCalculation[] = [];
    let updated = 0;
    let unchanged = 0;

    for (const position of positions) {
      try {
        const calc = await this.calculateStopLoss(portfolioId, position.symbolId, date);
        calculations.push(calc);

        // Update if needed
        await this.updateStopLoss(calc);

        if (calc.shouldUpdate) {
          updated++;
        } else {
          unchanged++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to calculate stop-loss for ${position.symbol.symbol}: ${error.message}`
        );
      }
    }

    this.logger.log(
      `Portfolio ${portfolioId}: ${updated} stops updated, ${unchanged} unchanged`
    );

    return {
      portfolioId,
      date: date.toISOString(),
      totalPositions: positions.length,
      updated,
      unchanged,
      calculations,
    };
  }

  /**
   * Get stop-loss state for a position
   */
  async getStopLossState(portfolioId: string, symbolId: string): Promise<any> {
    return this.prisma.stopRulesState.findUnique({
      where: {
        portfolioId_symbolId: {
          portfolioId,
          symbolId,
        },
      },
      include: {
        symbol: true,
      },
    });
  }

  /**
   * Get all stop-loss states for a portfolio
   */
  async getPortfolioStopLosses(portfolioId: string): Promise<any[]> {
    return this.prisma.stopRulesState.findMany({
      where: {
        portfolioId,
      },
      include: {
        symbol: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Check for stop-loss violations
   */
  async checkStopLossViolations(
    portfolioId: string,
    date: Date
  ): Promise<{
    portfolioId: string;
    date: string;
    violations: Array<{
      symbol: string;
      currentPrice: number;
      stopLoss: number;
      violationAmount: number;
      violationPercent: number;
    }>;
  }> {
    this.logger.log(`Checking stop-loss violations for portfolio ${portfolioId}`);

    const stopStates = await this.prisma.stopRulesState.findMany({
      where: {
        portfolioId,
      },
      include: {
        symbol: true,
      },
    });

    const violations: Array<{
      symbol: string;
      currentPrice: number;
      stopLoss: number;
      violationAmount: number;
      violationPercent: number;
    }> = [];

    for (const state of stopStates) {
      // Get current price
      const features = await this.prisma.dailySymbolFeatures.findUnique({
        where: {
          symbol_market_date: {
            symbol: state.symbol.symbol,
            market: state.symbol.market as Market,
            date,
          },
        },
      });

      if (features && lt(features.closePrice, state.currentStopLoss)) {
        const violationAmount = num(state.currentStopLoss) - num(features.closePrice);
        const violationPercent = (violationAmount / num(state.currentStopLoss)) * 100;

        violations.push({
          symbol: state.symbol.symbol,
          currentPrice: num(features.closePrice),
          stopLoss: num(state.currentStopLoss),
          violationAmount: Number(violationAmount.toFixed(2)),
          violationPercent: Number(violationPercent.toFixed(2)),
        });

        this.logger.warn(
          `STOP LOSS VIOLATED: ${state.symbol.symbol} @ ${num(features.closePrice)} ` +
          `(stop: ${num(state.currentStopLoss)}, violation: ${violationPercent.toFixed(2)}%)`
        );
      }
    }

    return {
      portfolioId,
      date: date.toISOString(),
      violations,
    };
  }

  /**
   * Get stop-loss statistics
   */
  async getStopLossStats(): Promise<{
    totalStops: number;
    byType: Record<string, number>;
    avgStopPercent: number | null;
  }> {
    const [totalStops, byType, avgData] = await Promise.all([
      this.prisma.stopRulesState.count(),
      this.prisma.stopRulesState.groupBy({
        by: ['stopLossType'],
        _count: true,
      }),
      this.prisma.stopRulesState.findMany({
        include: {
          symbol: true,
        },
      }),
    ]);

    const stopTypeCounts: Record<string, number> = {};
    for (const item of byType) {
      stopTypeCounts[item.stopLossType] = item._count;
    }

    // Calculate average stop-loss percentage
    // Note: Would need current prices to calculate accurately
    const avgStopPercent: number | null = null;

    return {
      totalStops,
      byType: stopTypeCounts,
      avgStopPercent,
    };
  }
}

