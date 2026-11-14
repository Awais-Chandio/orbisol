import { addDays, CLIMATE_VARS, daysBetween, type ClimateVar, type DailyClimate } from '../src';

/** Build a synthetic series from start to end with per-day generator functions (et0 given directly). */
export function makeSeries(
  start: string,
  end: string,
  gen: Partial<Record<ClimateVar, (date: string, i: number) => number>>,
): DailyClimate {
  const n = daysBetween(start, end) + 1;
  const values = {} as Record<ClimateVar, number[]>;
  for (const v of CLIMATE_VARS) {
    const f = gen[v] ?? (() => 0);
    values[v] = Array.from({ length: n }, (_, i) => f(addDays(start, i), i));
  }
  return {
    start,
    values,
    provenance: { source: 'test', kind: 'model', date: end },
    location: { lat: 25.4, lon: 68.37, elevationM: 92 },
  };
}
