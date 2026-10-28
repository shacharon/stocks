import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MockProvider, StooqProvider, AlphaVantageProvider, TwelveDataProvider } from './providers';
import { AlphaVantageQueueService } from './alphavantage-queue.service';
import { AlphaVantageQueueProcessor } from './alphavantage-queue.processor';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Market Module
 * Manages market data fetching and storage
 * 
 * Features:
 * - Multiple provider support (Mock, Stooq, Alpha Vantage)
 * - Automatic provider selection by market
 * - Bulk sync for all symbols
 * - Data statistics
 * - Alpha Vantage queue with rate limiting (25/day, 1/sec)
 */
@Module({
  imports: [
    PrismaModule,
    // Register AlphaVantage queue
    BullModule.registerQueue({
      name: 'alphavantage',
    }),
  ],
  controllers: [MarketController],
  providers: [
    MarketService,
    MockProvider,
    StooqProvider,
    AlphaVantageProvider,
    TwelveDataProvider,
    AlphaVantageQueueService,
    AlphaVantageQueueProcessor,
  ],
  exports: [MarketService, AlphaVantageQueueService],
})
export class MarketModule {}


