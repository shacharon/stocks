import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS for local development
  app.enableCors();

  // Get port from environment or default to 3001
  const port = process.env.WORKER_PORT || 3001;

  // Start server
  await app.listen(port);

  logger.log(`🚀 Worker service is running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start worker service:', error);
  process.exit(1);
});

