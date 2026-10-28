import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { RedisService } from '../redis/redis.service';

interface AlphaVantageJobData {
  symbol: string;
  market: string;
  from: Date;
  to: Date;
}

interface AlphaVantageJobResult {
  bars: any[];
  error?: string;
}

/**
 * Queue service for Alpha Vantage API calls
 * Enforces:
 * - 1 request per second (throttling)
 * - 25 requests per day (rate limiting)
 */
@Injectable()
export class AlphaVantageQueueService implements OnModuleInit {
  private readonly logger = new Logger(AlphaVantageQueueService.name);
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue('alphavantage') private avQueue: Queue,
    private redis: RedisService,
  ) {}

  async onModuleInit() {
    this.queueEvents = new QueueEvents('alphavantage', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: null, // Required for BullMQ blocking operations
      },
    });
  }

  /**
   * Queue an Alpha Vantage API call
   * Returns bars or throws if rate limit exceeded
   */
  async queueFetch(
    symbol: string,
    market: string,
    from: Date,
    to: Date,
  ): Promise<any[]> {
    // Check rate limit BEFORE queuing
    const canMake = await this.redis.canMakeAlphaVantageRequest();
    if (!canMake) {
      const count = await this.redis.getAlphaVantageRequestCount();
      throw new Error(
        `⛔ Alpha Vantage daily limit reached (${count}/25). Wait until tomorrow.`
      );
    }

    // Add job to queue
    const job = await this.avQueue.add(
      'fetch',
      {
        symbol,
        market,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      {
        attempts: 1, // Don't retry on failure (preserves rate limit)
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    // Wait for job to complete
    const result = await job.waitUntilFinished(this.queueEvents);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.bars;
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.avQueue.getWaitingCount(),
      this.avQueue.getActiveCount(),
      this.avQueue.getCompletedCount(),
      this.avQueue.getFailedCount(),
    ]);

    const requestsToday = await this.redis.getAlphaVantageRequestCount();

    return {
      queue: {
        waiting,
        active,
        completed,
        failed,
      },
      rateLimit: {
        requestsToday,
        limit: 25,
        remaining: 25 - requestsToday,
      },
    };
  }
}

