import { describe, expect, it } from 'vitest';
import { addDays, compareRain, daysBetween } from '../src';

describe('compareRain (satellite rain only)', () => {
  // 1998-2026: 5 mm every day of August, plus one 25 mm day each 15 Aug; 2026 August is dry
  const start = '1998-01-01';
  const end = '2026-11-01';
  const n = daysBetween(start, end) + 1;
  const rain = Array.from({ length: n }, (_, i) => {
    const d = addDays(start, i);
    if (d.startsWith('2026')) return 0;
    if (d.slice(5) === '08-15') return 25;
    return d.slice(5, 7) === '08' ? 5 : 0;
  });
  const r = compareRain({ start, rain, provenance: { source: 't', kind: 'satellite', date: end } }, { lengthDays: 120 })!;

  it('uses the window ending on the last valid day and a 2001-2020 baseline', () => {
    expect(r.window.end).toBe('2026-11-01');
    expect(r.baseline.years).toHaveLength(20);
  });

  it('flags a dry season as below normal, with R20mm counted', () => {
    expect(r.rainTotal.normal).toBe(30 * 5 + 25);
    expect(r.rainTotal.tercile).toBe('below');
    expect(r.heavyRainDays.normal).toBe(1);
    expect(r.heavyRainDays.current).toBe(0);
  });
});
