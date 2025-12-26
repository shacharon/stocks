import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AnalysisService } from './analysis.service';

/**
 * Analysis Controller
 * Endpoints for triggering and monitoring analysis pipelines
 */
@Controller('analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * POST /analysis/run
   * Trigger the EOD analysis pipeline
   * 
   * Query params:
   * - date: Analysis date (YYYY-MM-DD, defaults to today)
   * - portfolioId: Optional portfolio ID to analyze
   */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runPipeline(
    @Query('date') dateStr?: string,
    @Query('portfolioId') portfolioId?: string,
  ) {
    this.logger.log(`POST /analysis/run - date: ${dateStr}, portfolioId: ${portfolioId}`);

    // Parse date
    let date = new Date();
    if (dateStr) {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }

    return this.analysisService.runPipeline(date, portfolioId);
  }

  /**
   * GET /analysis/runs
   * Get all pipeline runs with optional filtering
   * 
   * Query params:
   * - date: Filter by date (YYYY-MM-DD)
   * - portfolioId: Filter by portfolio
   * - limit: Max results (default 50)
   */
  @Get('runs')
  async getPipelineRuns(
    @Query('date') dateStr?: string,
    @Query('portfolioId') portfolioId?: string,
    @Query('limit') limitStr?: string,
  ): Promise<any> {
    this.logger.log(`GET /analysis/runs - date: ${dateStr}, limit: ${limitStr}`);

    let date: Date | undefined;
    if (dateStr) {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 50;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.analysisService.getPipelineRuns(date, portfolioId, limit);
  }

  /**
   * GET /analysis/runs/:id
   * Get a specific pipeline run with all job details
   */
  @Get('runs/:id')
  async getPipelineStatus(@Param('id') id: string): Promise<any> {
    this.logger.log(`GET /analysis/runs/${id}`);
    return this.analysisService.getPipelineStatus(id);
  }

  /**
   * GET /analysis/stats
   * Get pipeline statistics
   */
  @Get('stats')
  async getPipelineStats(): Promise<any> {
    this.logger.log('GET /analysis/stats');
    return this.analysisService.getPipelineStats();
  }
}

