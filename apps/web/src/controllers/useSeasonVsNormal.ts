/**
 * Orbisol web - "This season vs normal" controller: pin -> climate service -> core compareSeason -> view model.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { compareSeason, type IndicatorKey, type Provenance, type SeasonComparison, type Tercile } from '@orbisol/core';
import type { ClimateOrigin } from '@/services/climateService';
import { useClimate } from './useClimate';

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
  const { pin, query } = useClimate();

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
