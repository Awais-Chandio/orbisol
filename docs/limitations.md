# Limitations

- Orbisol supports, not replaces, farmer judgment and local expertise. Every suggestion needs local review.
- NASA POWER is a gridded model product (~0.5 degree), not a field-level ground measurement.
- Satellite greenness (NDVI) mixes neighbouring fields at 250-500 m resolution.
- SMAP soil moisture is coarse (~9-36 km) and covers only the top few centimetres.
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
