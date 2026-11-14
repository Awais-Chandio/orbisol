/**
 * Orbisol core - season indicators and "this season vs normal" comparison.
 *
 * Definitions (cited, not invented):
 * - Frost days: Tmin < 0 °C (ETCCDI index FD).
 * - Very heavy rain days: daily rain >= 20 mm (ETCCDI index R20mm).
 * - Hot days: days with Tmax above the 90th percentile of the same window in the baseline
 *   period (adapted from ETCCDI TX90p, pooled over the window instead of a 5-day calendar window).
 * - Normal: median of the same window in the WMO standard normal period 1991-2020.
 * - Evaporation demand: sum of daily FAO-56 reference evapotranspiration (ET0).
 * - Water balance: rain minus ET0 (climatic water balance).
 * - Below / near / above normal: terciles of the baseline years (WMO seasonal practice).
 * ETCCDI: Zhang et al. (2011), WIREs Climate Change 2:851-870, https://doi.org/10.1002/wcc.147
 *
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { countWhere, finite, mean, percentile, sum } from '../stats';
import { yearOf } from './dates';
import {
  coverage,
  lastCompleteDate,
  sliceVar,
  windowEndingOn,
  windowInYear,
  type DailyClimate,
  type DateWindow,
} from './series';

export const FROST_TMIN_C = 0; // ETCCDI FD
export const HEAVY_RAIN_MM = 20; // ETCCDI R20mm
export const HOT_PERCENTILE = 90; // ETCCDI TX90p (adapted)
export const WMO_NORMAL = { from: 1991, to: 2020 } as const;
/** A window needs this share of valid days to count. */
export const MIN_COVERAGE = 0.8;

export const INDICATORS = [
  'hotDays',
  'tmaxMean',
  'frostDays',
  'rainTotal',
  'heavyRainDays',
  'soilWetness',
  'et0Total',
  'waterBalance',
] as const;
export type IndicatorKey = (typeof INDICATORS)[number];

export type SeasonIndicators = Record<IndicatorKey, number>;

export interface Thresholds {
  hotTmaxC: number;
}

export function computeIndicators(s: DailyClimate, w: DateWindow, t: Thresholds): { values: SeasonIndicators; coverage: number } {
  const tmax = sliceVar(s, 'tmax', w);
  const tmin = sliceVar(s, 'tmin', w);
  const rain = sliceVar(s, 'rain', w);
  const soil = sliceVar(s, 'soilWetness', w);
  const et0 = sliceVar(s, 'et0', w);
  const cov = Math.min(coverage(tmax), coverage(tmin), coverage(rain));
  const rainTotal = sum(rain);
  // ET0 needs solar radiation, which arrives a few days later than temperature; scale up small gaps.
  const et0Cov = coverage(et0);
  const et0Total = et0Cov >= MIN_COVERAGE ? (sum(et0) / et0Cov) : Number.NaN;
  return {
    coverage: cov,
    values: {
      hotDays: countWhere(tmax, (x) => x > t.hotTmaxC),
      tmaxMean: mean(tmax),
      frostDays: countWhere(tmin, (x) => x < FROST_TMIN_C),
      rainTotal,
      heavyRainDays: countWhere(rain, (x) => x >= HEAVY_RAIN_MM),
      soilWetness: coverage(soil) >= MIN_COVERAGE ? mean(soil) : Number.NaN,
      et0Total,
      waterBalance: rainTotal - et0Total,
    },
  };
}

export type Tercile = 'below' | 'near' | 'above';

export interface IndicatorComparison {
  current: number;
  /** Median of baseline years (consistent with the tercile labels). */
  normal: number;
  mean: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
  /** Share of baseline years below current (ties count half), 0-1. NaN if not comparable. */
  rank: number;
  tercile: Tercile | null;
  nYears: number;
}

