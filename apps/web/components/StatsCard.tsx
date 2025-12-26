interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
}

export function StatsCard({ title, value, change, icon, trend }: StatsCardProps) {
  const trendColor = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  }[trend];

  const trendBg = {
    up: 'bg-green-500/10 border-green-500/20',
    down: 'bg-red-500/10 border-red-500/20',
    neutral: 'bg-gray-500/10 border-gray-500/20',
  }[trend];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${trendBg} ${trendColor}`}>
          {change}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-gray-400">{title}</div>
      </div>
    </div>
  );
}

