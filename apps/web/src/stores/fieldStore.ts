/**
 * Orbisol web - field pin store (persisted on device).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from './storage';
import { FieldPinSchema, type FieldPin } from '@/models/field';

interface FieldState {
  pin: FieldPin | null;
  setPin: (pin: FieldPin) => void;
  clearPin: () => void;
}

export const useFieldStore = create<FieldState>()(
  persist(
    (set) => ({
      pin: null,
      setPin: (pin) => set({ pin: FieldPinSchema.parse(pin) }),
      clearPin: () => set({ pin: null }),
    }),
    {
      name: 'orbisol.field',
      version: 1,
      storage: safeStorage,
      // Drop a corrupted persisted pin instead of crashing.
      merge: (persisted, current) => {
        const p = (persisted as { pin?: unknown } | undefined)?.pin;
        const parsed = FieldPinSchema.safeParse(p);
        return { ...current, pin: parsed.success ? parsed.data : null };
      },
    },
  ),
);
