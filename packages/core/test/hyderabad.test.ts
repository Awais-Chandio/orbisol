import { describe, expect, it } from 'vitest';
import { compareRotations, compareSeason, monthTimeline, et0Climatology, hazardMonths, monthlyClimate, SOURCES } from '../src';
import { hyderabadSeries } from './fixture';

// Integration test on real NASA POWER data for the Hyderabad case study.
describe('Hyderabad case study (real NASA POWER data)', () => {
  const s = hyderabadSeries();
  const hz = hazardMonths(monthlyClimate(s));
  const env = { et0Clim: et0Climatology(s), hazards: hz };
  const reports = compareRotations(
    {
      existing: [
        { crop: 'cotton', sow: '05-15', harvest: '10-31' },
        { crop: 'wheat', sow: '11-10', harvest: '04-15' },
      ],
      priorities: ['water_use', 'forage_value'],
      salty: false,
    },
    env,
  );

  it('hottest months are April-June', () => {
    expect(hz.hot).toEqual([4, 5, 6]);
  });

  it('existing cotton -> wheat leaves the field bare in the hottest weeks', () => {
    const ex = reports[0]!;
    expect(ex.plan.kind).toBe('existing');
    expect(ex.metrics.bareHotDays).toBeGreaterThanOrEqual(20);
  });

  it('returns the existing rotation plus two different alternatives, each fully explained', () => {
    expect(reports).toHaveLength(3);
    expect(new Set(reports.map((r) => r.plan.id)).size).toBe(3);
    for (const r of reports) {
      expect(r.why.length).toBeGreaterThan(0);
      expect(r.evidence.length).toBeGreaterThan(0);
      expect(r.gaps.some((g) => g.key === 'gap.market')).toBe(true);
      for (const n of r.evidence) {
        expect(n.source === 'nasa_power' || n.source === 'computed' || n.source === 'farmer' || (n.source && n.source in SOURCES)).toBe(true);
      }
    }
  });

  it('calendar shows April-May bare and hot for the existing rotation, wheat ripening in April', () => {
    const ex = reports[0]!;
    const cal = monthTimeline(ex.plan, ex.metrics, hz);
    expect(cal).toHaveLength(12);
    expect(cal[4]!.bareDays).toBeGreaterThan(10); // May
    expect(cal[4]!.hazards).toContain('hot');
    expect(cal[3]!.crops.find((c) => c.crop === 'wheat')?.stage).toBe('late'); // April
    expect(cal[3]!.vulnerable).toContainEqual({ crop: 'wheat', hazard: 'hot' });
  });

  it('season comparison has 30 baseline years and complete recent data', () => {
    const c = compareSeason(s, { lengthDays: 90 });
    expect(c.baseline.years).toHaveLength(30);
    expect(c.currentCoverage).toBe(1);
  });
});
