/**
 * Orbisol web - Season Twins + Confidence Meter + Track Record for the selected window.
 * Outcomes: mean Tmax and rain over the next 60 days (NDVI greenness arrives with the satellite pipeline).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import {
  backtestTwins,
  compareSeason,
  confidenceMeter,
  mean,
  nextWindowIndicators,
  seasonTwins,
  twinOutlook,
  type IndicatorKey,
} from '@orbisol/core';
import { useClimate } from './useClimate';
import type { WindowDays } from './useSeasonVsNormal';

export const OUTLOOK_DAYS = 60;
export const OUTCOMES: IndicatorKey[] = ['tmaxMean', 'rainTotal'];
/** Twins are searched from 2001, the start of the MODIS greenness record. */
export const TWIN_FROM_YEAR = 2001;

export function useSeasonOutlook(lengthDays: WindowDays) {
  const { data } = useClimate();
  return useMemo(() => {
    if (!data) return null;
    const s = data.series;
    const cmp = compareSeason(s, { lengthDays });
    const tw = seasonTwins(cmp.current, cmp.perYear.filter((p) => p.year >= TWIN_FROM_YEAR));
    const next = nextWindowIndicators(s, cmp, OUTLOOK_DAYS);
    const outlooks = OUTCOMES.map((key) => {
      const outcomes = new Map([...next].map(([y, v]) => [y, v[key]]));
      const baseline = cmp.baseline.years.map((y) => outcomes.get(y)).filter((x): x is number => x !== undefined);
      const outlook = twinOutlook(tw.twins, outcomes, baseline);
      const track = backtestTwins(cmp.perYear, outcomes);
      const confidence = confidenceMeter({
        nTwins: tw.twins.length,
        meanDistance: mean(tw.twins.map((t) => t.distance)),
        agreement: outlook.agreement,
        coverage: cmp.currentCoverage,
        backtest: track,
      });
      return { key, outlook, track, confidence: outlook.informative ? confidence : null };
    });
    return { comparison: cmp, twins: tw, outlooks, provenance: s.provenance };
  }, [data, lengthDays]);
}
