/**
 * Orbisol core - rotation calendar on a 365-day year: crop slots, bare spans, FAO-56 stage dates, Kc curve.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { CROPS, type CropId, type CropRule } from './crops';

export const YEAR_DAYS = 365;
const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** 'MM-DD' -> day of year 1..365 (non-leap; Feb 29 -> Feb 28). */
export function mdToDoy(md: string): number {
  const m = /^(\d{2})-(\d{2})$/.exec(md);
  if (!m) throw new Error(`Invalid MM-DD: ${md}`);
  const month = Number(m[1]);
  const day = Math.min(Number(m[2]), month === 2 ? 28 : 31);
  if (month < 1 || month > 12) throw new Error(`Invalid month: ${md}`);
  return CUM[month - 1]! + day;
}

/** Wrap any integer onto 1..365. */
export function wrapDoy(d: number): number {
  return ((((d - 1) % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS) + 1;
}

export function doyToMd(doy: number): string {
  const d = wrapDoy(doy);
  let m = 11;
  while (CUM[m]! >= d) m--;
  return `${String(m + 1).padStart(2, '0')}-${String(d - CUM[m]!).padStart(2, '0')}`;
}

/** Month 1-12 of a day of year. */
export function doyMonth(doy: number): number {
  return Number(doyToMd(doy).slice(0, 2));
}

export interface CropSlot {
  crop: CropId;
  /** Day of year sown (1..365). */
  sow: number;
  /** Season length in days (sowing day counts as day 1). */
  days: number;
  /** Where the dates came from. */
  origin: 'farmer' | 'rule';
}

export function slotEnd(s: CropSlot): number {
  return wrapDoy(s.sow + Math.min(s.days, YEAR_DAYS) - 1);
}

/** Day index within the slot (0-based) or -1 if the slot does not cover doy. Perennials cover all days. */
export function slotDayIndex(s: CropSlot, doy: number): number {
  if (s.days >= YEAR_DAYS) return wrapDoy(doy - s.sow + 1) - 1;
  const i = wrapDoy(doy - s.sow + 1) - 1;
  return i < s.days ? i : -1;
}

/** Typical season length for a crop from its rule: sowing start -> harvest end, or seasonDays. */
export function typicalSeasonDays(rule: CropRule): number {
  if (rule.harvest) {
    const d = mdToDoy(rule.harvest.value.to) - mdToDoy(rule.sowing.value.from);
    return (d <= 0 ? d + YEAR_DAYS : d) + 1;
  }
  if (rule.seasonDays) return rule.seasonDays.value;
  return rule.stages.value.reduce((a, b) => a + b, 0);
}

/** For each day of year (index 0 = Jan 1): crops on the field that day. */
export function occupancy(slots: readonly CropSlot[]): CropId[][] {
  const out: CropId[][] = Array.from({ length: YEAR_DAYS }, () => []);
  for (const s of slots) for (let d = 1; d <= YEAR_DAYS; d++) if (slotDayIndex(s, d) >= 0) out[d - 1]!.push(s.crop);
  return out;
}

export interface Span {
  start: number;
  end: number;
  days: number;
}

/** Contiguous bare (no crop) spans on the circular year. */
export function bareSpans(slots: readonly CropSlot[]): Span[] {
  const occ = occupancy(slots);
  const bare = occ.map((c) => c.length === 0);
  if (bare.every(Boolean)) return [{ start: 1, end: YEAR_DAYS, days: YEAR_DAYS }];
  if (!bare.some(Boolean)) return [];
  // start scanning right after an occupied day so spans do not split at Dec 31 / Jan 1
  const first = bare.findIndex((b) => !b);
  const spans: Span[] = [];
  let cur: Span | null = null;
  for (let k = 1; k <= YEAR_DAYS; k++) {
    const idx = (first + k) % YEAR_DAYS;
    if (bare[idx]) {
      if (!cur) cur = { start: idx + 1, end: idx + 1, days: 0 };
      cur.end = idx + 1;
      cur.days++;
    } else if (cur) {
      spans.push(cur);
      cur = null;
    }
  }
  if (cur) spans.push(cur);
  return spans;
}

/** Days where two crops overlap (a scheduling conflict). */
export function overlapDays(slots: readonly CropSlot[]): number {
  return occupancy(slots).filter((c) => c.length > 1).length;
}

export type Stage = 'initial' | 'development' | 'mid' | 'late';

/** FAO-56 stage lengths scaled to the slot's season length. */
export function scaledStages(s: CropSlot): [number, number, number, number] {
  const st = CROPS[s.crop].stages.value;
  const total = st.reduce((a, b) => a + b, 0);
  const len = Math.min(s.days, YEAR_DAYS);
  const scaled = st.map((x) => Math.max(1, Math.round((x / total) * len))) as [number, number, number, number];
  scaled[3] = Math.max(1, len - scaled[0] - scaled[1] - scaled[2]);
  return scaled;
}

export function stageOnDay(s: CropSlot, dayIndex: number): Stage {
  const [a, b, c] = scaledStages(s);
  if (dayIndex < a) return 'initial';
  if (dayIndex < a + b) return 'development';
  if (dayIndex < a + b + c) return 'mid';
  return 'late';
}

/** FAO-56 Kc curve (Fig. 25): flat initial, linear rise, flat mid, linear fall to Kc end. Uses range midpoints. */
export function kcOnDay(s: CropSlot, dayIndex: number, which: 'low' | 'mid' | 'high' = 'mid'): number {
  const kc = CROPS[s.crop].kc.value;
  const pick = (r: [number, number]) => (which === 'low' ? Math.min(...r) : which === 'high' ? Math.max(...r) : (r[0] + r[1]) / 2);
  const kmid = pick(kc.mid);
  const kend = pick(kc.end);
  const [a, b, c, d] = scaledStages(s);
  if (dayIndex < a) return kc.ini;
  if (dayIndex < a + b) return kc.ini + ((dayIndex - a + 1) / b) * (kmid - kc.ini);
  if (dayIndex < a + b + c) return kmid;
  return kmid + ((dayIndex - a - b - c + 1) / d) * (kend - kmid);
}

/** Months (1-12) in which the crop is in a given stage. */
export function stageMonths(s: CropSlot, stage: Stage): number[] {
  const months = new Set<number>();
  for (let i = 0; i < Math.min(s.days, YEAR_DAYS); i++) if (stageOnDay(s, i) === stage) months.add(doyMonth(s.sow + i));
  return [...months];
}
