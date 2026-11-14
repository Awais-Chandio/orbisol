/**
 * Orbisol web - shared climate query for the pinned field (one fetch serves every screen).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { et0Climatology, hazardMonths, monthlyClimate } from '@orbisol/core';
import { climateKey, getDailyClimate } from '@/services/climateService';
import { useFieldStore } from '@/stores/fieldStore';

export function useClimate() {
  const pin = useFieldStore((s) => s.pin);
  const query = useQuery({
    queryKey: ['climate', pin ? climateKey(pin.lat, pin.lon) : 'none'],
    queryFn: ({ signal }) => getDailyClimate(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 0,
  });
  return { pin, query, data: query.data };
}

/** Normals the rotation engine needs (ET0 by day of year, monthly hazards), computed once per series. */
export function useClimateEnvironment() {
  const c = useClimate();
  const env = useMemo(() => {
    if (!c.data) return null;
    const monthly = monthlyClimate(c.data.series);
    return { et0Clim: et0Climatology(c.data.series), hazards: hazardMonths(monthly), monthly };
  }, [c.data]);
  return { ...c, env };
}
