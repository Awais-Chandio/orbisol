import { describe, expect, it } from 'vitest';
import { linearTrend, observedTrend } from '../src';
import { hyderabadSeries } from './fixture';

describe('observed long-term trend', () => {
  it('least-squares slope per decade with a 95% interval', () => {
    const xs = Array.from({ length: 30 }, (_, i) => 1990 + i);
    const exact = linearTrend(xs, xs.map((x) => 2 * (x - 1990) + 5))!;
    expect(exact.perDecade).toBeCloseTo(20);
    expect(exact.clear).toBe(true);
    // pure alternating noise around a flat line: no clear trend
    const flat = linearTrend(xs, xs.map((_, i) => (i % 2 ? 10 : -10)))!;
    expect(Math.abs(flat.perDecade)).toBeLessThan(3);
    expect(flat.clear).toBe(false);
    expect(linearTrend(xs.slice(0, 5), [1, 2, 3, 4, 5])).toBeNull();
  });

  it('Hyderabad: complete years from 1990, fixed hot-day threshold, values in a sane range', () => {
    const tr = observedTrend(hyderabadSeries())!;
    expect(tr.fromYear).toBe(1990);
    expect(tr.toYear).toBeGreaterThanOrEqual(2024);
    expect(tr.hotTmaxC).toBeGreaterThan(38);
    expect(tr.hotTmaxC).toBeLessThan(46);
    // ~10% of 1991-2020 days are hot by construction
    const normal = tr.years.filter((y) => y.year >= 1991 && y.year <= 2020);
    const meanHot = normal.reduce((a, y) => a + y.hotDays, 0) / normal.length;
    expect(meanHot).toBeGreaterThan(30);
    expect(meanHot).toBeLessThan(43);
    for (const y of tr.years) expect(y.waterBalance).toBeLessThan(0); // arid: ET0 far above rain
    const meanWarm = normal.reduce((a, y) => a + y.warmNights, 0) / normal.length;
    expect(meanWarm).toBeGreaterThan(30);
    expect(meanWarm).toBeLessThan(43);
    for (const y of tr.years) expect(y.txx).toBeGreaterThan(tr.hotTmaxC);
    console.log(
      `warm nights > ${tr.warmTminC.toFixed(1)} C: ${tr.warmNights!.perDecade.toFixed(1)}/decade [${tr.warmNights!.low.toFixed(1)}, ${tr.warmNights!.high.toFixed(1)}];`,
      `TXx ${tr.txx!.perDecade.toFixed(2)} C/decade [${tr.txx!.low.toFixed(2)}, ${tr.txx!.high.toFixed(2)}]; first ${tr.firstDecade.txx.toFixed(1)} last ${tr.lastDecade.txx.toFixed(1)}`,
    );
    console.log(
      `threshold ${tr.hotTmaxC.toFixed(1)} C; hot days ${tr.hotDays!.perDecade.toFixed(1)}/decade [${tr.hotDays!.low.toFixed(1)}, ${tr.hotDays!.high.toFixed(1)}];`,
      `balance ${tr.waterBalance!.perDecade.toFixed(0)} mm/decade [${tr.waterBalance!.low.toFixed(0)}, ${tr.waterBalance!.high.toFixed(0)}];`,
      `first10 ${JSON.stringify(tr.firstDecade)} last10 ${JSON.stringify(tr.lastDecade)}`,
    );
  });
});
