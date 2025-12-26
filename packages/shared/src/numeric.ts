import { Prisma } from '@prisma/client';

export type Numeric = number | Prisma.Decimal | null | undefined;

/**
 * Convert Prisma.Decimal (or number) to JS number
 * Returns NaN if null/undefined
 */
export function num(x: Numeric): number {
  if (x == null) return NaN;
  return typeof x === 'number' ? x : x.toNumber();
}

/**
 * Convert to number with fallback to 0 if null/NaN
 */
export function num0(x: Numeric): number {
  const v = num(x);
  return Number.isFinite(v) ? v : 0;
}

/**
 * Safe percent difference helper: (a-b)/b*100
 * Returns NaN if invalid inputs
 */
export function pctDiff(a: Numeric, b: Numeric): number {
  const aa = num(a);
  const bb = num(b);
  if (!Number.isFinite(aa) || !Number.isFinite(bb) || bb === 0) return NaN;
  return ((aa - bb) / bb) * 100;
}

/**
 * Safe arithmetic operations
 */
export function add(a: Numeric, b: Numeric): number {
  return num(a) + num(b);
}

export function subtract(a: Numeric, b: Numeric): number {
  return num(a) - num(b);
}

export function multiply(a: Numeric, b: Numeric): number {
  return num(a) * num(b);
}

export function divide(a: Numeric, b: Numeric): number {
  const bb = num(b);
  return bb === 0 ? NaN : num(a) / bb;
}

/**
 * Safe comparison operations
 */
export function gt(a: Numeric, b: Numeric): boolean {
  return num(a) > num(b);
}

export function lt(a: Numeric, b: Numeric): boolean {
  return num(a) < num(b);
}

export function gte(a: Numeric, b: Numeric): boolean {
  return num(a) >= num(b);
}

export function lte(a: Numeric, b: Numeric): boolean {
  return num(a) <= num(b);
}

export function eq(a: Numeric, b: Numeric): boolean {
  return num(a) === num(b);
}

/**
 * Format number as currency
 */
export function formatCurrency(x: Numeric, currency: string = 'USD'): string {
  const value = num(x);
  if (!Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercent(x: Numeric, decimals: number = 2): string {
  const value = num(x);
  if (!Number.isFinite(value)) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

