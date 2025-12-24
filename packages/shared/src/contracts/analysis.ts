/**
 * Analysis Contracts
 */

import { Market, Action } from './enums';

// ============================================================================
// Daily Symbol Features (Portfolio-Neutral)
// ============================================================================

export interface DailySymbolFeatures {
  id: string;
  symbol: string;
  market: Market;
  date: Date;
  closePrice: number;
  
  // Indicators
  sma20?: number | null;
  sma50?: number | null;
  rsi14?: number | null;
  atr14?: number | null;
  volumeAvg20?: bigint | null;
  
  // Levels
  supportLevels?: SupportResistanceLevel[] | null;
  resistanceLevels?: SupportResistanceLevel[] | null;
  
  // Regime
  trend?: string | null;
  volatilityState?: string | null;
  
  // Metadata
  engineVersion: string;
  confidence?: number | null;
  reasons?: string[] | null;
  
  createdAt: Date;
}

export interface SupportResistanceLevel {
  price: number;
  strength: number;
  touches: number;
  lastTouchedAt?: Date;
}

// ============================================================================
// Indicators
// ============================================================================

export interface Indicators {
  sma20?: number;
  sma50?: number;
  rsi14?: number;
  atr14?: number;
  volumeAvg20?: number;
}

export interface IndicatorInput {
  bars: Array<{
    close: number;
    high: number;
    low: number;
    volume: number;
  }>;
}

// ============================================================================
// Levels Detection
// ============================================================================

export interface LevelsResult {
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
}

// ============================================================================
// Stop-Loss Calculation
// ============================================================================

export interface StopCalculationInput {
  buyPrice: number;
  prevStop?: number;
  currentPrice: number;
  atr?: number;
  supports: SupportResistanceLevel[];
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
}

export interface StopCalculationResult {
  suggestedStop: number;
  reason: string;
  confidence: number;
  candidates: Array<{
    price: number;
    reason: string;
    score: number;
  }>;
}

// ============================================================================
// Decision Engine
// ============================================================================

export interface DecisionContext {
  symbol: string;
  market: Market;
  buyPrice: number;
  currentPrice: number;
  prevStop?: number;
  suggestedStop: number;
  indicators: Indicators;
  levels: LevelsResult;
  trend?: string;
  volatilityState?: string;
}

export interface DecisionResult {
  action: Action;
  confidence: number;
  reasons: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Analysis Run
// ============================================================================

export interface AnalysisRunInput {
  portfolioId?: string;
  date: Date;
  symbols?: string[];
}

export interface AnalysisRunResult {
  runId: string;
  date: Date;
  symbolsAnalyzed: number;
  actionBreakdown: {
    [Action.HOLD]: number;
    [Action.MOVE_STOP]: number;
    [Action.REDUCE]: number;
    [Action.EXIT]: number;
  };
  duration: number;
  errors: string[];
}

// ============================================================================
// Sector Analysis
// ============================================================================

export interface DailySectorList {
  id: string;
  date: Date;
  sector: string;
  symbolList: SectorRanking[];
  rankingCriteria?: Record<string, any> | null;
  createdAt: Date;
}

export interface SectorRanking {
  symbol: string;
  rank: number;
  score: number;
  metrics?: Record<string, number>;
}

// ============================================================================
// Deep Dive Report
// ============================================================================

export interface DeepDiveReport {
  id: string;
  symbol: string;
  market: Market;
  date: Date;
  reportData: DeepDiveData;
  createdAt: Date;
}

export interface DeepDiveData {
  summary: string;
  multiTimeframeAnalysis?: Record<string, any>;
  volumeProfile?: Record<string, any>;
  patternRecognition?: Record<string, any>;
  sectorCorrelation?: Record<string, any>;
  riskAssessment?: Record<string, any>;
}

// ============================================================================
// Change Detection
// ============================================================================

export interface DailyDelta {
  id: string;
  symbol: string;
  market: Market;
  date: Date;
  changeType: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  materialityScore?: number | null;
  createdAt: Date;
}

export interface ChangeDigest {
  date: Date;
  totalChanges: number;
  materialChanges: DailyDelta[];
  changesByType: Record<string, number>;
}


