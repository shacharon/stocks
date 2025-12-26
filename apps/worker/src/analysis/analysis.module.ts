import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { FeaturesController } from './features.controller';
import { ChangeDetectorController } from './change-detector.controller';
import { DeepDiveController } from './deep-dive.controller';
import { DailyDeltaController } from './daily-delta.controller';
import { AnalysisService } from './analysis.service';
import { PipelineTrackingService } from './pipeline-tracking.service';
import { FeatureFactoryService } from './feature-factory.service';
import { ChangeDetectorService } from './change-detector.service';
import { DeepDiveService } from './deep-dive.service';
import { DailyDeltaService } from './daily-delta.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SectorModule } from '../sector/sector.module';

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
  imports: [PrismaModule, SectorModule],
  controllers: [AnalysisController, FeaturesController, ChangeDetectorController, DeepDiveController, DailyDeltaController],
  providers: [AnalysisService, PipelineTrackingService, FeatureFactoryService, ChangeDetectorService, DeepDiveService, DailyDeltaService],
  exports: [AnalysisService, PipelineTrackingService, FeatureFactoryService, ChangeDetectorService, DeepDiveService, DailyDeltaService],
})
export class AnalysisModule {}

