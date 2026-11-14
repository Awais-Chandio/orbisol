/**
 * Orbisol core - NASA POWER meteorology grid (MERRA-2 / GEOS-IT native 0.5° lat x 0.625° lon).
 * Two pins in the same cell get identical POWER values, so a precomputed file for one serves the other.
 * Checked against the POWER API on 2026-11-14: the boundary near Hyderabad is at 68.4375°E.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
export const POWER_GRID = { dLat: 0.5, dLon: 0.625 } as const;

/** Index of the grid cell whose centre is nearest to the point. */
export function powerCell(lat: number, lon: number): { i: number; j: number } {
  return { j: Math.round((lat + 90) / POWER_GRID.dLat), i: Math.round((lon + 180) / POWER_GRID.dLon) };
}

export function samePowerCell(a: { lat: number; lon: number }, b: { lat: number; lon: number }): boolean {
  const ca = powerCell(a.lat, a.lon);
  const cb = powerCell(b.lat, b.lon);
  return ca.i === cb.i && ca.j === cb.j;
}
