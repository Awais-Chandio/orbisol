/**
 * Orbisol web - data source constants (endpoints, parameters, static fallbacks).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
export const POWER = {
  url: 'https://power.larc.nasa.gov/api/temporal/daily/point',
  home: 'https://power.larc.nasa.gov/',
  source: 'NASA POWER daily (MERRA-2 / GEOS-IT)',
  community: 'AG',
  start: '19900101',
  /** POWER name -> Orbisol variable. */
  params: {
    T2M_MAX: 'tmax',
    T2M_MIN: 'tmin',
    PRECTOTCORR: 'rain',
    GWETTOP: 'soilWetness',
    T2MDEW: 'tdew',
    WS2M: 'wind2m',
    ALLSKY_SFC_SW_DWN: 'solar',
  },
  /** Approximate MERRA-2 grid cell half-size (0.5° lat x 0.625° lon). */
  cellHalf: { lat: 0.25, lon: 0.3125 },
  timeoutMs: 25_000,
} as const;

/** Live data younger than this is reused without a network call. */
export const CLIMATE_FRESH_MS = 12 * 60 * 60 * 1000;

/** Precomputed files in data/ (copied to /data at build time). */
export const STATIC_CLIMATE = [{ lat: 25.4, lon: 68.37, path: '/data/hyderabad/power_daily.json' }] as const;

/** Offline place search (GeoNames, CC BY 4.0), prefix-sharded by pipeline/scripts/places.py. */
export const PLACES = {
  index: '/data/places/index.json',
  shard: (key: string) => `/data/places/idx/${key.replace('~', '_')}.json`,
  home: 'https://www.geonames.org/',
} as const;
