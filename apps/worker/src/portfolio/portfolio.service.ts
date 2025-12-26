import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto, UpdatePortfolioDto, AddPositionDto, UpdatePositionDto } from './dto';
import { Market } from '@stocks/shared';

/**
 * Portfolio Service
 * Manages portfolios and positions
 */
@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // Portfolio CRUD
  // ============================================================================

  /**
   * Create a new portfolio
   */
  async createPortfolio(dto: CreatePortfolioDto) {
    this.logger.log(`Creating portfolio: ${dto.name}`);

    const portfolio = await this.prisma.portfolio.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    this.logger.log(`Portfolio created: ${portfolio.id}`);
    return portfolio;
  }

  /**
   * Get all portfolios
   */
  async getAllPortfolios() {
    this.logger.log('Fetching all portfolios');

    const portfolios = await this.prisma.portfolio.findMany({
      include: {
        _count: {
          select: { positions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Found ${portfolios.length} portfolios`);
    return portfolios;
  }

  /**
   * Get a single portfolio by ID
   */
  async getPortfolioById(id: string): Promise<any> {
    this.logger.log(`Fetching portfolio: ${id}`);

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { positions: true },
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    return portfolio;
  }

  /**
   * Update a portfolio
   */
  async updatePortfolio(id: string, dto: UpdatePortfolioDto) {
    this.logger.log(`Updating portfolio: ${id}`);

    // Check if exists
    await this.getPortfolioById(id);

    const portfolio = await this.prisma.portfolio.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    this.logger.log(`Portfolio updated: ${id}`);
    return portfolio;
  }

  /**
   * Delete a portfolio
   */
  async deletePortfolio(id: string) {
    this.logger.log(`Deleting portfolio: ${id}`);

    // Check if exists
    await this.getPortfolioById(id);

    // Delete all positions first (cascade)
    await this.prisma.portfolioPosition.deleteMany({
      where: { portfolioId: id },
    });

    // Delete portfolio
    await this.prisma.portfolio.delete({
      where: { id },
    });

    this.logger.log(`Portfolio deleted: ${id}`);
    return { id, deleted: true };
  }

  // ============================================================================
  // Position Management
  // ============================================================================

  /**
   * Add a position to a portfolio
   */
  async addPosition(portfolioId: string, dto: AddPositionDto): Promise<any> {
    this.logger.log(`Adding position to portfolio ${portfolioId}: ${dto.symbol} (${dto.market})`);

    // Validate portfolio exists
    await this.getPortfolioById(portfolioId);

    // Validate buy price
    if (dto.buyPrice <= 0) {
      throw new BadRequestException('Buy price must be greater than 0');
    }

    // Validate quantity
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Validate symbol exists in universe
    const symbol = await this.prisma.symbolUniverse.findUnique({
      where: {
        symbol_market: {
          symbol: dto.symbol,
          market: dto.market as Market,
        },
      },
    });

    if (!symbol) {
      throw new BadRequestException(
        `Symbol ${dto.symbol} (${dto.market}) not found in universe. Add it first.`,
      );
    }

    // Create position
    const position = await this.prisma.portfolioPosition.create({
      data: {
        portfolioId,
        symbol: dto.symbol,
        market: dto.market as Market,
        buyPrice: dto.buyPrice,
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.notes && { notes: dto.notes }),
      },
    });

    this.logger.log(`Position added: ${position.id}`);
    return position;
  }

  /**
   * Get all positions for a portfolio
   */
  async getPositions(portfolioId: string): Promise<any> {
    this.logger.log(`Fetching positions for portfolio ${portfolioId}`);

    // Validate portfolio exists
    await this.getPortfolioById(portfolioId);

    const positions = await this.prisma.portfolioPosition.findMany({
      where: {
        portfolioId,
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Found ${positions.length} positions`);
    return positions;
  }

  /**
   * Get a single position
   */
  async getPositionById(portfolioId: string, positionId: string): Promise<any> {
    this.logger.log(`Fetching position: ${positionId}`);

    const position = await this.prisma.portfolioPosition.findUnique({
      where: { id: positionId },
    });

    if (!position) {
      throw new NotFoundException(`Position with ID ${positionId} not found`);
    }

    if (position.portfolioId !== portfolioId) {
      throw new BadRequestException('Position does not belong to this portfolio');
    }

    return position;
  }

  /**
   * Update a position
   */
  async updatePosition(portfolioId: string, positionId: string, dto: UpdatePositionDto): Promise<any> {
    this.logger.log(`Updating position: ${positionId}`);

    // Validate position exists and belongs to portfolio
    await this.getPositionById(portfolioId, positionId);

    // Validate buy price if provided
    if (dto.buyPrice !== undefined && dto.buyPrice <= 0) {
      throw new BadRequestException('Buy price must be greater than 0');
    }

    // Validate quantity if provided
    if (dto.quantity !== undefined && dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const position = await this.prisma.portfolioPosition.update({
      where: { id: positionId },
      data: {
        ...(dto.buyPrice !== undefined && { buyPrice: dto.buyPrice }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    this.logger.log(`Position updated: ${positionId}`);
    return position;
  }

  /**
   * Delete a position
   */
  async deletePosition(portfolioId: string, positionId: string) {
    this.logger.log(`Deleting position: ${positionId}`);

    // Validate position exists and belongs to portfolio
    await this.getPositionById(portfolioId, positionId);

    await this.prisma.portfolioPosition.delete({
      where: { id: positionId },
    });

    this.logger.log(`Position deleted: ${positionId}`);
    return { id: positionId, deleted: true };
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(portfolioId: string) {
    this.logger.log(`Fetching stats for portfolio: ${portfolioId}`);

    // Validate portfolio exists
    const portfolio = await this.getPortfolioById(portfolioId);

    const [totalPositions, markets] = await Promise.all([
      this.prisma.portfolioPosition.count({ where: { portfolioId } }),
      this.prisma.portfolioPosition.groupBy({
        by: ['market'],
        where: { portfolioId },
        _count: true,
      }),
    ]);

    return {
      portfolioId,
      portfolioName: portfolio.name,
      totalPositions,
      byMarket: markets.reduce((acc, m) => {
        acc[m.market] = m._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

