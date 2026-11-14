import { describe, expect, it } from 'vitest';
import { adjustP, CROPS, et0Climatology, planFromFarmer, SOIL_WATER, SOURCES, waterFit } from '../src';
import { hyderabadSeries } from './fixture';

const flatEt0 = new Array(365).fill(5);
const cottonWheat = planFromFarmer([
  { crop: 'cotton', sow: '05-15', harvest: '10-25' },
  { crop: 'wheat', sow: '11-05', harvest: '04-15' },
]);

describe('Water Fit (FAO-56 TAW / RAW / ETc)', () => {
  it('p adjustment follows FAO-56: p + 0.04 (5 - ETc), limited to 0.1..0.8', () => {
    expect(adjustP(0.5, 5)).toBeCloseTo(0.5);
    expect(adjustP(0.5, 8)).toBeCloseTo(0.38);
    expect(adjustP(0.65, 1)).toBeCloseTo(0.8);
    expect(adjustP(0.2, 12)).toBeCloseTo(0.1);
  });

  it('every p and soil value is cited; rice has no p (flooded crop)', () => {
    for (const c of Object.values(CROPS)) if (c.depletionP) expect(SOURCES[c.depletionP.source]).toBeDefined();
    for (const s of Object.values(SOIL_WATER)) expect(s.source).toBe('fao56_t19');
    expect(CROPS.rice.depletionP).toBeUndefined();
  });

  it('safe interval = RAW / ETc, with a range around the estimate; sand holds less than loam', () => {
    const loam = waterFit(cottonWheat, flatEt0, 7, 'loam');
    const sand = waterFit(cottonWheat, flatEt0, 7, 'sandy');
    for (const m of loam.months) {
      for (const c of m.crops) {
        expect(c.safeDays).toBeCloseTo(c.rawMm / c.etc, 6);
        expect(c.safeLow).toBeLessThanOrEqual(c.safeDays);
        expect(c.safeHigh).toBeGreaterThanOrEqual(c.safeDays);
      }
    }
    expect(sand.months[7]!.limiting!.safeDays).toBeLessThan(loam.months[7]!.limiting!.safeDays);
    // August cotton at full cover: ETc = 1.175 x 5; p = 0.65 + 0.04 (5 - 5.875); TAW = 1000 x 0.155 x 1.0 (small Zr)
    const aug = loam.months[7]!.limiting!;
    expect(aug.crop).toBe('cotton');
    expect(aug.young).toBe(false);
    expect(aug.safeDays).toBeCloseTo((0.615 * 155) / 5.875, 1);
    // newly sown wheat in November is young: a fitting turn is not confirmed
    expect(loam.months[10]!.status).toBe('young');
  });

  it('flags months where the turn is longer than the safe interval; unknown soil falls back to loam', () => {
    const f = waterFit(cottonWheat, flatEt0, 60, null);
    expect(f.textureAssumed).toBe(true);
    expect(f.texture).toBe('loam');
    expect(f.overMonths.length).toBeGreaterThan(0);
    expect(waterFit(cottonWheat, flatEt0, 1, 'loam').overMonths).toEqual([]);
    // bare month (late Apr - mid May has both crops partly; none fully bare here) still returns 12 months
    expect(f.months).toHaveLength(12);
  });

  it('rice months are reported as flooded, not checked', () => {
    const rice = planFromFarmer([{ crop: 'rice', sow: '05-01', harvest: '09-30' }]);
    const f = waterFit(rice, flatEt0, 7, 'clay');
    expect(f.months[6]!.flooded).toEqual(['rice']);
    expect(f.months[6]!.status).toBe('none');
  });

  it('Hyderabad demo: a 7-day turn is tight in the hot months on sandy soil', () => {
    const et0 = et0Climatology(hyderabadSeries());
    const loam7 = waterFit(cottonWheat, et0, 7, 'loam');
    const sand7 = waterFit(cottonWheat, et0, 7, 'sandy');
    const rows = (w: typeof loam7) => w.months.map((m) => `${m.month}:${m.limiting ? m.limiting.crop + ' ' + m.limiting.safeDays.toFixed(1) + ' ' + m.status : '-'}`).join(' | ');
    console.log('loam', rows(loam7));
    console.log('sand', rows(sand7));
    expect(sand7.overMonths.length).toBeGreaterThan(loam7.overMonths.length);
  });
});
