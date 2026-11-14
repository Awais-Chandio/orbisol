/**
 * Orbisol web - Zod model for the NASA POWER daily point API response.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';

const DailyValues = z.record(z.string().regex(/^\d{8}$/), z.number());

export const PowerDailyResponseSchema = z.object({
  geometry: z.object({
    // [lon, lat, elevation m]
    coordinates: z.tuple([z.number(), z.number(), z.number()]),
  }),
  header: z.object({
    fill_value: z.number(),
    start: z.string(),
    end: z.string(),
    sources: z.array(z.string()).optional(),
  }),
  properties: z.object({
    parameter: z.object({
      T2M_MAX: DailyValues,
      T2M_MIN: DailyValues,
      PRECTOTCORR: DailyValues,
      GWETTOP: DailyValues,
      T2MDEW: DailyValues,
      WS2M: DailyValues,
      ALLSKY_SFC_SW_DWN: DailyValues,
    }),
  }),
  parameters: z
    .record(z.string(), z.object({ units: z.string(), longname: z.string() }))
    .optional(),
  messages: z.array(z.unknown()).optional(),
});
export type PowerDailyResponse = z.infer<typeof PowerDailyResponseSchema>;
