/**
 * Orbisol core - rotation strategies: the farmer's existing rotation plus alternatives built from the cited
 * crop rules, evaluated against local NASA-derived climate and scored by the farmer's priorities.
 *
 * Scoring is a transparent design choice (not data): each priority gets a 0-1 score relative to the best
 * candidate; the farmer's 1st/2nd/3rd priorities weigh 3/2/1. Market suitability is never scored (no data):
 * it is always reported as an information gap for local review.
 *
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { Priority } from '../types';
import {
  bareSpans,
  doyMonth,
  mdToDoy,
  overlapDays,
  slotDayIndex,
  slotEnd,
  stageMonths,
  typicalSeasonDays,
  wrapDoy,
  YEAR_DAYS,
  type CropSlot,
  type Span,
} from './calendar';
import { CROPS, type CropId, type Family } from './crops';
import type { SourceId } from './sources';
import { slotWaterNeed, type HazardMonths, type WaterNeed } from './water';

/** A sentence for the UI, as an i18n key with parameters and an optional cited source. */
export interface Note {
  key: string;
  params?: Record<string, string | number>;
  source?: SourceId | 'nasa_power' | 'computed' | 'farmer';
}

export interface RotationPlan {
  id: string;
  kind: 'existing' | 'alternative';
  slots: CropSlot[];
}

export interface FarmerSlotInput {
  crop: CropId;
  /** MM-DD the farmer sows. */
  sow: string;
  /** MM-DD the farmer harvests; defaults to the crop's typical season. */
  harvest?: string;
}

export interface FarmProfile {
  existing: FarmerSlotInput[];
  /** Top priorities in order (1-3). */
  priorities: Priority[];
  salty: boolean | null;
}

export interface Environment {
  et0Clim: readonly number[];
  hazards: HazardMonths;
}

export function planFromFarmer(input: readonly FarmerSlotInput[]): RotationPlan {
  const slots: CropSlot[] = input.map((s) => {
    const sow = mdToDoy(s.sow);
    const rule = CROPS[s.crop];
    let days = typicalSeasonDays(rule);
    if (s.harvest) {
      const d = mdToDoy(s.harvest) - sow;
      days = (d <= 0 ? d + YEAR_DAYS : d) + 1;
    }
    if (rule.season === 'perennial') days = YEAR_DAYS;
    return { crop: s.crop, sow, days, origin: 'farmer' };
  });
  return { id: 'existing', kind: 'existing', slots };
}

const KHARIF: CropId[] = ['cotton', 'rice', 'sorghum_fodder', 'mungbean'];
const RABI: CropId[] = ['wheat', 'berseem', 'chickpea'];

/**
 * Two-crop annual rotations (one kharif + one rabi crop). Each crop is sown at the start of its cited
 * window, or right after the previous harvest; a plan is dropped if a crop would be sown after its window.
 */
export function candidatePlans(): RotationPlan[] {
  const out: RotationPlan[] = [];
  for (const k of KHARIF) {
    for (const r of RABI) {
      const kr = CROPS[k];
      const rr = CROPS[r];
      const kWin = [mdToDoy(kr.sowing.value.from), mdToDoy(kr.sowing.value.to)] as const;
      const rWin = [mdToDoy(rr.sowing.value.from), mdToDoy(rr.sowing.value.to)] as const;
      const kDays = typicalSeasonDays(kr);
      const rDays = typicalSeasonDays(rr);
      let kSow: number = kWin[0];
      let rSow: number = rWin[0];
      let ok = true;
      for (let iter = 0; iter < 3; iter++) {
        rSow = latestOf(rWin[0], wrapDoy(kSow + kDays));
        kSow = latestOf(kWin[0], wrapDoy(rSow + rDays));
      }
      if (!withinWindow(rSow, rWin) || !withinWindow(kSow, kWin)) ok = false;
      if (!ok) continue;
      out.push({
        id: `${k}+${r}`,
        kind: 'alternative',
        slots: [
          { crop: k, sow: kSow, days: kDays, origin: 'rule' },
          { crop: r, sow: rSow, days: rDays, origin: 'rule' },
        ],
      });
    }
  }
  return out;
}

/** Later of two days of year, measured forward from `base` within ~half a year. */
function latestOf(base: number, other: number): number {
  const ahead = wrapDoy(other - base + 1) - 1; // days from base to other
  return ahead < 183 ? other : base;
}

function withinWindow(d: number, w: readonly [number, number]): boolean {
  const len = wrapDoy(w[1] - w[0] + 1);
  const off = wrapDoy(d - w[0] + 1) - 1;
  return off < len;
}

