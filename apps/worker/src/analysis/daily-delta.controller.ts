import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { DailyDeltaService } from './daily-delta.service';

@Controller('deltas')
export class DailyDeltaController {
  private readonly logger = new Logger(DailyDeltaController.name);

  constructor(private dailyDelta: DailyDeltaService) {}

  /**
   * Calculate and save daily deltas
   * POST /deltas/calculate
   */
  @Post('calculate')
  async calculateDailyDeltas(
    @Body() body: { date: string; previousDate?: string; portfolioId?: string }
  ): Promise<any> {
    const date = new Date(body.date);
    const previousDate = body.previousDate ? new Date(body.previousDate) : undefined;

    this.logger.log(`Calculating daily deltas for ${body.date}`);

    const delta = await this.dailyDelta.calculateDailyDeltas(date, previousDate);

    // Save to database
    await this.dailyDelta.saveDailyDelta(delta, body.portfolioId);

    return delta;
  }

  /**
   * Get daily delta for a specific date
   * GET /deltas/:date?portfolioId=uuid
   */
  @Get(':date')
  async getDailyDelta(
    @Param('date') dateStr: string,
    @Query('portfolioId') portfolioId?: string
  ): Promise<any> {
    const date = new Date(dateStr);
    this.logger.log(`Getting daily delta for ${dateStr}`);

    const delta = await this.dailyDelta.getDailyDelta(date, portfolioId);

    if (!delta) {
      return {
        error: 'No delta found for this date',
        date: dateStr,
      };
    }

    return delta;
  }

  /**
   * Get daily deltas for a date range
   * GET /deltas/range?start=YYYY-MM-DD&end=YYYY-MM-DD&portfolioId=uuid
   */
  @Get('range/query')
  async getDailyDeltasRange(
    @Query('start') startStr: string,
    @Query('end') endStr: string,
    @Query('portfolioId') portfolioId?: string
  ): Promise<any> {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    this.logger.log(`Getting daily deltas from ${startStr} to ${endStr}`);

    const deltas = await this.dailyDelta.getDailyDeltasRange(
      startDate,
      endDate,
      portfolioId
    );

    return {
      startDate: startStr,
      endDate: endStr,
      portfolioId: portfolioId || 'ALL',
      count: deltas.length,
      deltas,
    };
  }

  /**
   * Get delta statistics
   * GET /deltas/stats
   */
  @Get('stats/summary')
  async getDeltaStats(): Promise<any> {
    this.logger.log('Getting delta statistics');
    return this.dailyDelta.getDeltaStats();
  }
}

