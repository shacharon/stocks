/**
 * @stocks/database - Prisma Client Export
 * 
 * Provides the Prisma database client for both web and worker applications.
 * 
 * Usage:
 *   import { prisma } from '@stocks/database';
 */

import { PrismaClient } from '@prisma/client';

// Global Prisma instance to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma types
export * from '@prisma/client';

