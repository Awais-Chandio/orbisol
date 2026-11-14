/**
 * Orbisol web - 2050 heat outlook controller (climate model projection, not a forecast).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useQuery } from '@tanstack/react-query';
import { getHeat2050 } from '@/services/heat2050Service';
import { useFieldStore } from '@/stores/fieldStore';

function useHeat2050Query() {
  const pin = useFieldStore((s) => s.pin);
  return useQuery({
    queryKey: ['heat2050', pin ? `${pin.lat.toFixed(3)},${pin.lon.toFixed(3)}` : 'none'],
    queryFn: ({ signal }) => getHeat2050(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: Infinity,
    retry: 1,
  });
}

export function useHeat2050() {
  return useHeat2050Query().data ?? null;
}

/** Data plus whether it is still loading (null data after loading = no projection file for this pin). */
export function useHeat2050State() {
  const q = useHeat2050Query();
  return { data: q.data ?? null, isLoading: q.isLoading };
}
