import Link from 'next/link';

// This will fetch real data from the API
async function getRecentSignals() {
  // For now, return sample data - we'll connect to API next
  return [
    { symbol: 'JPM', signal: 'HOLD', confidence: 46, reason: 'Neutral momentum', market: 'US', date: '2024-12-26' },
    { symbol: 'AAPL', signal: 'BUY', confidence: 72, reason: 'Strong uptrend', market: 'US', date: '2024-12-25' },
    { symbol: 'MSFT', signal: 'STRONG_BUY', confidence: 88, reason: 'Breakout pattern', market: 'US', date: '2024-12-25' },
  ];
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

