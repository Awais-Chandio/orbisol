/**
 * Orbisol web - device GPS service.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { LatLonSchema } from '@/models/field';

export interface GpsFix {
  lat: number;
  lon: number;
  accuracyM: number;
}

export type GpsErrorCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GpsError extends Error {
  constructor(public readonly code: GpsErrorCode) {
    super(code);
  }
}

export function getCurrentPosition(timeoutMs = 15000): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GpsError('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const parsed = LatLonSchema.safeParse({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        if (!parsed.success) {
          reject(new GpsError('unavailable'));
          return;
        }
        resolve({ ...parsed.data, accuracyM: pos.coords.accuracy });
      },
      (err) => {
        const code: GpsErrorCode =
          err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable';
        reject(new GpsError(code));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
