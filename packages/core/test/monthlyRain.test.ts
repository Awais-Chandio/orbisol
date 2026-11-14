import { describe, expect, it } from 'vitest';
import { compareLatestMonths, type MonthlyRain } from '../src';

/** 2000-01 .. 2025-12: 10 mm every month, except Nov of each year = 30 mm; 2025 Oct-Dec wetter. */
function series(): MonthlyRain[] {
  const out: MonthlyRain[] = [];
  for (let y = 2000; y <= 2025; y++)
    for (let m = 1; m <= 12; m++) {
      let mm = m === 11 ? 30 : 10;
      if (y === 2025 && m >= 10) mm = 100;
      out.push({ month: `${y}-${String(m).padStart(2, '0')}`, mm });
    }
  return out;
}

describe('monthly satellite rain vs record', () => {
  it('compares the last 3 months with the same months in all earlier years', () => {
    const c = compareLatestMonths(series(), 3)!;
    expect(c.months).toEqual(['2025-10', '2025-11', '2025-12']);
    expect(c.years).toHaveLength(25); // 2000-2024
    expect(c.comparison.current).toBe(300);
    expect(c.comparison.normal).toBe(50); // 10 + 30 + 10
    expect(c.comparison.tercile).toBe('above');
  });

  it('handles a window across the new year and skips years with a missing month', () => {
    const s = series().filter((p) => p.month <= '2025-02').map((p) => (p.month === '2003-01' ? { ...p, mm: null } : p));
    const c = compareLatestMonths(s, 3)!;
    expect(c.months).toEqual(['2024-12', '2025-01', '2025-02']);
    // a window is named by the year it ends in: 2003 = Dec 2002 + Jan-Feb 2003, and Jan 2003 is missing
    expect(c.years).not.toContain(2003);
    expect(c.years).toContain(2002);
    expect(c.years[0]).toBe(2001); // 2000 would need Dec 1999, before the record
  });
});
