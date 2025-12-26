import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ChangeDetectorService, SignalType } from './change-detector.service';
import { Market } from '@stocks/shared';

@Controller('changes')
export class ChangeDetectorController {
  private readonly logger = new Logger(ChangeDetectorController.name);

  constructor(private changeDetector: ChangeDetectorService) {}

  /**
   * Detect changes for a single symbol
   * POST /changes/detect
   */
  @Post('detect')
  async detectChanges(
    @Body() body: { symbol: string; market: Market; date: string }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(`Detecting changes for ${body.symbol} (${body.market}) on ${body.date}`);

    const result = await this.changeDetector.detectChanges(body.symbol, body.market, date);

    if (!result) {
      return {
        error: 'No features found for this symbol and date',
        symbol: body.symbol,
        market: body.market,
        date: body.date,
      };
    }

    return result;
  }

  /**
   * Detect changes for all positions in a portfolio
   * POST /changes/portfolio
   */
  @Post('portfolio')
  async detectChangesForPortfolio(
    @Body() body: { portfolioId: string; date: string }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(`Detecting changes for portfolio ${body.portfolioId} on ${body.date}`);

    const result = await this.changeDetector.detectChangesForPortfolio(body.portfolioId, date);

    // Also save to database
    await this.changeDetector.savePortfolioDailyDecisions(
      body.portfolioId,
      date,
      result.results
    );

    return result;
  }

  /**
   * Get daily decisions for a portfolio
   * GET /changes/portfolio/:portfolioId/decisions/:date
   */
  @Get('portfolio/:portfolioId/decisions/:date')
  async getPortfolioDailyDecisions(
    @Param('portfolioId') portfolioId: string,
    @Param('date') dateStr: string
  ): Promise<any> {
    const date = new Date(dateStr);
    this.logger.log(`Getting decisions for portfolio ${portfolioId} on ${dateStr}`);

    const decisions = await this.changeDetector.getPortfolioDailyDecisions(portfolioId, date);

    return {
      portfolioId,
      date: dateStr,
      count: decisions.length,
      decisions,
    };
  }

  /**
   * Get decision statistics
   * GET /changes/stats
   */
  @Get('stats')
  async getDecisionStats(): Promise<any> {
    this.logger.log('Getting decision statistics');
    return this.changeDetector.getDecisionStats();
  }
}


