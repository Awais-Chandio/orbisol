/**
 * Orbisol web - farmer inputs (Zod): current rotation, priorities, canal turn, soil.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { z } from 'zod';
import { CROP_IDS, PRIORITIES, type CropId, type Priority } from '@orbisol/core';

const MonthDay = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);

export const FarmerSlotSchema = z.object({
  crop: z.enum(CROP_IDS as [CropId, ...CropId[]]),
  sow: MonthDay,
  harvest: MonthDay,
});
export type FarmerSlot = z.infer<typeof FarmerSlotSchema>;

export const FarmProfileSchema = z.object({
  rotation: z.array(FarmerSlotSchema).min(1).max(3),
  priorities: z
    .array(z.enum(PRIORITIES as unknown as [Priority, ...Priority[]]))
    .max(3)
    .refine((p) => new Set(p).size === p.length, 'Priorities must be unique'),
  canal: z.object({ intervalDays: z.number().int().min(1).max(60), hours: z.number().min(0.25).max(72) }).nullable(),
  soil: z.object({
    texture: z.enum(['sandy', 'loam', 'clay']).nullable(),
    salty: z.boolean().nullable(),
  }),
});
export type FarmProfileInput = z.infer<typeof FarmProfileSchema>;

/**
 * Cotton -> wheat, the demo farm's rotation and the first preset (one definition, so the numbers match wherever a
 * judge starts). Inside the cited Sindh Agriculture Department windows for Hyderabad: cotton sown May (mid), picked
 * 15 Sep - 31 Oct (late Oct); wheat sown 1-20 Nov (early Nov), harvested in March (late Mar).
 */
export const COTTON_WHEAT: FarmerSlot[] = [
  { crop: 'cotton', sow: '05-15', harvest: '10-25' },
  { crop: 'wheat', sow: '11-05', harvest: '03-25' },
];

/**
 * One-tap starting points for common Sindh rotations. Dates sit inside the cited windows in core crop rules
 * (Sindh Agriculture Department sowing calendar; Feedipedia for fodder), snapped to early / mid / late month.
 * The farmer adjusts them to their own dates afterwards.
 */
export const ROTATION_PRESETS: { id: string; rotation: FarmerSlot[] }[] = [
  { id: 'cotton_wheat', rotation: COTTON_WHEAT },
  {
    id: 'rice_wheat',
    rotation: [
      { crop: 'rice', sow: '05-05', harvest: '10-15' },
      { crop: 'wheat', sow: '11-15', harvest: '03-25' },
    ],
  },
  { id: 'sugarcane', rotation: [{ crop: 'sugarcane', sow: '02-25', harvest: '01-25' }] },
  {
    id: 'fodder',
    rotation: [
      { crop: 'sorghum_fodder', sow: '05-15', harvest: '08-05' },
      { crop: 'berseem', sow: '10-15', harvest: '04-25' },
    ],
  },
];

/** Demo farmer (Hyderabad case study): the cotton -> wheat preset. */
export const DEMO_FARM: FarmProfileInput = {
  rotation: COTTON_WHEAT,
  priorities: ['water_use', 'forage_value'],
  canal: null,
  // Loam: FAO-56 Table 19 middle class for the alluvial plain. No cited texture for the demo pin was found (Tandojam
  // field studies report several textures, e.g. clay loam at one site); sandy or clay stay a farmer's choice.
  soil: { texture: 'loam', salty: null },
};

/** Farmers think in months and early/mid/late; stored as MM-DD (5th / 15th / 25th). */
export const PARTS = { early: '05', mid: '15', late: '25' } as const;
export type MonthPart = keyof typeof PARTS;

export function toMonthDay(month: number, part: MonthPart): string {
  return `${String(month).padStart(2, '0')}-${PARTS[part]}`;
}

export function fromMonthDay(md: string): { month: number; part: MonthPart } {
  const month = Number(md.slice(0, 2));
  const day = Number(md.slice(3, 5));
  return { month, part: day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late' };
}
