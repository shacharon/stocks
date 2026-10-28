import Link from "next/link";
import { formatDateISO, getLastTradingDay } from "@/lib/date-utils";

// Fetch REAL trading signals from the API
async function getRecentSignals() {
  try {
    // Use last trading day instead of today
    const tradingDay = getLastTradingDay();
    const tradingDateStr = formatDateISO(tradingDay);

    const WORKER_API_URL =
      process.env.WORKER_API_URL || "http://localhost:3001";

    // Try to get real portfolio decisions
    // First, get all portfolios
    const portfoliosRes = await fetch(`${WORKER_API_URL}/portfolios`, {
      cache: "no-store",
    });
    if (!portfoliosRes.ok) throw new Error("No portfolios");

    const portfolios = await portfoliosRes.json();
    if (portfolios.length === 0) return [];

    // Get decisions for the first portfolio
    const portfolioId = portfolios[0].id;
    const decisionsRes = await fetch(
      `${WORKER_API_URL}/changes/portfolio/${portfolioId}/decisions/${tradingDateStr}`,
      { cache: "no-store" }
    );

    if (!decisionsRes.ok) {
      // If last trading day has no data, try the day before
      const previousDay = new Date(tradingDay);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousTradingDay = getLastTradingDay(previousDay);
      const previousDateStr = formatDateISO(previousTradingDay);

      const previousRes = await fetch(
        `${WORKER_API_URL}/changes/portfolio/${portfolioId}/decisions/${previousDateStr}`,
        { cache: "no-store" }
      );

      if (!previousRes.ok) return [];

      const response = await previousRes.json();
      const decisionsArray = response.decisions || [];

      // Fetch symbols to get names
      const symbolsRes = await fetch(`${WORKER_API_URL}/universe/symbols`, {
        cache: "no-store",
      });
      const symbols = symbolsRes.ok ? await symbolsRes.json() : [];
      const symbolMap = new Map(symbols.map((s: any) => [s.id, s.symbol]));

      return decisionsArray.slice(0, 5).map((d: any) => ({
        symbol:
          symbolMap.get(d.symbolId) || d.symbolId?.substring(0, 4) || "N/A",
        signal: d.signal || "HOLD",
        confidence: Math.round(parseFloat(d.confidence) || 0),
        reason:
          typeof d.reasons === "string"
            ? d.reasons.substring(0, 30)
            : "Analysis pending",
        market: d.market || "US",
        date: previousDateStr,
      }));
    }

    const response = await decisionsRes.json();
    const decisionsArray = response.decisions || [];

    // Fetch symbols to get names
    const symbolsRes = await fetch(`${WORKER_API_URL}/universe/symbols`, {
      cache: "no-store",
    });
    const symbols = symbolsRes.ok ? await symbolsRes.json() : [];
    const symbolMap = new Map(symbols.map((s: any) => [s.id, s.symbol]));

    // Return top 5 most recent decisions
    return decisionsArray.slice(0, 5).map((d: any) => ({
      symbol: symbolMap.get(d.symbolId) || d.symbolId?.substring(0, 4) || "N/A",
      signal: d.signal || "HOLD",
      confidence: Math.round(parseFloat(d.confidence) || 0),
      reason:
        typeof d.reasons === "string"
          ? d.reasons.substring(0, 30)
          : "Analysis pending",
      market: d.market || "US",
      date: tradingDateStr,
    }));
  } catch (error) {
    console.error("Failed to fetch recent signals:", error);
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
        <Link
          href="/signals"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
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
    STRONG_BUY: { badge: "signal-strong-buy", bg: "bg-green-500/5" },
    BUY: { badge: "signal-buy", bg: "bg-green-500/5" },
    HOLD: { badge: "signal-hold", bg: "bg-yellow-500/5" },
    SELL: { badge: "signal-sell", bg: "bg-red-500/5" },
    STRONG_SELL: { badge: "signal-strong-sell", bg: "bg-red-500/5" },
  };

  const style = signalStyles[signal] || signalStyles.HOLD;

  return (
    <Link href={`/stocks/${symbol}`}>
      <div
        className={`${style.bg} border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all hover:scale-[1.02]`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="font-bold text-lg">{symbol}</div>
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium border ${style.badge}`}
            >
              {signal}
            </span>
          </div>
          <div className="text-sm text-gray-400">{date}</div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{reason}</span>
          <span className="text-gray-300 font-medium">
            {confidence}% confidence
          </span>
        </div>
      </div>
    </Link>
  );
}
