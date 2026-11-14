# Orbisol pipeline

Python scripts that download NASA Earth observation data for the Hyderabad (Sindh) case-study
region and write small, versioned JSON files into `../data/`. The web app reads these files as its
offline fallback, so the demo works even if a live API is down.

AI-assisted: scripts drafted with Claude (Anthropic); see `../docs/ai-usage.md`.

## Setup

```bash
cd pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Earthdata login (GPM IMERG, SRTM) - set up ~/.netrc yourself (chmod 600), never committed
```

## Scripts

| Script | Dataset | Output | Login | Status |
|---|---|---|---|---|
| `scripts/power.py` | NASA POWER daily (ag), 1990 to now | `data/hyderabad/power_daily.json` (`orbisol.daily.v2`) | No | Shipped |
| `scripts/ndvi.py` | MODIS Terra MOD13Q1 NDVI + MCD12Q1 cropland mask via ORNL DAAC TESViS | `data/hyderabad/ndvi.json` (`orbisol.ndvi.v1`) | No | See below |
| `scripts/srtm.py` | SRTM SRTMGL1 v003 (earthaccess) -> Horn slope at 30/90/270 m + plane fit | `data/hyderabad/slope.json` (`orbisol.slope.v1`) | Yes | Shipped |
| `scripts/imerg.py` | GPM IMERG V07 daily, one OPeNDAP pixel per day (Final, then Late) | `data/hyderabad/imerg_daily.json` (`orbisol.rain.v1`) | Yes | Not shipped (run incomplete, see limitations) |
| `scripts/cmip6_heat.py` | NASA NEX-GDDP-CMIP6 tasmax via NCCS THREDDS NCSS point subset (3 models, SSP2-4.5/5-8.5) | `data/hyderabad/heat2050.json` (`orbisol.heat2050.v1`) | No | Shipped |
| `scripts/places.py` | GeoNames (CC BY 4.0): PK populated places + world cities >= 15k | `data/places/index.json` + `data/places/idx/*.json` (max 1500 rows per shard) | No | Shipped |

Run from `pipeline/scripts` with `../.venv/bin/python <script>.py`. Raw downloads and resumable caches go to
`pipeline/raw/` (git-ignored). TESViS throttles (HTTP 502/503, empty bodies): `ndvi.py` uses 2 workers with backoff.
GES DISC refuses connections when hit too hard: `imerg.py` defaults to 4 workers (`IMERG_WORKERS`) and resumes from
`raw/imerg/*.jsonl`; `--from-cache` rebuilds the JSON without fetching. SMAP is future work (no data on TESViS for
the demo farm; see `../docs/limitations.md`).

Every output record carries `source`, `kind` and `date` (see `../data/README.md`).
