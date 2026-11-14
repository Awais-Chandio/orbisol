"""Orbisol pipeline - 2050 heat outlook from NASA NEX-GDDP-CMIP6 (climate model projection, not a forecast).

For the demo farm pixel (0.25 deg), reads daily tasmax with the NCCS THREDDS NetCDF Subset Service (point subset,
CSV, no login), counts hot days per year above the same fixed threshold as the observed trend (Tmax > 42.5 C =
1991-2020 90th percentile of NASA POWER daily Tmax at the pin; see packages/core/src/season/trend.ts), and compares
1995-2014 (historical) with 2041-2060 (SSP2-4.5, SSP5-8.5) per model. The app shows the range across models.

Output: data/hyderabad/heat2050.json (orbisol.heat2050.v1). Raw per-year CSV values cached in raw/cmip6/*.json.
Run: ../.venv/bin/python cmip6_heat.py [--workers 4]

AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import argparse
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from statistics import mean

import requests

from common import HYDERABAD, ROOT, provenance, write_json

THREDDS = "https://ds.nccs.nasa.gov/thredds"
BASE = "AMES/NEX/GDDP-CMIP6"
MODELS = ["ACCESS-CM2", "MPI-ESM1-2-HR", "MRI-ESM2-0"]
SCENARIOS = ["ssp245", "ssp585"]
BASELINE = (1995, 2014)
FUTURE = (2041, 2060)
HOT_TMAX_C = 42.5  # same threshold as the observed trend card (POWER 1991-2020 p90 of daily Tmax at the pin)
CACHE = ROOT / "pipeline" / "raw" / "cmip6"
SOURCE_URL = "https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6"

session = requests.Session()


def year_paths(model: str, scenario: str) -> dict[int, str]:
    """THREDDS catalog -> {year: urlPath}; prefers the newest file version (v2.0 > v1.1 > none)."""
    url = f"{THREDDS}/catalog/{BASE}/{model}/{scenario}/r1i1p1f1/tasmax/catalog.xml"
    xml = session.get(url, timeout=60).text
    out: dict[int, tuple[str, str]] = {}
    for path in re.findall(r'urlPath="([^"]+\.nc)"', xml):
        m = re.search(r"_gn_(\d{4})(?:_v([\d.]+))?\.nc$", path) or re.search(r"_(\d{4})(?:_v([\d.]+))?\.nc$", path)
        if not m:
            continue
        y, v = int(m.group(1)), m.group(2) or "0"
        if y not in out or v > out[y][1]:
            out[y] = (path, v)
    return {y: p for y, (p, _) in out.items()}


def fetch_year(model: str, scenario: str, year: int, path: str) -> list[float]:
    cache = CACHE / f"{model}_{scenario}_{year}.json"
    if cache.exists():
        return json.loads(cache.read_text())
    url = f"{THREDDS}/ncss/grid/{path}"
    params = {"var": "tasmax", "latitude": HYDERABAD["lat"], "longitude": HYDERABAD["lon"], "temporal": "all", "accept": "csv"}
    for attempt in range(4):
        try:
            r = session.get(url, params=params, timeout=120)
            r.raise_for_status()
            lines = r.text.strip().splitlines()[1:]
            vals = [float(line.rsplit(",", 1)[1]) - 273.15 for line in lines if line]
            if len(vals) < 360:
                raise ValueError(f"only {len(vals)} days")
            CACHE.mkdir(parents=True, exist_ok=True)
            cache.write_text(json.dumps(vals))
            return vals
        except Exception as e:  # noqa: BLE001 - retry any network / parse failure
            if attempt == 3:
                raise RuntimeError(f"{model} {scenario} {year}: {e}") from e
    return []


def hot_days(vals: list[float]) -> int:
    return sum(1 for v in vals if v > HOT_TMAX_C)


def run(workers: int) -> None:
    jobs = []
    paths: dict[tuple[str, str], dict[int, str]] = {}
    for model in MODELS:
        for scen, (y0, y1) in [("historical", BASELINE)] + [(s, FUTURE) for s in SCENARIOS]:
            paths[(model, scen)] = year_paths(model, scen)
            for y in range(y0, y1 + 1):
                if y in paths[(model, scen)]:
                    jobs.append((model, scen, y, paths[(model, scen)][y]))
    print(f"{len(jobs)} point-years")
    with ThreadPoolExecutor(workers) as ex:
        results = list(ex.map(lambda j: (j[:3], fetch_year(*j)), jobs))
    per: dict[tuple[str, str], list[int]] = {}
    for (model, scen, _y), vals in results:
        per.setdefault((model, scen), []).append(hot_days(vals))

    models = []
    for model in MODELS:
        base = per.get((model, "historical"), [])
        row = {"model": model, "baselineYears": len(base), "baselineHotDays": round(mean(base), 1) if base else None}
        for s in SCENARIOS:
            fut = per.get((model, s), [])
            row[s] = {"years": len(fut), "hotDays": round(mean(fut), 1) if fut else None}
            if base and fut:
                row[s]["change"] = round(mean(fut) - mean(base), 1)
        models.append(row)
        print(row)

    def rng(key: str, field: str) -> list[float] | None:
        vals = [m[key][field] for m in models if m.get(key, {}).get(field) is not None]
        return [min(vals), max(vals)] if vals else None

    write_json(
        "hyderabad/heat2050.json",
        {
            "format": "orbisol.heat2050.v1",
            "location": {**HYDERABAD, "gridLat": 25.375, "gridLon": 68.375, "gridDeg": 0.25},
            "hotTmaxC": HOT_TMAX_C,
            "baseline": {"from": BASELINE[0], "to": BASELINE[1]},
            "future": {"from": FUTURE[0], "to": FUTURE[1]},
            "models": models,
            "range": {
                "baselineHotDays": [min(m["baselineHotDays"] for m in models), max(m["baselineHotDays"] for m in models)],
                **{s: {"hotDays": rng(s, "hotDays"), "change": rng(s, "change")} for s in SCENARIOS},
            },
            "provenance": provenance(
                "NASA NEX-GDDP-CMIP6 (tasmax, daily, 0.25 deg) via NCCS THREDDS",
                "model",
                f"{FUTURE[1]}-12-31",
                date_from=f"{BASELINE[0]}-01-01",
                url=SOURCE_URL,
            ),
            "note": "Climate model projection, not a forecast. Hot day = Tmax above the same fixed threshold as the observed trend.",
        },
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=4)
    run(ap.parse_args().workers)
