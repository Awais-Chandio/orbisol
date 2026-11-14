import { describe, expect, it } from 'vitest';
import {
  bareSpans,
  candidatePlans,
  CROP_IDS,
  CROPS,
  doyToMd,
  evaluatePlan,
  hazardMonths,
  windiestMonths,
  kcOnDay,
  mdToDoy,
  overlapDays,
  planFromFarmer,
  priorityScores,
  scaledStages,
  slotWaterNeed,
  SOURCES,
  totalScore,
  typicalSeasonDays,
  type CropSlot,
  type MonthClimate,
} from '../src';

const flatEt0 = new Array(365).fill(5); // 5 mm/day everywhere
const noHazards = { hot: [] as number[], frost: [] as number[], heavyRain: [] as number[] };

describe('crop rules table', () => {
  it('every value carries a known source; no Kc or stage is missing', () => {
    for (const id of CROP_IDS) {
      const c = CROPS[id];
      for (const cited of [c.family, c.sowing, c.stages, c.kc, c.nitrogenFixing, c.harvest, c.seasonDays, c.rootDepthM, c.salt, c.forage, ...c.notes]) {
        if (cited) expect(SOURCES[cited.source], `${id}: ${cited.source}`).toBeDefined();
      }
      expect(c.stages.value).toHaveLength(4);
      expect(c.kc.value.mid[0]).toBeLessThanOrEqual(c.kc.value.mid[1]);
      expect(c.harvest || c.seasonDays, id).toBeTruthy();
    }
  });

  it('matches FAO-56 and Sindh values for the baseline crops', () => {
    expect(CROPS.cotton.stages.value).toEqual([30, 50, 60, 55]);
    expect(CROPS.cotton.salt?.value.thresholdECe).toBe(7.7);
    expect(CROPS.wheat.sowing.value).toEqual({ from: '11-01', to: '11-20' });
    expect(CROPS.berseem.kc.value.mid).toEqual([0.9, 0.9]);
    expect(CROPS.mungbean.salt).toBeUndefined(); // not in FAO-56 Table 23 -> left out
  });
});

describe('rotation/calendar', () => {
  it('converts MM-DD and day of year', () => {
    expect(mdToDoy('01-01')).toBe(1);
    expect(mdToDoy('12-31')).toBe(365);
    expect(mdToDoy('02-29')).toBe(59);
    expect(doyToMd(mdToDoy('11-20'))).toBe('11-20');
  });

  it('typical season: sowing start to harvest end, wrapping the new year', () => {
    expect(typicalSeasonDays(CROPS.wheat)).toBe(151); // 1 Nov .. 31 Mar
    expect(typicalSeasonDays(CROPS.mungbean)).toBe(75);
  });

  it('finds bare spans across the year end and overlaps', () => {
    const cottonWheat: CropSlot[] = [
      { crop: 'cotton', sow: mdToDoy('05-15'), days: 170, origin: 'farmer' },
      { crop: 'wheat', sow: mdToDoy('11-10'), days: 157, origin: 'farmer' },
    ];
    const spans = bareSpans(cottonWheat);
    expect(spans.reduce((a, s) => a + s.days, 0)).toBe(365 - 170 - 157 + overlapDays(cottonWheat));
    expect(spans.some((s) => doyToMd(s.start).startsWith('04'))).toBe(true); // bare from mid-April
    expect(bareSpans([])).toEqual([{ start: 1, end: 365, days: 365 }]);
    expect(overlapDays([...cottonWheat, { crop: 'berseem', sow: mdToDoy('10-01'), days: 60, origin: 'rule' }])).toBeGreaterThan(0);
  });

  it('scales FAO-56 stages to the season and follows the Kc curve', () => {
    const s: CropSlot = { crop: 'cotton', sow: 1, days: 195, origin: 'rule' };
    expect(scaledStages(s)).toEqual([30, 50, 60, 55]);
    expect(kcOnDay(s, 0)).toBe(0.35);
    expect(kcOnDay(s, 100)).toBeCloseTo(1.175, 6); // mid-season, midpoint of 1.15-1.20
    expect(kcOnDay(s, 194)).toBeCloseTo(0.6, 6); // end, midpoint of 0.50-0.70
  });
});

