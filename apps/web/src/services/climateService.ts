/**
 * Orbisol web - daily climate for a pin: live NASA POWER -> device cache -> built-in data/ JSON.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { DailyClimate } from '@orbisol/core';
import { CLIMATE_FRESH_MS, POWER, STATIC_CLIMATE } from '@/config/sources';
import { ClimateFileSchema, fileToSeries, seriesToFile } from '@/models/climate';
import { db, type ClimateCacheRow } from './db';
import { fetchPowerDaily } from './powerService';

export type ClimateOrigin = 'live' | 'cache' | 'static';

export interface ClimateResult {
  series: DailyClimate;
  origin: ClimateOrigin;
  /** When this copy was fetched (ISO). */
  fetchedAt: string;
}

export class ClimateUnavailableError extends Error {
  constructor(public override readonly cause: unknown) {
    super('Climate data unavailable');
  }
}

/** POWER grid is ~0.5°, so 2 decimals is plenty for a cache key. */
export function climateKey(lat: number, lon: number): string {
  return `power:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function readCache(key: string): Promise<ClimateCacheRow | undefined> {
  try {
    const row = await db.climate.get(key);
    if (!row) return undefined;
    return ClimateFileSchema.safeParse(row.file).success ? row : undefined;
  } catch {
    return undefined; // IndexedDB blocked (private mode) -> behave as no cache
  }
}

async function loadStatic(lat: number, lon: number, signal?: AbortSignal): Promise<ClimateResult | null> {
  const hit = STATIC_CLIMATE.find(
    (s) => Math.abs(s.lat - lat) <= POWER.cellHalf.lat && Math.abs(s.lon - lon) <= POWER.cellHalf.lon,
  );
  if (!hit) return null;
  const res = await fetch(hit.path, { signal });
  if (!res.ok) return null;
  const file = ClimateFileSchema.parse(await res.json());
  return { series: fileToSeries(file), origin: 'static', fetchedAt: file.generatedAt ?? file.provenance.date };
}

export async function getDailyClimate(lat: number, lon: number, signal?: AbortSignal): Promise<ClimateResult> {
  const key = climateKey(lat, lon);
  const cached = await readCache(key);
  const fromCache = (row: ClimateCacheRow): ClimateResult => ({
    series: fileToSeries(row.file),
    origin: 'cache',
    fetchedAt: new Date(row.fetchedAt).toISOString(),
  });
  if (cached && Date.now() - cached.fetchedAt < CLIMATE_FRESH_MS) return fromCache(cached);

  let liveError: unknown = null;
  if (navigator.onLine) {
    try {
      const series = await fetchPowerDaily(lat, lon, signal);
      const now = Date.now();
      db.climate.put({ key, fetchedAt: now, file: seriesToFile(series) }).catch(() => undefined);
      return { series, origin: 'live', fetchedAt: new Date(now).toISOString() };
    } catch (e) {
      if (signal?.aborted) throw e;
      liveError = e;
    }
  }
  if (cached) return fromCache(cached);
  const st = await loadStatic(lat, lon, signal).catch(() => null);
  if (st) return st;
  throw new ClimateUnavailableError(liveError ?? new Error('offline'));
}
