/**
 * Portfolio Contracts
 */

import { Market, Action } from './enums';

// ============================================================================
// Portfolio
// ============================================================================

export interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePortfolioInput {
  name: string;
  description?: string;
}

export interface UpdatePortfolioInput {
  name?: string;
  description?: string;
}

// ============================================================================
// Portfolio Position
// ============================================================================

export interface PortfolioPosition {
  id: string;
  portfolioId: string;
  symbol: string;
  market: Market;
  buyPrice: number;
  quantity?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePositionInput {
  symbol: string;
  market: Market;
  buyPrice: number;
  quantity?: number;
  notes?: string;
}

export interface UpdatePositionInput {
  symbol?: string;
  market?: Market;
  buyPrice?: number;
  quantity?: number;
  notes?: string;
}

// ============================================================================
// Portfolio Decision (Buy-Price Aware)
// ============================================================================

export interface PortfolioDecision {
  id: string;
  positionId: string;
  date: Date;
  buyPrice: number;
  currentPrice: number;
  suggestedStop: number;
  prevStop?: number | null;
  stopDistancePct?: number | null;
  action: Action;
  actionConfidence?: number | null;
  actionReasons?: Record<string, any> | null;
  featureId?: string | null;
  createdAt: Date;
}

// ============================================================================
// Stop Rules State
// ============================================================================

export interface StopRulesState {
  id: string;
  positionId: string;
  currentStop: number;
  lastMovedAt: Date;
  history?: Record<string, any> | null;
  updatedAt: Date;
}


