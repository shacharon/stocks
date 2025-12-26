import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { PipelineTrackingService } from './pipeline-tracking.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Analysis Module
 * Manages the EOD analysis pipeline
 * 
 * Features:
 * - Pipeline orchestration
 * - Job tracking and idempotency
 * - Market sync
 * - Feature calculation
 * - Sector selection
 * - Change detection
 * - Deep dive reports
 */
@Module({
  imports: [PrismaModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, PipelineTrackingService],
  exports: [AnalysisService, PipelineTrackingService],
})
export class AnalysisModule {}

