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
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto, UpdatePortfolioDto, AddPositionDto, UpdatePositionDto } from './dto';

/**
 * Portfolio Controller
 * REST endpoints for portfolio and position management
 */
@Controller('portfolios')
export class PortfolioController {
  private readonly logger = new Logger(PortfolioController.name);

  constructor(private readonly portfolioService: PortfolioService) {}

  // ============================================================================
  // Portfolio Endpoints
  // ============================================================================

  /**
   * POST /portfolios
   * Create a new portfolio
   */
  @Post()
  async createPortfolio(@Body() dto: CreatePortfolioDto) {
    this.logger.log(`POST /portfolios - ${dto.name}`);
    return this.portfolioService.createPortfolio(dto);
  }

  /**
   * GET /portfolios
   * Get all portfolios
   */
  @Get()
  async getAllPortfolios() {
    this.logger.log('GET /portfolios');
    return this.portfolioService.getAllPortfolios();
  }

  /**
   * GET /portfolios/:id
   * Get a single portfolio by ID
   */
  @Get(':id')
  async getPortfolioById(@Param('id') id: string): Promise<any> {
    this.logger.log(`GET /portfolios/${id}`);
    return this.portfolioService.getPortfolioById(id);
  }

  /**
   * PUT /portfolios/:id
   * Update a portfolio
   */
  @Put(':id')
  async updatePortfolio(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    this.logger.log(`PUT /portfolios/${id}`);
    return this.portfolioService.updatePortfolio(id, dto);
  }

  /**
   * DELETE /portfolios/:id
   * Delete a portfolio
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePortfolio(@Param('id') id: string) {
    this.logger.log(`DELETE /portfolios/${id}`);
    return this.portfolioService.deletePortfolio(id);
  }

  /**
   * GET /portfolios/:id/stats
   * Get portfolio statistics
   */
  @Get(':id/stats')
  async getPortfolioStats(@Param('id') id: string) {
    this.logger.log(`GET /portfolios/${id}/stats`);
    return this.portfolioService.getPortfolioStats(id);
  }

  // ============================================================================
  // Position Endpoints
  // ============================================================================

  /**
   * POST /portfolios/:id/positions
   * Add a position to a portfolio
   */
  @Post(':id/positions')
  async addPosition(@Param('id') portfolioId: string, @Body() dto: AddPositionDto): Promise<any> {
    this.logger.log(`POST /portfolios/${portfolioId}/positions - ${dto.symbol}`);
    return this.portfolioService.addPosition(portfolioId, dto);
  }

  /**
   * GET /portfolios/:id/positions
   * Get all positions for a portfolio
   */
  @Get(':id/positions')
  async getPositions(@Param('id') portfolioId: string): Promise<any> {
    this.logger.log(`GET /portfolios/${portfolioId}/positions`);
    return this.portfolioService.getPositions(portfolioId);
  }

  /**
   * GET /portfolios/:id/positions/:posId
   * Get a single position
   */
  @Get(':id/positions/:posId')
  async getPositionById(
    @Param('id') portfolioId: string,
    @Param('posId') positionId: string,
  ): Promise<any> {
    this.logger.log(`GET /portfolios/${portfolioId}/positions/${positionId}`);
    return this.portfolioService.getPositionById(portfolioId, positionId);
  }

  /**
   * PUT /portfolios/:id/positions/:posId
   * Update a position
   */
  @Put(':id/positions/:posId')
  async updatePosition(
    @Param('id') portfolioId: string,
    @Param('posId') positionId: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<any> {
    this.logger.log(`PUT /portfolios/${portfolioId}/positions/${positionId}`);
    return this.portfolioService.updatePosition(portfolioId, positionId, dto);
  }

  /**
   * DELETE /portfolios/:id/positions/:posId
   * Delete a position
   */
  @Delete(':id/positions/:posId')
  @HttpCode(HttpStatus.OK)
  async deletePosition(
    @Param('id') portfolioId: string,
    @Param('posId') positionId: string,
  ) {
    this.logger.log(`DELETE /portfolios/${portfolioId}/positions/${positionId}`);
    return this.portfolioService.deletePosition(portfolioId, positionId);
  }
}

