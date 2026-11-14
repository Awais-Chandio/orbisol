/**
 * Orbisol web - field picker controller (GPS, map tap, manual entry, demo field).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { useCallback, useState } from 'react';
import { DEMO_FIELD } from '@/config/env';
import { LatLonSchema, roundCoord, type PinSource } from '@/models/field';
import { getCurrentPosition, GpsError, type GpsErrorCode } from '@/services/geolocation';
import { useFieldStore } from '@/stores/fieldStore';

export type LocateStatus = 'idle' | 'locating' | 'error';

export function useFieldPicker() {
  const pin = useFieldStore((s) => s.pin);
  const setPin = useFieldStore((s) => s.setPin);
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [gpsError, setGpsError] = useState<GpsErrorCode | null>(null);

  const place = useCallback(
    (lat: number, lon: number, source: PinSource, extra: { accuracyM?: number; label?: string } = {}) => {
      const ok = LatLonSchema.safeParse({ lat, lon });
      if (!ok.success) return false;
      setPin({
        lat: roundCoord(lat),
        lon: roundCoord(lon),
        source,
        pinnedAt: new Date().toISOString(),
        ...extra,
      });
      return true;
    },
    [setPin],
  );

  const locate = useCallback(async () => {
    setStatus('locating');
    setGpsError(null);
    try {
      const fix = await getCurrentPosition();
      place(fix.lat, fix.lon, 'gps', { accuracyM: Math.round(fix.accuracyM) });
      setStatus('idle');
    } catch (e) {
      setGpsError(e instanceof GpsError ? e.code : 'unavailable');
      setStatus('error');
    }
  }, [place]);

  const pickOnMap = useCallback((lat: number, lon: number) => place(lat, lon, 'map'), [place]);
  const enterManually = useCallback((lat: number, lon: number) => place(lat, lon, 'manual'), [place]);
  const useDemoField = useCallback(
    () => place(DEMO_FIELD.lat, DEMO_FIELD.lon, 'demo', { label: DEMO_FIELD.label }),
    [place],
  );

  return { pin, status, gpsError, locate, pickOnMap, enterManually, useDemoField };
}
