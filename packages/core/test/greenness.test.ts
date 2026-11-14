import { describe, expect, it } from 'vitest';
import { addDays, compareGreenness, compositeMean, greennessAfter, type Composite } from '../src';

/** Synthetic 16-day composites 2000-2026: green in Jan-Mar (0.6), dry otherwise (0.2); 2026 greener (0.7). */
function series(): Composite[] {
  const pts: Composite[] = [];
  for (let y = 2000; y <= 2026; y++) {
    for (let k = 0; k < 23; k++) {
      const date = addDays(`${y}-01-01`, k * 16);
      if (date.slice(0, 4) !== String(y)) continue;
      if (y === 2026 && date > '2026-10-16') continue;
      const m = Number(date.slice(5, 7));
      const v = m <= 3 ? 0.6 : 0.2;
      pts.push({ date, value: y === 2026 && m >= 8 ? 0.35 : v });
    }
  }
  return pts;
}
const prov = { source: 'test', kind: 'satellite' as const, date: '2026-10-16' };

describe('greenness', () => {
  it('averages composites starting inside a window', () => {
    const pts: Composite[] = [
      { date: '2021-01-01', value: 0.4 },
      { date: '2021-01-17', value: Number.NaN },
      { date: '2021-02-02', value: 0.6 },
    ];
    expect(compositeMean(pts, { start: '2021-01-01', end: '2021-01-31' })).toEqual({ value: 0.4, n: 1 });
    expect(compositeMean(pts, { start: '2021-01-01', end: '2021-02-28' }).value).toBeCloseTo(0.5, 6);
  });

  it('compares the latest window with the 2001-2020 normal', () => {
    const g = compareGreenness({ points: series(), provenance: prov }, 90)!;
    expect(g.window.end).toBe('2026-10-31'); // last composite 16 Oct + 15 days
    expect(g.comparison.nYears).toBe(20);
    expect(g.comparison.current).toBeGreaterThan(g.comparison.normal);
    expect(g.comparison.tercile).toBe('above');
  });

  it('reports what greenness did after the same window in past years, not in the unobserved future', () => {
    const after = greennessAfter({ points: series(), provenance: prov }, { start: '2026-08-14', end: '2026-11-11' }, 60);
    // 12 Nov - 10 Jan: composites from 17 Nov, 3 Dec, 19 Dec (0.2) and 1 Jan (0.6) -> 0.3
    expect(after.get(2010)).toBeCloseTo(0.3, 6);
    expect(after.has(2026)).toBe(false);
    expect(after.size).toBeGreaterThan(20);
  });
});
