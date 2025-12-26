import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineTrackingService } from './pipeline-tracking.service';
import { FeatureFactoryService } from './feature-factory.service';
import { SectorService } from '../sector/sector.service';
import { JobType, PipelineStatus, JobStatus, Market } from '@stocks/shared';

/**
 * Analysis Service
 * Orchestrates the EOD analysis pipeline
 * 
 * Pipeline Flow:
 * 1. Market Sync (fetch latest bars)
 * 2. Feature Factory (calculate indicators)
 * 3. Sector Selector (identify strong sectors)
 * 4. Change Detector (detect significant changes)
 * 5. Deep Dive (generate detailed reports)
 */
@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private prisma: PrismaService,
    private pipelineTracking: PipelineTrackingService,
    private featureFactory: FeatureFactoryService,
    private sectorService: SectorService,
  ) {}

  /**
   * Run the full EOD analysis pipeline
   */
  async runPipeline(date: Date, portfolioId?: string) {
    this.logger.log(`Starting pipeline for ${date.toISOString().split('T')[0]}`);

    // Check if already ran
    const alreadyRan = await this.pipelineTracking.hasPipelineRunForDate(date, portfolioId);
    if (alreadyRan) {
      this.logger.warn(`Pipeline already completed for ${date.toISOString().split('T')[0]}`);
      return { alreadyRan: true, message: 'Pipeline already completed for this date' };
    }

    // Create pipeline run
    const pipelineRun = await this.pipelineTracking.createPipelineRun(date, portfolioId);

    try {
      // Update to running
      await this.pipelineTracking.updatePipelineStatus(pipelineRun.id, PipelineStatus.RUNNING);

      // Run jobs in sequence
      await this.runMarketSync(pipelineRun.id, date);
      await this.runFeatureFactory(pipelineRun.id, date);
      await this.runSectorSelector(pipelineRun.id, date);
      await this.runChangeDetector(pipelineRun.id, date, portfolioId);
      await this.runDeepDive(pipelineRun.id, date, portfolioId);

      // Mark as completed
      await this.pipelineTracking.updatePipelineStatus(pipelineRun.id, PipelineStatus.COMPLETED);

      this.logger.log(`Pipeline ${pipelineRun.id} completed successfully`);
      return {
        pipelineRunId: pipelineRun.id,
        status: 'COMPLETED',
        date: date.toISOString().split('T')[0],
      };
    } catch (error) {
      this.logger.error(`Pipeline ${pipelineRun.id} failed: ${error.message}`);
      await this.pipelineTracking.updatePipelineStatus(
        pipelineRun.id,
        PipelineStatus.FAILED,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Job 1: Market Sync
   * Fetch latest market data for all symbols
   */
  private async runMarketSync(pipelineRunId: string, date: Date) {
    const jobRun = await this.pipelineTracking.createJobRun(
      pipelineRunId,
      JobType.MARKET_SYNC,
      { date: date.toISOString() },
    );

    try {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.RUNNING);

      // TODO: Implement actual market sync logic
      // For now, just mark as completed
      this.logger.log(`[MARKET_SYNC] Job ${jobRun.id} - Placeholder`);

      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.COMPLETED, {
        message: 'Market sync placeholder - not yet implemented',
      });
    } catch (error) {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  /**
   * Job 2: Feature Factory
   * Calculate technical indicators and features
   */
  private async runFeatureFactory(pipelineRunId: string, date: Date) {
    const jobRun = await this.pipelineTracking.createJobRun(
      pipelineRunId,
      JobType.FEATURE_FACTORY,
      { date: date.toISOString() },
    );

    try {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.RUNNING);

      this.logger.log(`[FEATURE_FACTORY] Job ${jobRun.id} - Starting feature calculation`);
      
      // Calculate features for all symbols in the universe
      const result = await this.featureFactory.calculateFeaturesForUniverse(date);
      
      this.logger.log(
        `[FEATURE_FACTORY] Job ${jobRun.id} - Processed ${result.total} symbols: ${result.successful} successful, ${result.failed} failed`
      );

      if (result.failed > 0) {
        this.logger.warn(`[FEATURE_FACTORY] Errors: ${result.errors.slice(0, 5).join('; ')}`);
      }

      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.COMPLETED, {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        errorSample: result.errors.slice(0, 5),
      });
    } catch (error) {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  /**
   * Job 3: Sector Selector
   * Identify strong sectors and generate daily_sector_lists
   */
  private async runSectorSelector(pipelineRunId: string, date: Date) {
    const jobRun = await this.pipelineTracking.createJobRun(
      pipelineRunId,
      JobType.SECTOR_SELECTOR,
      { date: date.toISOString() },
    );

    try {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.RUNNING);

      this.logger.log(`[SECTOR_SELECTOR] Job ${jobRun.id} - Starting sector analysis`);

      // Calculate sector strengths for each market
      const markets = [Market.US, Market.TASE];
      let totalSectors = 0;
      
      for (const market of markets) {
        const strengths = await this.sectorService.calculateSectorStrength(date, market);
        
        if (strengths.length > 0) {
          // Save to daily_sector_lists
          await this.sectorService.saveDailySectorList(date, market, strengths);
          totalSectors += strengths.length;
          
          this.logger.log(
            `[SECTOR_SELECTOR] ${market}: ${strengths.length} sectors analyzed, ` +
            `top sector: ${strengths[0]?.sector} (score: ${strengths[0]?.score})`
          );
        } else {
          this.logger.warn(`[SECTOR_SELECTOR] No sectors found for ${market}`);
        }
      }

      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.COMPLETED, {
        totalSectors,
        markets: markets.length,
        date: date.toISOString(),
      });
    } catch (error) {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  /**
   * Job 4: Change Detector
   * Detect significant changes and update portfolio_daily_decisions
   */
  private async runChangeDetector(pipelineRunId: string, date: Date, portfolioId?: string) {
    const jobRun = await this.pipelineTracking.createJobRun(
      pipelineRunId,
      JobType.CHANGE_DETECTOR,
      { date: date.toISOString(), portfolioId },
    );

    try {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.RUNNING);

      // TODO: Implement change detection logic
      this.logger.log(`[CHANGE_DETECTOR] Job ${jobRun.id} - Placeholder`);

      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.COMPLETED, {
        message: 'Change detector placeholder - not yet implemented',
      });
    } catch (error) {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  /**
   * Job 5: Deep Dive
   * Generate detailed reports for flagged symbols
   */
  private async runDeepDive(pipelineRunId: string, date: Date, portfolioId?: string) {
    const jobRun = await this.pipelineTracking.createJobRun(
      pipelineRunId,
      JobType.DEEP_DIVE,
      { date: date.toISOString(), portfolioId },
    );

    try {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.RUNNING);

      // TODO: Implement deep dive report generation
      this.logger.log(`[DEEP_DIVE] Job ${jobRun.id} - Placeholder`);

      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.COMPLETED, {
        message: 'Deep dive placeholder - not yet implemented',
      });
    } catch (error) {
      await this.pipelineTracking.updateJobStatus(jobRun.id, JobStatus.FAILED, null, error.message);
      throw error;
    }
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus(pipelineRunId: string): Promise<any> {
    return this.pipelineTracking.getPipelineRun(pipelineRunId);
  }

  /**
   * Get all pipeline runs
   */
  async getPipelineRuns(date?: Date, portfolioId?: string, limit?: number): Promise<any> {
    return this.pipelineTracking.getPipelineRuns(date, portfolioId, undefined, limit);
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(): Promise<any> {
    return this.pipelineTracking.getPipelineStats();
  }
}

