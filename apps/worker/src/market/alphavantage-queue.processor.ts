import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AlphaVantageProvider } from './providers/alphavantage.provider';
import { RedisService } from '../redis/redis.service';
import { Market } from '@stocks/shared';

@Processor('alphavantage', {
  concurrency: 1, // Only 1 job at a time
  limiter: {
    max: 1, // Max 1 job
    duration: 1100, // per 1100ms (1.1 seconds for safety)
  },
})
export class AlphaVantageQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AlphaVantageQueueProcessor.name);

  constructor(
    private alphaVantageProvider: AlphaVantageProvider,
    private redis: RedisService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { symbol, market, from, to } = job.data;

    this.logger.log(`Processing Alpha Vantage fetch for ${symbol}`);

    try {
      // Increment counter (will throw if limit exceeded)
      await this.redis.incrementAlphaVantageRequests();

      // Make the actual API call
      const bars = await this.alphaVantageProvider.getDailyBars(
        symbol,
        market as Market,
        new Date(from),
        new Date(to),
      );

      return { bars };
    } catch (error) {
      this.logger.error(`Alpha Vantage fetch failed for ${symbol}: ${error.message}`);
      return { bars: [], error: error.message };
    }
  }
}