describe('rotation/water', () => {
  it('ETc = sum of Kc x ET0, with a low/high range from the Kc ranges', () => {
    const w = slotWaterNeed({ crop: 'berseem', sow: 1, days: 195, origin: 'rule' }, flatEt0);
    // berseem: 10 d @0.40, 20 d rising to 0.90, 155 d @0.90, 10 d falling to 0.85 -> about 0.88 average
    expect(w.mm).toBeGreaterThan(195 * 5 * 0.8);
    expect(w.mm).toBeLessThan(195 * 5 * 0.9);
    expect(w.low).toBeCloseTo(w.mm, 6); // single values, no range
    const c = slotWaterNeed({ crop: 'cotton', sow: 1, days: 195, origin: 'rule' }, flatEt0);
    expect(c.low).toBeLessThan(c.mm);
    expect(c.high).toBeGreaterThan(c.mm);
  });

  it('picks the three hottest months and frequent hazards', () => {
    const mc: MonthClimate[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      tmaxMean: [25, 29, 35, 40, 43, 42, 39, 38, 38, 37, 32, 27][i]!,
      rainMm: 0,
      et0Mm: 0,
      frostDaysPerYear: i === 0 ? 0.6 : 0,
      heavyRainDaysPerYear: i === 7 ? 0.7 : 0.1,
      windMean: [2, 2.2, 2.6, 3.5, 4.8, 5.3, 5.1, 4.4, 3.6, 2.2, 1.9, 2][i]!,
    }));
    expect(hazardMonths(mc)).toEqual({ hot: [4, 5, 6], frost: [1], heavyRain: [8] });
    expect(windiestMonths(mc)).toEqual([5, 6, 7]);
  });
});

describe('rotation/strategies', () => {
  it('builds feasible two-crop candidates inside the cited sowing windows', () => {
    const plans = candidatePlans();
    expect(plans.length).toBeGreaterThanOrEqual(4);
    for (const p of plans) {
      for (const s of p.slots) {
        const w = CROPS[s.crop].sowing.value;
        const from = mdToDoy(w.from);
        const len = ((mdToDoy(w.to) - from + 365) % 365) + 1;
        expect(((s.sow - from + 365) % 365) < len, `${p.id} ${s.crop}`).toBe(true);
      }
    }
  });

  it('uses farmer dates for the existing rotation', () => {
    const p = planFromFarmer([{ crop: 'cotton', sow: '05-15', harvest: '10-31' }]);
    expect(p.slots[0]).toMatchObject({ crop: 'cotton', sow: mdToDoy('05-15'), days: 170, origin: 'farmer' });
  });

  it('scores relative to the best plan and weights priorities 3/2/1', () => {
    const env = { et0Clim: flatEt0, hazards: noHazards };
    const a = evaluatePlan(planFromFarmer([{ crop: 'cotton', sow: '05-01' }, { crop: 'wheat', sow: '11-01' }]), env);
    const b = evaluatePlan(planFromFarmer([{ crop: 'mungbean', sow: '06-01' }, { crop: 'berseem', sow: '10-01' }]), env);
    const [sa, sb] = priorityScores([a, b]);
    expect(sb!.nitrogen_fixing).toBe(1);
    expect(sa!.nitrogen_fixing).toBe(0);
    expect(sa!.market_suitability).toBeNull();
    expect(totalScore(sb!, ['nitrogen_fixing'])).toBe(1);
    expect(totalScore(sa!, ['water_use', 'nitrogen_fixing'])).toBeCloseTo((3 * sa!.water_use! + 0) / 5, 6);
  });
});
