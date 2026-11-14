# Limitations

- Orbisol supports, not replaces, farmer judgment and local expertise. Every suggestion needs local review.
- NASA POWER is a gridded model product (~0.5 degree), not a field-level ground measurement.
- Satellite greenness (NDVI) mixes neighbouring fields at 250-500 m resolution.
- SMAP soil moisture is coarse (~9-36 km) and covers only the top few centimetres.
- The precomputed fallback covers the Hyderabad (Sindh) region only; other pins rely on live NASA POWER.
- Map imagery is VIIRS NOAA-20 true color (native ~375 m, served to zoom 9 and slightly over-zoomed). It is good for finding the area, not for drawing individual field boundaries; GPS or typed coordinates are more precise.
- The map has no road or place labels: the GIBS reference label/feature overlays return opaque black tiles where they are empty, so they were removed.
- Daily VIIRS imagery can show clouds, haze or gaps for the chosen date (3 days back).
- NASA POWER (MERRA-2 / GEOS-IT) does not model canal irrigation. Top-soil wetness is drier than irrigated fields,
  and FAO-56 ET0 computed from POWER inputs is likely higher than at a local station in irrigated Sindh (Hyderabad
  1991-2020 means: about 3.9 mm/day in January and 11.2 mm/day in May). The app compares with normal rather than
  treating ET0 as an exact amount, and says so on screen.
- POWER's model ET (EVPTRNS) was tested and rejected: it showed about 2 mm over 90 days for Hyderabad because the model has no irrigation.
- "Hot days" use a local percentile, not a crop-specific heat-stress threshold (crop thresholds come with the crop rules).
- Crop rule values come only from cited sources; values without a reliable source are left out and listed below.

## Missing crop rule values

(Filled in Phase 4.)
