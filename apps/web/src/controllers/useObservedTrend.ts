/**
 * Orbisol web - observed long-term trend (1990 to the last complete year) from the same NASA POWER series.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { observedTrend } from '@orbisol/core';
import { useClimate } from './useClimate';

export function useObservedTrend() {
  const { data } = useClimate();
  const trend = useMemo(() => (data ? observedTrend(data.series) : null), [data]);
  return { trend, provenance: data?.series.provenance };
}
