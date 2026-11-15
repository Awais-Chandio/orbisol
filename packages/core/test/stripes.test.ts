import { describe, expect, it } from 'vitest';
import { climateStripes } from '../src';
import { makeSeries } from './helpers';

describe('climateStripes', () => {
  it('annual mean of (Tmax+Tmin)/2 vs the 1991-2020 mean, complete years 1990-2025 only', () => {
    // each year is 0.1 °C warmer than the last; Tmax - Tmin = 10
    const s = makeSeries('1990-01-01', '2026-06-30', {
      tmax: (d) => 30 + (Number(d.slice(0, 4)) - 1990) * 0.1,
      tmin: (d) => 20 + (Number(d.slice(0, 4)) - 1990) * 0.1,
    });
    const r = climateStripes(s)!;
    expect(r.years[0]!.year).toBe(1990);
    expect(r.years.at(-1)!.year).toBe(2025);
    expect(r.years).toHaveLength(36);
    // 1991-2020 mean: 25 + 0.1 * mean(1..30) = 26.55
    expect(r.normalC).toBeCloseTo(26.55, 6);
    expect(r.years[0]!.meanC).toBeCloseTo(25, 6);
    expect(r.years[0]!.anomalyC).toBeCloseTo(-1.55, 6);
    expect(r.maxAbsC).toBeCloseTo(1.95, 6);
  });

  it('skips years with too many gaps and stops at the last complete year', () => {
    const s = makeSeries('1990-01-01', '2024-03-01', {
      tmax: (d) => (d.startsWith('2000') ? Number.NaN : 30),
      tmin: () => 20,
    });
    const r = climateStripes(s)!;
    expect(r.years.some((v) => v.year === 2000)).toBe(false);
    expect(r.years.at(-1)!.year).toBe(2023);
    expect(r.years.every((v) => Math.abs(v.anomalyC) < 1e-9)).toBe(true);
  });
});
