import { getFeatures, getSymbols } from '@/lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    symbol: string;
  };
  searchParams: {
    market?: string;
    date?: string;
  };
}

export default async function StockDetailPage({ params, searchParams }: PageProps) {
  const symbol = params.symbol.toUpperCase();
  const market = searchParams.market || 'US';
  const date = searchParams.date || '2024-12-26';

  let features = null;
  let error = null;

  try {
    features = await getFeatures(symbol, market, date);
  } catch (e: any) {
    error = e.message;
  }

  if (error || !features) {
    return (
      <div className="space-y-6">
        <Link href="/stocks" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Stocks
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">No Data Available</h2>
          <p className="text-gray-400">
            {error || `No features found for ${symbol} (${market}) on ${date}`}
          </p>
        </div>
      </div>
    );
  }

  const price = parseFloat(features.closePrice);
  const sma20 = features.sma20 ? parseFloat(features.sma20) : null;
  const sma50 = features.sma50 ? parseFloat(features.sma50) : null;
  const rsi = features.rsi14 ? parseFloat(features.rsi14) : null;
  const macd = features.macd ? parseFloat(features.macd) : null;
  const atr = features.atr14 ? parseFloat(features.atr14) : null;
  const volumeRatio = features.volumeRatio ? parseFloat(features.volumeRatio) : null;

  // Determine trend based on price vs SMAs
  let trend = 'Neutral';
  let trendColor = 'text-yellow-400';
  if (sma20 && sma50) {
    if (price > sma20 && price > sma50 && sma20 > sma50) {
      trend = 'Strong Uptrend';
      trendColor = 'text-green-400';
    } else if (price < sma20 && price < sma50 && sma20 < sma50) {
      trend = 'Strong Downtrend';
      trendColor = 'text-red-400';
    } else if (price > sma20) {
      trend = 'Uptrend';
      trendColor = 'text-green-300';
    } else if (price < sma20) {
      trend = 'Downtrend';
      trendColor = 'text-red-300';
    }
  }

  // RSI interpretation
  let rsiSignal = 'Neutral';
  let rsiColor = 'text-gray-400';
  if (rsi !== null) {
    if (rsi > 70) {
      rsiSignal = 'Overbought';
      rsiColor = 'text-red-400';
    } else if (rsi < 30) {
      rsiSignal = 'Oversold';
      rsiColor = 'text-green-400';
    }
  }

  // MACD interpretation
  let macdSignal = 'Neutral';
  let macdColor = 'text-gray-400';
  if (macd !== null) {
    if (macd > 0) {
      macdSignal = 'Bullish';
      macdColor = 'text-green-400';
    } else if (macd < 0) {
      macdSignal = 'Bearish';
      macdColor = 'text-red-400';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/stocks" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Stocks
        </Link>
        <div className="text-sm text-gray-400">
          Last updated: {new Date(features.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Stock Header Card */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-5xl font-bold">{symbol}</h1>
              <span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">{market}</span>
            </div>
            <div className="text-sm text-gray-400 mb-4">{date}</div>
            <div className="text-4xl font-bold mb-2">${price.toFixed(2)}</div>
            <div className={`text-lg font-semibold ${trendColor}`}>{trend}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Volume</div>
            <div className="text-2xl font-bold">{parseInt(features.volume).toLocaleString()}</div>
            {volumeRatio && (
              <div className="text-sm text-gray-400 mt-1">
                {(volumeRatio * 100).toFixed(0)}% of avg
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <IndicatorCard
          title="RSI (14)"
          value={rsi?.toFixed(2) || 'N/A'}
          signal={rsiSignal}
          color={rsiColor}
          description="Relative Strength Index"
        />
        <IndicatorCard
          title="MACD"
          value={macd?.toFixed(2) || 'N/A'}
          signal={macdSignal}
          color={macdColor}
          description="Moving Average Convergence Divergence"
        />
        <IndicatorCard
          title="ATR (14)"
          value={atr ? `$${atr.toFixed(2)}` : 'N/A'}
          signal="Volatility"
          color="text-gray-400"
          description="Average True Range"
        />
      </div>

      {/* Technical Indicators Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <span>📊</span>
          All Technical Indicators
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Moving Averages */}
          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-3">Moving Averages</h4>
            <div className="space-y-2">
              <IndicatorRow label="SMA-20" value={sma20 ? `$${sma20.toFixed(2)}` : 'N/A'} />
              <IndicatorRow label="SMA-50" value={sma50 ? `$${sma50.toFixed(2)}` : 'N/A'} />
              <IndicatorRow 
                label="SMA-200" 
                value={features.sma200 ? `$${parseFloat(features.sma200).toFixed(2)}` : 'N/A'} 
              />
              <IndicatorRow 
                label="EMA-12" 
                value={features.ema12 ? `$${parseFloat(features.ema12).toFixed(2)}` : 'N/A'} 
              />
              <IndicatorRow 
                label="EMA-26" 
                value={features.ema26 ? `$${parseFloat(features.ema26).toFixed(2)}` : 'N/A'} 
              />
            </div>
          </div>

          {/* Momentum & Volatility */}
          <div>
            <h4 className="text-sm font-semibold text-purple-400 mb-3">Momentum & Volatility</h4>
            <div className="space-y-2">
              <IndicatorRow label="RSI-14" value={rsi ? rsi.toFixed(2) : 'N/A'} highlight={rsiColor} />
              <IndicatorRow label="MACD" value={macd ? macd.toFixed(2) : 'N/A'} highlight={macdColor} />
              <IndicatorRow 
                label="MACD Signal" 
                value={features.macdSignal ? parseFloat(features.macdSignal).toFixed(2) : 'N/A'} 
              />
              <IndicatorRow 
                label="MACD Histogram" 
                value={features.macdHistogram ? parseFloat(features.macdHistogram).toFixed(2) : 'N/A'} 
              />
              <IndicatorRow label="ATR-14" value={atr ? `$${atr.toFixed(2)}` : 'N/A'} />
            </div>
          </div>

          {/* Bollinger Bands */}
          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-3">Bollinger Bands</h4>
            <div className="space-y-2">
              <IndicatorRow 
                label="Upper Band" 
                value={features.bbUpper ? `$${parseFloat(features.bbUpper).toFixed(2)}` : 'N/A'} 
              />
              <IndicatorRow 
                label="Middle Band" 
                value={features.bbMiddle ? `$${parseFloat(features.bbMiddle).toFixed(2)}` : 'N/A'} 
              />
              <IndicatorRow 
                label="Lower Band" 
                value={features.bbLower ? `$${parseFloat(features.bbLower).toFixed(2)}` : 'N/A'} 
              />
            </div>
          </div>

          {/* Volume */}
          <div>
            <h4 className="text-sm font-semibold text-orange-400 mb-3">Volume Analysis</h4>
            <div className="space-y-2">
              <IndicatorRow label="Current Volume" value={parseInt(features.volume).toLocaleString()} />
              <IndicatorRow 
                label="20-Day Avg Volume" 
                value={features.volumeSma20 ? parseInt(features.volumeSma20).toLocaleString() : 'N/A'} 
              />
              <IndicatorRow 
                label="Volume Ratio" 
                value={volumeRatio ? `${(volumeRatio * 100).toFixed(0)}%` : 'N/A'} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Engine Info */}
      <div className="text-center text-sm text-gray-500">
        Calculated by Feature Engine v{features.engineVersion}
      </div>
    </div>
  );
}

function IndicatorCard({ 
  title, 
  value, 
  signal, 
  color, 
  description 
}: { 
  title: string; 
  value: string; 
  signal: string; 
  color: string; 
  description: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{description}</div>
      <div className="text-2xl font-bold mb-1">{title}</div>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className={`text-lg font-semibold ${color}`}>{signal}</div>
    </div>
  );
}

function IndicatorRow({ 
  label, 
  value, 
  highlight 
}: { 
  label: string; 
  value: string; 
  highlight?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${highlight || 'text-gray-200'}`}>{value}</span>
    </div>
  );
}

