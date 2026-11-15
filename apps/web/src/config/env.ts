/**
 * Orbisol web - app constants.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
export const APP_NAME = 'Orbisol';
export const TAGLINE = 'From orbit to soil.';

/**
 * Demo case study: canal-irrigated cropland between Hyderabad and Tando Jam, Sindh (MODIS land cover 2025:
 * 77% cropland within 2 km). Same NASA POWER grid cell as Hyderabad city, so the built-in data covers it.
 */
export const DEMO_FIELD = { lat: 25.48, lon: 68.41, label: 'Demo farm near Tando Jam, Hyderabad' } as const;

/**
 * Second quick demo: Faisalabad district, Punjab (canal-irrigated cotton-wheat zone). Live NASA POWER only: none of the
 * precomputed satellite layers (NDVI, slope, 2050 heat, satellite rain) cover it.
 */
export const DEMO_PUNJAB = { lat: 31.25, lon: 73.05, label: 'Demo: Faisalabad district, Punjab (live NASA data)' } as const;

/**
 * More one-tap demo regions outside Pakistan, for trying the app on other irrigated farmland. Live NASA POWER only:
 * no precomputed satellite layers, and the crop sowing windows still follow the Sindh calendar (case-study note shown).
 */
export const DEMO_REGIONS = [
  { id: 'nile', lat: 30.75, lon: 31.25, label: 'Demo: Nile Delta, Egypt (live NASA data)' },
  { id: 'punjabIndia', lat: 30.9, lon: 75.85, label: 'Demo: Punjab, India (live NASA data)' },
  { id: 'centralValley', lat: 36.75, lon: -119.75, label: 'Demo: Central Valley, USA (live NASA data)' },
] as const;
export type DemoRegionId = (typeof DEMO_REGIONS)[number]['id'];
