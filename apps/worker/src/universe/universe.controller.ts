import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UniverseService } from './universe.service';
import { AddSymbolDto, UpdateSymbolDto } from './dto';
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { AddSymbolSchema, UpdateSymbolSchema, Market } from '@stocks/shared';

/**
 * Universe Controller
 * REST endpoints for managing the symbol universe
 */
@Controller('universe')
export class UniverseController {
  private readonly logger = new Logger(UniverseController.name);

  constructor(private readonly universeService: UniverseService) {}

  /**
   * POST /universe/symbols
   * Add a new symbol to the universe
   */
  @Post('symbols')
  async addSymbol(@Body(new ZodValidationPipe(AddSymbolSchema)) dto: AddSymbolDto) {
    this.logger.log(`POST /universe/symbols - ${dto.symbol} (${dto.market})`);
    return this.universeService.addSymbol(dto);
  }

  /**
   * GET /universe/symbols
   * Get all symbols with optional filtering
   * Query params: market (TASE|US), isActive (true|false)
   */
  @Get('symbols')
  async getAllSymbols(
    @Query('market') market?: Market,
    @Query('isActive') isActive?: string,
  ) {
    this.logger.log(`GET /universe/symbols - market: ${market}, isActive: ${isActive}`);
    
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    
    return this.universeService.getAllSymbols(market, isActiveBool);
  }

  /**
   * GET /universe/symbols/:id
   * Get a single symbol by ID
   */
  @Get('symbols/:id')
  async getSymbolById(@Param('id') id: string) {
    this.logger.log(`GET /universe/symbols/${id}`);
    return this.universeService.getSymbolById(id);
  }

  /**
   * PUT /universe/symbols/:id
   * Update a symbol
   */
  @Put('symbols/:id')
  async updateSymbol(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSymbolSchema)) dto: UpdateSymbolDto,
  ) {
    this.logger.log(`PUT /universe/symbols/${id}`);
    return this.universeService.updateSymbol(id, dto);
  }

  /**
   * DELETE /universe/symbols/:id
   * Delete a symbol
   */
  @Delete('symbols/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSymbol(@Param('id') id: string) {
    this.logger.log(`DELETE /universe/symbols/${id}`);
    return this.universeService.deleteSymbol(id);
  }

  /**
   * GET /universe/stats
   * Get universe statistics
   */
  @Get('stats')
  async getStats() {
    this.logger.log('GET /universe/stats');
    return this.universeService.getSymbolCount();
  }

  /**
   * GET /universe/symbols/lookup/:symbol/:market
   * Lookup a symbol by symbol and market
   */
  @Get('symbols/lookup/:symbol/:market')
  async lookupSymbol(@Param('symbol') symbol: string, @Param('market') market: Market) {
    this.logger.log(`GET /universe/symbols/lookup/${symbol}/${market}`);
    return this.universeService.getSymbolBySymbolAndMarket(symbol, market);
  }
}

