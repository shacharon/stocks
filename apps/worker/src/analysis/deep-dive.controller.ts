import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { DeepDiveService } from './deep-dive.service';
import { Market } from '@stocks/shared';

@Controller('reports')
export class DeepDiveController {
  private readonly logger = new Logger(DeepDiveController.name);

  constructor(private deepDive: DeepDiveService) {}

  /**
   * Generate a deep dive report for a symbol
   * POST /reports/generate
   */
  @Post('generate')
  async generateReport(
    @Body() body: {
      symbol: string;
      market: Market;
      date: string;
      signal: string;
      confidence: number;
      reasons: string[];
    }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(`Generating report for ${body.symbol} (${body.market})`);

    const report = await this.deepDive.generateReport(
      body.symbol,
      body.market,
      date,
      body.signal,
      body.confidence,
      body.reasons
    );

    // Save to database
    await this.deepDive.saveReport(report);

    return report;
  }

  /**
   * Get report for a specific symbol and date
   * GET /reports/:symbol/:market/:date
   */
  @Get(':symbol/:market/:date')
  async getReport(
    @Param('symbol') symbol: string,
    @Param('market') market: Market,
    @Param('date') dateStr: string
  ): Promise<any> {
    const date = new Date(dateStr);
    this.logger.log(`Getting report for ${symbol} (${market}) on ${dateStr}`);

    const report = await this.deepDive.getReport(symbol, market, date);

    if (!report) {
      return {
        error: 'No report found for this symbol and date',
        symbol,
        market,
        date: dateStr,
      };
    }

    return report;
  }

  /**
   * Get all reports for a date
   * GET /reports/date/:date?market=US
   */
  @Get('date/:date')
  async getReportsForDate(
    @Param('date') dateStr: string,
    @Query('market') market?: Market
  ): Promise<any> {
    const date = new Date(dateStr);
    this.logger.log(`Getting reports for ${dateStr}${market ? ` (${market})` : ''}`);

    const reports = await this.deepDive.getReportsForDate(date, market);

    return {
      date: dateStr,
      market: market || 'ALL',
      count: reports.length,
      reports,
    };
  }

  /**
   * Get report statistics
   * GET /reports/stats
   */
  @Get('stats')
  async getReportStats(): Promise<any> {
    this.logger.log('Getting report statistics');
    return this.deepDive.getReportStats();
  }
}


