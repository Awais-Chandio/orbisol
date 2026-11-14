import { describe, expect, it } from 'vitest';
import { backtestTwins, confidenceMeter, seasonTwins, twinOutlook, type SeasonIndicators, type YearIndicators } from '../src';

function ind(t: number, r: number): SeasonIndicators {
  return { hotDays: 0, tmaxMean: t, frostDays: 0, rainTotal: r, heavyRainDays: 0, soilWetness: 0.2, et0Total: 400, waterBalance: r - 400 };
}
function years(list: [number, number, number][]): YearIndicators[] {
  return list.map(([year, t, r]) => ({ year, window: { start: `${year}-01-01`, end: `${year}-03-31` }, values: ind(t, r), coverage: 1 }));
}

describe('twins', () => {
  const past = years([
    [2001, 30, 10],
    [2002, 31, 50],
    [2003, 33, 5],
    [2004, 30.2, 12],
    [2005, 35, 80],
  ]);

  it('finds the closest years by standardized distance', () => {
    const r = seasonTwins(ind(30.1, 11), past, 2, ['tmaxMean', 'rainTotal']);
    expect(r.twins.map((t) => t.year).sort()).toEqual([2001, 2004]);
    expect(r.twins[0]!.distance).toBeLessThan(0.2);
  });

  it('ignores features without spread', () => {
    expect(seasonTwins(ind(30, 10), past, 2, ['frostDays', 'tmaxMean']).features).toEqual(['tmaxMean']);
  });

  it('summarizes what happened next in twin years', () => {
    const outcomes = new Map([[2001, 5], [2004, 7], [2002, 1]]);
    const o = twinOutlook([{ year: 2001, distance: 0.1 }, { year: 2004, distance: 0.2 }], outcomes, [1, 2, 3, 4, 5, 6]);
    expect(o.normal).toBe(3.5);
    expect(o.direction).toBe('above');
    expect(o.agreement).toBe(1);
    expect(o.informative).toBe(true);
    expect(twinOutlook([{ year: 2001, distance: 0 }], outcomes, [0, 0, 0, 0, 0]).informative).toBe(false);
  });
});

describe('backtest', () => {
  it('uses only earlier years and compares with a naive baseline', () => {
    // outcome follows temperature: hot years -> above
    const list: [number, number, number][] = [];
    for (let y = 1990; y < 2020; y++) list.push([y, 30 + ((y * 7) % 5), 10]);
    const py = years(list);
    const outcomes = new Map(py.map((p) => [p.year, p.values.tmaxMean * 2]));
    const r = backtestTwins(py, outcomes, { k: 3, minPastYears: 10, features: ['tmaxMean'] });
    expect(r.rows[0]!.year).toBe(2000);
    expect(r.rows.every((row) => row.twins.every((t) => t < row.year))).toBe(true);
    expect(r.hitRate).toBeGreaterThan(0.9);
    expect(r.n).toBe(20);
  });
});

describe('confidence', () => {
  it('is high with close, agreeing twins, full data and a good track record', () => {
    const c = confidenceMeter({ nTwins: 3, meanDistance: 0.4, agreement: 1, coverage: 1, backtest: { n: 20, hitRate: 0.8, baselineRate: 0.5 } });
    expect(c.level).toBe('high');
    expect(c.points).toBe(6);
  });

  it('drops to low when twins are far and disagree, and explains why', () => {
    const c = confidenceMeter({ nTwins: 3, meanDistance: 1.6, agreement: 0.5, coverage: 0.9 });
    expect(c.level).toBe('low');
    expect(c.reason).toMatch(/twinsFar|twinsDisagree|dataGaps/);
  });

  it('penalizes a track record no better than guessing', () => {
    const c = confidenceMeter({ nTwins: 3, meanDistance: 0.5, agreement: 1, coverage: 1, backtest: { n: 20, hitRate: 0.5, baselineRate: 0.6 } });
    expect(c.level).toBe('medium');
    expect(c.factors.some((f) => f.key === 'confidence.trackNoSkill')).toBe(true);
  });

  it('is low with no twins', () => {
    expect(confidenceMeter({ nTwins: 0, meanDistance: Number.NaN, agreement: 0, coverage: 1 }).level).toBe('low');
  });
});
