# Limitations

- Orbisol supports, not replaces, farmer judgment and local expertise. Every suggestion needs local review.
- NASA POWER is a gridded model product (~0.5 degree), not a field-level ground measurement.
- Satellite greenness (NDVI) mixes neighbouring fields at 250-500 m resolution.
- Soil moisture is NASA POWER top-soil wetness (GWETTOP), a **model** value (tagged as model, not satellite). It is
  coarse (~50 km), covers only the top ~5 cm and does not see canal irrigation.
- The precomputed fallback covers the Hyderabad (Sindh) region only; other pins rely on live NASA POWER.
- Map imagery is VIIRS NOAA-20 true color (native ~375 m, served to zoom 9 and slightly over-zoomed). It is good for finding the area, not for drawing individual field boundaries; GPS or typed coordinates are more precise.
- The map has no road or place labels. Re-tested on 14 Nov 2026 with the format and tile matrix set from GIBS
  GetCapabilities (`image/png`, `GoogleMapsCompatible_Level13`):
  - Without the time segment (`.../{Layer}/default/{TMS}/...`) GIBS returns a mix of HTTP 500s and blank tiles;
    some of these are palette PNGs with no transparency (opaque black), which hid the imagery in Phase 2.
  - With the time segment (`.../{Layer}/default/default/{TMS}/...`) tiles are transparent, but
    `Reference_Labels_15m` and `Reference_Features_15m` returned no content anywhere tested (Hyderabad, Karachi,
    Lahore, New York, London; zoom 6-11).
  - `Coastlines_15m` works with the time segment and is now shown as an overlay.
  - Instead of labels, Orbisol has an offline place search (GeoNames, CC BY 4.0; no OpenStreetMap/Nominatim).
- Place search covers populated places in Pakistan (about 150,000, including many villages) and cities of 15,000+
  people elsewhere. Small villages outside Pakistan are not in the index; GPS, map tap or coordinates still work.
  Village names have many spellings (for example Goth/Got, Muhammad/Mohammad); search matches the start of the
  name only, not words in the middle.
- Daily VIIRS imagery can show clouds, haze or gaps for the chosen date (3 days back).
- NASA POWER (MERRA-2 / GEOS-IT) does not model canal irrigation. Top-soil wetness is drier than irrigated fields,
  and FAO-56 ET0 computed from POWER inputs is likely higher than at a local station in irrigated Sindh (Hyderabad
  1991-2020 means: about 3.9 mm/day in January and 11.2 mm/day in May). The app compares with normal rather than
  treating ET0 as an exact amount, and says so on screen.
- POWER's model ET (EVPTRNS) was tested and rejected: it showed about 2 mm over 90 days for Hyderabad because the model has no irrigation.
- "Hot days" use a local percentile, not a crop-specific heat-stress threshold (crop thresholds come with the crop rules).
- Crop rule values come only from cited sources; values without a reliable source are left out and listed below.

## Greenness (NDVI)

- NDVI uses **MODIS Terra (MOD13Q1) only**. Terra's orbit is drifting (later overpass time each year since 2022) and its
  science data is expected to end around **February 2027**. A future version moves to **VIIRS NOAA-20 (VJ113A1)** via
  NASA Earthdata / AppEEARS (needs an Earthdata login; VJ113A1 is not offered by the ORNL TESViS service used here).
  **VIIRS Suomi NPP (VNP13A1) was not used on purpose.**
- The demo farm (25.48 N, 68.41 E) lies between Hyderabad and Tando Jam, about 10 km from Hyderabad city centre and
  13 km from Tando Jam town. It was chosen because MODIS land cover (MCD12Q1, 2025) shows 77% cropland within 2 km and
  because it is in the same NASA POWER grid cell as Hyderabad (cell boundary at 68.4375 E; Tando Jam town itself is in
  the next cell east). The first demo pin (25.40, 68.37) was in the city: 313 urban vs 25 cropland pixels within 5 km.
- Greenness is the median of cropland pixels (MCD12Q1 classes 12 and 14, year-matched) within 3 km of the pin,
  good/marginal quality only, per 16-day composite. It describes nearby farmland, not the exact field.
- Normal for greenness is 2001-2020 (MODIS starts in 2000), not the WMO 1991-2020 period used for weather.
- Greenness is precomputed for the demo farm only; other pins show a data gap.

## Terrain (SRTM slope)

