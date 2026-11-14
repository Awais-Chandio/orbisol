/**
 * Orbisol core - crop water need (FAO-56: ETc = Kc x ET0) and monthly climate hazards from a daily series.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { mean } from '../stats';
import { dayOfYear } from '../season/et0';
import { addDays, yearOf } from '../season/dates';
import { HEAVY_RAIN_MM, FROST_TMIN_C, WMO_NORMAL } from '../season/indicators';
import type { DailyClimate } from '../season/series';
import { kcOnDay, slotDayIndex, YEAR_DAYS, type CropSlot } from './calendar';

/** Mean daily ET0 for each day of year (index 0 = Jan 1) over the normal period, smoothed with a 31-day window. */
export function et0Climatology(s: DailyClimate, from = WMO_NORMAL.from, to = WMO_NORMAL.to): number[] {
  const buckets: number[][] = Array.from({ length: YEAR_DAYS }, () => []);
  const et0 = s.values.et0;
  for (let i = 0; i < et0.length; i++) {
    const date = addDays(s.start, i);
    const y = yearOf(date);
    if (y < from || y > to) continue;
    const doy = Math.min(dayOfYear(date), YEAR_DAYS);
    const v = et0[i]!;
    if (Number.isFinite(v)) buckets[doy - 1]!.push(v);
  }
  const raw = buckets.map((b) => mean(b));
  return raw.map((_, i) => {
    const w: number[] = [];
    for (let k = -15; k <= 15; k++) w.push(raw[(i + k + YEAR_DAYS) % YEAR_DAYS]!);
    return mean(w);
  });
}

export interface WaterNeed {
  /** Crop evapotranspiration over the season, mm (FAO-56 Kc range midpoints). */
  mm: number;
  /** Using the low / high ends of the FAO-56 Kc ranges. */
  low: number;
  high: number;
}

export function slotWaterNeed(slot: CropSlot, et0Clim: readonly number[]): WaterNeed {
  let mm = 0;
  let low = 0;
  let high = 0;
  for (let d = 1; d <= YEAR_DAYS; d++) {
    const i = slotDayIndex(slot, d);
    if (i < 0 || i >= Math.min(slot.days, YEAR_DAYS)) continue;
    const e = et0Clim[d - 1]!;
    mm += kcOnDay(slot, i, 'mid') * e;
    low += kcOnDay(slot, i, 'low') * e;
    high += kcOnDay(slot, i, 'high') * e;
  }
  return { mm, low, high };
}

export interface MonthClimate {
  month: number;
  tmaxMean: number;
  rainMm: number;
  et0Mm: number;
  frostDaysPerYear: number;
  heavyRainDaysPerYear: number;
  /** Mean wind speed at 2 m, m/s. */
  windMean: number;
}

/** Month-by-month normals (1991-2020) from the daily series. */
export function monthlyClimate(s: DailyClimate, from = WMO_NORMAL.from, to = WMO_NORMAL.to): MonthClimate[] {
  const acc = Array.from({ length: 12 }, () => ({ tmax: [] as number[], wind: [] as number[], rain: 0, et0: 0, frost: 0, heavy: 0, rainN: 0, et0N: 0 }));
  const years = new Set<number>();
  for (let i = 0; i < s.values.tmax.length; i++) {
    const date = addDays(s.start, i);
    const y = yearOf(date);
    if (y < from || y > to) continue;
    years.add(y);
    const a = acc[Number(date.slice(5, 7)) - 1]!;
    const tx = s.values.tmax[i]!;
    const tn = s.values.tmin[i]!;
    const r = s.values.rain[i]!;
    const e = s.values.et0[i]!;
    if (Number.isFinite(tx)) a.tmax.push(tx);
    const w = s.values.wind2m[i]!;
    if (Number.isFinite(w)) a.wind.push(w);
    if (Number.isFinite(tn) && tn < FROST_TMIN_C) a.frost++;
    if (Number.isFinite(r)) {
      a.rain += r;
      a.rainN++;
      if (r >= HEAVY_RAIN_MM) a.heavy++;
    }
    if (Number.isFinite(e)) {
      a.et0 += e;
      a.et0N++;
    }
  }
  const ny = Math.max(1, years.size);
  return acc.map((a, m) => ({
    month: m + 1,
    tmaxMean: mean(a.tmax),
    rainMm: a.rain / ny,
    et0Mm: a.et0N ? a.et0 / ny : Number.NaN,
    frostDaysPerYear: a.frost / ny,
    heavyRainDaysPerYear: a.heavy / ny,
    windMean: mean(a.wind),
  }));
}

/**
 * Hazard months (design choices, documented in docs/limitations.md):
 * - hot: the 3 months with the highest mean Tmax at this location;
 * - frost / heavy rain: months where such days happen on average at least once every two years.
 */
export const HOT_MONTHS = 3;
export const HAZARD_DAYS_PER_YEAR = 0.5;

export interface HazardMonths {
  hot: number[];
  frost: number[];
  heavyRain: number[];
}

export function hazardMonths(mc: readonly MonthClimate[]): HazardMonths {
  const hot = [...mc]
    .filter((m) => Number.isFinite(m.tmaxMean))
    .sort((a, b) => b.tmaxMean - a.tmaxMean)
    .slice(0, HOT_MONTHS)
    .map((m) => m.month)
    .sort((a, b) => a - b);
  return {
    hot,
    frost: mc.filter((m) => m.frostDaysPerYear >= HAZARD_DAYS_PER_YEAR).map((m) => m.month),
    heavyRain: mc.filter((m) => m.heavyRainDaysPerYear >= HAZARD_DAYS_PER_YEAR).map((m) => m.month),
  };
}

/** The `n` windiest months (highest mean 2 m wind), ascending by month number. */
export function windiestMonths(mc: readonly MonthClimate[], n = 3): number[] {
  return [...mc]
    .filter((m) => Number.isFinite(m.windMean))
    .sort((a, b) => b.windMean - a.windMean)
    .slice(0, n)
    .map((m) => m.month)
    .sort((a, b) => a - b);
}
