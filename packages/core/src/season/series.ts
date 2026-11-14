/**
 * Orbisol core - daily climate series and windowing.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { Provenance } from '../types';
import { addDays, daysBetween, sameDayInYear } from './dates';

import { dayOfYear, fao56Et0, satVapourPressure } from './et0';

/** Raw daily variables stored in files and caches. Missing values are NaN. */
export const RAW_CLIMATE_VARS = ['tmax', 'tmin', 'rain', 'soilWetness', 'tdew', 'wind2m', 'solar'] as const;
export type RawClimateVar = (typeof RAW_CLIMATE_VARS)[number];
/** All variables, including derived reference evapotranspiration (et0). */
export const CLIMATE_VARS = [...RAW_CLIMATE_VARS, 'et0'] as const;
export type ClimateVar = (typeof CLIMATE_VARS)[number];

export interface DailyClimate {
  /** ISO date of index 0; index i is start + i days. */
  start: string;
  /**
   * tmax/tmin/tdew °C, rain mm/day, soilWetness 0-1 (share of pore space holding water),
   * wind2m m/s, solar MJ m-2 day-1, et0 mm/day (FAO-56).
   */
  values: Record<ClimateVar, number[]>;
  provenance: Provenance;
  location: { lat: number; lon: number; elevationM: number };
}

/** Build a full series from raw variables, deriving daily FAO-56 ET0. */
export function buildDailyClimate(
  start: string,
  raw: Record<RawClimateVar, number[]>,
  location: DailyClimate['location'],
  provenance: Provenance,
): DailyClimate {
  const n = raw.tmax.length;
  const et0 = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const tdew = raw.tdew[i] ?? Number.NaN;
    et0[i] = fao56Et0({
      tmaxC: raw.tmax[i] ?? Number.NaN,
      tminC: raw.tmin[i] ?? Number.NaN,
      eaKPa: Number.isFinite(tdew) ? satVapourPressure(tdew) : Number.NaN,
      rsMJ: raw.solar[i] ?? Number.NaN,
      u2: raw.wind2m[i] ?? Number.NaN,
      elevationM: location.elevationM,
      latDeg: location.lat,
      dayOfYear: dayOfYear(addDays(start, i)),
    });
  }
  return { start, values: { ...raw, et0 }, provenance, location };
}

/** Inclusive date window. */
export interface DateWindow {
  start: string;
  end: string;
}

export function seriesLength(s: DailyClimate): number {
  return s.values.tmax.length;
}

export function seriesEnd(s: DailyClimate): string {
  return addDays(s.start, seriesLength(s) - 1);
}

/** Last date where every listed variable has a finite value. */
export function lastCompleteDate(s: DailyClimate, vars: readonly ClimateVar[] = ['tmax', 'tmin', 'rain']): string | null {
  for (let i = seriesLength(s) - 1; i >= 0; i--) {
    if (vars.every((v) => Number.isFinite(s.values[v][i]))) return addDays(s.start, i);
  }
  return null;
}

export function windowEndingOn(end: string, lengthDays: number): DateWindow {
  if (lengthDays < 1) throw new Error('lengthDays must be >= 1');
  return { start: addDays(end, -(lengthDays - 1)), end };
}

/** Same window (same end month-day and length) in another year. */
export function windowInYear(w: DateWindow, year: number): DateWindow {
  const length = daysBetween(w.start, w.end) + 1;
  return windowEndingOn(sameDayInYear(w.end, year), length);
}

/** Values of one variable inside a window; days outside the series are NaN. */
export function sliceVar(s: DailyClimate, v: ClimateVar, w: DateWindow): number[] {
  const from = daysBetween(s.start, w.start);
  const n = daysBetween(w.start, w.end) + 1;
  const src = s.values[v];
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const x = src[from + i];
    out[i] = x === undefined ? Number.NaN : x;
  }
  return out;
}

/** Share (0-1) of days in a window with a finite value. */
export function coverage(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.filter((x) => Number.isFinite(x)).length / values.length;
}
