/**
 * @stocks/shared - Shared TypeScript contracts and schemas
 * 
 * This package contains:
 * - TypeScript interfaces and types
 * - Zod validation schemas
 * - Enums and constants
 * 
 * Used by both web and worker applications for type safety.
 */

export const SHARED_VERSION = '0.1.0';

// ============================================================================
// Enums
// ============================================================================
export * from './contracts/enums';

// ============================================================================
// Contracts
// ============================================================================
export * from './contracts/portfolio';
export * from './contracts/market';
export * from './contracts/analysis';
export * from './contracts/jobs';
export * from './contracts/universe';

// ============================================================================
// Validation Schemas
// ============================================================================
export * from './schemas/portfolio.schema';
export * from './schemas/universe.schema';
export * from './schemas/analysis.schema';

// ============================================================================
// Numeric Utilities
// ============================================================================
export * from './numeric';
export type { Numeric } from './numeric';

