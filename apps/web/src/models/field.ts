/**
 * Orbisol web - field pin model (Zod-validated).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';

export const LatLonSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
});

export const PinSourceSchema = z.enum(['gps', 'map', 'manual', 'demo', 'search']);
export type PinSource = z.infer<typeof PinSourceSchema>;

export const FieldPinSchema = LatLonSchema.extend({
  source: PinSourceSchema,
  /** GPS accuracy in metres, when known. */
  accuracyM: z.number().nonnegative().optional(),
  label: z.string().max(80).optional(),
  pinnedAt: z.string(),
});
export type FieldPin = z.infer<typeof FieldPinSchema>;

/** Round to 4 decimals (~11 m): enough for a field, avoids false precision. */
export function roundCoord(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}
