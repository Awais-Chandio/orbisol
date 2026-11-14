/**
 * Orbisol web - "This season vs normal" controller: pin -> climate service -> core compareSeason -> view model.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { compareSeason, type IndicatorKey, type Provenance, type SeasonComparison, type Tercile } from '@orbisol/core';
import { climateKey, getDailyClimate, type ClimateOrigin } from '@/services/climateService';
import { useFieldStore } from '@/stores/fieldStore';

export type WindowDays = 30 | 90;

export interface IndicatorView {
  key: IndicatorKey | 'greenness';
  available: boolean;
  value: number;
  normal: number;
  p10: number;
  p90: number;
  tercile: Tercile | null;
  nYears: number;
  provenance: Provenance;
}

/** Order shown on screen. tmaxMean is kept for twins, not shown as a card. */
const SHOWN: IndicatorKey[] = ['hotDays', 'rainTotal', 'heavyRainDays', 'frostDays', 'soilWetness', 'et0Total', 'waterBalance'];

export function toIndicatorViews(cmp: SeasonComparison, base: Provenance): IndicatorView[] {
  const provenance: Provenance = { ...base, dateFrom: cmp.window.start, date: cmp.window.end };
  return SHOWN.map((key) => {
    const c = cmp.comparisons[key];
    return {
      key,
      available: Number.isFinite(c.current) && c.nYears > 0,
      value: c.current,
      normal: c.normal,
      p10: c.p10,
      p90: c.p90,
      tercile: c.tercile,
      nYears: c.nYears,
      provenance,
    };
  });
}

export function useSeasonVsNormal(lengthDays: WindowDays) {
  const pin = useFieldStore((s) => s.pin);
  const query = useQuery({
    queryKey: ['climate', pin ? climateKey(pin.lat, pin.lon) : 'none'],
    queryFn: ({ signal }) => getDailyClimate(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 0,
  });

  const result = useMemo(() => {
    if (!query.data) return null;
    const cmp = compareSeason(query.data.series, { lengthDays });
    return { comparison: cmp, indicators: toIndicatorViews(cmp, query.data.series.provenance) };
  }, [query.data, lengthDays]);

  return {
    pin,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
    origin: query.data?.origin as ClimateOrigin | undefined,
    fetchedAt: query.data?.fetchedAt,
    comparison: result?.comparison ?? null,
    indicators: result?.indicators ?? [],
  };
}
