import { Module } from '@nestjs/common';
import { UniverseController } from './universe.controller';
import { UniverseService } from './universe.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Universe Module
 * Manages the symbol universe (10-800 symbols)
 * 
 * Features:
 * - CRUD operations for symbols
 * - Market-specific filtering (TASE, US)
 * - Active/inactive symbol management
 * - Universe statistics
 */
@Module({
  imports: [PrismaModule],
  controllers: [UniverseController],
  providers: [UniverseService],
  exports: [UniverseService],
})
export class UniverseModule {}


