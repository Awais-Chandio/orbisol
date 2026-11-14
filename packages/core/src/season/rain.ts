/**
 * Orbisol core - "this season vs normal" for a rain-only daily series (e.g. satellite GPM IMERG), so satellite
 * rain can be shown next to model rain. Uses the same windows, ETCCDI R20mm and tercile logic as compareSeason.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { Provenance } from '../types';
import { countWhere, sum } from '../stats';
import { addDays, daysBetween, yearOf } from './dates';
import { compareToBaseline, HEAVY_RAIN_MM, MIN_COVERAGE, type IndicatorComparison } from './indicators';
import { coverage, windowEndingOn, windowInYear, type DateWindow } from './series';

export interface DailyRain {
  start: string;
  /** mm/day; NaN = missing */
  rain: number[];
  provenance: Provenance;
}

export interface RainComparison {
  window: DateWindow;
  baseline: { from: number; to: number; years: number[] };
  coverage: number;
  rainTotal: IndicatorComparison;
  heavyRainDays: IndicatorComparison;
}

function sliceRain(s: DailyRain, w: DateWindow): number[] {
  const from = daysBetween(s.start, w.start);
  const n = daysBetween(w.start, w.end) + 1;
  return Array.from({ length: n }, (_, i) => s.rain[from + i] ?? Number.NaN);
}

export function compareRain(
  s: DailyRain,
  opts: { lengthDays: number; end?: string; baseline?: { from: number; to: number } },
): RainComparison | null {
  let last = -1;
  for (let i = s.rain.length - 1; i >= 0; i--) if (Number.isFinite(s.rain[i])) { last = i; break; }
  if (last < 0) return null;
  const end = opts.end ?? addDays(s.start, last);
  const base = opts.baseline ?? { from: 2001, to: 2020 };
  const window = windowEndingOn(end, opts.lengthDays);
  const cur = sliceRain(s, window);
  const totals: number[] = [];
  const heavy: number[] = [];
  const years: number[] = [];
  for (let y = base.from; y <= base.to; y++) {
    const xs = sliceRain(s, windowInYear(window, y));
    if (coverage(xs) < MIN_COVERAGE) continue;
    years.push(y);
    totals.push(sum(xs));
    heavy.push(countWhere(xs, (x) => x >= HEAVY_RAIN_MM));
  }
  if (yearOf(end) <= base.to) return null;
  return {
    window,
    baseline: { ...base, years },
    coverage: coverage(cur),
    rainTotal: compareToBaseline(sum(cur), totals),
    heavyRainDays: compareToBaseline(countWhere(cur, (x) => x >= HEAVY_RAIN_MM), heavy),
  };
}