/** Mid-rank percentile of x among a reference sample (ties count half). */
export function midRank(x: number, ref: readonly number[]): number {
  const xs = finite(ref);
  if (!Number.isFinite(x) || xs.length === 0) return Number.NaN;
  const below = xs.filter((v) => v < x).length;
  const equal = xs.filter((v) => v === x).length;
  return (below + equal / 2) / xs.length;
}

export function tercileOf(rank: number): Tercile | null {
  if (!Number.isFinite(rank)) return null;
  if (rank < 1 / 3) return 'below';
  if (rank > 2 / 3) return 'above';
  return 'near';
}

export function compareToBaseline(current: number, baseline: readonly number[]): IndicatorComparison {
  const xs = finite(baseline);
  const rank = midRank(current, xs);
  return {
    current,
    normal: percentile(xs, 50),
    mean: mean(xs),
    p10: percentile(xs, 10),
    p90: percentile(xs, 90),
    min: xs.length ? Math.min(...xs) : Number.NaN,
    max: xs.length ? Math.max(...xs) : Number.NaN,
    rank,
    tercile: tercileOf(rank),
    nYears: xs.length,
  };
}

export interface YearIndicators {
  year: number;
  window: DateWindow;
  values: SeasonIndicators;
  coverage: number;
}

export interface SeasonComparison {
  window: DateWindow;
  lengthDays: number;
  baseline: { from: number; to: number; years: number[] };
  thresholds: Thresholds;
  current: SeasonIndicators;
  currentCoverage: number;
  comparisons: Record<IndicatorKey, IndicatorComparison>;
  /** Same window in every year with enough data (used later for Season Twins and trends). */
  perYear: YearIndicators[];
}

export interface CompareOptions {
  lengthDays: number;
  /** Window end; defaults to the last date with complete temperature and rain data. */
  end?: string;
  baseline?: { from: number; to: number };
}

/** "This season vs normal" for one location. */
export function compareSeason(s: DailyClimate, opts: CompareOptions): SeasonComparison {
  const end = opts.end ?? lastCompleteDate(s);
  if (!end) throw new Error('No complete days in series');
  const window = windowEndingOn(end, opts.lengthDays);
  const base = opts.baseline ?? WMO_NORMAL;
  const currentYear = yearOf(end);
  const firstYear = yearOf(s.start);

  const yearWindows: { year: number; w: DateWindow }[] = [];
  for (let y = firstYear; y < currentYear; y++) yearWindows.push({ year: y, w: windowInYear(window, y) });

  // Hot-day threshold: 90th percentile of Tmax pooled over the baseline windows.
  const pooled: number[] = [];
  for (const { year, w } of yearWindows) {
    if (year < base.from || year > base.to) continue;
    const tx = sliceVar(s, 'tmax', w);
    if (coverage(tx) >= MIN_COVERAGE) pooled.push(...finite(tx));
  }
  const thresholds: Thresholds = { hotTmaxC: percentile(pooled, HOT_PERCENTILE) };

  const perYear: YearIndicators[] = [];
  for (const { year, w } of yearWindows) {
    const r = computeIndicators(s, w, thresholds);
    if (r.coverage >= MIN_COVERAGE) perYear.push({ year, window: w, values: r.values, coverage: r.coverage });
  }
  const baseYears = perYear.filter((p) => p.year >= base.from && p.year <= base.to);
  const cur = computeIndicators(s, window, thresholds);

  const comparisons = {} as Record<IndicatorKey, IndicatorComparison>;
  for (const k of INDICATORS) {
    comparisons[k] = compareToBaseline(
      cur.values[k],
      baseYears.map((p) => p.values[k]),
    );
  }

  return {
    window,
    lengthDays: opts.lengthDays,
    baseline: { from: base.from, to: base.to, years: baseYears.map((p) => p.year) },
    thresholds,
    current: cur.values,
    currentCoverage: cur.coverage,
    comparisons,
    perYear,
  };
}
