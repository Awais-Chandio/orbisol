/**
 * Orbisol core - "warming stripes" data: annual mean temperature ((Tmax + Tmin) / 2, daily, averaged over each
 * complete calendar year) and its difference from the mean of the WMO normal years 1991-2020.
 * Stripe design: #ShowYourStripes by Ed Hawkins (CC BY 4.0). Read-only view of the same daily NASA POWER series;
 * nothing else in Orbisol uses these numbers.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { finite, mean } from '../stats';
import { coverage, seriesEnd, sliceVar, type DailyClimate } from './series';
import { MIN_COVERAGE, WMO_NORMAL } from './indicators';

export const STRIPES_FROM = 1990;
export const STRIPES_TO = 2025;

export interface StripeYear {
  year: number;
  /** Annual mean of daily (Tmax + Tmin) / 2, °C. */
  meanC: number;
  /** meanC minus the 1991-2020 mean, °C. */
  anomalyC: number;
}

export interface ClimateStripes {
  years: StripeYear[];
  /** Mean of the annual means 1991-2020, °C. */
  normalC: number;
  /** Largest |anomaly|, for a symmetric colour scale. */
  maxAbsC: number;
}

export function climateStripes(s: DailyClimate, from = STRIPES_FROM, to = STRIPES_TO): ClimateStripes | null {
  const end = seriesEnd(s);
  const raw: { year: number; meanC: number }[] = [];
  for (let y = Math.max(from, Number(s.start.slice(0, 4))); y <= to && `${y}-12-31` <= end; y++) {
    const w = { start: `${y}-01-01`, end: `${y}-12-31` };
    const tx = sliceVar(s, 'tmax', w);
    const tn = sliceVar(s, 'tmin', w);
    const tm = tx.map((x, i) => (x + tn[i]!) / 2);
    if (coverage(tm) < MIN_COVERAGE) continue;
    raw.push({ year: y, meanC: mean(finite(tm)) });
  }
  const base = raw.filter((v) => v.year >= WMO_NORMAL.from && v.year <= WMO_NORMAL.to);
  if (raw.length < 10 || base.length < 20) return null;
  const normalC = mean(base.map((v) => v.meanC));
  const years = raw.map((v) => ({ ...v, anomalyC: v.meanC - normalC }));
  return { years, normalC, maxAbsC: Math.max(...years.map((v) => Math.abs(v.anomalyC))) };
}
