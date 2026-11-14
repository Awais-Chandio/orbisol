/**
 * Orbisol web - satellite rain (GPM IMERG) vs normal, and terrain / erosion (SRTM slope + POWER wind + bare months).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { compareRain, windiestMonths } from '@orbisol/core';
import { getSatelliteRain, getSlope } from '@/services/pointDataService';
import { useFieldStore } from '@/stores/fieldStore';
import { useRotationComparison } from './useRotationComparison';

function usePinKey() {
  const pin = useFieldStore((s) => s.pin);
  return { pin, key: pin ? `${pin.lat.toFixed(4)},${pin.lon.toFixed(4)}` : 'none' };
}

export function useSatelliteRain(lengthDays: number) {
  const { pin, key } = usePinKey();
  const q = useQuery({
    queryKey: ['imerg', key],
    queryFn: ({ signal }) => getSatelliteRain(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: Infinity,
    retry: 1,
  });
  const cmp = useMemo(() => {
    if (!q.data) return null;
    try {
      return compareRain(q.data, { lengthDays });
    } catch {
      return null; // a malformed or too-short file is shown as "not available", never as a crash
    }
  }, [q.data, lengthDays]);
  return { isLoading: q.isLoading, comparison: cmp, provenance: q.data?.provenance };
}

export function useTerrain() {
  const { pin, key } = usePinKey();
  const r = useRotationComparison();
  const q = useQuery({
    queryKey: ['slope', key],
    queryFn: ({ signal }) => getSlope(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: Infinity,
  });
  const windy = r.monthly.length ? windiestMonths(r.monthly) : [];
  const existing = r.strategies[0];
  const bareWindyDays = existing ? existing.months.filter((m) => windy.includes(m.month)).reduce((a, m) => a + m.bareDays, 0) : 0;
  return { slope: q.data ?? null, windy, bareWindyDays, climate: r.provenance };
}
