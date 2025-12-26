import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Market, num, pctDiff } from '@stocks/shared';

export interface SectorStrength {
  sector: string;
  symbolCount: number;
  avgRsi: number | null;
  avgSma20Dist: number | null; // % distance from SMA 20
  avgVolRatio: number | null;
  strongSymbols: number; // RSI > 60
  weakSymbols: number; // RSI < 40
  score: number; // Composite strength score
}

@Injectable()
export class SectorService {
  private readonly logger = new Logger(SectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Assign sector to a symbol
   */
  async assignSector(symbolId: string, sector: string): Promise<any> {
    // Verify symbol exists
    const symbol = await this.prisma.symbolUniverse.findUnique({
      where: { id: symbolId },
    });

    if (!symbol) {
      throw new NotFoundException(`Symbol with ID ${symbolId} not found`);
    }

    // Check if mapping already exists
    const existing = await this.prisma.symbolSectorMap.findUnique({
      where: { symbolId },
    });

    if (existing) {
      // Update existing
      return this.prisma.symbolSectorMap.update({
        where: { symbolId },
        data: { sector },
      });
    }

    // Create new
    return this.prisma.symbolSectorMap.create({
      data: {
        symbolId,
        sector,
      },
    });
  }

  /**
   * Get sector for a symbol
   */
  async getSectorForSymbol(symbolId: string): Promise<any> {
    return this.prisma.symbolSectorMap.findUnique({
      where: { symbolId },
      include: {
        symbol: true,
      },
    });
  }

  /**
   * Get all sector mappings
   */
  async getAllSectorMappings(sector?: string): Promise<any[]> {
    return this.prisma.symbolSectorMap.findMany({
      where: sector ? { sector } : undefined,
      include: {
        symbol: true,
      },
      orderBy: {
        sector: 'asc',
      },
    });
  }

  /**
   * Bulk import sector mappings
   */
  async bulkImportSectors(
    mappings: Array<{ symbolId: string; sector: string }>
  ): Promise<{ total: number; created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const mapping of mappings) {
      const existing = await this.prisma.symbolSectorMap.findUnique({
        where: { symbolId: mapping.symbolId },
      });

      if (existing) {
        await this.prisma.symbolSectorMap.update({
          where: { symbolId: mapping.symbolId },
          data: { sector: mapping.sector },
        });
        updated++;
      } else {
        await this.prisma.symbolSectorMap.create({
          data: mapping,
        });
        created++;
      }
    }

    return {
      total: mappings.length,
      created,
      updated,
    };
  }

  /**
   * Delete sector mapping
   */
  async deleteSectorMapping(symbolId: string): Promise<void> {
    await this.prisma.symbolSectorMap.delete({
      where: { symbolId },
    });
  }

  /**
   * Get sector statistics
   */
  async getSectorStats(): Promise<{
    totalMapped: number;
    uniqueSectors: number;
    sectorCounts: Record<string, number>;
  }> {
    const mappings = await this.prisma.symbolSectorMap.findMany({
      select: { sector: true },
    });

    const sectorCounts: Record<string, number> = {};
    for (const m of mappings) {
      sectorCounts[m.sector] = (sectorCounts[m.sector] || 0) + 1;
    }

    return {
      totalMapped: mappings.length,
      uniqueSectors: Object.keys(sectorCounts).length,
      sectorCounts,
    };
  }

