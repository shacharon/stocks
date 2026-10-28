import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketDataProvider, DailyBar, Market } from './market-data-provider.interface';

@Injectable()
export class TwelveDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(TwelveDataProvider.name);
  readonly name = 'twelvedata';
  readonly supportedMarkets: Market[] = ['US' as Market];
  private readonly baseUrl = 'https://api.twelvedata.com';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TWELVEDATA_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn('⚠️  No Twelve Data API key found.');
      this.logger.warn('⚠️  Get your free key (800 req/day) at: https://twelvedata.com/apikey');
      this.logger.warn('⚠️  Set TWELVEDATA_API_KEY in .env');
    } else {
      this.logger.log('✅ Twelve Data provider initialized');
    }
  }

  supportsMarket(market: Market): boolean {
    return this.supportedMarkets.includes(market);
  }

  async getDailyBars(
    symbol: string,
    market: Market,
    from: Date,
    to: Date,
  ): Promise<DailyBar[]> {
    if (!this.supportsMarket(market)) {
      throw new Error(`Twelve Data provider does not support ${market} market`);
    }

    if (!this.apiKey) {
      this.logger.error('No Twelve Data API key configured');
      return [];
    }

    this.logger.log(
      `Fetching Twelve Data for ${symbol} from ${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`
    );

    try {
      // Twelve Data uses time_series endpoint
      // Format: YYYY-MM-DD
      const startDate = from.toISOString().split('T')[0];
      const endDate = to.toISOString().split('T')[0];
      
      const url = `${this.baseUrl}/time_series?symbol=${symbol}&interval=1day&start_date=${startDate}&end_date=${endDate}&apikey=${this.apiKey}&format=JSON`;
      
      this.logger.debug(`Twelve Data URL: ${url.replace(this.apiKey, 'HIDDEN')}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for errors
      if (data.status === 'error') {
        this.logger.warn(`Twelve Data API error for ${symbol}: ${data.message}`);
        if (data.message?.includes('limit')) {
          this.logger.warn('💡 Daily limit reached. Get a paid plan or wait until tomorrow.');
        }
        return [];
      }

      if (!data.values || !Array.isArray(data.values)) {
        this.logger.warn(`No time series data found for ${symbol}`);
        return [];
      }

      const bars: DailyBar[] = [];

      for (const item of data.values) {
        const date = new Date(item.datetime + 'T00:00:00Z');
        
        bars.push({
          symbol,
          market,
          date,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseInt(item.volume, 10),
        });
      }

      // Twelve Data returns newest first, we want oldest first
      bars.reverse();

      this.logger.log(`✅ Fetched ${bars.length} bars for ${symbol} from Twelve Data`);
      return bars;
    } catch (error) {
      this.logger.error(`Failed to fetch data from Twelve Data for ${symbol}: ${error.message}`);
      return [];
    }
  }
}

