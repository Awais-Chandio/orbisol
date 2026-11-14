/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { useEffect, useRef, useState } from 'react';
import { Map as MlMap, Marker, NavigationControl, setWorkerUrl, type RasterTileSource } from 'maplibre-gl';
// MapLibre v6 looks for its worker next to its own file; after bundling we must point it at Vite's copy.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import { buildMapStyle, gibsImageryDate, MAP_MAX_ZOOM, ndviTileUrl } from '@/config/map';
import { DEMO_FIELD } from '@/config/env';

setWorkerUrl(maplibreWorkerUrl);

export type MapLayer = 'true' | 'ndvi';

interface Props {
  pin: { lat: number; lon: number } | null;
  onPick: (lat: number, lon: number) => void;
  /** Base imagery: true colour, or MODIS greenness (NDVI) for `ndviDate`. */
  layer?: MapLayer;
  ndviDate?: string;
  /** Called once if greenness tiles fail (offline, server error): the caller falls back to true colour. */
  onNdviError?: () => void;
}

/** MapLibre map on NASA GIBS imagery. Tap or drag the pin to choose a field. Lazy-loaded (heavy). */
export default function FieldMap({ pin, onPick, layer = 'true', ndviDate = '2025-01-01', onNdviError }: Props) {
  const { t } = useTranslation();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onNdviErrorRef = useRef(onNdviError);
  onNdviErrorRef.current = onNdviError;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    let m: MlMap;
    try {
      const start = pin ?? DEMO_FIELD;
      m = new MlMap({
        container: el.current,
        style: buildMapStyle(gibsImageryDate(), ndviDate),
        center: [start.lon, start.lat],
        zoom: pin ? 9 : 6,
        maxZoom: MAP_MAX_ZOOM,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      setFailed(true);
      return;
    }
    m.touchZoomRotate.disableRotation();
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    // Start with the attribution collapsed (the "i" button) so it doesn't cover the field on small screens.
    m.once('load', () => el.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
    m.on('click', (e) => onPickRef.current(e.lngLat.lat, e.lngLat.lng));
    m.once('load', () => setReady(true));
    // A failing greenness tile (offline, server error) must not break the map: report once, caller shows true colour.
    let ndviFailed = false;
    m.on('error', (e) => {
      const src = (e as { sourceId?: string }).sourceId;
      if (src === 'ndvi' && !ndviFailed && m.getLayoutProperty('ndvi', 'visibility') === 'visible') {
        ndviFailed = true;
        onNdviErrorRef.current?.();
      }
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // map is created once; pin changes are handled below
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !pin) return;
    if (!marker.current) {
      marker.current = new Marker({ color: '#EAFE07', draggable: true })
        .setLngLat([pin.lon, pin.lat])
        .addTo(m);
      marker.current.on('dragend', () => {
        const p = marker.current?.getLngLat();
        if (p) onPickRef.current(p.lat, p.lng);
      });
    } else {
      marker.current.setLngLat([pin.lon, pin.lat]);
    }
    const c = m.getCenter();
    const far = Math.abs(c.lat - pin.lat) > 0.05 || Math.abs(c.lng - pin.lon) > 0.05;
    if (far || m.getZoom() < 8) m.flyTo({ center: [pin.lon, pin.lat], zoom: Math.max(m.getZoom(), 9), essential: true });
  }, [pin]);

  // Layer switch and month: change visibility and the time segment of the greenness tiles.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    try {
      m.setLayoutProperty('ndvi', 'visibility', layer === 'ndvi' ? 'visible' : 'none');
      (m.getSource('ndvi') as RasterTileSource | undefined)?.setTiles([ndviTileUrl(ndviDate)]);
    } catch {
      /* style not ready: the next render applies it */
    }
  }, [layer, ndviDate, ready]);

  if (failed) return <p className="card light">{t('field.mapError')}</p>;
  return <div ref={el} className="field-map" role="application" aria-label={t('field.tapHint')} />;
}
