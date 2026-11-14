/**
 * Orbisol core - observed long-term trend (not a forecast): hot days per year and the yearly climatic water balance
 * (rain minus FAO-56 ET0) from the daily NASA POWER series, with a least-squares change per decade.
 *
 * Hot day (yearly view): Tmax above the 90th percentile of all daily Tmax in the WMO normal 1991-2020
 * (ETCCDI TX90p adapted: one fixed threshold pooled over the whole year, so hot days fall in the hot season).
 * The same threshold (degrees C) is used for the 2050 projection card.
 * Warm night: Tmin above the 90th percentile of all daily Tmin in 1991-2020 (ETCCDI TN90p, adapted the same way).
 * Hottest day of the year: yearly maximum of daily Tmax (ETCCDI TXx).
 * Change per decade: ordinary least-squares slope x 10 with a 95% interval (slope +/- t * SE). If the interval
 * includes zero the trend is reported as unclear (could be year-to-year chance).
 *
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { finite, mean, percentile, sum } from '../stats';
import { coverage, seriesEnd, sliceVar, type DailyClimate } from './series';
import { HOT_PERCENTILE, MIN_COVERAGE, WMO_NORMAL } from './indicators';

export const TREND_FROM_YEAR = 1990;

export interface YearValue {
  year: number;
  hotDays: number;
  /** Nights with Tmin above the 1991-2020 90th percentile (TN90p, adapted). */
  warmNights: number;
  /** Hottest day of the year, °C (TXx). */
  txx: number;
  /** Rain minus ET0, mm per year. */
  waterBalance: number;
  rain: number;
  et0: number;
}

export interface LinearTrend {
  /** Change per decade (units per 10 years). */
  perDecade: number;
  /** 95% interval of the change per decade. */
  low: number;
  high: number;
  /** true when the 95% interval excludes zero. */
  clear: boolean;
  n: number;
  /** Fitted values at the first and last year (for drawing the line). */
  fitFirst: number;
  fitLast: number;
}

export type TrendMeasure = 'hotDays' | 'warmNights' | 'txx' | 'waterBalance';
export const TREND_MEASURES: TrendMeasure[] = ['hotDays', 'warmNights', 'txx', 'waterBalance'];

export interface ObservedTrend {
  hotTmaxC: number;
  warmTminC: number;
  fromYear: number;
  toYear: number;
  years: YearValue[];
  hotDays: LinearTrend | null;
  warmNights: LinearTrend | null;
  txx: LinearTrend | null;
  waterBalance: LinearTrend | null;
  /** Means of the first and last 10 years, for a plain-language comparison. */
  firstDecade: Record<TrendMeasure, number>;
  lastDecade: Record<TrendMeasure, number>;
}

/** Two-sided 97.5% Student t quantiles for small df; 1.96 beyond 120. */
function tQuantile(df: number): number {
  const table: [number, number][] = [
    [10, 2.228],
    [15, 2.131],
    [20, 2.086],
    [25, 2.06],
    [30, 2.042],
    [40, 2.021],
    [60, 2.0],
    [120, 1.98],
  ];
  for (const [d, q] of table) if (df <= d) return q;
  return 1.96;
}

export function linearTrend(xs: readonly number[], ys: readonly number[]): LinearTrend | null {
  const pts = xs.map((x, i) => [x, ys[i]!] as const).filter(([, y]) => Number.isFinite(y));
  const n = pts.length;
  if (n < 10) return null;
  const mx = mean(pts.map((p) => p[0]));
  const my = mean(pts.map((p) => p[1]));
  let sxx = 0;
  let sxy = 0;
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
  }
  const b = sxy / sxx;
  const a = my - b * mx;
  let sse = 0;
  for (const [x, y] of pts) sse += (y - (a + b * x)) ** 2;
  const se = Math.sqrt(sse / (n - 2) / sxx);
  const q = tQuantile(n - 2);
  const low = (b - q * se) * 10;
  const high = (b + q * se) * 10;
  return {
    perDecade: b * 10,
    low,
    high,
    clear: low > 0 || high < 0,
    n,
    fitFirst: a + b * pts[0]![0],
    fitLast: a + b * pts[n - 1]![0],
  };
}

/** A fixed yearly threshold: 90th percentile of daily Tmax (or Tmin) over 1991-2020. */
export function annualHotThreshold(s: DailyClimate, v: 'tmax' | 'tmin' = 'tmax'): number {
  const x = sliceVar(s, v, { start: `${WMO_NORMAL.from}-01-01`, end: `${WMO_NORMAL.to}-12-31` });
  return percentile(finite(x), HOT_PERCENTILE);
}

export function observedTrend(s: DailyClimate, fromYear = TREND_FROM_YEAR): ObservedTrend | null {
  const hot = annualHotThreshold(s);
  const warm = annualHotThreshold(s, 'tmin');
  if (!Number.isFinite(hot) || !Number.isFinite(warm)) return null;
  const firstYear = Math.max(fromYear, Number(s.start.slice(0, 4)));
  const years: YearValue[] = [];
  const end = seriesEnd(s);
  for (let y = firstYear; `${y}-12-31` <= end; y++) {
    // only complete calendar years
    const w = { start: `${y}-01-01`, end: `${y}-12-31` };
    const tx = sliceVar(s, 'tmax', w);
    const tn = sliceVar(s, 'tmin', w);
    const rain = sliceVar(s, 'rain', w);
    const et0 = sliceVar(s, 'et0', w);
    if (coverage(tx) < MIN_COVERAGE || coverage(tn) < MIN_COVERAGE || coverage(rain) < MIN_COVERAGE || coverage(et0) < MIN_COVERAGE) continue;
    // scale small gaps up to a full year (as for the season indicators)
    const rainY = sum(rain) / coverage(rain);
    const et0Y = sum(et0) / coverage(et0);
    const hotDays = Math.round(finite(tx).filter((x) => x > hot).length / coverage(tx));
    const warmNights = Math.round(finite(tn).filter((x) => x > warm).length / coverage(tn));
    years.push({ year: y, hotDays, warmNights, txx: Math.max(...finite(tx)), rain: rainY, et0: et0Y, waterBalance: rainY - et0Y });
  }
  if (years.length < 10) return null;
  const xs = years.map((v) => v.year);
  const first = years.slice(0, 10);
  const last = years.slice(-10);
  const decade = (ys: YearValue[]) =>
    Object.fromEntries(TREND_MEASURES.map((m) => [m, mean(ys.map((v) => v[m]))])) as Record<TrendMeasure, number>;
  return {
    hotTmaxC: hot,
    warmTminC: warm,
    fromYear: years[0]!.year,
    toYear: years[years.length - 1]!.year,
    years,
    hotDays: linearTrend(xs, years.map((v) => v.hotDays)),
    warmNights: linearTrend(xs, years.map((v) => v.warmNights)),
    txx: linearTrend(xs, years.map((v) => v.txx)),
    waterBalance: linearTrend(xs, years.map((v) => v.waterBalance)),
    firstDecade: decade(first),
    lastDecade: decade(last),
  };
}
