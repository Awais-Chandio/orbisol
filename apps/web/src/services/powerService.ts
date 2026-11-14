/**
 * Orbisol web - NASA POWER daily point API client (live data for any pin).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { addDays, buildDailyClimate, daysBetween, lastCompleteDate, type DailyClimate, type RawClimateVar } from '@orbisol/core';
import { POWER } from '@/config/sources';
import { PowerDailyResponseSchema } from '@/models/power';

function yyyymmddToIso(k: string): string {
  return `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
}

export function buildPowerUrl(lat: number, lon: number, end: Date = new Date()): string {
  const q = new URLSearchParams({
    parameters: Object.keys(POWER.params).join(','),
    community: POWER.community,
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start: POWER.start,
    end: end.toISOString().slice(0, 10).replaceAll('-', ''),
    format: 'JSON',
  });
  return `${POWER.url}?${q.toString()}`;
}

/** Fetch, validate (Zod) and convert to the core DailyClimate type. */
export async function fetchPowerDaily(lat: number, lon: number, signal?: AbortSignal): Promise<DailyClimate> {
  const timeout = AbortSignal.timeout(POWER.timeoutMs);
  const res = await fetch(buildPowerUrl(lat, lon), {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!res.ok) throw new Error(`NASA POWER returned HTTP ${res.status}`);
  const parsed = PowerDailyResponseSchema.parse(await res.json());
  const fill = parsed.header.fill_value;
  const par = parsed.properties.parameter;

  const keys = Object.keys(par.T2M_MAX).sort();
  if (keys.length === 0) throw new Error('NASA POWER returned no days');
  const start = yyyymmddToIso(keys[0]!);
  const n = daysBetween(start, yyyymmddToIso(keys[keys.length - 1]!)) + 1;

  const dayKeys = Array.from({ length: n }, (_, i) => addDays(start, i).replaceAll('-', ''));
  const raw = {} as Record<RawClimateVar, number[]>;
  for (const [pname, v] of Object.entries(POWER.params) as [keyof typeof par, RawClimateVar][]) {
    const src = par[pname];
    const out = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const x = src[dayKeys[i]!];
      const ok = x !== undefined && x !== fill && Number.isFinite(x);
      out[i] = ok ? x : Number.NaN;
    }
    raw[v] = out;
  }

  const [, , elevationM] = parsed.geometry.coordinates;
  const series: DailyClimate = buildDailyClimate(
    start,
    raw,
    { lat, lon, elevationM },
    { source: POWER.source, kind: 'reanalysis', date: start, dateFrom: start, url: POWER.home },
  );
  series.provenance.date = lastCompleteDate(series) ?? start;
  return series;
}
