import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildDailyClimate, RAW_CLIMATE_VARS, type DailyClimate, type RawClimateVar } from '../src';

/** Real NASA POWER data for Hyderabad (data/hyderabad/power_daily.json), loaded only in tests. */
export function hyderabadSeries(): DailyClimate {
  const path = fileURLToPath(new URL('../../../data/hyderabad/power_daily.json', import.meta.url));
  const f = JSON.parse(readFileSync(path, 'utf8')) as {
    start: string;
    location: { lat: number; lon: number; elevationM: number };
    provenance: DailyClimate['provenance'];
    values: Record<RawClimateVar, (number | null)[]>;
  };
  const raw = {} as Record<RawClimateVar, number[]>;
  for (const v of RAW_CLIMATE_VARS) raw[v] = f.values[v].map((x) => (x === null ? Number.NaN : x));
  return buildDailyClimate(f.start, raw, f.location, f.provenance);
}
