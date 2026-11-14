/**
 * Orbisol web - 2050 heat outlook controller (climate model projection, not a forecast).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useQuery } from '@tanstack/react-query';
import { getHeat2050 } from '@/services/heat2050Service';
import { useFieldStore } from '@/stores/fieldStore';

export function useHeat2050() {
  const pin = useFieldStore((s) => s.pin);
  const q = useQuery({
    queryKey: ['heat2050', pin ? `${pin.lat.toFixed(3)},${pin.lon.toFixed(3)}` : 'none'],
    queryFn: ({ signal }) => getHeat2050(pin!.lat, pin!.lon, signal),
    enabled: pin !== null,
    staleTime: Infinity,
    retry: 1,
  });
  return q.data ?? null;
}