export interface VulnerableStage {
  crop: CropId;
  months: number[];
  hazard: 'hot' | 'frost' | 'heavyRain';
}

export interface PlanMetrics {
  water: WaterNeed;
  perCropWater: { crop: CropId; water: WaterNeed }[];
  bare: Span[];
  bareDays: number;
  /** Bare days falling in the location's hottest months. */
  bareHotDays: number;
  coverShare: number;
  legumeShare: number;
  /** Fodder days (1) + residue days (0.5), as a share of the year. */
  forageShare: number;
  families: Family[];
  overlap: number;
  vulnerable: VulnerableStage[];
}

export function evaluatePlan(plan: RotationPlan, env: Environment): PlanMetrics {
  const perCropWater = plan.slots.map((s) => ({ crop: s.crop, water: slotWaterNeed(s, env.et0Clim) }));
  const water = perCropWater.reduce(
    (a, c) => ({ mm: a.mm + c.water.mm, low: a.low + c.water.low, high: a.high + c.water.high }),
    { mm: 0, low: 0, high: 0 },
  );
  const bare = bareSpans(plan.slots);
  const bareDays = bare.reduce((a, s) => a + s.days, 0);
  let bareHotDays = 0;
  for (const sp of bare) for (let i = 0; i < sp.days; i++) if (env.hazards.hot.includes(doyMonth(sp.start + i))) bareHotDays++;

  let legume = 0;
  let forage = 0;
  for (let d = 1; d <= YEAR_DAYS; d++) {
    const here = plan.slots.filter((s) => slotDayIndex(s, d) >= 0).map((s) => CROPS[s.crop]);
    if (here.some((c) => c.nitrogenFixing.value)) legume++;
    const f = Math.max(0, ...here.map((c) => (c.forage?.value === 'fodder' ? 1 : c.forage?.value === 'residue' ? 0.5 : 0)));
    forage += f;
  }

  const vulnerable: VulnerableStage[] = [];
  for (const s of plan.slots) {
    const mid = stageMonths(s, 'mid');
    // heat also matters in the late stage (grain/boll filling); frost and heavy rain are checked at mid-season
    const late = stageMonths(s, 'late');
    for (const hazard of ['hot', 'frost', 'heavyRain'] as const) {
      const stageMonthsForHazard = hazard === 'hot' ? [...new Set([...mid, ...late])] : mid;
      const months = stageMonthsForHazard.filter((m) => env.hazards[hazard].includes(m));
      if (months.length) vulnerable.push({ crop: s.crop, months, hazard });
    }
  }

  return {
    water,
    perCropWater,
    bare,
    bareDays,
    bareHotDays,
    coverShare: 1 - bareDays / YEAR_DAYS,
    legumeShare: legume / YEAR_DAYS,
    forageShare: forage / YEAR_DAYS,
    families: [...new Set(plan.slots.map((s) => CROPS[s.crop].family.value))],
    overlap: overlapDays(plan.slots),
    vulnerable,
  };
}

export const PRIORITY_WEIGHTS = [3, 2, 1] as const;
export const SCORED_PRIORITIES: Priority[] = ['water_use', 'forage_value', 'nitrogen_fixing', 'erosion_reduction', 'organic_matter'];

/** 0-1 per priority, relative to the best plan in the set; null = not scored (no data). */
export function priorityScores(all: readonly PlanMetrics[]): Record<Priority, number | null>[] {
  const rel = (vals: number[], higherIsBetter: boolean) => {
    const best = higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    return vals.map((v) => (best === 0 ? (higherIsBetter ? 0 : 1) : higherIsBetter ? v / best : best / v));
  };
  const water = rel(all.map((m) => m.water.mm), false);
  const forage = rel(all.map((m) => m.forageShare), true);
  const nfix = rel(all.map((m) => m.legumeShare), true);
  const cover = rel(all.map((m) => m.coverShare), true);
  // organic matter proxy: living cover and legume time (no soil organic matter data available)
  const om = rel(all.map((m) => 0.5 * m.coverShare + 0.5 * m.legumeShare), true);
  return all.map((_, i) => ({
    water_use: water[i]!,
    forage_value: forage[i]!,
    nitrogen_fixing: nfix[i]!,
    erosion_reduction: cover[i]!,
    organic_matter: om[i]!,
    market_suitability: null,
  }));
}

