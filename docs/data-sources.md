# Data sources

All data credited in text only. No NASA or Space Apps logos are used anywhere.

**Place names: [GeoNames](https://www.geonames.org/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**
(also shown on the app's About screen and beside search results).

| Dataset | Provider | Used for | Kind | Access |
|---|---|---|---|---|
| POWER daily point API (community=ag) | NASA LaRC | T2M_MAX, T2M_MIN, PRECTOTCORR, GWETTOP, T2MDEW, WS2M, ALLSKY_SFC_SW_DWN, cell elevation -> heat, frost, rain, top-soil wetness, FAO-56 ET0 | Model/reanalysis | Live for any pin (1990 to ~3 days ago); `data/hyderabad/power_daily.json` fallback |
| GPM IMERG V07 monthly (Final, GPM_3IMERGM.07) | NASA GES DISC (OPeNDAP point read, Earthdata login) | "Satellite rain vs normal": latest 3 months vs the same months 2000-2024 | Satellite | `pipeline/scripts/imerg_monthly.py` -> `data/hyderabad/imerg_monthly.json` (2000-01 to 2025-09) |
| GPM IMERG V07 daily (Final GPM_3IMERGDF.07, Late GPM_3IMERGDL.07) | NASA GES DISC (OPeNDAP point read, Earthdata login) | Satellite rain and extreme-rain days next to model rain | Satellite | `pipeline/scripts/imerg.py` -> `data/hyderabad/imerg_daily.json`; **not shipped in this build** (run incomplete, see limitations.md) |
| MODIS Terra MOD13Q1 (250 m, 16-day) | NASA / ORNL DAAC TESViS (no login) | Cropland NDVI 2000-now: this window vs 2001-2020, and greenness after twin years | Satellite | `pipeline/scripts/ndvi.py` -> `data/hyderabad/ndvi.json` |
| MODIS MCD12Q1 LC_Type1 (500 m, yearly) | NASA / ORNL DAAC TESViS | Cropland mask for NDVI (classes 12, 14) | Satellite | Pipeline |
| VIIRS NOAA-20 VJ113A1 | NASA LP DAAC / AppEEARS | Future replacement for MODIS Terra NDVI (Terra science data expected to end ~Feb 2027); needs Earthdata login | Satellite | Not yet used |
| SMAP soil moisture | NASA NSIDC | Future work (not used in this build; POWER GWETTOP model value is used instead) | Satellite | Not yet used |
| SRTM SRTMGL1 v003 (1 arc-second) | NASA / USGS, LP DAAC | Slope -> FAO slope class, erosion context | Satellite (radar) | `pipeline/scripts/srtm.py` -> `data/hyderabad/slope.json` |
| GIBS VIIRS_NOAA20_CorrectedReflectance_TrueColor | NASA GIBS | Map imagery | Satellite | Live tiles |
| GIBS MODIS_Terra_L3_NDVI_16Day | NASA GIBS (WMTS, EPSG:3857, GoogleMapsCompatible_Level9) | Field map greenness layer with a month slider, any pin | Satellite | Live tiles |
| Coastlines_15m (GIBS reference layer) | NASA GIBS (© OpenStreetMap contributors) | Coastline overlay on the map | Reference | Live tiles |
| GeoNames gazetteer (CC BY 4.0) | GeoNames | Offline town/village search (PK populated places + world cities >= 15k) | Reference | `data/places/` via `pipeline/scripts/places.py` |
| GAEZ v4, FAO-56 | FAO | Crop requirements and water needs (cited crop rules) | Reference | Static table |

Not used: Suomi NPP (VNP) products, the deprecated MODIS C6 subsets service, tile.openstreetmap.org, OSM Nominatim, Open-Meteo,
GIBS Reference_Labels_15m / Reference_Features_15m (no content returned, see limitations.md).

## Methods (cited)

| Item | Definition | Source |
|---|---|---|
| Normal | Median of the same window in 1991-2020 | WMO climatological standard normals (WMO-No. 1203, 2017) |
| Below / near / above normal | Terciles of the 1991-2020 years | WMO seasonal practice |
| Frost days | Tmin < 0 °C | ETCCDI index FD (Zhang et al. 2011, doi:10.1002/wcc.147) |
| Extreme rain days | Daily rain >= 20 mm | ETCCDI index R20mm |
| Hot days | Tmax above the 90th percentile of the same window in 1991-2020 | Adapted from ETCCDI TX90p |
| Evaporation demand | Daily FAO-56 Penman-Monteith reference ET (ET0), summed | Allen et al. 1998, FAO Irrigation and Drainage Paper 56, eq. 6 (tested against Example 18) |
| Water balance | Rain minus ET0 | Climatic water balance |
| Slope | Horn (1981) 3x3 slope on 270 m block-mean SRTM elevation, median within 1 km; plane fit as a cross-check | Horn 1981, Proc. IEEE 69(1) |
| Slope class | 01 Flat 0-0.2%, 02 Level 0.2-0.5%, 03 Nearly level 0.5-1%, 04 Very gently sloping 1-2%, ... | FAO (2006) Guidelines for soil description, 4th ed., Table 7 |

## Crop rule references

Full table with every value and its source: [crop-rules.md](crop-rules.md).

| Reference | Used for |
|---|---|
| FAO-56 (Allen et al. 1998) Tables 11, 12, 22, 23 | Stage lengths, crop coefficients Kc, rooting depth, salt tolerance (Table 23 compiled from FAO-29) |
| Sindh Agriculture, Supply & Prices Department, sowing periods page | Sowing/harvest windows for Hyderabad / South Sindh (cotton, wheat, rice, sugarcane, sunflower, gram) |
| Feedipedia (INRAE, CIRAD, AFZ, FAO) | Plant families, N-fixing legumes, fodder and residue use, berseem cutting schedule, sorghum fodder practice and HCN risk |
| Dawn, 16 Apr 2007, "Mungbean: a rich source of protein" | Mung bean sowing months and 75-77 day season (newspaper; check locally) |

## Access notes (checked 14 Nov 2026)

| Dataset | Access | Login |
|---|---|---|
| MOD13Q1, MCD12Q1 | ORNL DAAC TESViS REST API (10 dates per request, ~15 s each) | No |
| SMAP SPL3SMP_E (9 km daily) | ORNL DAAC TESViS (listed; returned "No SPL3SMP_E data available" for the demo farm on 14 Nov 2026) | No |
| GPM IMERG monthly (GPM_3IMERGM.07) | GES DISC OPeNDAP (`.ascii?precipitation[0:0][i:i][j:j]`, dims time, lon, lat; mm/hr); ~1.7 s per read | **Yes (Earthdata, ~/.netrc)** |
| GPM IMERG daily (GPM_3IMERGDF.07 / DL.07) | GES DISC OPeNDAP (`.ascii?precipitation[0:0][i:i][j:j]`); data files redirect to urs.earthdata.nasa.gov; keep to ~4 parallel connections | **Yes (Earthdata, ~/.netrc)** |
| VIIRS NOAA-20 VJ113A1 | LP DAAC / AppEEARS | **Yes** |
| SRTM SRTMGL1 v003 | LP DAAC (cloud); redirects to urs.earthdata.nasa.gov | **Yes** |
