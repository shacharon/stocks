// API Client for Worker Service
const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';

export interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
}

export interface MarketStats {
  totalBars: number;
  totalSymbols: number;
  oldestBar: string;
  newestBar: string;
  marketCoverage: Record<string, number>;
}

export interface UniverseStats {
  total: number;
  byMarket: Record<string, number>;
}

export interface TechnicalFeatures {
  id: string;
  symbol: string;
  market: string;
  date: string;
  closePrice: string;
  volume: string;
  sma20: string | null;
  sma50: string | null;
  sma200: string | null;
  ema12: string | null;
  ema26: string | null;
  rsi14: string | null;
  macd: string | null;
  macdSignal: string | null;
  macdHistogram: string | null;
  atr14: string | null;
  bbUpper: string | null;
  bbMiddle: string | null;
  bbLower: string | null;
  volumeSma20: string | null;
  volumeRatio: string | null;
  engineVersion: string;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbolId: string;
  buyPrice: string;
  quantity: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${WORKER_API_URL}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function getMarketStats(): Promise<MarketStats> {
  const res = await fetch(`${WORKER_API_URL}/market/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch market stats');
  return res.json();
}

export async function getUniverseStats(): Promise<UniverseStats> {
  const res = await fetch(`${WORKER_API_URL}/universe/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch universe stats');
  return res.json();
}

export async function getSymbols() {
  const res = await fetch(`${WORKER_API_URL}/universe/symbols`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch symbols');
  return res.json();
}

export async function getFeatures(
  symbol: string,
  market: string,
  date: string
): Promise<TechnicalFeatures> {
  const res = await fetch(
    `${WORKER_API_URL}/features/${symbol}/${market}/${date}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch features');
  return res.json();
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const res = await fetch(`${WORKER_API_URL}/portfolios`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch portfolios');
  return res.json();
}

export async function getPortfolio(id: string): Promise<Portfolio> {
  const res = await fetch(`${WORKER_API_URL}/portfolios/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}

export async function getPortfolioPositions(portfolioId: string): Promise<Position[]> {
  const res = await fetch(
    `${WORKER_API_URL}/portfolios/${portfolioId}/positions`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch positions');
  return res.json();
}

export async function getPortfolioStats(portfolioId: string) {
  const res = await fetch(
    `${WORKER_API_URL}/portfolios/${portfolioId}/stats`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('Failed to fetch portfolio stats');
  return res.json();
}