  /**
   * Calculate sector strength for a given date
   */
  async calculateSectorStrength(date: Date, market?: Market): Promise<SectorStrength[]> {
    this.logger.log(`Calculating sector strength for ${date.toISOString()}`);

    // Get all sector mappings
    const mappings = await this.prisma.symbolSectorMap.findMany({
      include: {
        symbol: {
          select: {
            id: true,
            symbol: true,
            market: true,
            isActive: true,
          },
        },
      },
    });

    if (mappings.length === 0) {
      this.logger.warn('No sector mappings found');
      return [];
    }

    // Filter by market if specified
    const filteredMappings = market
      ? mappings.filter((m) => m.symbol.market === market)
      : mappings;

    // Group by sector
    const sectorGroups: Record<string, typeof filteredMappings> = {};
    for (const mapping of filteredMappings) {
      if (!sectorGroups[mapping.sector]) {
        sectorGroups[mapping.sector] = [];
      }
      sectorGroups[mapping.sector].push(mapping);
    }

    // Calculate strength for each sector
    const sectorStrengths: SectorStrength[] = [];

    for (const [sector, symbols] of Object.entries(sectorGroups)) {
      const symbolIds = symbols.map((s) => s.symbolId);

      // Get features for all symbols in this sector
      const features = await this.prisma.dailySymbolFeatures.findMany({
        where: {
          symbol: {
            in: symbols.map((s) => s.symbol.symbol),
          },
          market: market || { in: symbols.map((s) => s.symbol.market) },
          date,
        },
      });

      if (features.length === 0) {
        this.logger.debug(`No features found for sector ${sector} on ${date.toISOString()}`);
        continue;
      }

      // Calculate sector metrics
      const rsiValues = features
        .filter((f) => f.rsi14 !== null)
        .map((f) => num(f.rsi14!));
      const sma20DistValues = features
        .filter((f) => f.closePrice !== null && f.sma20 !== null)
        .map((f) => pctDiff(f.closePrice, f.sma20!));
      const volRatioValues = features
        .filter((f) => f.volumeRatio !== null)
        .map((f) => num(f.volumeRatio!));

      const avgRsi = rsiValues.length > 0 ? rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length : null;
      const avgSma20Dist =
        sma20DistValues.length > 0 ? sma20DistValues.reduce((a, b) => a + b, 0) / sma20DistValues.length : null;
      const avgVolRatio =
        volRatioValues.length > 0 ? volRatioValues.reduce((a, b) => a + b, 0) / volRatioValues.length : null;

      const strongSymbols = rsiValues.filter((r) => r > 60).length;
      const weakSymbols = rsiValues.filter((r) => r < 40).length;

      // Calculate composite score (0-100)
      let score = 50; // Base score

      if (avgRsi !== null) {
        score += (avgRsi - 50) * 0.5; // RSI contribution (-25 to +25)
      }

      if (avgSma20Dist !== null) {
        score += avgSma20Dist * 0.5; // SMA distance contribution
      }

      if (avgVolRatio !== null) {
        score += (avgVolRatio - 1) * 10; // Volume ratio contribution
      }

      // Bonus for strong symbols
      score += (strongSymbols / features.length) * 10;

      // Penalty for weak symbols
      score -= (weakSymbols / features.length) * 10;

      // Clamp score to 0-100
      score = Math.max(0, Math.min(100, score));

      sectorStrengths.push({
        sector,
        symbolCount: features.length,
        avgRsi: avgRsi !== null ? Math.round(avgRsi * 100) / 100 : null,
        avgSma20Dist: avgSma20Dist !== null ? Math.round(avgSma20Dist * 100) / 100 : null,
        avgVolRatio: avgVolRatio !== null ? Math.round(avgVolRatio * 100) / 100 : null,
        strongSymbols,
        weakSymbols,
        score: Math.round(score * 100) / 100,
      });
    }

    // Sort by score (descending)
    sectorStrengths.sort((a, b) => b.score - a.score);

    return sectorStrengths;
  }

  /**
   * Save sector strengths to daily_sector_lists table
   */
  async saveDailySectorList(
    date: Date,
    market: Market,
    sectorStrengths: SectorStrength[]
  ): Promise<void> {
    this.logger.log(`Saving sector list for ${market} on ${date.toISOString()}`);

    for (const [rank, strength] of sectorStrengths.entries()) {
      await this.prisma.dailySectorList.upsert({
        where: {
          date_market_sector: {
            date,
            market,
            sector: strength.sector,
          },
        },
        create: {
          market,
          date,
          sector: strength.sector,
          rank: rank + 1,
          score: strength.score,
          symbolCount: strength.symbolCount,
          metrics: {
            avgRsi: strength.avgRsi,
            avgSma20Dist: strength.avgSma20Dist,
            avgVolRatio: strength.avgVolRatio,
          },
        },
        update: {
          rank: rank + 1,
          score: strength.score,
          symbolCount: strength.symbolCount,
          metrics: {
            avgRsi: strength.avgRsi,
            avgSma20Dist: strength.avgSma20Dist,
            avgVolRatio: strength.avgVolRatio,
          },
        },
      });
    }

    this.logger.log(`Saved ${sectorStrengths.length} sectors to daily_sector_lists`);
  }

  /**
   * Get daily sector list
   */
  async getDailySectorList(date: Date, market?: Market, topN?: number): Promise<any[]> {
    const sectorList = await this.prisma.dailySectorList.findMany({
      where: {
        date,
        market: market || undefined,
      },
      orderBy: {
        rank: 'asc',
      },
      take: topN || undefined,
    });

    return sectorList;
  }

  /**
   * Get sector list statistics
   */
  async getSectorListStats(): Promise<{
    totalRecords: number;
    dateRange: { earliest: Date | null; latest: Date | null };
    marketCounts: Record<string, number>;
  }> {
    const [totalRecords, earliest, latest, byMarket] = await Promise.all([
      this.prisma.dailySectorList.count(),
      this.prisma.dailySectorList.findFirst({
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.dailySectorList.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
      this.prisma.dailySectorList.groupBy({
        by: ['market'],
        _count: true,
      }),
    ]);

    const marketCounts: Record<string, number> = {};
    for (const item of byMarket) {
      marketCounts[item.market] = item._count;
    }

    return {
      totalRecords,
      dateRange: {
        earliest: earliest?.date || null,
        latest: latest?.date || null,
      },
      marketCounts,
    };
  }
}

