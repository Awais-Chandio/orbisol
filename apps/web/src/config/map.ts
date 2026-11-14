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

export function buildMapStyle(date: string): StyleSpecification {
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
      // GIBS Reference_Features/Labels overlays were dropped: their empty tiles are opaque black PNGs
      // (no alpha) and hide the imagery. See docs/limitations.md.
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#07173F' } },
      { id: 'imagery', type: 'raster', source: 'imagery' },
    ],
  };
}

/** Imagery is native to z9 (~300 m); allow some overzoom for pin placement, not more. */
export const MAP_MAX_ZOOM = 12;
