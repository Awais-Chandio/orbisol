/**
 * Orbisol web - cropland greenness for a pin: precomputed NDVI from the pipeline (data/), when the pin is
 * inside a sampled window. Elsewhere greenness is reported as a data gap (no live NDVI in this build).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { distanceKm, type CompositeSeries } from '@orbisol/core';
import { STATIC_NDVI } from '@/config/sources';
import { fetchStaticJson } from './staticJson';
import { NdviFileSchema, ndviToSeries, type NdviFile } from '@/models/ndvi';

export interface GreennessData {
  series: CompositeSeries;
  method: NdviFile['method'];
}

export async function getGreenness(lat: number, lon: number, signal?: AbortSignal): Promise<GreennessData | null> {
  const hit = STATIC_NDVI.find((s) => distanceKm({ lat, lon }, s) <= s.windowKm);
  if (!hit) return null;
  const json = await fetchStaticJson(hit.path, signal);
  if (json === null) return null;
  const file = NdviFileSchema.parse(json);
  return { series: ndviToSeries(file), method: file.method };
}
