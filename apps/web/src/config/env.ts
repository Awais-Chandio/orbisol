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