- Slope comes from NASA SRTM (1 arc-second, February 2000) within 1 km of the pin. On flat plains SRTM height noise
  (a few metres) and crop/tree/building heights dominate 30 m slopes: the demo farm's 30 m median slope is 3.15%,
  although elevations in the whole 2 km window vary by only about +/-2.5 m. Orbisol therefore averages elevation into
  270 m blocks before Horn's slope (0.35%, FAO class 02 "Level") and also reports a plane fit over the window (0.14%).
  The 30 m figure is kept in the data file as a note only.
- Slope is precomputed for the demo farm only; other pins show no terrain card.
- Erosion risk is described qualitatively (slope class, windiest months, bare days in them); no soil erodibility data is used.

## Future work

- **Satellite rain (GPM IMERG V07).** `pipeline/scripts/imerg.py` works (Earthdata login, OPeNDAP one pixel per day,
  Final run with Late run for recent days, cell 25.45 N 68.45 E) but a full 1998-2026 daily series is ~10,500
  requests. On 14 Nov 2026 the run reached 2004 (about 2,400 days, ~4 days/s), then the GES DISC `gpm1` server began
  refusing connections after too many parallel requests. It was skipped to keep the feature-freeze time. The satellite rain
  cards are hidden when the file is missing; rain in this version is the NASA POWER model value only. A second try the same
  evening (4 connections, 15-minute cap) was not blocked but only reached ~3,000 of 10,544 days. The cache and the
  month listing are kept (`pipeline/raw/imerg/`), so a future run resumes directly; ~7,500 days at ~1.7 days/s is
  about 75 minutes.
- **SMAP soil moisture.** SMAP SPL3SMP_E (9 km) is listed on ORNL DAAC TESViS but returned no data for the demo farm
  (14 Nov 2026; a re-probe the same evening got HTTP 503). Reading it from NSIDC OPeNDAP one day at a time (~4,000 requests plus EASE-Grid 2.0 indexing) was
  judged too heavy for this build. A future version adds SMAP as a satellite soil-moisture anomaly next to the model value.
- VIIRS NOAA-20 NDVI (VJ113A1) to replace MODIS Terra (see Greenness above).

## Missing crop rule values (left out, not guessed)

Full table with sources: `docs/crop-rules.md`.

- Wheat forage use (wheat straw / bhusa as fodder): no source page was retrieved in this build, so it is not scored.
- Salt tolerance threshold: mung bean and chickpea are not in FAO-56 Table 23; sunflower has a rating (MS) but no threshold.
- Berseem: no FAO-56 Table 11 row, so initial/development/late stage lengths borrow the Alfalfa 1st cutting cycle (proxy);
  sowing "early autumn" (Feedipedia) is read as October for Sindh.
- Chickpea: no FAO-56 Table 11 row; stage split borrows lentil (Oct/Nov planting, arid region) as a proxy.
- Mung bean sowing window and season length come from a 2007 newspaper article (Dawn), the best source found; check locally.
- The Sindh department gives wheat harvest in South Sindh as March; the demo farmer harvests in April. The farmer's dates are used for the existing rotation.

## Design choices in the engine (transparent, not data)

- Alternatives are two-crop annual rotations (one kharif + one rabi crop) from the crop table, sown at the start of the
  cited window or right after the previous harvest. Sugarcane and rice are not proposed as alternatives (multi-season or
  water-heavy) but can be entered as the existing rotation. Land preparation time between crops is not modelled.
- Priority scores are relative to the best candidate (0-1). The farmer's 1st/2nd/3rd priorities weigh 3/2/1.
  Forage counts fodder crops as 1 and crop residues as 0.5 per day. Organic matter has no soil data: it is a proxy
  (half living cover, half legume time). Market suitability is never scored and is always shown as a gap.
- Hazard months: the 3 hottest months by mean Tmax; frost or heavy-rain months where such days happen at least once
  every two years on average (1991-2020). Heat is checked at mid and late crop stages, frost and heavy rain at mid-season.
- Season Twins: root-mean-square difference of z-scores of mean Tmax, rain, ET0, top-soil wetness and hot days for the
  same window in 2001-last year; 3 twins.
- Track Record: for each past year only earlier years are used (no peeking); a naive baseline always predicts the more
  common direction. Outcomes that never vary (e.g. hot days in winter) are flagged as not informative.
