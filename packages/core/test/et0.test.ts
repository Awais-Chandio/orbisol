import { describe, expect, it } from 'vitest';
import {
  buildDailyClimate,
  dayOfYear,
  extraterrestrialRadiation,
  fao56Et0,
  pressureFromElevation,
  satVapourPressure,
} from '../src';

describe('FAO-56 building blocks', () => {
  it('matches FAO-56 worked examples', () => {
    expect(pressureFromElevation(1800)).toBeCloseTo(81.8, 1); // Example 2
    expect(satVapourPressure(24.5)).toBeCloseTo(3.075, 2); // Example 3 (Tmax)
    expect(extraterrestrialRadiation(-20, 246)).toBeCloseTo(32.2, 1); // Example 8 (3 Sept, 20°S)
    expect(dayOfYear('2026-07-06')).toBe(187);
    expect(dayOfYear('2024-12-31')).toBe(366);
  });
});

describe('fao56Et0', () => {
  // FAO-56 Example 18: Uccle (Brussels), 6 July, 50°48'N, 100 m. Published ET0 = 3.9 mm/day.
  const uccle = {
    tmaxC: 21.5,
    tminC: 12.3,
    eaKPa: 1.409,
    rsMJ: 22.07,
    u2: 2.078,
    elevationM: 100,
    latDeg: 50.8,
    dayOfYear: 187,
  };

  it('reproduces FAO-56 Example 18', () => {
    expect(extraterrestrialRadiation(50.8, 187)).toBeCloseTo(41.09, 1);
    expect(fao56Et0(uccle)).toBeCloseTo(3.9, 1);
  });

  it('is NaN with missing inputs and never negative', () => {
    expect(fao56Et0({ ...uccle, rsMJ: Number.NaN })).toBeNaN();
    expect(fao56Et0({ ...uccle, rsMJ: 0.1, eaKPa: 2.0, u2: 0 })).toBeGreaterThanOrEqual(0);
  });

  it('buildDailyClimate derives et0 per day', () => {
    const s = buildDailyClimate(
      '2026-07-06',
      { tmax: [21.5], tmin: [12.3], rain: [0], soilWetness: [0.3], tdew: [Number.NaN], wind2m: [2.078], solar: [22.07] },
      { lat: 50.8, lon: 4.35, elevationM: 100 },
      { source: 't', kind: 'model', date: '2026-07-06' },
    );
    expect(s.values.et0[0]).toBeNaN(); // no dew point -> no ea
    const s2 = buildDailyClimate(
      '2026-07-06',
      { tmax: [21.5], tmin: [12.3], rain: [0], soilWetness: [0.3], tdew: [12.0], wind2m: [2.078], solar: [22.07] },
      { lat: 50.8, lon: 4.35, elevationM: 100 },
      { source: 't', kind: 'model', date: '2026-07-06' },
    );
    // Tdew 12.0 °C -> ea ≈ 1.40 kPa, close to the example -> ET0 ≈ 3.9
    expect(s2.values.et0[0]).toBeCloseTo(3.9, 1);
  });
});
