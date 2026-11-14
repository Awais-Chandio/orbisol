/**
 * Orbisol web - place search controller (debounced query -> places service -> pin).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { compactPlace, MIN_QUERY_CHARS, type Place } from '@orbisol/core';
import { DEMO_FIELD } from '@/config/env';
import { roundCoord } from '@/models/field';
import { searchPlaces } from '@/services/placesService';
import { useFieldStore } from '@/stores/fieldStore';

export function placeLabel(p: Place): string {
  return [p.name, p.admin1, p.country].filter(Boolean).join(', ');
}

export function usePlaceSearch() {
  const pin = useFieldStore((s) => s.pin);
  const setPin = useFieldStore((s) => s.setPin);
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text), 250);
    return () => window.clearTimeout(id);
  }, [text]);

  const q = compactPlace(debounced);
  const near = pin ?? DEMO_FIELD;
  const query = useQuery({
    queryKey: ['places', q, Math.round(near.lat), Math.round(near.lon)],
    queryFn: () => searchPlaces(debounced, near),
    enabled: q.length >= MIN_QUERY_CHARS,
    staleTime: Infinity,
    retry: 1,
  });

  const choose = (p: Place) => {
    setPin({
      lat: roundCoord(p.lat),
      lon: roundCoord(p.lon),
      source: 'search',
      label: placeLabel(p).slice(0, 80),
      pinnedAt: new Date().toISOString(),
    });
    setText('');
  };

  return {
    text,
    setText,
    tooShort: compactPlace(text).length < MIN_QUERY_CHARS,
    isLoading: query.isFetching,
    isError: query.isError,
    results: query.data?.places ?? [],
    needMore: query.data?.needMore ?? false,
    provenance: query.data?.provenance,
    /** Distances are shown only relative to a real pin (the demo field is just a ranking hint). */
    showDistance: pin !== null,
    choose,
  };
}
