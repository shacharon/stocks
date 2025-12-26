import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MockProvider, StooqProvider } from './providers';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Market Module
 * Manages market data fetching and storage
 * 
 * Features:
 * - Multiple provider support (Mock, Stooq)
 * - Automatic provider selection by market
 * - Bulk sync for all symbols
 * - Data statistics
 */
@Module({
  imports: [PrismaModule],
  controllers: [MarketController],
  providers: [MarketService, MockProvider, StooqProvider],
  exports: [MarketService],
})
export class MarketModule {}


