import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { StopLossService } from './stop-loss.service';

@Controller('stop-loss')
export class StopLossController {
  private readonly logger = new Logger(StopLossController.name);

  constructor(private stopLoss: StopLossService) {}

  /**
   * Calculate stop-loss for a specific position
   * POST /stop-loss/calculate
   */
  @Post('calculate')
  async calculateStopLoss(
    @Body() body: { portfolioId: string; symbolId: string; date: string }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(
      `Calculating stop-loss for position ${body.symbolId} in portfolio ${body.portfolioId}`
    );

    const calculation = await this.stopLoss.calculateStopLoss(
      body.portfolioId,
      body.symbolId,
      date
    );

    return calculation;
  }

  /**
   * Update stop-losses for entire portfolio
   * POST /stop-loss/portfolio/update
   */
  @Post('portfolio/update')
  async updatePortfolioStopLosses(
    @Body() body: { portfolioId: string; date: string }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(`Updating stop-losses for portfolio ${body.portfolioId}`);

    const result = await this.stopLoss.updatePortfolioStopLosses(body.portfolioId, date);

    return result;
  }

  /**
   * Get stop-loss state for a position
   * GET /stop-loss/portfolio/:portfolioId/symbol/:symbolId
   */
  @Get('portfolio/:portfolioId/symbol/:symbolId')
  async getStopLossState(
    @Param('portfolioId') portfolioId: string,
    @Param('symbolId') symbolId: string
  ): Promise<any> {
    this.logger.log(`Getting stop-loss state for position ${symbolId}`);

    const state = await this.stopLoss.getStopLossState(portfolioId, symbolId);

    if (!state) {
      return {
        error: 'No stop-loss state found for this position',
        portfolioId,
        symbolId,
      };
    }

    return state;
  }

  /**
   * Get all stop-losses for a portfolio
   * GET /stop-loss/portfolio/:portfolioId
   */
  @Get('portfolio/:portfolioId')
  async getPortfolioStopLosses(@Param('portfolioId') portfolioId: string): Promise<any> {
    this.logger.log(`Getting stop-losses for portfolio ${portfolioId}`);

    const stopLosses = await this.stopLoss.getPortfolioStopLosses(portfolioId);

    return {
      portfolioId,
      count: stopLosses.length,
      stopLosses,
    };
  }

  /**
   * Check for stop-loss violations
   * POST /stop-loss/portfolio/check-violations
   */
  @Post('portfolio/check-violations')
  async checkStopLossViolations(
    @Body() body: { portfolioId: string; date: string }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(`Checking stop-loss violations for portfolio ${body.portfolioId}`);

    const result = await this.stopLoss.checkStopLossViolations(body.portfolioId, date);

    return result;
  }

  /**
   * Get stop-loss statistics
   * GET /stop-loss/stats
   */
  @Get('stats')
  async getStopLossStats(): Promise<any> {
    this.logger.log('Getting stop-loss statistics');
    return this.stopLoss.getStopLossStats();
  }
}


