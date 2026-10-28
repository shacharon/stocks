'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AddSymbolModal } from './AddSymbolModal';
import { QuickAddModal } from './QuickAddModal';
import { DailyRefresh } from './DailyRefresh';

interface Symbol {
  id: string;
  symbol: string;
  market: string;
  name: string;
  sector: string | null;
  addedAt: string;
}

interface StocksPageClientProps {
  initialSymbols: Symbol[];
  actualDataDate: string;
}

export function StocksPageClient({ initialSymbols, actualDataDate }: StocksPageClientProps) {
  const [symbols, setSymbols] = useState(initialSymbols);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddSuccess = () => {
    // Refresh the page to show new symbol
    window.location.reload();
  };

  const handleDelete = async (id: string, symbol: string) => {
    if (!confirm(`Are you sure you want to remove ${symbol} from your universe?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_API_URL || 'http://localhost:3001';
      const response = await fetch(`${WORKER_API_URL}/universe/symbols/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete symbol');
      }

      // Remove from local state
      setSymbols(symbols.filter((s) => s.id !== id));
    } catch (error) {
      alert('Failed to remove symbol. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Universe</h1>
            <p className="text-gray-400 mt-1">
              {symbols.length} symbols tracked
            </p>
            
            {/* Trading Day Info */}
            <div className="mt-2 inline-block px-3 py-1 rounded-lg text-sm bg-blue-500/10 text-blue-400">
              📊 Showing data for Dec 24, 2025 (last trading day before Christmas)
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                ⚡ Quick Add 5-7 Stocks
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                + Add One
              </button>
            </div>
            <DailyRefresh />
          </div>
        </div>

        {/* Symbols Grid */}
        {symbols.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {symbols.map((sym) => (
              <div key={sym.id} className="relative group">
                <Link href={`/stocks/${sym.symbol}?market=${sym.market}&date=${actualDataDate}`}>
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

                {/* Delete Button - appears on hover */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(sym.id, sym.symbol);
                  }}
                  disabled={deletingId === sym.id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded text-xs font-medium"
                  title={`Remove ${sym.symbol}`}
                >
                  {deletingId === sym.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Symbols Yet</h3>
            <p className="text-gray-400 mb-4">
              Add symbols to your universe to start tracking and analyzing them.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
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

      {/* Add Symbol Modal */}
      <AddSymbolModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </>
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

