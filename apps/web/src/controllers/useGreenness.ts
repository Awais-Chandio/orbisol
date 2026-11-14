/**
 * Orbisol web - greenness controller: precomputed MODIS NDVI -> core compareGreenness.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { compareGreenness } from '@orbisol/core';
import { getGreenness } from '@/services/ndviService';
import { useFieldStore } from '@/stores/fieldStore';

export function useGreennessData() {
  const pin = useFieldStore((s) => s.pin);
  return useQuery({
    queryKey: ['ndvi', pin ? `${pin.lat.toFixed(3)},${pin.lon.toFixed(3)}` : 'none'],
    queryFn: ({ signal }) => getGreenness(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: Infinity,
    retry: 1,
  });
}

export function useGreenness(lengthDays: number) {
  const q = useGreennessData();
  const cmp = useMemo(() => (q.data ? compareGreenness(q.data.series, lengthDays) : null), [q.data, lengthDays]);
  return { isLoading: q.isLoading, isError: q.isError, available: !!q.data, data: q.data, comparison: cmp };
}
