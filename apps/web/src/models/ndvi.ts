/**
 * Orbisol web - Zod model for precomputed cropland NDVI ("orbisol.ndvi.v1").
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';
import type { CompositeSeries } from '@orbisol/core';
import { ProvenanceSchema } from './climate';

export const NdviFileSchema = z.object({
  format: z.literal('orbisol.ndvi.v1'),
  location: z.object({ lat: z.number(), lon: z.number(), label: z.string().optional() }),
  provenance: ProvenanceSchema,
  method: z.object({ windowKm: z.number(), mask: z.string(), quality: z.string(), statistic: z.string() }).passthrough(),
  series: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      ndvi: z.number().min(-1).max(1).nullable(),
      n: z.number().int().nonnegative(),
    }),
  ),
});
export type NdviFile = z.infer<typeof NdviFileSchema>;

export function ndviToSeries(f: NdviFile): CompositeSeries {
  return {
    points: f.series.map((p) => ({ date: p.date, value: p.ndvi ?? Number.NaN })),
    provenance: f.provenance,
  };
}
