/**
 * Orbisol web - 2050 heat outlook file (pipeline/scripts/cmip6_heat.py, orbisol.heat2050.v1), validated with Zod.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';

const Range = z.tuple([z.number(), z.number()]).nullable();
const Scen = z.object({ years: z.number(), hotDays: z.number().nullable(), change: z.number().optional() });

export const Heat2050Schema = z.object({
  format: z.literal('orbisol.heat2050.v1'),
  hotTmaxC: z.number(),
  baseline: z.object({ from: z.number(), to: z.number() }),
  future: z.object({ from: z.number(), to: z.number() }),
  models: z.array(z.object({ model: z.string(), baselineHotDays: z.number().nullable(), ssp245: Scen, ssp585: Scen.optional() })),
  range: z.object({
    baselineHotDays: z.tuple([z.number(), z.number()]),
    ssp245: z.object({ hotDays: Range, change: Range }),
    ssp585: z.object({ hotDays: Range, change: Range }).optional(),
  }),
  provenance: z.object({ source: z.string(), kind: z.literal('model'), date: z.string(), dateFrom: z.string().optional(), url: z.string().optional() }),
});
export type Heat2050 = z.infer<typeof Heat2050Schema>;
