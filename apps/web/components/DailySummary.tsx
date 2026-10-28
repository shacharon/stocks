import Link from 'next/link';

async function getDailySummary() {
  try {
    const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';
    
    // Get all symbols
    const symbolsRes = await fetch(`${WORKER_API_URL}/universe/symbols`, { cache: 'no-store' });
    if (!symbolsRes.ok) return null;
    const symbols = await symbolsRes.json();
    
    if (symbols.length === 0) return null;
    
    // Get features for all symbols (Dec 24)
    const featuresPromises = symbols.map(async (sym: any) => {
      try {
        const res = await fetch(
          `${WORKER_API_URL}/features/${sym.symbol}/${sym.market}/2025-12-24`,
          { cache: 'no-store' }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return { ...data, symbol: sym.symbol };
      } catch {
        return null;
      }
    });
    
    const allFeatures = (await Promise.all(featuresPromises)).filter(Boolean);
    
    if (allFeatures.length === 0) return null;
    
    // Calculate summary stats
    const withRSI = allFeatures.filter((f: any) => f.rsi14 !== null);
    const overbought = withRSI.filter((f: any) => parseFloat(f.rsi14) > 70);
    const oversold = withRSI.filter((f: any) => parseFloat(f.rsi14) < 30);
    const neutral = withRSI.filter((f: any) => {
      const rsi = parseFloat(f.rsi14);
      return rsi >= 30 && rsi <= 70;
    });
    
    // Get signals from decisions
    const portfoliosRes = await fetch(`${WORKER_API_URL}/portfolios`, { cache: 'no-store' });
    let buySignals = 0;
    let sellSignals = 0;
    
    if (portfoliosRes.ok) {
      const portfolios = await portfoliosRes.json();
      if (portfolios.length > 0) {
        const decisionsRes = await fetch(
          `${WORKER_API_URL}/changes/portfolio/${portfolios[0].id}/decisions/2025-12-24`,
          { cache: 'no-store' }
        );
        
        if (decisionsRes.ok) {
          const decisionsData = await decisionsRes.json();
          const decisions = decisionsData.decisions || [];
          
          buySignals = decisions.filter((d: any) => 
            d.signal === 'BUY' || d.signal === 'STRONG_BUY'
          ).length;
          
          sellSignals = decisions.filter((d: any) => 
            d.signal === 'SELL' || d.signal === 'STRONG_SELL'
          ).length;
        }
      }
    }
    
    return {
      totalStocks: symbols.length,
      overbought: overbought.length,
      oversold: oversold.length,
      neutral: neutral.length,
      buySignals,
      sellSignals,
      topMovers: allFeatures
        .filter((f: any) => f.closePrice && f.sma20)
        .map((f: any) => ({
          symbol: f.symbol,
          price: parseFloat(f.closePrice),
          change: ((parseFloat(f.closePrice) - parseFloat(f.sma20)) / parseFloat(f.sma20)) * 100,
        }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 3),
    };
  } catch (error) {
    console.error('Failed to fetch daily summary:', error);
    return null;
  }
}

export async function DailySummary() {
  const summary = await getDailySummary();
  
  if (!summary) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📊</span>
          Daily Summary
        </h3>
        <p className="text-gray-400 text-sm">No data available yet. Add stocks to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>📊</span>
          Daily Summary
        </h3>
        <span className="text-xs text-gray-400">Dec 24, 2025</span>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryBox
          label="Total Stocks"
          value={summary.totalStocks}
          color="text-blue-400"
          icon="📈"
        />
        <SummaryBox
          label="Buy Signals"
          value={summary.buySignals}
          color="text-green-400"
          icon="🟢"
        />
        <SummaryBox
          label="Sell Signals"
          value={summary.sellSignals}
          color="text-red-400"
          icon="🔴"
        />
        <SummaryBox
          label="Overbought"
          value={summary.overbought}
          color="text-orange-400"
          icon="⚠️"
        />
      </div>

      {/* RSI Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">RSI Distribution</h4>
        <div className="flex gap-2">
          <div 
            className="bg-red-500/20 border border-red-500/50 rounded px-3 py-2 flex-1 text-center"
            title="Overbought (RSI > 70)"
          >
            <div className="text-xs text-gray-400">Overbought</div>
            <div className="text-lg font-bold text-red-400">{summary.overbought}</div>
          </div>
          <div 
            className="bg-green-500/20 border border-green-500/50 rounded px-3 py-2 flex-1 text-center"
            title="Normal (30 < RSI < 70)"
          >
            <div className="text-xs text-gray-400">Neutral</div>
            <div className="text-lg font-bold text-green-400">{summary.neutral}</div>
          </div>
          <div 
            className="bg-blue-500/20 border border-blue-500/50 rounded px-3 py-2 flex-1 text-center"
            title="Oversold (RSI < 30)"
          >
            <div className="text-xs text-gray-400">Oversold</div>
            <div className="text-lg font-bold text-blue-400">{summary.oversold}</div>
          </div>
        </div>
      </div>

      {/* Top Movers */}
      {summary.topMovers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Top Movers vs SMA-20</h4>
          <div className="space-y-2">
            {summary.topMovers.map((mover) => (
              <Link key={mover.symbol} href={`/stocks/${mover.symbol}`}>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="font-bold">{mover.symbol}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">${mover.price.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${
                      mover.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {mover.change >= 0 ? '+' : ''}
                      {mover.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value, color, icon }: { 
  label: string; 
  value: number; 
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

