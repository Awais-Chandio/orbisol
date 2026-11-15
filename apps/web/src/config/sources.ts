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
  timeoutMs: 25_000,
} as const;

/** Live data younger than this is reused without a network call. */
export const CLIMATE_FRESH_MS = 12 * 60 * 60 * 1000;

/** Precomputed files in data/ (copied to /data at build time). */
export const STATIC_CLIMATE = [{ lat: 25.48, lon: 68.41, path: '/data/hyderabad/power_daily.json' }] as const;

/** Offline place search (GeoNames, CC BY 4.0), prefix-sharded by pipeline/scripts/places.py. */
export const PLACES = {
  index: '/data/places/index.json',
  shard: (key: string) => `/data/places/idx/${key.replace('~', '_')}.json`,
  home: 'https://www.geonames.org/',
} as const;

/** Precomputed cropland NDVI (MODIS MOD13Q1 via ORNL TESViS), valid for pins inside the sampled window. */
export const STATIC_NDVI = [{ lat: 25.48, lon: 68.41, windowKm: 3, path: '/data/hyderabad/ndvi.json' }] as const;

/**
 * Precomputed daily satellite rainfall (GPM IMERG V07, one 0.1 deg cell). No daily file is shipped yet, so the list is
 * empty: nothing is requested (no 404) and the daily-rain card stays hidden. Add an entry when the pipeline writes one.
 */
export const STATIC_RAIN: readonly { lat: number; lon: number; cellDeg: number; path: string }[] = [];
/** GPM IMERG V07 monthly (GPM_3IMERGM.07, Final run), one 0.1 deg cell; and SRTM slope for the demo farm. */
export const STATIC_RAIN_MONTHLY = [{ lat: 25.48, lon: 68.41, cellDeg: 0.1, path: '/data/hyderabad/imerg_monthly.json' }] as const;
export const STATIC_SLOPE = [{ lat: 25.48, lon: 68.41, radiusKm: 1, path: '/data/hyderabad/slope.json' }] as const;

/** Precomputed 2050 heat outlook (NASA NEX-GDDP-CMIP6, one 0.25 deg cell centred on gridLat/gridLon). */
export const STATIC_HEAT2050 = [{ gridLat: 25.375, gridLon: 68.375, cellDeg: 0.25, path: '/data/hyderabad/heat2050.json' }] as const;
