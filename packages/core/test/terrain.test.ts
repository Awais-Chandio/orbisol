import { describe, expect, it } from 'vitest';
import { FAO_SLOPE_CLASSES, hornSlopePct, slopeClass } from '../src';

describe('terrain', () => {
  it('uses the FAO 2006 Table 7 slope classes', () => {
    expect(FAO_SLOPE_CLASSES).toHaveLength(10);
    expect(slopeClass(0.1)?.name).toBe('Flat');
    expect(slopeClass(0.2)?.name).toBe('Level');
    expect(slopeClass(1.5)?.name).toBe('Very gently sloping');
    expect(slopeClass(3)?.name).toBe('Gently sloping');
    expect(slopeClass(75)?.name).toBe('Very steep');
    expect(slopeClass(Number.NaN)).toBeNull();
  });

  it('computes Horn slope: flat = 0, a 1 m rise per 30 m eastward = 3.33%', () => {
    expect(hornSlopePct([5, 5, 5, 5, 5, 5, 5, 5, 5], 30, 30)).toBe(0);
    const east = [0, 1, 2, 0, 1, 2, 0, 1, 2]; // +1 m per 30 m cell to the east
    expect(hornSlopePct(east, 30, 30)).toBeCloseTo(100 / 30, 6);
    expect(hornSlopePct([0, 0, 0, 0, Number.NaN, 0, 0, 0, 0], 30, 30)).toBe(0); // centre value unused
    expect(hornSlopePct([Number.NaN, 0, 0, 0, 0, 0, 0, 0, 0], 30, 30)).toBeNaN();
  });
});
