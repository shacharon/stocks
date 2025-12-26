import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
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
 */
@Module({
  imports: [PrismaModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}