- Confidence Meter points: twins close (+2/+1), twins agree (+2/+1), complete data (+1), track record (+1 / 0 / -1).
  High >= 5, medium >= 3, else low.
- Crop water need is FAO-56 Kc x ET0 (no effective rainfall or irrigation efficiency); ET0 from NASA POWER likely reads
  high in irrigated Sindh, so absolute mm are shown with that caveat and comparisons between rotations matter more.

## Water Fit (canal turn vs safe interval)

- Safe interval = FAO-56 RAW / ETc (Eq. 82-83): soil water from Table 19 (farmer "sandy" read as the Sand row,
  unknown soil defaults to Loam), root depth and p from Table 22 (smaller depth, as footnote 1 advises for
  irrigation scheduling), p adjusted for the ETc rate (p + 0.04 (5 - ETc), 0.1-0.8), ETc = Table 12 Kc x NASA POWER ET0.
- **Canal flow volume per turn is unknown** (flow rate, hours and field size are not measured), so the check assumes
  each turn refills the root zone. If a turn does not fill the field, the real safe interval is shorter.
- Rain is not counted (conservative; monsoon months may be easier than shown).
- Table 22 depths are for a grown crop and FAO-56 gives no root-growth rule there. In months when a crop is mostly
  in its initial or development stage the safe interval is an upper bound: too-long turns are flagged, fits are shown
  as "young crop", not confirmed.
- Rice is a flooded crop (Table 22 p is a fraction of saturation) and is not checked.
- ET0 from POWER is likely high in irrigated Sindh (see above), which makes safe intervals look shorter.

## Observed long-term trend (Season screen)

- Labelled "observed trend, not a forecast". NASA POWER 1990 to the last complete year; least-squares change per
  decade with a 95% range; "unclear" when the range crosses zero.
- Hot day (yearly view) = Tmax above the 1991-2020 90th percentile of all daily Tmax at the pin (Hyderabad: 42.5 °C).
- Warm night = Tmin above the 1991-2020 90th percentile of daily Tmin (TN90p adapted; Hyderabad 27.8 °C); hottest day
  of the year = yearly max Tmax (TXx). Hyderabad: warm nights +5.7 per decade (+1.4 to +9.9, clear); TXx -0.25 °C per
  decade (-0.69 to +0.19, unclear). Together with fewer hot days this reads as warmer nights, not hotter days. The card
  says irrigated areas can cool daytime extremes and that the grid is about 50 km.
- Hyderabad result: hot days -4.5 per decade (95% range -8.5 to -0.6); rain minus ET0 +185 mm per decade (+100 to
  +270), from rain +94 mm and ET0 -91 mm per decade. In the POWER inputs, dew point rose (+0.7 °C per decade) while
  wind and sunshine fell slightly. This runs against the common expectation of a hotter, drier Sindh. It is a
  reanalysis trend (MERRA-2 / GEOS-IT), which can shift when the observing system changes, and it has not been
  checked against a local station (for example PMD Hyderabad). Shown as observed, with that caveat on screen.

## 2050 heat outlook (NASA NEX-GDDP-CMIP6)

- Labelled "climate model projection, not a forecast". Data: NEX-GDDP-CMIP6 daily tasmax (0.25 deg, bias-corrected
  and downscaled) read one cell at a time with the NCCS THREDDS NetCDF Subset Service (`pipeline/scripts/cmip6_heat.py`).
- 3 models (ACCESS-CM2, MPI-ESM1-2-HR, MRI-ESM2-0, chosen as widely used models available for both scenarios; not a
  skill-based selection), SSP2-4.5 and SSP5-8.5, 1995-2014 vs 2041-2060. Three models is a small sample of the
  35-model ensemble; the range shown is the spread of these three only.
- Hot day = Tmax > 42.5 °C, the same fixed threshold as the observed trend. The models give only 6-9 such days a year
  in 1995-2014 at this cell, against about 36 in NASA POWER: the bias-correction reference runs cooler here than POWER.
  The card therefore leads with the change (+11 to +27 days a year under SSP2-4.5, +16 to +33 under SSP5-8.5) and says
  the counts are not comparable with the observed card.
- The projected rise runs against the observed POWER trend (fewer hot days since 1990, see above). Both are shown,
  each with its label; neither has been checked against a local station.
- First attempt via the Microsoft Planetary Computer was not feasible (global daily chunks, about 246 MB per
  pixel-year at 0.5 MB/s measured).
