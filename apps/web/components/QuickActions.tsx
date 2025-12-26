'use client';

import Link from 'next/link';

const actions = [
  { icon: '➕', label: 'Add Position', href: '/portfolios', color: 'from-blue-500 to-cyan-500' },
  { icon: '⚡', label: 'Run Analysis', href: '/analysis', color: 'from-purple-500 to-pink-500' },
  { icon: '🔍', label: 'Search Stocks', href: '/stocks', color: 'from-green-500 to-emerald-500' },
  { icon: '📊', label: 'View Reports', href: '/reports', color: 'from-orange-500 to-red-500' },
];

export function QuickActions() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>⚡</span>
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group"
          >
            <div className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-center transition-all hover:scale-105">
              <div className={`text-3xl mb-2 inline-block bg-gradient-to-br ${action.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="text-sm font-medium text-gray-300">
                {action.label}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

