/**
 * Orbisol web - safe persisted storage for Zustand (falls back to memory when localStorage is blocked).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { createJSONStorage } from 'zustand/middleware';

export const safeStorage = createJSONStorage(() => {
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
