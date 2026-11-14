/**
 * Orbisol web - precomputed satellite point data (IMERG rain, SRTM slope) for pins inside the sampled area.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { distanceKm, type DailyRain } from '@orbisol/core';
import { STATIC_RAIN, STATIC_RAIN_MONTHLY, STATIC_SLOPE } from '@/config/sources';
import { fetchStaticJson } from './staticJson';
import { RainFileSchema, RainMonthlyFileSchema, rainToSeries, SlopeFileSchema, type RainMonthlyFile, type SlopeFile } from '@/models/pointData';

/** Same 0.1 deg IMERG cell (cell edges at whole tenths of a degree). */
function sameImergCell(a: { lat: number; lon: number }, b: { lat: number; lon: number }): boolean {
  return Math.floor(a.lat * 10) === Math.floor(b.lat * 10) && Math.floor(a.lon * 10) === Math.floor(b.lon * 10);
}

export async function getSatelliteRain(lat: number, lon: number, signal?: AbortSignal): Promise<DailyRain | null> {
  const hit = STATIC_RAIN.find((s) => sameImergCell(s, { lat, lon }));
  if (!hit) return null;
  const json = await fetchStaticJson(hit.path, signal);
  return json === null ? null : rainToSeries(RainFileSchema.parse(json));
}

export async function getSlope(lat: number, lon: number, signal?: AbortSignal): Promise<SlopeFile | null> {
  const hit = STATIC_SLOPE.find((s) => distanceKm({ lat, lon }, s) <= s.radiusKm);
  if (!hit) return null;
  const json = await fetchStaticJson(hit.path, signal);
  return json === null ? null : SlopeFileSchema.parse(json);
}

/** Monthly satellite rain for the pin's IMERG cell, when the pipeline sampled it. */
export async function getSatelliteRainMonthly(lat: number, lon: number, signal?: AbortSignal): Promise<RainMonthlyFile | null> {
  const hit = STATIC_RAIN_MONTHLY.find((s) => sameImergCell(s, { lat, lon }));
  if (!hit) return null;
  const json = await fetchStaticJson(hit.path, signal);
  return json === null ? null : RainMonthlyFileSchema.parse(json);
}
