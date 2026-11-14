/**
 * Orbisol web - Zod models for precomputed satellite point data: GPM IMERG rain and SRTM slope.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';
import type { DailyRain } from '@orbisol/core';
import { ProvenanceSchema } from './climate';

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const RainFileSchema = z.object({
  format: z.literal('orbisol.rain.v1'),
  location: z.object({ lat: z.number(), lon: z.number(), cell: z.object({ lat: z.number(), lon: z.number(), sizeDeg: z.number() }) }).passthrough(),
  provenance: ProvenanceSchema,
  start: IsoDate,
  firstLateDay: IsoDate.nullable(),
  units: z.literal('mm/day'),
  rain: z.array(z.number().min(0).max(2000).nullable()),
});

export function rainToSeries(f: z.infer<typeof RainFileSchema>): DailyRain {
  return { start: f.start, rain: f.rain.map((x) => (x === null ? Number.NaN : x)), provenance: f.provenance };
}

export const SlopeFileSchema = z.object({
  format: z.literal('orbisol.slope.v1'),
  location: z.object({ lat: z.number(), lon: z.number() }).passthrough(),
  provenance: ProvenanceSchema,
  method: z.object({ windowKm: z.number(), note: z.string() }).passthrough(),
  slopePct: z.object({ primary: z.number().min(0), planeFit: z.number().min(0) }).passthrough(),
  faoClass: z.object({ code: z.string(), name: z.string() }),
});
export type SlopeFile = z.infer<typeof SlopeFileSchema>;

/** Monthly satellite rain (pipeline/scripts/imerg_monthly.py, "orbisol.rainm.v1"). */
export const RainMonthlyFileSchema = z.object({
  format: z.literal('orbisol.rainm.v1'),
  location: z.object({ lat: z.number(), lon: z.number() }).passthrough(),
  provenance: ProvenanceSchema,
  units: z.literal('mm/month'),
  reference: z.string(),
  months: z.array(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), mm: z.number().nonnegative().nullable() })),
});
export type RainMonthlyFile = z.infer<typeof RainMonthlyFileSchema>;
