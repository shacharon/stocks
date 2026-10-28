import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis Service for caching and rate limiting
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Get current Alpha Vantage request count for today
   */
  async getAlphaVantageRequestCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `av:reqcount:${today}`;
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Increment Alpha Vantage request count
   * Returns new count
   * Throws if budget exceeded
   */
  async incrementAlphaVantageRequests(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `av:reqcount:${today}`;
    const limit = 25;

    // Check current count
    const currentCount = await this.getAlphaVantageRequestCount();
    if (currentCount >= limit) {
      throw new Error(
        `⛔ Alpha Vantage daily limit reached (${currentCount}/${limit}). Wait until tomorrow.`
      );
    }

    // Increment
    const newCount = await this.client.incr(key);

    // Set expiry on first increment (26 hours to be safe)
    if (newCount === 1) {
      await this.client.expire(key, 93600); // 26 hours
    }

    this.logger.debug(`Alpha Vantage requests today: ${newCount}/${limit}`);
    return newCount;
  }

  /**
   * Check if we can make another Alpha Vantage request
   */
  async canMakeAlphaVantageRequest(): Promise<boolean> {
    const count = await this.getAlphaVantageRequestCount();
    return count < 25;
  }

  /**
   * Get Redis client for custom operations
   */
  getClient(): Redis {
    return this.client;
  }
}

