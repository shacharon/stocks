import { Injectable, Logger } from '@nestjs/common';
import { MarketDataProvider, DailyBar, Market } from './market-data-provider.interface';

/**
 * Mock Market Data Provider
 * Returns synthetic data for testing
 */
@Injectable()
export class MockProvider implements MarketDataProvider {
  private readonly logger = new Logger(MockProvider.name);
  readonly name = 'mock';
  readonly supportedMarkets: Market[] = ['US' as Market, 'TASE' as Market];

  supportsMarket(market: Market): boolean {
    return this.supportedMarkets.includes(market);
  }

  async getDailyBars(
    symbol: string,
    market: Market,
    from: Date,
    to: Date,
  ): Promise<DailyBar[]> {
    this.logger.log(`Fetching mock data for ${symbol} (${market}) from ${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`);

    const bars: DailyBar[] = [];
    const currentDate = new Date(from);
    let basePrice = 100 + Math.random() * 100; // Random starting price between 100-200

    while (currentDate <= to) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Generate realistic OHLCV data
        const open = basePrice;
        const change = (Math.random() - 0.5) * 5; // -2.5% to +2.5% daily change
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        const volume = Math.floor(1000000 + Math.random() * 9000000); // 1M-10M volume

        bars.push({
          symbol,
          market,
          date: new Date(currentDate),
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume,
        });

        basePrice = close; // Next day starts at previous close
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.logger.log(`Generated ${bars.length} mock bars for ${symbol}`);
    return bars;
  }
}

