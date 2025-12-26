import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { StopLossController } from './stop-loss.controller';
import { PortfolioService } from './portfolio.service';
import { StopLossService } from './stop-loss.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Portfolio Module
 * Manages portfolios and positions
 * 
 * Features:
 * - Portfolio CRUD
 * - Position management
 * - Buy price validation
 * - Symbol validation
 * - Portfolio statistics
 * - Stop-loss management (ATR-based trailing stops)
 */
@Module({
  imports: [PrismaModule],
  controllers: [PortfolioController, StopLossController],
  providers: [PortfolioService, StopLossService],
  exports: [PortfolioService, StopLossService],
})
export class PortfolioModule {}

