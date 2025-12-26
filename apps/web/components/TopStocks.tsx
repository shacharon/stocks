import Link from 'next/link';

async function getTopStocks() {
  // Sample data - will connect to real API
  return {
    gainers: [
      { symbol: 'JPM', price: 243.14, change: 1.08, changePercent: 0.45 },
      { symbol: 'AAPL', price: 195.50, change: 3.25, changePercent: 1.69 },
      { symbol: 'MSFT', price: 412.80, change: 5.60, changePercent: 1.37 },
    ],
    losers: [
      { symbol: 'GOOGL', price: 142.30, change: -2.15, changePercent: -1.49 },
      { symbol: 'TSLA', price: 358.25, change: -4.80, changePercent: -1.32 },
    ],
  };
}

export async function TopStocks() {
  const { gainers, losers } = await getTopStocks();

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <span>🏆</span>
        Top Movers
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gainers */}
        <div>
          <div className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
            <span>📈</span>
            Top Gainers
          </div>
          <div className="space-y-2">
            {gainers.map((stock) => (
              <StockRow key={stock.symbol} {...stock} />
            ))}
          </div>
        </div>

        {/* Losers */}
        <div>
          <div className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
            <span>📉</span>
            Top Losers
          </div>
          <div className="space-y-2">
            {losers.map((stock) => (
              <StockRow key={stock.symbol} {...stock} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StockRow({
  symbol,
  price,
  change,
  changePercent,
}: {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}) {
  const isPositive = change >= 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const bgClass = isPositive ? 'bg-green-500/5' : 'bg-red-500/5';

  return (
    <Link href={`/stocks/${symbol}`}>
      <div className={`${bgClass} border border-gray-800 hover:border-gray-700 rounded-lg p-3 transition-all hover:scale-[1.02]`}>
        <div className="flex items-center justify-between">
          <div className="font-bold">{symbol}</div>
          <div className="text-right">
            <div className="font-medium">${price.toFixed(2)}</div>
            <div className={`text-sm ${colorClass}`}>
              {isPositive ? '+' : ''}
              {change.toFixed(2)} ({isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

