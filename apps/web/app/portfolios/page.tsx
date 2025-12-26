import { getPortfolios } from '@/lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PortfoliosPage() {
  let portfolios = [];
  let error = null;

  try {
    portfolios = await getPortfolios();
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolios</h1>
          <p className="text-gray-400 mt-1">
            Manage your investment portfolios
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
          + New Portfolio
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400">Failed to load portfolios: {error}</p>
        </div>
      )}

      {/* Portfolios Grid */}
      {portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio: any) => (
            <Link key={portfolio.id} href={`/portfolios/${portfolio.id}`}>
              <div className="bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">💼</div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-md border border-green-500/50">
                    Active
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{portfolio.name}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {portfolio.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-semibold">{portfolio.currency}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-sm text-blue-400 font-medium">
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-2xl font-semibold mb-2">No Portfolios Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first portfolio to start tracking your investments and get automated trading signals.
          </p>
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Create Your First Portfolio
          </button>
        </div>
      )}

      {/* Quick Tips */}
      {portfolios.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TipCard
            icon="📊"
            title="Track Performance"
            description="Monitor your portfolio's performance with real-time P&L calculations"
          />
          <TipCard
            icon="🎯"
            title="Get Signals"
            description="Receive automated BUY/SELL signals based on technical analysis"
          />
          <TipCard
            icon="🛡️"
            title="Stop-Loss Protection"
            description="Automatic stop-loss management using ATR-based calculations"
          />
        </div>
      )}
    </div>
  );
}

function TipCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

