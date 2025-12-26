import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketDataProvider, DailyBar, Market } from './market-data-provider.interface';

/**
 * Alpha Vantage Market Data Provider
 * Free API with 25 requests/day (500 with paid)
 * 
 * Get your free API key: https://www.alphavantage.co/support/#api-key
 * 
 * API: https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&outputsize=full&apikey={key}
 * 
 * Response Format (JSON):
 * {
 *   "Time Series (Daily)": {
 *     "2024-12-26": {
 *       "1. open": "180.5000",
 *       "2. high": "185.2000",
 *       "3. low": "179.8000",
 *       "4. close": "184.3000",
 *       "5. volume": "54000000"
 *     }
 *   }
 * }
 */
@Injectable()
export class AlphaVantageProvider implements MarketDataProvider {
  private readonly logger = new Logger(AlphaVantageProvider.name);
  readonly name = 'alphavantage';
  readonly supportedMarkets: Market[] = ['US' as Market];
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ALPHAVANTAGE_API_KEY', 'demo');
    if (this.apiKey === 'demo') {
      this.logger.warn('⚠️  Using demo API key. Get your free key at: https://www.alphavantage.co/support/#api-key');
      this.logger.warn('⚠️  Demo key is limited and may not work for all symbols. Set ALPHAVANTAGE_API_KEY in .env');
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
      throw new Error(`AlphaVantage provider does not support ${market} market`);
    }

    this.logger.log(
      `Fetching Alpha Vantage data for ${symbol} from ${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`
    );

    try {
      // Use 'compact' for free tier (last 100 trading days ~5 months)
      // 'full' requires premium subscription
      const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${this.apiKey}`;
      
      this.logger.debug(`Alpha Vantage URL: ${url.replace(this.apiKey, 'HIDDEN')}`);

      // Free tier rate limit: 25 requests/day, 1 request/second
      // Add a small delay to respect rate limits (will be handled at service level)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for API errors
      if (data['Error Message']) {
        this.logger.warn(`Alpha Vantage API error for ${symbol}: ${data['Error Message']}`);
        return [];
      }

      if (data['Note']) {
        this.logger.warn(`Alpha Vantage rate limit: ${data['Note']}`);
        this.logger.warn('💡 Get a free API key at: https://www.alphavantage.co/support/#api-key');
        return [];
      }

      if (data['Information']) {
        this.logger.warn(`Alpha Vantage info: ${data['Information']}`);
        return [];
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        this.logger.warn(`No time series data found for ${symbol}`);
        return [];
      }

      // Parse the data
      const bars: DailyBar[] = [];
      const fromTime = from.getTime();
      const toTime = to.getTime();

      for (const [dateStr, values] of Object.entries(timeSeries)) {
        const date = new Date(dateStr + 'T00:00:00Z');
        const dateTime = date.getTime();

        // Filter by date range
        if (dateTime < fromTime || dateTime > toTime) {
          continue;
        }

        const dayData = values as any;
        
        bars.push({
          symbol,
          market,
          date,
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          volume: parseInt(dayData['5. volume'], 10),
        });
      }

      // Sort by date ascending
      bars.sort((a, b) => a.date.getTime() - b.date.getTime());

      this.logger.log(`Fetched ${bars.length} bars for ${symbol} from Alpha Vantage`);
      return bars;
    } catch (error) {
      this.logger.error(`Failed to fetch data from Alpha Vantage for ${symbol}: ${error.message}`);
      return [];
    }
  }
}

