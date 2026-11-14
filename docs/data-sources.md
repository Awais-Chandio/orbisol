# Data sources

All data credited in text only. No NASA or Space Apps logos are used anywhere.

| Dataset | Provider | Used for | Kind | Access |
|---|---|---|---|---|
| POWER daily point API (community=ag) | NASA LaRC | Rain, max/min temperature (heat, frost), humidity, radiation | Model/reanalysis | Live, any pin |
| GPM IMERG | NASA GES DISC | Rainfall totals, extreme-rain days | Satellite | Pipeline (precomputed) |
| MODIS vegetation indices | NASA / ORNL DAAC TESViS | NDVI history | Satellite | Pipeline |
| VIIRS NOAA-20 VJ113A1 | NASA / ORNL DAAC TESViS | Recent NDVI | Satellite | Pipeline |
| SMAP soil moisture | NASA NSIDC | Soil moisture anomaly | Satellite | Pipeline |
| SRTM elevation | NASA / USGS | Slope -> erosion risk | Satellite (radar) | Pipeline |
| GIBS VIIRS_NOAA20_CorrectedReflectance_TrueColor | NASA GIBS | Map imagery | Satellite | Live tiles |
| GAEZ v4, FAO-56 | FAO | Crop requirements and water needs (cited crop rules) | Reference | Static table |

Not used: Suomi NPP (VNP) products, the deprecated MODIS C6 subsets service, tile.openstreetmap.org, Open-Meteo.