export function totalScore(scores: Record<Priority, number | null>, priorities: readonly Priority[]): number {
  const chosen = priorities.filter((p) => SCORED_PRIORITIES.includes(p));
  const list = chosen.length ? chosen : SCORED_PRIORITIES;
  let sum = 0;
  let wsum = 0;
  list.forEach((p, i) => {
    const w = chosen.length ? (PRIORITY_WEIGHTS[i] ?? 1) : 1;
    const s = scores[p];
    if (s === null) return;
    sum += w * s;
    wsum += w;
  });
  return wsum ? sum / wsum : 0;
}

export interface StrategyReport {
  plan: RotationPlan;
  metrics: PlanMetrics;
  scores: Record<Priority, number | null>;
  total: number;
  why: Note[];
  evidence: Note[];
  benefits: Note[];
  gaps: Note[];
  /** Risks that need local review by farmers or experts. */
  risks: Note[];
}

function cropsOf(p: RotationPlan): CropId[] {
  return p.slots.map((s) => s.crop);
}

function explain(
  r: Omit<StrategyReport, 'why' | 'evidence' | 'benefits' | 'gaps' | 'risks'>,
  base: Omit<StrategyReport, 'why' | 'evidence' | 'benefits' | 'gaps' | 'risks'>,
  farm: FarmProfile,
  env: Environment,
): Pick<StrategyReport, 'why' | 'evidence' | 'benefits' | 'gaps' | 'risks'> {
  const why: Note[] = [];
  const evidence: Note[] = [];
  const benefits: Note[] = [];
  const gaps: Note[] = [];
  const risks: Note[] = [];
  const m = r.metrics;
  const b = base.metrics;
  const isExisting = r.plan.kind === 'existing';
  const baseCrops = new Set(cropsOf(base.plan));

  // WHY
  if (isExisting) why.push({ key: 'why.existing', source: 'farmer' });
  else {
    const ranked = farm.priorities.filter((p) => r.scores[p] !== null && base.scores[p] !== null);
    for (const p of ranked) {
      if ((r.scores[p] ?? 0) > (base.scores[p] ?? 0) + 0.05) why.push({ key: 'why.betterFor', params: { priority: p }, source: 'computed' });
    }
    if (why.length === 0) why.push({ key: 'why.balanced', source: 'computed' });
  }

  // EVIDENCE (numbers with sources)
  for (const c of m.perCropWater) {
    evidence.push({
      key: 'evidence.waterNeed',
      params: { crop: c.crop, mm: Math.round(c.water.mm), low: Math.round(c.water.low), high: Math.round(c.water.high) },
      source: 'fao56_t12',
    });
  }
  evidence.push({ key: 'evidence.et0Source', source: 'nasa_power' });
  evidence.push({ key: 'evidence.bareDays', params: { days: m.bareDays, hot: m.bareHotDays }, source: 'computed' });
  for (const s of r.plan.slots) {
    const c = CROPS[s.crop];
    if (c.nitrogenFixing.value) evidence.push({ key: 'evidence.legume', params: { crop: s.crop }, source: c.nitrogenFixing.source });
    if (c.forage?.value === 'fodder') evidence.push({ key: 'evidence.fodder', params: { crop: s.crop }, source: c.forage.source });
    if (s.origin === 'rule')
      evidence.push({
        key: 'evidence.sowWindow',
        params: { crop: s.crop, from: c.sowing.value.from, to: c.sowing.value.to },
        source: c.sowing.source,
      });
  }

  // BENEFITS (vs existing)
  if (!isExisting) {
    const pct = Math.round((1 - m.water.mm / b.water.mm) * 100);
    if (pct >= 5) benefits.push({ key: 'benefit.lessWater', params: { pct }, source: 'computed' });
    const coverGain = b.bareDays - m.bareDays;
    if (coverGain >= 7) benefits.push({ key: 'benefit.moreCover', params: { days: coverGain }, source: 'computed' });
    if (b.bareHotDays - m.bareHotDays >= 7)
      benefits.push({ key: 'benefit.lessBareInHeat', params: { days: b.bareHotDays - m.bareHotDays }, source: 'computed' });
    for (const s of r.plan.slots) {
      const c = CROPS[s.crop];
      if (c.nitrogenFixing.value && !baseCrops.has(s.crop)) benefits.push({ key: 'benefit.nitrogen', params: { crop: s.crop }, source: c.nitrogenFixing.source });
      if (c.forage?.value === 'fodder' && !baseCrops.has(s.crop)) benefits.push({ key: 'benefit.fodder', params: { crop: s.crop }, source: c.forage.source });
    }
    const newFamilies = m.families.filter((f) => !b.families.includes(f));
    if (newFamilies.length) benefits.push({ key: 'benefit.pestBreak', params: { families: newFamilies.join(', ') }, source: 'computed' });
  } else {
    if (m.families.length >= 2) benefits.push({ key: 'benefit.twoFamilies', params: { families: m.families.join(', ') }, source: 'computed' });
  }

  // GAPS
  gaps.push({ key: 'gap.market' });
  gaps.push({ key: 'gap.varieties' });
  for (const s of r.plan.slots) {
    const c = CROPS[s.crop];
    if (c.stages.note?.startsWith('proxy')) gaps.push({ key: 'gap.proxyStages', params: { crop: s.crop }, source: c.stages.source });
    if (!c.salt?.value.thresholdECe) gaps.push({ key: 'gap.salt', params: { crop: s.crop } });
    if (!c.forage) gaps.push({ key: 'gap.forage', params: { crop: s.crop } });
    if (c.sowing.source === 'dawn_mung_2007' || c.sowing.note?.includes('check locally'))
      gaps.push({ key: 'gap.sowingSource', params: { crop: s.crop }, source: c.sowing.source });
  }
  gaps.push({ key: 'gap.irrigationModel', source: 'nasa_power' });

  // RISKS needing local review
  if (farm.salty) {
    for (const s of r.plan.slots) {
      const salt = CROPS[s.crop].salt;
      if (salt && (salt.value.rating === 'S' || salt.value.rating === 'MS'))
        risks.push({
          key: 'risk.saltSensitive',
          params: { crop: s.crop, ece: salt.value.thresholdECe ?? '–', rating: salt.value.rating },
          source: salt.source,
        });
    }
  }
  for (const v of m.vulnerable)
    risks.push({ key: `risk.vulnerable.${v.hazard}`, params: { crop: v.crop, months: v.months.join(',') }, source: 'nasa_power' });
  if (m.overlap > 0) risks.push({ key: 'risk.overlap', params: { days: m.overlap }, source: 'computed' });
  if (!isExisting) {
    const pct = Math.round((m.water.mm / b.water.mm - 1) * 100);
    if (pct >= 5) risks.push({ key: 'risk.moreWater', params: { pct }, source: 'computed' });
    if (m.bareDays - b.bareDays >= 7)
      risks.push({ key: 'risk.moreBare', params: { days: m.bareDays - b.bareDays, hot: m.bareHotDays }, source: 'computed' });
    for (const s of r.plan.slots) {
      if (!baseCrops.has(s.crop)) risks.push({ key: 'risk.newCrop', params: { crop: s.crop } });
      const tight = r.plan.slots.some((o) => o !== s && wrapDoy(s.sow - slotEnd(o)) <= 7);
      if (tight) risks.push({ key: 'risk.tightTurnaround', params: { crop: s.crop } });
    }
  }
  for (const s of r.plan.slots)
    for (const n of CROPS[s.crop].notes) {
      const relevant = /HCN/i.test(n.value) || (/frost/i.test(n.value) && env.hazards.frost.length > 0);
      if (relevant) risks.push({ key: 'risk.cropNote', params: { crop: s.crop, text: n.value }, source: n.source });
    }

  return { why, evidence, benefits, gaps, risks };
}

