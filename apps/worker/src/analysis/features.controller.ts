import { Controller, Get, Param, Query, ParseEnumPipe, Logger } from '@nestjs/common';
import { FeatureFactoryService } from './feature-factory.service';
import { Market } from '@stocks/shared';

@Controller('features')
export class FeaturesController {
  private readonly logger = new Logger(FeaturesController.name);

  constructor(private featureFactory: FeatureFactoryService) {}

  /**
   * Serialize response, converting BigInt to string for JSON compatibility
   */
  private serializeResponse(data: any): any {
    return JSON.parse(JSON.stringify(data, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
  }

  /**
   * Get features for a specific symbol on a specific date
   * GET /features/:symbol/:market/:date
   */
  @Get(':symbol/:market/:date')
  async getFeatures(
    @Param('symbol') symbol: string,
    @Param('market', new ParseEnumPipe(Market)) market: Market,
    @Param('date') dateStr: string,
  ): Promise<any> {
    const date = new Date(dateStr);
    this.logger.log(`Getting features for ${symbol} (${market}) on ${dateStr}`);
    
    const features = await this.featureFactory.getFeatures(symbol, market, date);
    
    if (!features) {
      return {
        error: 'No features found for this symbol and date',
        symbol,
        market,
        date: dateStr,
      };
    }
    
    return this.serializeResponse(features);
  }

  /**
   * Get feature history for a symbol
   * GET /features/:symbol/:market/history?start=YYYY-MM-DD&end=YYYY-MM-DD
   */
  @Get(':symbol/:market/history')
  async getFeaturesHistory(
    @Param('symbol') symbol: string,
    @Param('market', new ParseEnumPipe(Market)) market: Market,
    @Query('start') startStr: string,
    @Query('end') endStr: string,
  ): Promise<any> {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    this.logger.log(
      `Getting feature history for ${symbol} (${market}) from ${startStr} to ${endStr}`
    );
    
    const history = await this.featureFactory.getFeaturesHistory(symbol, market, startDate, endDate);
    
    return this.serializeResponse({
      symbol,
      market,
      startDate: startStr,
      endDate: endStr,
      count: history.length,
      features: history,
    });
  }

  /**
   * Get feature statistics
   * GET /features/stats
   */
  @Get('stats')
  async getStats(): Promise<any> {
    this.logger.log('Getting feature statistics');
    const stats = await this.featureFactory.getFeatureStats();
    return this.serializeResponse(stats);
  }
}


