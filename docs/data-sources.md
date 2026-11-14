# Data sources

All data credited in text only. No NASA or Space Apps logos are used anywhere.

| Dataset | Provider | Used for | Kind | Access |
|---|---|---|---|---|
| POWER daily point API (community=ag) | NASA LaRC | T2M_MAX, T2M_MIN, PRECTOTCORR, GWETTOP, T2MDEW, WS2M, ALLSKY_SFC_SW_DWN, cell elevation -> heat, frost, rain, top-soil wetness, FAO-56 ET0 | Model/reanalysis | Live for any pin (1990 to ~3 days ago); `data/hyderabad/power_daily.json` fallback |
| GPM IMERG | NASA GES DISC | Rainfall totals, extreme-rain days | Satellite | Pipeline (precomputed) |
| MODIS vegetation indices | NASA / ORNL DAAC TESViS | NDVI history | Satellite | Pipeline |
| VIIRS NOAA-20 VJ113A1 | NASA / ORNL DAAC TESViS | Recent NDVI | Satellite | Pipeline |
| SMAP soil moisture | NASA NSIDC | Soil moisture anomaly | Satellite | Pipeline |
| SRTM elevation | NASA / USGS | Slope -> erosion risk | Satellite (radar) | Pipeline |
| GIBS VIIRS_NOAA20_CorrectedReflectance_TrueColor | NASA GIBS | Map imagery | Satellite | Live tiles |
| GAEZ v4, FAO-56 | FAO | Crop requirements and water needs (cited crop rules) | Reference | Static table |

Not used: Suomi NPP (VNP) products, the deprecated MODIS C6 subsets service, tile.openstreetmap.org, Open-Meteo.

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
