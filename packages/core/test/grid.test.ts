import { describe, expect, it } from 'vitest';
import { powerCell, samePowerCell } from '../src';

describe('POWER grid cells (verified against the POWER API)', () => {
  it('puts Hyderabad city, the demo farm and points west of 68.4375E in one cell', () => {
    expect(powerCell(25.4, 68.37)).toEqual({ j: 231, i: 397 });
    expect(samePowerCell({ lat: 25.4, lon: 68.37 }, { lat: 25.48, lon: 68.41 })).toBe(true);
    expect(samePowerCell({ lat: 25.4, lon: 68.37 }, { lat: 25.43, lon: 68.43 })).toBe(true);
  });
  it('puts Tando Jam town (68.53E) and 68.44E in the next cell east', () => {
    expect(samePowerCell({ lat: 25.4, lon: 68.37 }, { lat: 25.43, lon: 68.53 })).toBe(false);
    expect(samePowerCell({ lat: 25.4, lon: 68.37 }, { lat: 25.43, lon: 68.44 })).toBe(false);
  });
});
