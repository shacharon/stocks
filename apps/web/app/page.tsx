import { StatsCard } from '@/components/StatsCard';
import { QuickActions } from '@/components/QuickActions';
import { RecentSignals } from '@/components/RecentSignals';
import { TopStocks } from '@/components/TopStocks';
import { checkHealth, getMarketStats, getUniverseStats, getPortfolios } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch real data from worker API
  let health, marketStats, universeStats, portfolios;
  let isOnline = false;
  
  try {
    [health, marketStats, universeStats, portfolios] = await Promise.all([
      checkHealth(),
      getMarketStats(),
      getUniverseStats(),
      getPortfolios(),
    ]);
    isOnline = health.status === 'ok';
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Set defaults if API fails
    marketStats = { totalBars: 0, totalSymbols: 0 };
    universeStats = { total: 0 };
    portfolios = [];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-400 mt-2">
          Welcome to your EOD Stock Analyzer. Real-time insights from {isOnline ? 'live' : 'offline'} data.
        </p>
      </div>

      {/* Quick Stats - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Symbols"
          value={universeStats?.total?.toString() || '0'}
          change={universeStats?.total > 0 ? 'Active' : 'Empty'}
          icon="📊"
          trend={universeStats?.total > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="Market Bars"
          value={marketStats?.totalBars?.toLocaleString() || '0'}
          change={marketStats?.totalBars > 0 ? 'Synced' : 'Waiting'}
          icon="📈"
          trend={marketStats?.totalBars > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="Portfolios"
          value={portfolios?.length?.toString() || '0'}
          change={portfolios?.length > 0 ? 'Active' : 'None'}
          icon="💼"
          trend={portfolios?.length > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="API Status"
          value={isOnline ? 'Online' : 'Offline'}
          change={isOnline ? 'Connected' : 'Disconnected'}
          icon="⚡"
          trend={isOnline ? 'up' : 'down'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Takes 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <RecentSignals />
          <TopStocks />
        </div>

        {/* Right Column - Takes 1/3 width */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* System Status - REAL DATA */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚡</span>
              System Status
            </h3>
            <div className="space-y-3">
              <StatusItem label="Worker API" status={isOnline ? 'online' : 'offline'} />
              <StatusItem label="Database" status={health?.database || 'unknown'} />
              <StatusItem label="Market Data" status={marketStats?.totalBars > 0 ? 'online' : 'empty'} />
              <StatusItem label="Symbols" status={`${universeStats?.total || 0} tracked`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const isOnline = status === 'online';
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span className={`text-sm ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

