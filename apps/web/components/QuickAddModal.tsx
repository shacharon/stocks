'use client';

import { useState } from 'react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft Corp', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', market: 'US' },
  { symbol: 'TSLA', name: 'Tesla Inc', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', market: 'US' },
  { symbol: 'AMD', name: 'AMD Inc', market: 'US' },
  { symbol: 'META', name: 'Meta Platforms', market: 'US' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', market: 'US' },
  { symbol: 'NFLX', name: 'Netflix Inc', market: 'US' },
  { symbol: 'JPM', name: 'JPMorgan Chase', market: 'US' },
];

export function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleStock = (symbol: string) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedStocks(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedStocks.size === 0) {
      setError('Please select at least one stock');
      return;
    }

    setError('');
    setIsLoading(true);
    setProgress(`Adding ${selectedStocks.size} stocks...`);

    try {
      const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_API_URL || 'http://localhost:3001';
      
      // Step 1: Add all stocks
      let addedCount = 0;
      for (const symbol of selectedStocks) {
        const stock = POPULAR_STOCKS.find(s => s.symbol === symbol);
        if (!stock) continue;

        try {
          const response = await fetch(`${WORKER_API_URL}/universe/symbols`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stock),
          });

          if (response.ok) {
            addedCount++;
            setProgress(`Added ${addedCount}/${selectedStocks.size} stocks...`);
          }
        } catch (err) {
          console.error(`Failed to add ${symbol}:`, err);
        }
      }

      // Step 2: Sync all market data (200 days)
      setProgress('Syncing market data (this may take 30-60 seconds)...');
      await fetch(`${WORKER_API_URL}/market/sync?lookback=200&date=2025-12-24`, {
        method: 'POST',
      });

      // Step 3: Run analysis
      setProgress('Running technical analysis...');
      const portfolios = await fetch(`${WORKER_API_URL}/portfolios`).then(r => r.json());
      if (portfolios.length > 0) {
        await fetch(
          `${WORKER_API_URL}/analysis/run?date=2025-12-24&portfolioId=${portfolios[0].id}`,
          { method: 'POST' }
        );
      }

      // Wait for analysis to complete
      setProgress('Finalizing... (waiting for indicators to calculate)');
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15s for analysis

      setProgress(`✅ Complete! ${addedCount} stocks are ready to view.`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setSelectedStocks(new Set());
        setProgress('');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to add stocks');
      setProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Quick Add Stocks</h2>
            <p className="text-sm text-gray-400 mt-1">
              Select 5-7 stocks to track for the next 2 weeks
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Stock Selection Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {POPULAR_STOCKS.map((stock) => {
            const isSelected = selectedStocks.has(stock.symbol);
            return (
              <button
                key={stock.symbol}
                onClick={() => toggleStock(stock.symbol)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-all text-left disabled:opacity-50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{stock.symbol}</div>
                    <div className="text-sm text-gray-400">{stock.name}</div>
                  </div>
                  {isSelected && (
                    <div className="text-blue-400 text-2xl">✓</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Counter */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Selected:</span>
            <span className={`font-bold ${
              selectedStocks.size >= 5 && selectedStocks.size <= 7
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}>
              {selectedStocks.size} stocks
              {selectedStocks.size >= 5 && selectedStocks.size <= 7 && ' ✅'}
            </span>
          </div>
        </div>

        {/* Progress Message */}
        {progress && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              {isLoading && (
                <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" />
              )}
              <p className="text-sm text-blue-400">{progress}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedStocks.size === 0}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Processing...' : `Add ${selectedStocks.size || ''} Stock${selectedStocks.size !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-400">
            <strong>💡 What happens next:</strong>
            <br />
            1. Stocks added to your universe
            <br />
            2. 200 days of historical data synced (~{selectedStocks.size} API calls)
            <br />
            3. Technical indicators calculated
            <br />
            4. Ready to view in ~60 seconds!
          </p>
        </div>
      </div>
    </div>
  );
}

