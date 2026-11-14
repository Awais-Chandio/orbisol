/**
 * Orbisol core - terrain: slope from an elevation grid (Horn 1981, 3x3 window) and FAO slope gradient classes.
 * Slope classes: FAO (2006) Guidelines for soil description, 4th ed., Table 7 "Slope gradient classes".
 * https://www.fao.org/4/a0541e/a0541e.pdf
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */

export interface SlopeClass {
  code: string;
  name: string;
  /** Lower bound, % (inclusive). */
  from: number;
  /** Upper bound, % (exclusive); Infinity for the last class. */
  to: number;
}

export const FAO_SLOPE_CLASSES: readonly SlopeClass[] = [
  { code: '01', name: 'Flat', from: 0, to: 0.2 },
  { code: '02', name: 'Level', from: 0.2, to: 0.5 },
  { code: '03', name: 'Nearly level', from: 0.5, to: 1 },
  { code: '04', name: 'Very gently sloping', from: 1, to: 2 },
  { code: '05', name: 'Gently sloping', from: 2, to: 5 },
  { code: '06', name: 'Sloping', from: 5, to: 10 },
  { code: '07', name: 'Strongly sloping', from: 10, to: 15 },
  { code: '08', name: 'Moderately steep', from: 15, to: 30 },
  { code: '09', name: 'Steep', from: 30, to: 60 },
  { code: '10', name: 'Very steep', from: 60, to: Infinity },
];

export function slopeClass(pct: number): SlopeClass | null {
  if (!Number.isFinite(pct) || pct < 0) return null;
  return FAO_SLOPE_CLASSES.find((c) => pct >= c.from && pct < c.to) ?? null;
}

/**
 * Slope in percent at the centre of a 3x3 elevation window (Horn's method).
 * z: row-major [a b c / d e f / g h i] in metres, rows from north to south; dx, dy: cell size in metres.
 */
export function hornSlopePct(z: readonly number[], dx: number, dy: number): number {
  // the centre cell is not used by Horn's method, so only the 8 neighbours must be valid
  if (z.length !== 9 || z.some((v, k) => k !== 4 && !Number.isFinite(v))) return Number.NaN;
  const [a, b, c, d, , f, g, h, i] = z as [number, number, number, number, number, number, number, number, number];
  const dzdx = (c + 2 * f + i - (a + 2 * d + g)) / (8 * dx);
  const dzdy = (g + 2 * h + i - (a + 2 * b + c)) / (8 * dy);
  return 100 * Math.sqrt(dzdx * dzdx + dzdy * dzdy);
}
