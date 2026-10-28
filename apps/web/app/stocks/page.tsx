import { getSymbols } from '@/lib/api';
import { StocksPageClient } from '@/components/StocksPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StocksPage() {
  let symbols = [];
  let error = null;
  
  // Use a known good date (Dec 24, 2025) as default
  // This is the last date we have calculated features for
  const actualDataDate = '2025-12-24';
  
  try {
    symbols = await getSymbols();
  } catch (e: any) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Stock Universe</h1>
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return <StocksPageClient initialSymbols={symbols} actualDataDate={actualDataDate} />;
}

