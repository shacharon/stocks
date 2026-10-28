'use client';

import { useState } from 'react';

export function DailyRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setProgress('Syncing latest market data...');

    try {
      const WORKER_API_URL = process.env.NEXT_PUBLIC_WORKER_API_URL || 'http://localhost:3001';
      
      // Step 1: Sync only today's data (lookback=1)
      setProgress('Fetching today\'s prices...');
      const syncResponse = await fetch(
        `${WORKER_API_URL}/market/sync?lookback=1&date=2025-12-24`,
        { method: 'POST' }
      );
      
      if (!syncResponse.ok) {
        throw new Error('Failed to sync market data');
      }

      const syncResult = await syncResponse.json();
      
      // Step 2: Run analysis for today
      setProgress('Calculating technical indicators...');
      const portfolios = await fetch(`${WORKER_API_URL}/portfolios`).then(r => r.json());
      
      if (portfolios.length > 0) {
        await fetch(
          `${WORKER_API_URL}/analysis/run?date=2025-12-24&portfolioId=${portfolios[0].id}`,
          { method: 'POST' }
        );
      }

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

      setProgress(`✅ Refreshed ${syncResult.successCount} stocks successfully!`);
      setLastSync(new Date().toLocaleTimeString());
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      setProgress(`❌ Error: ${error.message}`);
      setTimeout(() => setProgress(''), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        {isRefreshing ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Refreshing...
          </>
        ) : (
          <>
            🔄 Refresh Latest Data
          </>
        )}
      </button>

      {progress && (
        <div className="text-xs text-gray-400 text-center">
          {progress}
        </div>
      )}

      {lastSync && !isRefreshing && (
        <div className="text-xs text-gray-500 text-center">
          Last synced: {lastSync}
        </div>
      )}
    </div>
  );
}

