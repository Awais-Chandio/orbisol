/**
 * Orbisol web - the Hyderabad case study: where the precomputed satellite layers (MODIS NDVI 3 km window, SRTM slope,
 * NEX-GDDP-CMIP6 2050 heat, GPM IMERG monthly rain) exist. Elsewhere Orbisol runs on live NASA POWER only.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { distanceKm } from '@orbisol/core';
import { STATIC_NDVI } from './sources';

/** Inside the sampled case-study window (the widest of the precomputed layers' footprints that all share: NDVI 3 km). */
export function inCaseStudy(pin: { lat: number; lon: number } | null): boolean {
  return !!pin && STATIC_NDVI.some((s) => distanceKm(pin, s) <= s.windowKm);
}
