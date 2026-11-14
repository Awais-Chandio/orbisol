/**
 * Orbisol web - compact daily climate file ("orbisol.daily.v2"), used for the static data/ fallback
 * and the on-device cache. Stores raw variables only; ET0 is derived by the core engine.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';
import { buildDailyClimate, RAW_CLIMATE_VARS, type DailyClimate, type RawClimateVar } from '@orbisol/core';

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ProvenanceSchema = z.object({
  source: z.string(),
  kind: z.enum(['satellite', 'ground', 'model', 'reanalysis', 'farmer', 'reference']),
  date: IsoDate,
  dateFrom: IsoDate.optional(),
  url: z.string().url().optional(),
});

const Arr = z.array(z.number().nullable());

export const ClimateFileSchema = z
  .object({
    format: z.literal('orbisol.daily.v2'),
    generatedAt: z.string().optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      elevationM: z.number(),
      label: z.string().optional(),
    }),
    provenance: ProvenanceSchema,
    start: IsoDate,
    values: z.object({
      tmax: Arr,
      tmin: Arr,
      rain: Arr,
      soilWetness: Arr,
      tdew: Arr,
      wind2m: Arr,
      solar: Arr,
    }),
  })
  .refine((f) => RAW_CLIMATE_VARS.every((v) => f.values[v].length === f.values.tmax.length), {
    message: 'All variables must have the same length',
  });
export type ClimateFile = z.infer<typeof ClimateFileSchema>;

export function fileToSeries(f: ClimateFile): DailyClimate {
  const raw = {} as Record<RawClimateVar, number[]>;
  for (const v of RAW_CLIMATE_VARS) raw[v] = f.values[v].map((x) => (x === null ? Number.NaN : x));
  const { lat, lon, elevationM } = f.location;
  return buildDailyClimate(f.start, raw, { lat, lon, elevationM }, f.provenance);
}

export function seriesToFile(s: DailyClimate): ClimateFile {
  const values = {} as ClimateFile['values'];
  for (const v of RAW_CLIMATE_VARS) values[v] = s.values[v].map((x) => (Number.isFinite(x) ? x : null));
  return {
    format: 'orbisol.daily.v2',
    generatedAt: new Date().toISOString(),
    location: s.location,
    provenance: s.provenance,
    start: s.start,
    values,
  };
}
