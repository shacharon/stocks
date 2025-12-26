import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Market } from '@stocks/shared';

export interface DeepDiveReport {
  symbol: string;
  market: Market;
  date: Date;
  signal: string;
  confidence: number;
  
  summary: string;
  technicalAnalysis: {
    trend: string;
    momentum: string;
    volatility: string;
    volume: string;
  };
  keyMetrics: {
    currentPrice: number;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    rsi: number | null;
    atr: number | null;
    volumeRatio: number | null;
  };
  riskAssessment: {
    level: string; // LOW, MEDIUM, HIGH
    factors: string[];
  };
  recommendations: string[];
  supportingData: any;
}

@Injectable()
export class DeepDiveService {
  private readonly logger = new Logger(DeepDiveService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a deep dive report for a symbol
   */
  async generateReport(
    symbol: string,
    market: Market,
    date: Date,
    signal: string,
    confidence: number,
    reasons: string[]
  ): Promise<DeepDiveReport> {
    this.logger.log(`Generating deep dive report for ${symbol} (${market})`);

    // Get current features
    const features = await this.prisma.dailySymbolFeatures.findUnique({
      where: {
        symbol_market_date: { symbol, market, date },
      },
    });

    if (!features) {
      throw new Error(`No features found for ${symbol} on ${date.toISOString()}`);
    }

    // Get historical features (last 30 days)
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 30);
    
    const historicalFeatures = await this.prisma.dailySymbolFeatures.findMany({
      where: {
        symbol,
        market,
        date: {
          gte: startDate,
          lte: date,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Analyze trend
    const trendAnalysis = this.analyzeTrend(features, historicalFeatures);
    
    // Analyze momentum
    const momentumAnalysis = this.analyzeMomentum(features, historicalFeatures);
    
    // Analyze volatility
    const volatilityAnalysis = this.analyzeVolatility(features, historicalFeatures);
    
    // Analyze volume
    const volumeAnalysis = this.analyzeVolume(features, historicalFeatures);
    
    // Risk assessment
    const riskAssessment = this.assessRisk(features, signal, confidence);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      signal,
      confidence,
      trendAnalysis,
      momentumAnalysis,
      riskAssessment
    );
    
    // Generate summary
    const summary = this.generateSummary(
      symbol,
      signal,
      confidence,
      reasons,
      trendAnalysis,
      momentumAnalysis
    );

    return {
      symbol,
      market,
      date,
      signal,
      confidence,
      summary,
      technicalAnalysis: {
        trend: trendAnalysis,
        momentum: momentumAnalysis,
        volatility: volatilityAnalysis,
        volume: volumeAnalysis,
      },
      keyMetrics: {
        currentPrice: features.close,
        sma20: features.sma_20,
        sma50: features.sma_50,
        sma200: features.sma_200,
        rsi: features.rsi_14,
        atr: features.atr_14,
        volumeRatio: features.volume_ratio,
      },
      riskAssessment,
      recommendations,
      supportingData: {
        reasons,
        historicalDataPoints: historicalFeatures.length,
        bbPosition: this.getBollingerBandPosition(features),
      },
    };
  }

  private analyzeTrend(current: any, historical: any[]): string {
    if (!current.sma_20 || !current.sma_50) {
      return 'INSUFFICIENT_DATA';
    }

    const price = current.close;
    const sma20 = current.sma_20;
    const sma50 = current.sma_50;
    const sma200 = current.sma_200;

    if (price > sma20 && sma20 > sma50) {
      if (sma200 && sma50 > sma200) {
        return 'STRONG_UPTREND (all SMAs aligned)';
      }
      return 'UPTREND (price > SMA20 > SMA50)';
    } else if (price < sma20 && sma20 < sma50) {
      if (sma200 && sma50 < sma200) {
        return 'STRONG_DOWNTREND (all SMAs aligned)';
      }
      return 'DOWNTREND (price < SMA20 < SMA50)';
    } else {
      return 'MIXED (SMAs not aligned)';
    }
  }

  private analyzeMomentum(current: any, historical: any[]): string {
    if (!current.rsi_14) {
      return 'INSUFFICIENT_DATA';
    }

    const rsi = current.rsi_14;

    if (rsi > 70) {
      return 'OVERBOUGHT (RSI > 70) - potential pullback';
    } else if (rsi > 60) {
      return 'STRONG (RSI > 60) - bullish momentum';
    } else if (rsi < 30) {
      return 'OVERSOLD (RSI < 30) - potential bounce';
    } else if (rsi < 40) {
      return 'WEAK (RSI < 40) - bearish momentum';
    } else {
      return 'NEUTRAL (RSI 40-60)';
    }
  }

  private analyzeVolatility(current: any, historical: any[]): string {
    if (!current.atr_14 || !current.close) {
      return 'INSUFFICIENT_DATA';
    }

    const atr = current.atr_14;
    const price = current.close;
    const atrPercent = (atr / price) * 100;

    if (atrPercent > 3) {
      return `HIGH (ATR ${atrPercent.toFixed(1)}% of price) - significant daily swings`;
    } else if (atrPercent > 1.5) {
      return `MODERATE (ATR ${atrPercent.toFixed(1)}% of price)`;
    } else {
      return `LOW (ATR ${atrPercent.toFixed(1)}% of price) - stable price action`;
    }
  }

  private analyzeVolume(current: any, historical: any[]): string {
    if (!current.volume_ratio) {
      return 'INSUFFICIENT_DATA';
    }

    const volRatio = current.volume_ratio;

    if (volRatio > 2) {
      return `HIGH SPIKE (${volRatio.toFixed(1)}x average) - strong interest`;
    } else if (volRatio > 1.5) {
      return `ELEVATED (${volRatio.toFixed(1)}x average) - increased activity`;
    } else if (volRatio > 0.8) {
      return `NORMAL (${volRatio.toFixed(1)}x average)`;
    } else {
      return `LOW (${volRatio.toFixed(1)}x average) - reduced interest`;
    }
  }

  private assessRisk(features: any, signal: string, confidence: number): {
    level: string;
    factors: string[];
  } {
    const factors: string[] = [];
    let riskScore = 0;

    // Volatility risk
    if (features.atr_14 && features.close) {
      const atrPercent = (features.atr_14 / features.close) * 100;
      if (atrPercent > 3) {
        factors.push('High volatility (ATR > 3% of price)');
        riskScore += 2;
      } else if (atrPercent > 1.5) {
        factors.push('Moderate volatility');
        riskScore += 1;
      }
    }

    // RSI extremes
    if (features.rsi_14) {
      if (features.rsi_14 > 70) {
        factors.push('Overbought conditions (RSI > 70)');
        riskScore += 1;
      } else if (features.rsi_14 < 30) {
        factors.push('Oversold conditions (RSI < 30)');
        riskScore += 1;
      }
    }

    // Confidence level
    if (confidence < 60) {
      factors.push('Low signal confidence (<60%)');
      riskScore += 1;
    }

    // Volume
    if (features.volume_ratio && features.volume_ratio < 0.5) {
      factors.push('Low volume (< 0.5x average)');
      riskScore += 1;
    }

    // Determine risk level
    let level: string;
    if (riskScore >= 4) {
      level = 'HIGH';
    } else if (riskScore >= 2) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    if (factors.length === 0) {
      factors.push('No significant risk factors identified');
    }

    return { level, factors };
  }

  private generateRecommendations(
    signal: string,
    confidence: number,
    trend: string,
    momentum: string,
    risk: { level: string; factors: string[] }
  ): string[] {
    const recommendations: string[] = [];

    // Primary recommendation based on signal
    if (signal === 'STRONG_BUY') {
      recommendations.push('STRONG BUY: Consider entering or adding to position');
      if (risk.level === 'HIGH') {
        recommendations.push('Use smaller position size due to high risk');
      }
    } else if (signal === 'STRONG_SELL') {
      recommendations.push('STRONG SELL: Consider exiting position or avoiding entry');
    }

    // Entry timing
    if (signal.includes('BUY')) {
      if (momentum.includes('OVERBOUGHT')) {
        recommendations.push('Wait for pullback before entering (overbought conditions)');
      } else if (momentum.includes('OVERSOLD')) {
        recommendations.push('Good entry opportunity (oversold conditions)');
      }
    }

    // Risk management
    if (risk.level === 'HIGH') {
      recommendations.push('Implement tight stop-loss due to high volatility');
      recommendations.push('Consider using smaller position size');
    } else if (risk.level === 'MEDIUM') {
      recommendations.push('Standard stop-loss recommended');
    }

    // Trend alignment
    if (trend.includes('STRONG_UPTREND') && signal.includes('BUY')) {
      recommendations.push('Signal aligned with strong uptrend - high conviction');
    } else if (trend.includes('DOWNTREND') && signal.includes('BUY')) {
      recommendations.push('CAUTION: Buy signal against downtrend - counter-trend trade');
    }

    // Monitoring
    recommendations.push('Monitor RSI and volume for confirmation');
    recommendations.push('Review position daily for changes in technical setup');

    return recommendations;
  }

  private generateSummary(
    symbol: string,
    signal: string,
    confidence: number,
    reasons: string[],
    trend: string,
    momentum: string
  ): string {
    const parts: string[] = [];

    parts.push(`${symbol} generated a ${signal} signal with ${confidence}% confidence.`);
    
    if (trend) {
      parts.push(`The stock is in a ${trend}.`);
    }
    
    if (momentum) {
      parts.push(`Momentum is ${momentum}.`);
    }

    if (reasons.length > 0) {
      parts.push(`Key factors: ${reasons.slice(0, 3).join(', ')}.`);
    }

    return parts.join(' ');
  }

  private getBollingerBandPosition(features: any): string | null {
    if (!features.close || !features.bb_upper || !features.bb_lower || !features.bb_middle) {
      return null;
    }

    const price = features.close;
    const upper = features.bb_upper;
    const lower = features.bb_lower;
    const middle = features.bb_middle;

    if (price > upper) return 'ABOVE_UPPER';
    if (price < lower) return 'BELOW_LOWER';
    if (price > middle) return 'ABOVE_MIDDLE';
    return 'BELOW_MIDDLE';
  }

  /**
   * Save report to database
   */
  async saveReport(report: DeepDiveReport): Promise<void> {
    await this.prisma.deepDiveReports.upsert({
      where: {
        symbol_market_date: {
          symbol: report.symbol,
          market: report.market,
          date: report.date,
        },
      },
      create: {
        symbol: report.symbol,
        market: report.market,
        date: report.date,
        signal: report.signal,
        confidence: report.confidence,
        summary: report.summary,
        technicalAnalysis: report.technicalAnalysis as any,
        keyMetrics: report.keyMetrics as any,
        riskAssessment: report.riskAssessment as any,
        recommendations: report.recommendations,
      },
      update: {
        signal: report.signal,
        confidence: report.confidence,
        summary: report.summary,
        technicalAnalysis: report.technicalAnalysis as any,
        keyMetrics: report.keyMetrics as any,
        riskAssessment: report.riskAssessment as any,
        recommendations: report.recommendations,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Saved deep dive report for ${report.symbol}`);
  }

  /**
   * Get report for a symbol
   */
  async getReport(symbol: string, market: Market, date: Date): Promise<any> {
    return this.prisma.deepDiveReports.findUnique({
      where: {
        symbol_market_date: { symbol, market, date },
      },
    });
  }

  /**
   * Get all reports for a date
   */
  async getReportsForDate(date: Date, market?: Market): Promise<any[]> {
    return this.prisma.deepDiveReports.findMany({
      where: {
        date,
        market: market || undefined,
      },
      orderBy: {
        confidence: 'desc',
      },
    });
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<{
    totalReports: number;
    dateRange: { earliest: Date | null; latest: Date | null };
    signalCounts: Record<string, number>;
  }> {
    const [totalReports, earliest, latest, bySignal] = await Promise.all([
      this.prisma.deepDiveReports.count(),
      this.prisma.deepDiveReports.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.deepDiveReports.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
      this.prisma.deepDiveReports.groupBy({
        by: ['signal'],
        _count: true,
      }),
    ]);

    const signalCounts: Record<string, number> = {};
    for (const item of bySignal) {
      signalCounts[item.signal] = item._count;
    }

    return {
      totalReports,
      dateRange: {
        earliest: earliest?.date || null,
        latest: latest?.date || null,
      },
      signalCounts,
    };
  }
}

