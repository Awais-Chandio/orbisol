/**
 * Orbisol web - "My farm" controller: edits the farmer's inputs through the validated store.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { CropId } from '@orbisol/core';
import { fromMonthDay, toMonthDay, type FarmerSlot, type FarmProfileInput, type MonthPart } from '@/models/farm';
import { useFarmStore } from '@/stores/farmStore';

export function useFarmProfile() {
  const farm = useFarmStore((s) => s.farm);
  const update = useFarmStore((s) => s.update);
  const reset = useFarmStore((s) => s.reset);

  const setSlot = (i: number, patch: Partial<FarmerSlot>) =>
    update({ rotation: farm.rotation.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setDate = (i: number, field: 'sow' | 'harvest', month: number, part: MonthPart) =>
    setSlot(i, { [field]: toMonthDay(month, part) });
  const setCrop = (i: number, crop: CropId) => setSlot(i, { crop });
  const addSlot = () =>
    farm.rotation.length < 3 && update({ rotation: [...farm.rotation, { crop: 'mungbean', sow: '06-15', harvest: '08-25' }] });
  const removeSlot = (i: number) => farm.rotation.length > 1 && update({ rotation: farm.rotation.filter((_, j) => j !== i) });
  const set = (patch: Partial<FarmProfileInput>) => update(patch);

  return { farm, setCrop, setDate, addSlot, removeSlot, set, reset, fromMonthDay };
}
