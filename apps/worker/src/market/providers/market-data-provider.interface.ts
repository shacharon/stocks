import { MarketDataProvider as IMarketDataProvider } from '@stocks/shared';

/**
 * Re-export MarketDataProvider interface from shared package
 * This allows providers to import from a single location
 */
export type MarketDataProvider = IMarketDataProvider;
export { type DailyBar, type Market } from '@stocks/shared';


