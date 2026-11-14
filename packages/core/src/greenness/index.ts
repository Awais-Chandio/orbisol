/**
 * Orbisol core - greenness (NDVI) from 16-day satellite composites: this window vs normal, and what greenness
 * did after the same window in past years (the Season Twins outcome).
 * Normal period for MODIS: 2001-2020 (MODIS starts in 2000, so the WMO 1991-2020 period is not available).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { Provenance } from '../types';
import { finite, mean } from '../stats';
import { addDays, daysBetween, yearOf } from '../season/dates';
import { compareToBaseline, type IndicatorComparison } from '../season/indicators';
import { windowEndingOn, windowInYear, type DateWindow } from '../season/series';

export interface Composite {
  /** First day of the 16-day composite (ISO). */
  date: string;
  /** NDVI (-1..1); NaN when missing. */
  value: number;
}

export interface CompositeSeries {
  points: Composite[];
  provenance: Provenance;
}

export const NDVI_NORMAL = { from: 2001, to: 2020 } as const;
/** Composite length in days. */
export const COMPOSITE_DAYS = 16;
/** A window needs at least this many valid composites to count. */
export const MIN_COMPOSITES = 1;

/** Mean of composites whose start date falls inside the window. */
export function compositeMean(points: readonly Composite[], w: DateWindow): { value: number; n: number } {
  const xs = finite(points.filter((p) => p.date >= w.start && p.date <= w.end).map((p) => p.value));
  return { value: xs.length >= MIN_COMPOSITES ? mean(xs) : Number.NaN, n: xs.length };
}

export function lastValidComposite(points: readonly Composite[]): Composite | null {
  for (let i = points.length - 1; i >= 0; i--) if (Number.isFinite(points[i]!.value)) return points[i]!;
  return null;
}

export interface GreennessComparison {
  window: DateWindow;
  comparison: IndicatorComparison;
  composites: number;
  perYear: { year: number; value: number }[];
}

/** Greenness over the last `lengthDays` (ending with the latest composite) vs the same days in 2001-2020. */
export function compareGreenness(s: CompositeSeries, lengthDays: number, base = NDVI_NORMAL): GreennessComparison | null {
  const last = lastValidComposite(s.points);
  if (!last) return null;
  const end = addDays(last.date, COMPOSITE_DAYS - 1);
  const window = windowEndingOn(end, lengthDays);
  const cur = compositeMean(s.points, window);
  const first = yearOf(s.points[0]!.date);
  const perYear: { year: number; value: number }[] = [];
  for (let y = first; y < yearOf(end); y++) {
    const v = compositeMean(s.points, windowInYear(window, y)).value;
    if (Number.isFinite(v)) perYear.push({ year: y, value: v });
  }
  const baseline = perYear.filter((p) => p.year >= base.from && p.year <= base.to).map((p) => p.value);
  return { window, comparison: compareToBaseline(cur.value, baseline), composites: cur.n, perYear };
}

/**
 * Mean greenness in the `horizonDays` after a climate window, for every year with data
 * (what greenness did next in each year; used as the Season Twins outcome).
 */
export function greennessAfter(s: CompositeSeries, climateWindow: DateWindow, horizonDays: number): Map<number, number> {
  const out = new Map<number, number>();
  const first = yearOf(s.points[0]?.date ?? '2000-01-01');
  const last = lastValidComposite(s.points);
  if (!last) return out;
  for (let y = first; y <= yearOf(last.date); y++) {
    const w = windowInYear(climateWindow, y);
    const next = windowEndingOn(addDays(w.end, horizonDays), horizonDays);
    if (daysBetween(next.end, last.date) < -COMPOSITE_DAYS) continue; // not observed yet
    const v = compositeMean(s.points, next).value;
    if (Number.isFinite(v)) out.set(y, v);
  }
  return out;
}
