/**
 * Orbisol core - Season Twins: past years whose same window looked most like this season,
 * and what happened next in those years.
 * Similarity: root-mean-square difference of standardized indicators (z-scores over candidate years).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { finite, mean, percentile, stdDev } from '../stats';
import { addDays } from '../season/dates';
import {
  computeIndicators,
  MIN_COVERAGE,
  type IndicatorKey,
  type SeasonComparison,
  type SeasonIndicators,
  type YearIndicators,
} from '../season/indicators';
import { windowEndingOn, windowInYear, type DailyClimate } from '../season/series';

export const TWIN_FEATURES: IndicatorKey[] = ['tmaxMean', 'rainTotal', 'et0Total', 'soilWetness', 'hotDays'];
export const DEFAULT_TWINS = 3;

export interface Twin {
  year: number;
  /** RMS of z-score differences; 0 = identical, ~1 = one standard deviation apart on average. */
  distance: number;
}

export interface TwinsResult {
  twins: Twin[];
  features: IndicatorKey[];
}

export function seasonTwins(
  current: SeasonIndicators,
  candidates: readonly YearIndicators[],
  k = DEFAULT_TWINS,
  features: readonly IndicatorKey[] = TWIN_FEATURES,
): TwinsResult {
  const usable = features.filter((f) => {
    const xs = finite(candidates.map((c) => c.values[f]));
    const sd = stdDev(xs);
    return Number.isFinite(current[f]) && xs.length >= 3 && Number.isFinite(sd) && sd > 0;
  });
  const scale = Object.fromEntries(
    usable.map((f) => {
      const xs = finite(candidates.map((c) => c.values[f]));
      return [f, { m: mean(xs), sd: stdDev(xs) }];
    }),
  ) as Record<IndicatorKey, { m: number; sd: number }>;

  const scored: Twin[] = [];
  for (const c of candidates) {
    let sq = 0;
    let n = 0;
    for (const f of usable) {
      const v = c.values[f];
      if (!Number.isFinite(v)) continue;
      const z = (current[f] - v) / scale[f].sd;
      sq += z * z;
      n++;
    }
    if (n >= Math.max(1, Math.ceil(usable.length / 2))) scored.push({ year: c.year, distance: Math.sqrt(sq / n) });
  }
  scored.sort((a, b) => a.distance - b.distance || b.year - a.year);
  return { twins: scored.slice(0, k), features: usable };
}

/** Indicators for the `horizonDays` right after the comparison window, for every past year (what happened next). */
export function nextWindowIndicators(
  s: DailyClimate,
  cmp: SeasonComparison,
  horizonDays: number,
): Map<number, SeasonIndicators> {
  const out = new Map<number, SeasonIndicators>();
  for (const y of cmp.perYear) {
    const w = windowInYear(cmp.window, y.year);
    const next = windowEndingOn(addDays(w.end, horizonDays), horizonDays);
    const r = computeIndicators(s, next, cmp.thresholds);
    if (r.coverage >= MIN_COVERAGE) out.set(y.year, r.values);
  }
  return out;
}

export type Direction = 'above' | 'below';

export interface TwinOutlook {
  values: { year: number; value: number }[];
  /** Median outcome over the baseline years. */
  normal: number;
  above: number;
  below: number;
  /** Share of twins that agree with the majority direction (0.5-1). */
  agreement: number;
  direction: Direction | 'mixed';
  median: number;
  min: number;
  max: number;
  /** False when past outcomes barely vary (e.g. no hot days ever in this window): above/below says nothing. */
  informative: boolean;
}

/** Outcome above the normal (strictly) or not. */
export function directionOf(value: number, normal: number): Direction {
  return value > normal ? 'above' : 'below';
}

export function twinOutlook(twins: readonly Twin[], outcomes: ReadonlyMap<number, number>, baseline: readonly number[]): TwinOutlook {
  const base = finite(baseline);
  const normal = percentile(base, 50);
  const informative = base.length >= 5 && percentile(base, 90) > percentile(base, 10);
  const values = twins
    .map((t) => ({ year: t.year, value: outcomes.get(t.year) ?? Number.NaN }))
    .filter((v) => Number.isFinite(v.value));
  const above = values.filter((v) => directionOf(v.value, normal) === 'above').length;
  const below = values.length - above;
  const n = values.length;
  const xs = values.map((v) => v.value);
  return {
    values,
    normal,
    above,
    below,
    agreement: n ? Math.max(above, below) / n : 0,
    direction: above === below ? 'mixed' : above > below ? 'above' : 'below',
    median: percentile(xs, 50),
    min: xs.length ? Math.min(...xs) : Number.NaN,
    max: xs.length ? Math.max(...xs) : Number.NaN,
    informative,
  };
}
