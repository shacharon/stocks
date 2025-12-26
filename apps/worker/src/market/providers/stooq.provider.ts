import { Injectable, Logger } from '@nestjs/common';
import { MarketDataProvider, DailyBar, Market } from './market-data-provider.interface';
import { parse } from 'csv-parse/sync';

/**
 * Stooq Market Data Provider
 * Fetches US market data from stooq.com
 * 
 * API: https://stooq.com/q/d/l/?s={symbol}&d1={yyyymmdd}&d2={yyyymmdd}&i=d
 * 
 * CSV Format:
 * Date,Open,High,Low,Close,Volume
 * 2024-01-02,185.64,186.89,184.43,185.64,54000000
 */
@Injectable()
export class StooqProvider implements MarketDataProvider {
  private readonly logger = new Logger(StooqProvider.name);
  readonly name = 'stooq';
  readonly supportedMarkets: Market[] = ['US' as Market];
  private readonly baseUrl = 'https://stooq.com/q/d/l/';

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
      throw new Error(`Stooq provider does not support ${market} market`);
    }

    this.logger.log(`Fetching Stooq data for ${symbol} from ${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`);

    try {
      // Format dates as YYYYMMDD
      const fromStr = this.formatDate(from);
      const toStr = this.formatDate(to);

      // Build URL
      const url = `${this.baseUrl}?s=${symbol.toLowerCase()}.us&d1=${fromStr}&d2=${toStr}&i=d`;
      
      this.logger.debug(`Stooq URL: ${url}`);

      // Fetch CSV data
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Stooq API returned ${response.status}: ${response.statusText}`);
      }

      const csvContent = await response.text();

      // Check for error messages in response
      if (csvContent.includes('No data') || csvContent.includes('404')) {
        this.logger.warn(`No data found for ${symbol} on Stooq`);
        return [];
      }

      // Parse CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Transform to DailyBar format
      const bars: DailyBar[] = records
        .map((record: any) => {
          try {
            return {
              symbol: symbol.toUpperCase(),
              market,
              date: this.parseDate(record.Date),
              open: parseFloat(record.Open),
              high: parseFloat(record.High),
              low: parseFloat(record.Low),
              close: parseFloat(record.Close),
              volume: parseInt(record.Volume, 10),
            };
          } catch (error) {
            this.logger.warn(`Failed to parse record for ${symbol}: ${error.message}`);
            return null;
          }
        })
        .filter((bar): bar is DailyBar => bar !== null);

      this.logger.log(`Fetched ${bars.length} bars for ${symbol} from Stooq`);
      return bars;
    } catch (error) {
      this.logger.error(`Failed to fetch data from Stooq for ${symbol}: ${error.message}`);
      throw new Error(`Stooq fetch failed: ${error.message}`);
    }
  }

  /**
   * Format date as YYYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Parse date from YYYY-MM-DD format
   */
  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}

