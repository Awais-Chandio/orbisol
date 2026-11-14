/**
 * Orbisol web - field pin store (persisted on device).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FieldPinSchema, type FieldPin } from '@/models/field';

interface FieldState {
  pin: FieldPin | null;
  setPin: (pin: FieldPin) => void;
  clearPin: () => void;
}

/** localStorage can throw (private mode, blocked storage); fall back to memory. */
const safeStorage = createJSONStorage(() => {
  try {
    const k = '__orbisol_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (n: string) => mem.get(n) ?? null,
      setItem: (n: string, v: string) => void mem.set(n, v),
      removeItem: (n: string) => void mem.delete(n),
    };
  }
});

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
