/**
 * Orbisol web - farmer inputs store (persisted on device, Zod-validated).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEMO_FARM, FarmProfileSchema, type FarmProfileInput } from '@/models/farm';
import { safeStorage } from './storage';

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
        return { ...current, farm: parsed.success ? parsed.data : DEMO_FARM };
      },
    },
  ),
);
