/**
 * Orbisol web - Zod models for the offline place search index (GeoNames, CC BY 4.0).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';
import { ProvenanceSchema } from './climate';

export const PlaceRowSchema = z.tuple([
  z.string(),
  z.string(),
  z.string(),
  z.number().min(-90).max(90),
  z.number().min(-180).max(180),
  z.number().nonnegative(),
]);

export const PlacesIndexSchema = z.object({
  format: z.literal('orbisol.places-index.v1'),
  provenance: ProvenanceSchema,
  shards: z.array(z.string().regex(/^[a-z0-9]{2,10}~?$/)),
});
export type PlacesIndex = z.infer<typeof PlacesIndexSchema>;

export const PlacesShardSchema = z.object({
  format: z.literal('orbisol.places.v1'),
  rows: z.array(PlaceRowSchema),
});
