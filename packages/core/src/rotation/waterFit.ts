/**
 * Orbisol core - Water Fit: does the canal turn come often enough for each crop, month by month?
 *
 * FAO-56 Chapter 8:
 *   TAW = 1000 (thetaFC - thetaWP) Zr            (Eq. 82; theta from Table 19, Zr from Table 22)
 *   RAW = p TAW                                  (Eq. 83; p from Table 22)
 *   p   = p_table22 + 0.04 (5 - ETc), 0.1..0.8   (adjustment for the ETc rate, Ch. 8 text and Fig. 41)
 *   safe interval (days) = RAW / ETc             (days of crop water use the root zone holds without stress)
 * ETc = Kc x ET0 (FAO-56 Table 12 Kc, NASA POWER ET0 normal 1991-2020), month mean for the days the crop is in the field.
 *
 * Root depth: the estimate uses the smaller Table 22 value, which footnote 1 recommends for irrigation scheduling;
 * the range runs from (small Zr, small theta) to (large Zr, large theta).
 *
 * Simplifications (listed in docs/limitations.md): rain is ignored (conservative); Table 22 depths are for a grown
 * crop, so in months when the crop is mostly in its initial or development stage the safe interval is an upper bound
 * (status 'young': a turn that is too long is still flagged, a turn that fits is not confirmed); each turn is assumed
 * to refill the root zone, because canal flow volume per turn is unknown; rice is a flooded crop (Table 22 p is a
 * fraction of saturation) and is not checked.
 *
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { Cited } from './sources';
import { CROPS, type CropId } from './crops';
import { kcOnDay, slotDayIndex, stageOnDay, YEAR_DAYS, type CropSlot } from './calendar';
import type { RotationPlan } from './strategies';

import type { SoilTexture } from '../types';

/** FAO-56 Table 19, (thetaFC - thetaWP) in m3/m3. Farmer "sandy" is read as the Table 19 "Sand" row. */
export const SOIL_WATER: Record<SoilTexture, Cited<[number, number]>> = {
  sandy: { value: [0.05, 0.11], source: 'fao56_t19', note: 'Sand' },
  loam: { value: [0.13, 0.18], source: 'fao56_t19', note: 'Loam' },
  clay: { value: [0.12, 0.2], source: 'fao56_t19', note: 'Clay' },
};

/** Used when the farmer has not said what the soil is (the Hyderabad plain is mostly loamy alluvium; check locally). */
export const DEFAULT_TEXTURE: SoilTexture = 'loam';

const MONTH_START = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2;

export function adjustP(pTable: number, etc: number): number {
  return Math.min(0.8, Math.max(0.1, pTable + 0.04 * (5 - etc)));
}

export interface CropMonthFit {
  crop: CropId;
  /** Mean crop water use this month, mm/day. */
  etc: number;
  tawMm: number;
  p: number;
  rawMm: number;
  /** Safe days between irrigations: estimate (mid values) and range (low / high Table 19 and Table 22 ends). */
  safeDays: number;
  safeLow: number;
  safeHigh: number;
  /** Mostly in the initial / development stage this month: roots not yet at the Table 22 depth. */
  young: boolean;
}

export interface MonthFit {
  month: number;
  /** Crops checked this month (rice is skipped as a flooded crop). */
  crops: CropMonthFit[];
  /** The crop with the shortest safe interval this month, or null when no checkable crop is in the field. */
  limiting: CropMonthFit | null;
  flooded: CropId[];
  /**
   * 'over' = the canal turn interval is longer than the safe interval; 'young' = it fits the upper bound but the crop
   * is young (shorter roots), so the fit is not confirmed; 'none' = no checkable crop in the field.
   */
  status: 'ok' | 'over' | 'young' | 'none';
}

export interface WaterFit {
  texture: SoilTexture;
  textureAssumed: boolean;
  intervalDays: number;
  months: MonthFit[];
  overMonths: number[];
}

function cropMonthFit(slot: CropSlot, month: number, et0Clim: readonly number[], texture: SoilTexture): CropMonthFit | null {
  const rule = CROPS[slot.crop];
  if (!rule.depletionP || !rule.rootDepthM) return null;
  let etcSum = 0;
  let n = 0;
  let youngDays = 0;
  for (let d = MONTH_START[month - 1]!; d < MONTH_START[month]!; d++) {
    const i = slotDayIndex(slot, d);
    if (i < 0 || i >= Math.min(slot.days, YEAR_DAYS)) continue;
    etcSum += kcOnDay(slot, i, 'mid') * et0Clim[d - 1]!;
    n++;
    const st = stageOnDay(slot, i);
    if (st === 'initial' || st === 'development') youngDays++;
  }
  if (n === 0) return null;
  const etc = etcSum / n;
  const dTheta = SOIL_WATER[texture].value;
  const zr = rule.rootDepthM.value;
  const p = adjustP(rule.depletionP.value, etc);
  const safe = (theta: number, z: number) => (p * 1000 * theta * z) / etc;
  const tawMm = 1000 * mid(dTheta) * zr[0];
  return {
    crop: slot.crop,
    etc,
    tawMm,
    p,
    rawMm: p * tawMm,
    safeDays: safe(mid(dTheta), zr[0]),
    safeLow: safe(dTheta[0], zr[0]),
    safeHigh: safe(dTheta[1], zr[1]),
    young: youngDays * 2 > n,
  };
}

export function waterFit(plan: RotationPlan, et0Clim: readonly number[], intervalDays: number, texture: SoilTexture | null): WaterFit {
  const tex = texture ?? DEFAULT_TEXTURE;
  const months: MonthFit[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const crops: CropMonthFit[] = [];
    const flooded: CropId[] = [];
    for (const s of plan.slots) {
      const f = cropMonthFit(s, month, et0Clim, tex);
      if (f) crops.push(f);
      else if (!CROPS[s.crop].depletionP) {
        const inField = Array.from({ length: MONTH_START[month]! - MONTH_START[i]! }, (_, k) => slotDayIndex(s, MONTH_START[i]! + k)).some((x) => x >= 0);
        if (inField) flooded.push(s.crop);
      }
    }
    const limiting = crops.length ? crops.reduce((a, b) => (b.safeDays < a.safeDays ? b : a)) : null;
    const status: MonthFit['status'] = !limiting
      ? 'none'
      : intervalDays > limiting.safeDays
        ? 'over'
        : crops.some((c) => c.young)
          ? 'young'
          : 'ok';
    return { month, crops, limiting, flooded, status };
  });
  return {
    texture: tex,
    textureAssumed: texture === null,
    intervalDays,
    months,
    overMonths: months.filter((m) => m.status === 'over').map((m) => m.month),
  };
}
