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
# Earthdata login (GPM IMERG, SMAP, SRTM) - stored in ~/.netrc, never committed
```

## Scripts (added in Phase 6)

| Script | Dataset | Output |
|---|---|---|
| `scripts/power.py` | NASA POWER daily (ag) | `data/hyderabad/power_daily.json` |
| `scripts/imerg.py` | GPM IMERG | `data/hyderabad/rain_extremes.json` |
| `scripts/ndvi.py` | MODIS + VIIRS NOAA-20 (VJ113A1) via ORNL DAAC TESViS | `data/hyderabad/ndvi.json` |
| `scripts/smap.py` | SMAP soil moisture | `data/hyderabad/soil_moisture.json` |
| `scripts/srtm.py` | SRTM elevation -> slope | `data/hyderabad/slope.json` |

Every output record carries `source`, `kind` and `date` (see `../data/README.md`).
