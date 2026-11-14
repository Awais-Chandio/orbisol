"""Orbisol pipeline - NASA POWER daily point data -> data/<place>/power_daily.json.

Output format "orbisol.daily.v2" (same shape the web app caches): one value array per raw variable,
index i = start + i days, null = missing. Reference evapotranspiration (FAO-56 ET0) is NOT stored:
the core engine derives it from tmax, tmin, tdew, wind2m, solar and the POWER cell elevation.

Usage: .venv/bin/python scripts/power.py [--lat 25.40 --lon 68.37 --place hyderabad]

AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone

import requests

from common import HYDERABAD, provenance, write_json

API = "https://power.larc.nasa.gov/api/temporal/daily/point"
START = "19900101"
PARAMS = {  # POWER name -> Orbisol variable
    "T2M_MAX": "tmax",
    "T2M_MIN": "tmin",
    "PRECTOTCORR": "rain",
    "GWETTOP": "soilWetness",
    "T2MDEW": "tdew",
    "WS2M": "wind2m",
    "ALLSKY_SFC_SW_DWN": "solar",
}


def fetch(lat: float, lon: float) -> dict:
    end = datetime.now(timezone.utc).strftime("%Y%m%d")
    r = requests.get(
        API,
        params={
            "parameters": ",".join(PARAMS),
            "community": "AG",
            "latitude": lat,
            "longitude": lon,
            "start": START,
            "end": end,
            "format": "JSON",
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()


def to_daily(payload: dict, lat: float, lon: float, label: str) -> dict:
    fill = payload["header"]["fill_value"]
    par = payload["properties"]["parameter"]
    keys = sorted(par["T2M_MAX"].keys())
    d0 = datetime.strptime(keys[0], "%Y%m%d").date()
    d1 = datetime.strptime(keys[-1], "%Y%m%d").date()
    n = (d1 - d0).days + 1
    values: dict[str, list] = {}
    for pname, var in PARAMS.items():
        series = par[pname]
        out = []
        for i in range(n):
            k = (d0 + timedelta(days=i)).strftime("%Y%m%d")
            v = series.get(k, fill)
            if v is None or v == fill:
                out.append(None)
            else:
                out.append(v)
        values[var] = out
    # last date where temperature and rain are all present
    last = None
    for i in range(n - 1, -1, -1):
        if all(values[v][i] is not None for v in ("tmax", "tmin", "rain")):
            last = (d0 + timedelta(days=i)).isoformat()
            break
    return {
        "format": "orbisol.daily.v2",
        "location": {"lat": lat, "lon": lon, "elevationM": payload["geometry"]["coordinates"][2], "label": label},
        "provenance": provenance(
            "NASA POWER daily (MERRA-2 / GEOS-IT)",
            "reanalysis",
            last or d1.isoformat(),
            date_from=d0.isoformat(),
            url="https://power.larc.nasa.gov/",
        ),
        "start": d0.isoformat(),
        "values": values,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, default=HYDERABAD["lat"])
    ap.add_argument("--lon", type=float, default=HYDERABAD["lon"])
    ap.add_argument("--place", default="hyderabad")
    ap.add_argument("--label", default=HYDERABAD["label"])
    a = ap.parse_args()
    out = write_json(f"{a.place}/power_daily.json", to_daily(fetch(a.lat, a.lon), a.lat, a.lon, a.label))
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
