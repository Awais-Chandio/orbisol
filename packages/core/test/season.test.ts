import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareSeason,
  compareToBaseline,
  computeIndicators,
  daysBetween,
  lastCompleteDate,
  midRank,
  sameDayInYear,
  sliceVar,
  tercileOf,
  windowEndingOn,
  windowInYear,
  yearOf,
} from '../src';
import { makeSeries } from './helpers';

describe('season/dates', () => {
  it('adds days across month and leap boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('maps Feb 29 to Feb 28 in non-leap years', () => {
    expect(sameDayInYear('2024-02-29', 2023)).toBe('2023-02-28');
    expect(sameDayInYear('2024-02-29', 2000)).toBe('2000-02-29');
    expect(sameDayInYear('2026-11-11', 1999)).toBe('1999-11-11');
  });
});

describe('season/series', () => {
  const s = makeSeries('2020-01-01', '2020-01-10', { tmax: (_, i) => i, tmin: () => 1, rain: () => 0 });

  it('windows are inclusive and shift by year', () => {
    const w = windowEndingOn('2026-11-11', 90);
    expect(daysBetween(w.start, w.end)).toBe(89);
    expect(windowInYear(w, 2001)).toEqual({ start: '2001-08-14', end: '2001-11-11' });
  });

  it('slices with NaN outside the series', () => {
    const xs = sliceVar(s, 'tmax', { start: '2019-12-31', end: '2020-01-02' });
    expect(xs[0]).toBeNaN();
    expect(xs.slice(1)).toEqual([0, 1]);
  });

  it('finds the last complete day', () => {
    const t = makeSeries('2020-01-01', '2020-01-05', { tmax: (_, i) => (i >= 3 ? Number.NaN : 30) });
    expect(lastCompleteDate(t)).toBe('2020-01-03');
  });
});

describe('season/indicators', () => {
  it('counts frost (<0), heavy rain (>=20 mm) and hot days (> threshold)', () => {
    const s = makeSeries('2021-01-01', '2021-01-05', {
      tmax: (_, i) => [30, 36, 41, 35, 40][i]!,
      tmin: (_, i) => [-1, 0, 2, -0.5, 5][i]!,
      rain: (_, i) => [0, 19.9, 20, 45, 1][i]!,
      soilWetness: () => 0.3,
      et0: () => 2,
    });
    const r = computeIndicators(s, { start: '2021-01-01', end: '2021-01-05' }, { hotTmaxC: 35 });
    expect(r.values.frostDays).toBe(2); // 0 is not frost
    expect(r.values.heavyRainDays).toBe(2);
    expect(r.values.hotDays).toBe(3); // 35 is not above 35
    expect(r.values.rainTotal).toBeCloseTo(85.9, 6);
    expect(r.values.et0Total).toBe(10);
    expect(r.values.waterBalance).toBeCloseTo(75.9, 6);
    expect(r.values.soilWetness).toBeCloseTo(0.3, 6);
    expect(r.coverage).toBe(1);
  });

  it('returns NaN for soil wetness and ET0 when coverage is too low', () => {
    const s = makeSeries('2021-01-01', '2021-01-10', {
      soilWetness: (_, i) => (i < 5 ? 0.2 : Number.NaN),
      et0: () => Number.NaN,
    });
    const r = computeIndicators(s, { start: '2021-01-01', end: '2021-01-10' }, { hotTmaxC: 40 });
    expect(r.values.soilWetness).toBeNaN();
    expect(r.values.et0Total).toBeNaN();
    expect(r.values.waterBalance).toBeNaN();
  });

  it('mid-rank counts ties as half and maps to terciles', () => {
    expect(midRank(0, [0, 0, 0, 0])).toBe(0.5);
    expect(midRank(10, [1, 2, 3])).toBe(1);
    expect(midRank(0, [1, 2, 3])).toBe(0);
    expect(tercileOf(0.2)).toBe('below');
    expect(tercileOf(0.5)).toBe('near');
    expect(tercileOf(0.9)).toBe('above');
    expect(tercileOf(Number.NaN)).toBeNull();
  });

  it('compareToBaseline reports normal, range and sample size', () => {
    const c = compareToBaseline(15, [10, 12, 14, 16, 18, Number.NaN]);
    expect(c.normal).toBe(14); // median
    expect(c.mean).toBe(14);
    expect(c.nYears).toBe(5);
    expect(c.min).toBe(10);
    expect(c.max).toBe(18);
    expect(c.tercile).toBe('near');
  });
});

describe('season/compareSeason', () => {
  // 1990..2026: rain on the last day of each 30-day window equals (year - 1990) mm; this year is wettest.
  const s = makeSeries('1990-01-01', '2026-11-11', {
    tmax: (d) => (yearOf(d) === 2026 ? 45 : 30 + (yearOf(d) % 5)),
    tmin: () => 10,
    rain: (d) => (d.slice(5) === '11-11' ? (yearOf(d) === 2026 ? 100 : yearOf(d) - 1990) : 0),
    soilWetness: () => 0.25,
    et0: () => 1,
  });
  const r = compareSeason(s, { lengthDays: 30 });

  it('ends on the last complete day and uses the WMO 1991-2020 normal', () => {
    expect(r.window).toEqual({ start: '2026-10-13', end: '2026-11-11' });
    expect(r.baseline.years[0]).toBe(1991);
    expect(r.baseline.years.at(-1)).toBe(2020);
    expect(r.baseline.years).toHaveLength(30);
  });

  it('flags a hot, wet season as above normal', () => {
    expect(r.thresholds.hotTmaxC).toBe(34); // 90th percentile of 30..34
    expect(r.current.hotDays).toBe(30);
    expect(r.comparisons.hotDays.tercile).toBe('above');
    expect(r.current.rainTotal).toBe(100);
    expect(r.comparisons.rainTotal.normal).toBeCloseTo(15.5, 6); // median of 1..30
    expect(r.comparisons.rainTotal.tercile).toBe('above');
    expect(r.comparisons.frostDays.tercile).toBe('near'); // all zero -> tie
  });

  it('keeps per-year indicators for every complete past year', () => {
    expect(r.perYear[0]!.year).toBe(1990);
    expect(r.perYear.at(-1)!.year).toBe(2025);
    expect(r.perYear.find((p) => p.year === 2001)!.values.rainTotal).toBe(11);
  });
});
