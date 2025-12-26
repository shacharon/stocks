import { getSymbols } from '@/lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Symbol {
  id: string;
  symbol: string;
  market: string;
  name: string;
  sector: string | null;
  addedAt: string;
}

export default async function StocksPage() {
  let symbols: Symbol[] = [];
  let error = null;

  try {
    symbols = await getSymbols();
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Universe</h1>
          <p className="text-gray-400 mt-1">
            {symbols.length} symbols tracked
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
          + Add Symbol
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Symbols Grid */}
      {symbols.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbols.map((sym) => (
            <Link
              key={sym.id}
              href={`/stocks/${sym.symbol}?market=${sym.market}&date=2024-12-26`}
            >
              <div className="bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold">{sym.symbol}</div>
                    <div className="text-sm text-gray-400">{sym.name}</div>
                  </div>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md border border-blue-500/50">
                    {sym.market}
                  </span>
                </div>
                {sym.sector && (
                  <div className="text-xs text-gray-500">
                    {sym.sector}
                  </div>
                )}
                <div className="mt-4 text-sm text-blue-400 font-medium">
                  View Analysis →
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Symbols Yet</h3>
          <p className="text-gray-400 mb-4">
            Add symbols to your universe to start tracking and analyzing them.
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Add Your First Symbol
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {symbols.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox
            icon="🌎"
            label="Markets"
            value={new Set(symbols.map((s) => s.market)).size.toString()}
          />
          <StatBox
            icon="🏢"
            label="Sectors"
            value={new Set(symbols.map((s) => s.sector).filter(Boolean)).size.toString()}
          />
          <StatBox
            icon="📈"
            label="Total Symbols"
            value={symbols.length.toString()}
          />
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

