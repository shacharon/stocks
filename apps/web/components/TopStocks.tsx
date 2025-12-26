import Link from 'next/link';

async function getTopStocks() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';
    
    // Get all symbols
    const symbolsRes = await fetch(`${WORKER_API_URL}/universe/symbols`, { cache: 'no-store' });
    if (!symbolsRes.ok) throw new Error('No symbols');
    
    const symbols = await symbolsRes.json();
    if (symbols.length === 0) return { gainers: [], losers: [] };
    
    // Get features for each symbol (today and yesterday to calculate change)
    const stockChanges: any[] = [];
    
    for (const sym of symbols.slice(0, 10)) { // Limit to 10 symbols
      try {
        // Try today first, then yesterday
        let todayRes = await fetch(
          `${WORKER_API_URL}/features/${sym.symbol}/${sym.market}/${today}`,
          { cache: 'no-store' }
        );
        
        if (!todayRes.ok) {
          todayRes = await fetch(
            `${WORKER_API_URL}/features/${sym.symbol}/${sym.market}/${yesterdayStr}`,
            { cache: 'no-store' }
          );
        }
        
        if (!todayRes.ok) continue;
        
        const todayData = await todayRes.json();
        if (todayData.error) continue;
        
        const price = parseFloat(todayData.closePrice);
        const sma20 = todayData.sma20 ? parseFloat(todayData.sma20) : null;
        
        if (sma20) {
          const change = price - sma20;
          const changePercent = (change / sma20) * 100;
          
          stockChanges.push({
            symbol: sym.symbol,
            price,
            change,
            changePercent,
          });
        }
      } catch (err) {
        // Skip symbols with errors
        continue;
      }
    }
    
    if (stockChanges.length === 0) {
      return { gainers: [], losers: [] };
    }
    
    // Sort by change percent
    stockChanges.sort((a, b) => b.changePercent - a.changePercent);
    
    return {
      gainers: stockChanges.filter(s => s.changePercent > 0).slice(0, 3),
      losers: stockChanges.filter(s => s.changePercent < 0).slice(-3).reverse(),
    };
  } catch (error) {
    console.error('Failed to fetch top stocks:', error);
    return { gainers: [], losers: [] };
  }
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

