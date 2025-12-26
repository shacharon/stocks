import Link from 'next/link';

// Fetch REAL trading signals from the API
async function getRecentSignals() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';
    
    // Try to get real portfolio decisions
    // First, get all portfolios
    const portfoliosRes = await fetch(`${WORKER_API_URL}/portfolios`, { cache: 'no-store' });
    if (!portfoliosRes.ok) throw new Error('No portfolios');
    
    const portfolios = await portfoliosRes.json();
    if (portfolios.length === 0) return [];
    
    // Get decisions for the first portfolio
    const portfolioId = portfolios[0].id;
    const decisionsRes = await fetch(
      `${WORKER_API_URL}/changes/portfolio/${portfolioId}/decisions/${today}`,
      { cache: 'no-store' }
    );
    
    if (!decisionsRes.ok) {
      // If today has no data, try yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayRes = await fetch(
        `${WORKER_API_URL}/changes/portfolio/${portfolioId}/decisions/${yesterdayStr}`,
        { cache: 'no-store' }
      );
      
      if (!yesterdayRes.ok) return [];
      
      const decisions = await yesterdayRes.json();
      return decisions.slice(0, 5).map((d: any) => ({
        symbol: d.symbol || 'N/A',
        signal: d.signal || 'HOLD',
        confidence: Math.round(parseFloat(d.confidence) || 0),
        reason: Array.isArray(d.reasons) ? d.reasons[0] : 'Analysis pending',
        market: d.market || 'US',
        date: yesterdayStr,
      }));
    }
    
    const decisions = await decisionsRes.json();
    
    // Return top 5 most recent decisions
    return decisions.slice(0, 5).map((d: any) => ({
      symbol: d.symbol || 'N/A',
      signal: d.signal || 'HOLD',
      confidence: Math.round(parseFloat(d.confidence) || 0),
      reason: Array.isArray(d.reasons) ? d.reasons[0] : 'Analysis pending',
      market: d.market || 'US',
      date: today,
    }));
  } catch (error) {
    console.error('Failed to fetch recent signals:', error);
    return [];
  }
}

export async function RecentSignals() {
  const signals = await getRecentSignals();

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>🎯</span>
          Recent Trading Signals
        </h3>
        <Link href="/signals" className="text-sm text-blue-400 hover:text-blue-300">
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {signals.map((signal, i) => (
          <SignalCard key={i} {...signal} />
        ))}
      </div>
    </div>
  );
}

function SignalCard({
  symbol,
  signal,
  confidence,
  reason,
  market,
  date,
}: {
  symbol: string;
  signal: string;
  confidence: number;
  reason: string;
  market: string;
  date: string;
}) {
  const signalStyles: Record<string, { badge: string; bg: string }> = {
    STRONG_BUY: { badge: 'signal-strong-buy', bg: 'bg-green-500/5' },
    BUY: { badge: 'signal-buy', bg: 'bg-green-500/5' },
    HOLD: { badge: 'signal-hold', bg: 'bg-yellow-500/5' },
    SELL: { badge: 'signal-sell', bg: 'bg-red-500/5' },
    STRONG_SELL: { badge: 'signal-strong-sell', bg: 'bg-red-500/5' },
  };

  const style = signalStyles[signal] || signalStyles.HOLD;

  return (
    <Link href={`/stocks/${symbol}`}>
      <div className={`${style.bg} border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all hover:scale-[1.02]`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="font-bold text-lg">{symbol}</div>
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${style.badge}`}>
              {signal}
            </span>
          </div>
          <div className="text-sm text-gray-400">{date}</div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{reason}</span>
          <span className="text-gray-300 font-medium">{confidence}% confidence</span>
        </div>
      </div>
    </Link>
  );
}

