/**
 * Orbisol core - Track Record: honest hindcast of Season Twins.
 * For each past year Y, use only years before Y: find twins for Y's window, predict whether the outcome
 * ("what happened next") was above or below the normal of those earlier years, then check what really happened.
 * Compared with a naive baseline that always predicts the more common direction in the earlier years.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { finite, percentile } from '../stats';
import type { IndicatorKey, YearIndicators } from '../season/indicators';
import { DEFAULT_TWINS, directionOf, seasonTwins, TWIN_FEATURES, type Direction } from '../twins';

export interface BacktestRow {
  year: number;
  predicted: Direction;
  actual: Direction;
  hit: boolean;
  twins: number[];
  baselinePredicted: Direction;
}

export interface BacktestResult {
  rows: BacktestRow[];
  n: number;
  hits: number;
  hitRate: number;
  baselineHits: number;
  baselineRate: number;
}

export interface BacktestOptions {
  k?: number;
  minPastYears?: number;
  features?: readonly IndicatorKey[];
}

export function backtestTwins(
  perYear: readonly YearIndicators[],
  outcomes: ReadonlyMap<number, number>,
  opts: BacktestOptions = {},
): BacktestResult {
  const k = opts.k ?? DEFAULT_TWINS;
  const minPast = opts.minPastYears ?? 10;
  const features = opts.features ?? TWIN_FEATURES;
  const years = perYear.filter((p) => outcomes.has(p.year)).sort((a, b) => a.year - b.year);
  const rows: BacktestRow[] = [];

  for (let i = minPast; i < years.length; i++) {
    const target = years[i]!;
    const past = years.slice(0, i);
    const pastOutcomes = finite(past.map((p) => outcomes.get(p.year)!));
    const normal = percentile(pastOutcomes, 50);
    const { twins } = seasonTwins(target.values, past, k, features);
    if (twins.length === 0) continue;
    const ups = twins.filter((t) => directionOf(outcomes.get(t.year)!, normal) === 'above').length;
    const predicted: Direction = ups * 2 > twins.length ? 'above' : 'below';
    const actual = directionOf(outcomes.get(target.year)!, normal);
    const pastUps = pastOutcomes.filter((v) => directionOf(v, normal) === 'above').length;
    const baselinePredicted: Direction = pastUps * 2 > pastOutcomes.length ? 'above' : 'below';
    rows.push({ year: target.year, predicted, actual, hit: predicted === actual, twins: twins.map((t) => t.year), baselinePredicted });
  }
  const hits = rows.filter((r) => r.hit).length;
  const baselineHits = rows.filter((r) => r.baselinePredicted === r.actual).length;
  return {
    rows,
    n: rows.length,
    hits,
    hitRate: rows.length ? hits / rows.length : Number.NaN,
    baselineHits,
    baselineRate: rows.length ? baselineHits / rows.length : Number.NaN,
  };
}
