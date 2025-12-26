/**
 * Universe Management Contracts
 */

import { Market } from './enums';

// ============================================================================
// Symbol Universe
// ============================================================================

export interface SymbolUniverse {
  id: string;
  symbol: string;
  market: Market;
  isActive: boolean;
  addedAt: Date;
  lastUpdated: Date;
}

export interface AddSymbolInput {
  symbol: string;
  market: Market;
}

export interface UpdateSymbolInput {
  isActive?: boolean;
}

export interface ImportSymbolsInput {
  symbols: Array<{
    symbol: string;
    market: Market;
  }>;
}

export interface ImportResult {
  added: number;
  skipped: number;
  errors: Array<{
    symbol: string;
    error: string;
  }>;
}

// ============================================================================
// Symbol Sector Map
// ============================================================================

export interface SymbolSectorMap {
  id: string;
  symbol: string;
  sector: string;
  industry?: string | null;
  lastUpdated: Date;
}

export interface UpdateSectorInput {
  sector: string;
  industry?: string;
}

export interface BulkSectorImportInput {
  mappings: Array<{
    symbol: string;
    sector: string;
    industry?: string;
  }>;
}



