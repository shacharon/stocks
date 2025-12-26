import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Market } from '@stocks/shared';
import { AddSymbolDto, UpdateSymbolDto } from './dto';

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
}

