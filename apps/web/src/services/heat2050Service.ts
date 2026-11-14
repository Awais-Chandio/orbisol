/**
 * Orbisol web - 2050 heat outlook for a pin: precomputed NEX-GDDP-CMIP6 file when the pin is in the sampled cell.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { STATIC_HEAT2050 } from '@/config/sources';
import { Heat2050Schema, type Heat2050 } from '@/models/heat2050';
import { fetchStaticJson } from './staticJson';

export async function getHeat2050(lat: number, lon: number, signal?: AbortSignal): Promise<Heat2050 | null> {
  const hit = STATIC_HEAT2050.find((c) => Math.abs(lat - c.gridLat) <= c.cellDeg / 2 && Math.abs(lon - c.gridLon) <= c.cellDeg / 2);
  if (!hit) return null;
  const json = await fetchStaticJson(hit.path, signal);
  return json === null ? null : Heat2050Schema.parse(json);
}
