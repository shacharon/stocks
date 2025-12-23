import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    // Basic health check
    const basicHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'worker',
    };

    // Check database connectivity (optional detail)
    try {
      const dbHealthy = await this.prisma.isHealthy();
      return {
        ...basicHealth,
        database: dbHealthy ? 'connected' : 'disconnected',
      };
    } catch (error) {
      return {
        ...basicHealth,
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

