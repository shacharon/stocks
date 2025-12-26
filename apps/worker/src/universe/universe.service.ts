import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Market } from '@stocks/shared';
import { AddSymbolDto, UpdateSymbolDto, ImportSymbolsDto, ImportResult } from './dto';
import { parse } from 'csv-parse/sync';

/**
 * Universe Service
 * Manages the symbol universe (10-800 symbols across TASE and US markets)
 */
@Injectable()
export class UniverseService {
  private readonly logger = new Logger(UniverseService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Add a new symbol to the universe
   */
  async addSymbol(dto: AddSymbolDto) {
    this.logger.log(`Adding symbol: ${dto.symbol} (${dto.market})`);

    // Check if symbol already exists
    const existing = await this.prisma.symbolUniverse.findUnique({
      where: {
        symbol_market: {
          symbol: dto.symbol,
          market: dto.market as Market,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Symbol ${dto.symbol} already exists in ${dto.market} market`,
      );
    }

    // Create new symbol
    const symbol = await this.prisma.symbolUniverse.create({
      data: {
        symbol: dto.symbol,
        market: dto.market as Market,
        isActive: true,
      },
    });

    this.logger.log(`Symbol added: ${symbol.id}`);
    return symbol;
  }

  /**
   * Get all symbols with optional filtering
   */
  async getAllSymbols(market?: Market, isActive?: boolean) {
    this.logger.log(`Fetching symbols - market: ${market}, isActive: ${isActive}`);

    const symbols = await this.prisma.symbolUniverse.findMany({
      where: {
        ...(market && { market }),
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: [{ market: 'asc' }, { symbol: 'asc' }],
    });

    this.logger.log(`Found ${symbols.length} symbols`);
    return symbols;
  }

  /**
   * Get a single symbol by ID
   */
  async getSymbolById(id: string) {
    this.logger.log(`Fetching symbol by ID: ${id}`);

    const symbol = await this.prisma.symbolUniverse.findUnique({
      where: { id },
    });

    if (!symbol) {
      throw new NotFoundException(`Symbol with ID ${id} not found`);
    }

    return symbol;
  }

  /**
   * Get a symbol by symbol and market
   */
  async getSymbolBySymbolAndMarket(symbol: string, market: Market) {
    this.logger.log(`Fetching symbol: ${symbol} (${market})`);

    const result = await this.prisma.symbolUniverse.findUnique({
      where: {
        symbol_market: {
          symbol,
          market,
        },
      },
    });

    if (!result) {
      throw new NotFoundException(`Symbol ${symbol} not found in ${market} market`);
    }

    return result;
  }

  /**
   * Update a symbol
   */
  async updateSymbol(id: string, dto: UpdateSymbolDto) {
    this.logger.log(`Updating symbol: ${id}`);

    // Check if symbol exists
    await this.getSymbolById(id);

    // Update symbol
    const symbol = await this.prisma.symbolUniverse.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Symbol updated: ${id}`);
    return symbol;
  }

  /**
   * Delete a symbol
   */
  async deleteSymbol(id: string) {
    this.logger.log(`Deleting symbol: ${id}`);

    // Check if symbol exists
    await this.getSymbolById(id);

    // Delete symbol
    await this.prisma.symbolUniverse.delete({
      where: { id },
    });

    this.logger.log(`Symbol deleted: ${id}`);
    return { id, deleted: true };
  }

  /**
   * Get symbol count by market
   */
  async getSymbolCount() {
    const [total, taseCount, usCount, activeCount] = await Promise.all([
      this.prisma.symbolUniverse.count(),
      this.prisma.symbolUniverse.count({ where: { market: 'TASE' } }),
      this.prisma.symbolUniverse.count({ where: { market: 'US' } }),
      this.prisma.symbolUniverse.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      byMarket: {
        TASE: taseCount,
        US: usCount,
      },
      active: activeCount,
      inactive: total - activeCount,
    };
  }

  /**
   * Bulk import symbols from JSON array
   * Skips duplicates, reports errors
   */
  async bulkImport(dto: ImportSymbolsDto): Promise<ImportResult> {
    const startTime = Date.now();
    this.logger.log(`Starting bulk import of ${dto.symbols.length} symbols`);

    const result: ImportResult = {
      total: dto.symbols.length,
      added: 0,
      skipped: 0,
      errors: [],
      duration: 0,
    };

    // Process each symbol
    for (const symbolData of dto.symbols) {
      try {
        // Check if symbol already exists
        const existing = await this.prisma.symbolUniverse.findUnique({
          where: {
            symbol_market: {
              symbol: symbolData.symbol,
              market: symbolData.market as Market,
            },
          },
        });

        if (existing) {
          result.skipped++;
          this.logger.debug(`Skipped duplicate: ${symbolData.symbol} (${symbolData.market})`);
          continue;
        }

        // Create new symbol
        await this.prisma.symbolUniverse.create({
          data: {
            symbol: symbolData.symbol,
            market: symbolData.market as Market,
            isActive: true,
          },
        });

        result.added++;
      } catch (error) {
        result.errors.push({
          symbol: symbolData.symbol,
          market: symbolData.market,
          error: error.message || 'Unknown error',
        });
        this.logger.error(`Failed to import ${symbolData.symbol}: ${error.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    this.logger.log(
      `Bulk import complete: ${result.added} added, ${result.skipped} skipped, ${result.errors.length} errors (${result.duration}ms)`,
    );

    return result;
  }

  /**
   * Import symbols from CSV content
   * Expected format: symbol,market
   * Example:
   *   AAPL,US
   *   MSFT,US
   *   TEVA,TASE
   */
  async importFromCsv(csvContent: string): Promise<ImportResult> {
    this.logger.log('Parsing CSV content');

    try {
      // Parse CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      // Validate and transform records
      const symbols = records.map((record: any) => {
        if (!record.symbol || !record.market) {
          throw new Error(`Invalid CSV format: missing symbol or market in row`);
        }

        const symbol = record.symbol.toUpperCase().trim();
        const market = record.market.toUpperCase().trim();

        if (market !== 'US' && market !== 'TASE') {
          throw new Error(`Invalid market: ${market}. Must be US or TASE`);
        }

        return { symbol, market };
      });

      this.logger.log(`Parsed ${symbols.length} symbols from CSV`);

      // Use bulk import
      return this.bulkImport({ symbols });
    } catch (error) {
      this.logger.error(`CSV parsing failed: ${error.message}`);
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }
}

