/**
 * Orbisol core - basic statistics helpers (pure functions).
 * AI-assisted: drafted with Claude (Anthropic); reviewed by the Orbisol team. See docs/ai-usage.md.
 */

/** Keep only finite numbers (drops NaN, Infinity, null-ish fill values already mapped to NaN). */
export function finite(values: readonly number[]): number[] {
  return values.filter((v) => Number.isFinite(v));
}

export function sum(values: readonly number[]): number {
  return finite(values).reduce((acc, v) => acc + v, 0);
}

/** Arithmetic mean of finite values; NaN when there are none. */
export function mean(values: readonly number[]): number {
  const xs = finite(values);
  if (xs.length === 0) return Number.NaN;
  return sum(xs) / xs.length;
}

/** Sample standard deviation (n-1); NaN when fewer than 2 finite values. */
export function stdDev(values: readonly number[]): number {
  const xs = finite(values);
  if (xs.length < 2) return Number.NaN;
  const m = mean(xs);
  const variance = xs.reduce((acc, v) => acc + (v - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/** Linear-interpolated percentile, p in [0, 100]; NaN when empty. */
export function percentile(values: readonly number[], p: number): number {
  const xs = finite(values).sort((a, b) => a - b);
  if (xs.length === 0) return Number.NaN;
  if (p <= 0) return xs[0]!;
  if (p >= 100) return xs[xs.length - 1]!;
  const rank = (p / 100) * (xs.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const w = rank - lo;
  return xs[lo]! * (1 - w) + xs[hi]! * w;
}

/** Standard score of x against a reference sample; NaN when spread is zero or undefined. */
export function zScore(x: number, reference: readonly number[]): number {
  const sd = stdDev(reference);
  if (!Number.isFinite(sd) || sd === 0) return Number.NaN;
  return (x - mean(reference)) / sd;
}

/** Count values that satisfy a predicate (finite values only). */
export function countWhere(values: readonly number[], pred: (v: number) => boolean): number {
  return finite(values).filter(pred).length;
}