/** Existing rotation + the two best-scoring distinct alternatives, with explanations. */
export function compareRotations(farm: FarmProfile, env: Environment, nAlternatives = 2): StrategyReport[] {
  const existing = planFromFarmer(farm.existing);
  const existingKey = [...cropsOf(existing)].sort().join('+');
  const candidates = candidatePlans().filter((p) => [...cropsOf(p)].sort().join('+') !== existingKey);
  const plans = [existing, ...candidates];
  const metrics = plans.map((p) => evaluatePlan(p, env));
  const scores = priorityScores(metrics);
  const scored = plans.map((plan, i) => ({ plan, metrics: metrics[i]!, scores: scores[i]!, total: totalScore(scores[i]!, farm.priorities) }));

  const base = scored[0]!;
  const alts = scored.slice(1).sort((a, b) => b.total - a.total);
  const picked: typeof alts = [];
  for (const a of alts) {
    if (picked.length >= nAlternatives) break;
    // keep alternatives distinct: do not pick two plans that share both crops' families
    const sameShape = picked.some((p) => p.metrics.families.join() === a.metrics.families.join() && cropsOf(p.plan)[0] === cropsOf(a.plan)[0]);
    if (!sameShape) picked.push(a);
  }
  return [base, ...picked].map((r) => ({ ...r, ...explain(r, base, farm, env) }));
}
