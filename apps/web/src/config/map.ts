/**
 * Orbisol web - map configuration (NASA GIBS imagery; no tile.openstreetmap.org).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { StyleSpecification } from 'maplibre-gl';

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

/** VIIRS NOAA-20 daily imagery is published with a lag; use a date 3 days back (UTC). */
export function gibsImageryDate(now: Date = new Date(), daysBack = 3): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack));
  return d.toISOString().slice(0, 10);
}

export const IMAGERY_LAYER = 'VIIRS_NOAA20_CorrectedReflectance_TrueColor';

/**
 * Greenness layer: MODIS Terra L3 NDVI 16-day (GIBS WMTS, EPSG:3857, TileMatrixSet GoogleMapsCompatible_Level9, PNG).
 * Checked in GetCapabilities on 15 Nov 2026 (record 2000-03-05 to 2026-10-16, 16-day periods from 1 Jan each year);
 * tiles over Hyderabad, Faisalabad and the Nile Delta return real images. The time segment is required.
 */
export const NDVI_LAYER = 'MODIS_Terra_L3_NDVI_16Day';
export const NDVI_MAX_ZOOM = 9;

export function ndviTileUrl(date: string): string {
  return `${GIBS}/${NDVI_LAYER}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
}

/** Latest complete calendar year (all 16-day composites published). */
export function latestCompleteYear(now: Date = new Date()): number {
  return now.getUTCFullYear() - 1;
}

/** Start date of the 16-day composite that covers the 15th of `month` (composites start 1 Jan, every 16 days). */
export function midMonthCompositeDate(year: number, month: number): string {
  const jan1 = Date.UTC(year, 0, 1);
  const mid = Date.UTC(year, month - 1, 15);
  const k = Math.floor((mid - jan1) / 86_400_000 / 16);
  return new Date(jan1 + k * 16 * 86_400_000).toISOString().slice(0, 10);
}

export function buildMapStyle(date: string, ndviDate: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      imagery: {
        type: 'raster',
        tiles: [`${GIBS}/${IMAGERY_LAYER}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`],
        tileSize: 256,
        maxzoom: 9,
        attribution: `Imagery: NASA GIBS, VIIRS NOAA-20 true color (${date})`,
      },
      ndvi: {
        type: 'raster',
        tiles: [ndviTileUrl(ndviDate)],
        tileSize: 256,
        maxzoom: NDVI_MAX_ZOOM,
        attribution: 'Greenness: NASA GIBS, MODIS Terra NDVI 16-day',
      },
      // Coastlines need the time segment ("default/default"); without it GIBS returns opaque black empty
      // tiles. Reference_Labels_15m / Reference_Features_15m return no content at all (tested 14 Nov 2026,
      // also over New York and London), so they are not used; place search replaces labels.
      coastlines: {
        type: 'raster',
        tiles: [`${GIBS}/Coastlines_15m/default/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`],
        tileSize: 256,
        maxzoom: 13,
        attribution: 'Coastlines: NASA GIBS reference layer, © OpenStreetMap contributors',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#07173F' } },
      { id: 'imagery', type: 'raster', source: 'imagery' },
      { id: 'ndvi', type: 'raster', source: 'ndvi', layout: { visibility: 'none' } },
      { id: 'coastlines', type: 'raster', source: 'coastlines' },
    ],
  };
}

/** Imagery is native to z9 (~300 m); allow some overzoom for pin placement, not more. */
export const MAP_MAX_ZOOM = 12;
