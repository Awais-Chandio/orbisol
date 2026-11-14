/**
 * Orbisol web - farmer inputs store (persisted on device, Zod-validated).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { COTTON_WHEAT, DEMO_FARM, FarmProfileSchema, type FarmProfileInput } from '@/models/farm';
import { safeStorage } from './storage';

/** The demo rotation before it moved inside the cited wheat harvest window (harvest mid-April -> late March). */
const OLD_DEMO_ROTATION = JSON.stringify([
  { crop: 'cotton', sow: '05-15', harvest: '10-25' },
  { crop: 'wheat', sow: '11-05', harvest: '04-15' },
]);

interface FarmState {
  farm: FarmProfileInput;
  update: (patch: Partial<FarmProfileInput>) => void;
  reset: () => void;
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      farm: DEMO_FARM,
      update: (patch) => {
        const next = FarmProfileSchema.safeParse({ ...get().farm, ...patch });
        if (next.success) set({ farm: next.data });
      },
      reset: () => set({ farm: DEMO_FARM }),
    }),
    {
      name: 'orbisol.farm',
      version: 1,
      storage: safeStorage,
      merge: (persisted, current) => {
        const parsed = FarmProfileSchema.safeParse((persisted as { farm?: unknown } | undefined)?.farm);
        if (!parsed.success) return { ...current, farm: DEMO_FARM };
        // A device that saved the old demo rotation gets the current one, so the demo numbers match everywhere.
        const farm = JSON.stringify(parsed.data.rotation) === OLD_DEMO_ROTATION ? { ...parsed.data, rotation: COTTON_WHEAT } : parsed.data;
        return { ...current, farm };
      },
    },
  ),
);
