/**
 * Date utilities for handling market trading days
 */

const WORKER_API_URL = process.env.WORKER_API_URL || 'http://localhost:3001';

/**
 * Find the last date with actual feature data by querying backwards
 * This is more reliable than guessing based on weekends/holidays
 */
export async function findLastDateWithData(
  symbol: string,
  market: string,
  maxDaysBack: number = 30
): Promise<Date | null> {
  const today = new Date();
  
  for (let daysBack = 0; daysBack < maxDaysBack; daysBack++) {
    const testDate = new Date(today);
    testDate.setDate(testDate.getDate() - daysBack);
    
    // Skip weekends
    const dayOfWeek = testDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    const dateStr = formatDateISO(testDate);
    
    try {
      const response = await fetch(
        `${WORKER_API_URL}/features/${symbol}/${market}/${dateStr}`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && !data.error && data.closePrice) {
          return testDate;
        }
      }
    } catch (error) {
      // Continue searching
    }
  }
  
  return null;
}

/**
 * Get the last trading day
 * Accounts for weekends and assumes no holidays for simplicity
 * Can be enhanced with actual holiday calendar
 */
export function getLastTradingDay(referenceDate?: Date): Date {
  const date = referenceDate ? new Date(referenceDate) : new Date();
  
  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // If Saturday (6), go back to Friday
  if (dayOfWeek === 6) {
    date.setDate(date.getDate() - 1);
  }
  // If Sunday (0), go back to Friday
  else if (dayOfWeek === 0) {
    date.setDate(date.getDate() - 2);
  }
  // If it's a weekday but after market close (assume 4 PM ET), use today
  // Otherwise, for simplicity, use the current weekday
  
  return date;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Dec 24, 2025")
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get display info for current trading context
 */
export function getTradingDayInfo(): {
  date: Date;
  dateISO: string;
  dateDisplay: string;
  isToday: boolean;
  message: string;
} {
  const today = new Date();
  const tradingDay = getLastTradingDay(today);
  const isToday = formatDateISO(tradingDay) === formatDateISO(today);
  
  let message = '';
  if (!isToday) {
    if (isWeekend(today)) {
      message = `Weekend - Showing last trading day (${formatDateDisplay(tradingDay)})`;
    } else {
      message = `Market closed - Showing last trading day (${formatDateDisplay(tradingDay)})`;
    }
  } else {
    message = `Showing today's data (${formatDateDisplay(tradingDay)})`;
  }
  
  return {
    date: tradingDay,
    dateISO: formatDateISO(tradingDay),
    dateDisplay: formatDateDisplay(tradingDay),
    isToday,
    message
  };
}

