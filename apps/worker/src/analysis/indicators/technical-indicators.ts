/**
 * Technical Indicators
 * Pure functions for calculating technical indicators
 * All functions are deterministic and stateless
 */

export interface Bar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalFeatures {
  // Price-based indicators
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
  ema_12: number | null;
  ema_26: number | null;
  
  // Momentum indicators
  rsi_14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  
  // Volatility indicators
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  atr_14: number | null;
  
  // Volume indicators
  volume_sma_20: number | null;
  volume_ratio: number | null;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number, previousEMA?: number): number | null {
  if (prices.length < period && !previousEMA) return null;
  
  const currentPrice = prices[prices.length - 1];
  
  // If no previous EMA, use SMA as starting point
  if (!previousEMA) {
    return calculateSMA(prices, period);
  }
  
  const multiplier = 2 / (period + 1);
  return (currentPrice - previousEMA) * multiplier + previousEMA;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0);
  const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  previousFastEMA?: number,
  previousSlowEMA?: number,
  previousSignalEMA?: number
): { macd: number | null; signal: number | null; histogram: number | null } {
  if (prices.length < slowPeriod) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const fastEMA = calculateEMA(prices, fastPeriod, previousFastEMA);
  const slowEMA = calculateEMA(prices, slowPeriod, previousSlowEMA);
  
  if (!fastEMA || !slowEMA) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const macd = fastEMA - slowEMA;
  
  // For signal line, we'd need historical MACD values
  // Simplified: just return MACD for now
  const signal = previousSignalEMA || null;
  const histogram = signal ? macd - signal : null;
  
  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number | null; middle: number | null; lower: number | null } {
  if (prices.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  const middle = calculateSMA(prices, period);
  if (!middle) {
    return { upper: null, middle: null, lower: null };
  }
  
  const recentPrices = prices.slice(-period);
  const squaredDiffs = recentPrices.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: middle + (stdDev * stdDevMultiplier),
    middle,
    lower: middle - (stdDev * stdDevMultiplier),
  };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(bars: Bar[], period: number = 14): number | null {
  if (bars.length < period + 1) return null;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate all technical features for a symbol
 */
export function calculateFeatures(bars: Bar[]): TechnicalFeatures {
  if (bars.length === 0) {
    return {
      sma_20: null,
      sma_50: null,
      sma_200: null,
      ema_12: null,
      ema_26: null,
      rsi_14: null,
      macd: null,
      macd_signal: null,
      macd_histogram: null,
      bb_upper: null,
      bb_middle: null,
      bb_lower: null,
      atr_14: null,
      volume_sma_20: null,
      volume_ratio: null,
    };
  }
  
  const closes = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);
  
  // Price-based indicators
  const sma_20 = calculateSMA(closes, 20);
  const sma_50 = calculateSMA(closes, 50);
  const sma_200 = calculateSMA(closes, 200);
  const ema_12 = calculateEMA(closes, 12);
  const ema_26 = calculateEMA(closes, 26);
  
  // Momentum indicators
  const rsi_14 = calculateRSI(closes, 14);
  const macdData = calculateMACD(closes);
  
  // Volatility indicators
  const bb = calculateBollingerBands(closes, 20, 2);
  const atr_14 = calculateATR(bars, 14);
  
  // Volume indicators
  const volume_sma_20 = calculateSMA(volumes, 20);
  const currentVolume = volumes[volumes.length - 1];
  const volume_ratio = volume_sma_20 ? currentVolume / volume_sma_20 : null;
  
  return {
    sma_20: sma_20 ? Math.round(sma_20 * 100) / 100 : null,
    sma_50: sma_50 ? Math.round(sma_50 * 100) / 100 : null,
    sma_200: sma_200 ? Math.round(sma_200 * 100) / 100 : null,
    ema_12: ema_12 ? Math.round(ema_12 * 100) / 100 : null,
    ema_26: ema_26 ? Math.round(ema_26 * 100) / 100 : null,
    rsi_14: rsi_14 ? Math.round(rsi_14 * 100) / 100 : null,
    macd: macdData.macd ? Math.round(macdData.macd * 100) / 100 : null,
    macd_signal: macdData.signal ? Math.round(macdData.signal * 100) / 100 : null,
    macd_histogram: macdData.histogram ? Math.round(macdData.histogram * 100) / 100 : null,
    bb_upper: bb.upper ? Math.round(bb.upper * 100) / 100 : null,
    bb_middle: bb.middle ? Math.round(bb.middle * 100) / 100 : null,
    bb_lower: bb.lower ? Math.round(bb.lower * 100) / 100 : null,
    atr_14: atr_14 ? Math.round(atr_14 * 100) / 100 : null,
    volume_sma_20: volume_sma_20 ? Math.round(volume_sma_20) : null,
    volume_ratio: volume_ratio ? Math.round(volume_ratio * 100) / 100 : null,
  };
}

