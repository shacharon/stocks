/**
 * Market Data Contracts
 */

import { Market } from './enums';

// ============================================================================
// Market Daily Bar
// ============================================================================

export interface MarketDailyBar {
  id: string;
  symbol: string;
  market: Market;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: bigint;
  source: string;
  fetchedAt: Date;
}

export interface DailyBar {
  symbol: string;
  market: Market;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================================
// Market Data Provider Interface
// ============================================================================

export interface MarketDataProvider {
  /**
   * Fetch daily bars for a symbol between two dates
   */
  getDailyBars(
    symbol: string,
    market: Market,
    from: Date,
    to: Date
  ): Promise<DailyBar[]>;
}

// ============================================================================
// Market Sync Result
// ============================================================================

export interface SyncResult {
  symbol: string;
  market: Market;
  barsCount: number;
  source: string;
  success: boolean;
  error?: string;
}

export interface SyncSummary {
  totalSymbols: number;
  successCount: number;
  failureCount: number;
  details: SyncResult[];
  startedAt: Date;
  completedAt: Date;
}



