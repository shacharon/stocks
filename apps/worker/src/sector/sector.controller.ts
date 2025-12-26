import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseEnumPipe,
  Logger,
} from '@nestjs/common';
import { SectorService } from './sector.service';
import { Market } from '@stocks/shared';
import { UpdateSectorDto, BulkSectorImportDto } from './dto';

@Controller('sectors')
export class SectorController {
  private readonly logger = new Logger(SectorController.name);

  constructor(private sectorService: SectorService) {}

  /**
   * Assign sector to a symbol
   * POST /sectors/assign
   */
  @Post('assign')
  async assignSector(
    @Body() body: { symbolId: string; sector: string }
  ): Promise<any> {
    this.logger.log(`Assigning sector "${body.sector}" to symbol ${body.symbolId}`);
    return this.sectorService.assignSector(body.symbolId, body.sector);
  }

  /**
   * Get sector for a symbol
   * GET /sectors/symbol/:symbolId
   */
  @Get('symbol/:symbolId')
  async getSectorForSymbol(@Param('symbolId') symbolId: string): Promise<any> {
    this.logger.log(`Getting sector for symbol ${symbolId}`);
    return this.sectorService.getSectorForSymbol(symbolId);
  }

  /**
   * Get all sector mappings
   * GET /sectors/mappings?sector=Technology
   */
  @Get('mappings')
  async getAllSectorMappings(@Query('sector') sector?: string): Promise<any> {
    this.logger.log(`Getting all sector mappings${sector ? ` for sector: ${sector}` : ''}`);
    return this.sectorService.getAllSectorMappings(sector);
  }

  /**
   * Bulk import sector mappings
   * POST /sectors/import
   */
  @Post('import')
  async bulkImportSectors(
    @Body() body: { mappings: Array<{ symbolId: string; sector: string }> }
  ): Promise<any> {
    this.logger.log(`Bulk importing ${body.mappings.length} sector mappings`);
    return this.sectorService.bulkImportSectors(body.mappings);
  }

  /**
   * Delete sector mapping
   * DELETE /sectors/symbol/:symbolId
   */
  @Delete('symbol/:symbolId')
  async deleteSectorMapping(@Param('symbolId') symbolId: string): Promise<any> {
    this.logger.log(`Deleting sector mapping for symbol ${symbolId}`);
    await this.sectorService.deleteSectorMapping(symbolId);
    return { message: 'Sector mapping deleted successfully' };
  }

  /**
   * Get sector statistics
   * GET /sectors/stats
   */
  @Get('stats')
  async getSectorStats(): Promise<any> {
    this.logger.log('Getting sector statistics');
    return this.sectorService.getSectorStats();
  }

  /**
   * Calculate sector strength for a date
   * POST /sectors/strength
   */
  @Post('strength')
  async calculateSectorStrength(
    @Body() body: { date: string; market?: Market }
  ): Promise<any> {
    const date = new Date(body.date);
    this.logger.log(
      `Calculating sector strength for ${body.date}${body.market ? ` (${body.market})` : ''}`
    );

    const strengths = await this.sectorService.calculateSectorStrength(date, body.market);

    return {
      date: body.date,
      market: body.market || 'ALL',
      sectors: strengths,
      count: strengths.length,
    };
  }

  /**
   * Get daily sector list
   * GET /sectors/daily/:date?market=US&top=5
   */
  @Get('daily/:date')
  async getDailySectorList(
    @Param('date') dateStr: string,
    @Query('market') market?: Market,
    @Query('top') topStr?: string
  ): Promise<any> {
    const date = new Date(dateStr);
    const top = topStr ? parseInt(topStr, 10) : undefined;

    this.logger.log(
      `Getting daily sector list for ${dateStr}${market ? ` (${market})` : ''}${top ? ` (top ${top})` : ''}`
    );

    const sectorList = await this.sectorService.getDailySectorList(date, market, top);

    return {
      date: dateStr,
      market: market || 'ALL',
      top: top || 'ALL',
      count: sectorList.length,
      sectors: sectorList,
    };
  }

  /**
   * Get sector list statistics
   * GET /sectors/lists/stats
   */
  @Get('lists/stats')
  async getSectorListStats(): Promise<any> {
    this.logger.log('Getting sector list statistics');
    return this.sectorService.getSectorListStats();
  }
}

