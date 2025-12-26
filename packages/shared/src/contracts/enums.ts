/**
 * Shared Enums
 * Match Prisma schema enums exactly
 */

export enum Market {
  US = 'US',
  TASE = 'TASE',
}

export enum Action {
  HOLD = 'HOLD',
  MOVE_STOP = 'MOVE_STOP',
  REDUCE = 'REDUCE',
  EXIT = 'EXIT',
}

export enum PipelineStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum JobType {
  MARKET_SYNC = 'MARKET_SYNC',
  FEATURE_FACTORY = 'FEATURE_FACTORY',
  SECTOR_SELECTOR = 'SECTOR_SELECTOR',
  CHANGE_DETECTOR = 'CHANGE_DETECTOR',
  DEEP_DIVE = 'DEEP_DIVE',
}

// Helper type for enum values
export type MarketType = `${Market}`;
export type ActionType = `${Action}`;
export type PipelineStatusType = `${PipelineStatus}`;
export type JobStatusType = `${JobStatus}`;
export type JobTypeType = `${JobType}`;




