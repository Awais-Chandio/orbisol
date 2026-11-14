"""Orbisol pipeline - monthly rainfall at a pin from NASA GPM IMERG V07 monthly (GPM_3IMERGM.07, Final run)
-> data/<place>/imerg_monthly.json.

Why monthly: the daily product needs ~10,500 point reads and the server stopped us at ~3,000 (see limitations.md).
The monthly product is one file per month (~310 reads since 2000).
- One 0.1 deg pixel (nearest cell centre), OPeNDAP point subset: precipitation[0][i][j] (dims time, lon, lat).
- precipitation = merged microwave-IR-gauge estimate, mean rate in mm/hr over the month; fill -9999.9 -> null.
  Monthly total (mm) = rate x hours in that month.
- Reference period: the IMERG record from 2000 (WMO 1991-2020 is not available for IMERG).
Needs an Earthdata login in ~/.netrc with the GES DISC app authorised.

Usage: .venv/bin/python scripts/imerg_monthly.py [--lat 25.48 --lon 68.41 --place hyderabad --start-year 2000]
AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import argparse
import calendar
import json
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import earthaccess

from common import HYDERABAD, ROOT, provenance, write_json

BASE = "https://gpm1.gesdisc.eosdis.nasa.gov"
COLL = "GPM_3IMERGM.07"
CACHE = ROOT / "pipeline" / "raw" / "imerg"
WORKERS = int(os.environ.get("IMERG_WORKERS", "4"))  # keep low: the server refused 8+ parallel connections before


def cell(lat: float, lon: float) -> tuple[int, int, float, float]:
    """IMERG 0.1 deg grid: lon centres -179.95 + 0.1*i, lat centres -89.95 + 0.1*j."""
    i = round((lon + 179.95) / 0.1)
    j = round((lat + 89.95) / 0.1)
    return i, j, round(-179.95 + 0.1 * i, 2), round(-89.95 + 0.1 * j, 2)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, default=HYDERABAD["lat"])
    ap.add_argument("--lon", type=float, default=HYDERABAD["lon"])
    ap.add_argument("--place", default="hyderabad")
    ap.add_argument("--label", default=HYDERABAD["label"])
    ap.add_argument("--start-year", type=int, default=2000)
    ap.add_argument("--only-months", default="", help="comma list of calendar months to fetch first, e.g. 07,08,09")
    ap.add_argument("--cache-tag", default="", help="separate cache file for a parallel run")
    ap.add_argument("--from-cache", action="store_true", help="skip fetching; build the JSON from all cached months")
    a = ap.parse_args()

    earthaccess.login(strategy="netrc")
    local = threading.local()

    def get(url: str):
        for attempt in range(6):
            try:
                if not hasattr(local, "s"):
                    local.s = earthaccess.get_requests_https_session()
                r = local.s.get(url, timeout=120)
                if r.status_code in (200, 404):
                    return r
            except Exception:  # noqa: BLE001 - network/SSL hiccup: new session, back off, retry
                local.__dict__.pop("s", None)
            time.sleep(2 * (attempt + 1))
        return None

    i, j, clon, clat = cell(a.lat, a.lon)
    print(f"IMERG cell centre {clat}, {clon} (i={i}, j={j})")

    CACHE.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE / f"{a.place}_monthly{a.cache_tag}_{i}_{j}.jsonl"
    done = {}
    for part in sorted(CACHE.glob(f"{a.place}_monthly*_{i}_{j}.jsonl")):
        for line in part.read_text().splitlines():
            rec = json.loads(line)
            done[rec["month"]] = rec
    if a.from_cache:
        return build(a, done, clat, clon)

    # 1) list year folders -> monthly files
    r = get(f"{BASE}/data/GPM_L3/{COLL}/")
    years = sorted(int(y) for y in set(re.findall(r'href="(\d{4})/"', r.text)) if int(y) >= a.start_year)

    def list_year(y: int) -> dict[str, str]:
        rr = get(f"{BASE}/data/GPM_L3/{COLL}/{y}/")
        out = {}
        for name in set(re.findall(r'href="(3B-MO[^"]+?\.HDF5)"', rr.text if rr is not None else "")):
            ym = re.search(r"\.(\d{6})01-S", name).group(1)
            out[f"{ym[:4]}-{ym[4:]}"] = f"{y}/{name}"
        return out

    files: dict[str, str] = {}
    with ThreadPoolExecutor(WORKERS) as ex:
        for res in ex.map(list_year, years):
            files.update(res)
    print(f"{len(files)} monthly files {min(files)}..{max(files)}")

    # 2) one pixel per month (cached, resumable)
    todo = sorted(m for m in files if m not in done)
    if a.only_months:
        keep = set(a.only_months.split(","))
        todo = [m for m in todo if m[5:] in keep]
    print(f"{len(todo)} months to fetch ({len(done)} cached)")
    lock = threading.Lock()

    def fetch(month: str):
        url = f"{BASE}/opendap/GPM_L3/{COLL}/{files[month]}.ascii?precipitation[0:0][{i}:{i}][{j}:{j}]"
        for _ in range(3):
            rr = get(url)
            if rr is None or rr.status_code != 200:
                continue
            m = re.search(r"precipitation\[0\]\[0\],\s*(-?[\d.eE+-]+)", rr.text)
            if not m:
                continue
            rate = float(m.group(1))
            y, mo = int(month[:4]), int(month[5:])
            hours = calendar.monthrange(y, mo)[1] * 24
            rec = {"month": month, "mmPerHour": None if rate < -9000 else rate, "mm": None if rate < -9000 else round(rate * hours, 2)}
            with lock, cache_file.open("a") as f:
                f.write(json.dumps(rec) + "\n")
            return rec
        return None

    with ThreadPoolExecutor(WORKERS) as ex:
        for k, rec in enumerate(ex.map(fetch, todo), 1):
            if rec:
                done[rec["month"]] = rec
            if k % 50 == 0:
                print(f"  {k}/{len(todo)}")

    build(a, done, clat, clon)


def build(a, done: dict, clat: float, clon: float) -> None:
    months = sorted(done)
    out = write_json(
        f"{a.place}/imerg_monthly.json",
        {
            "format": "orbisol.rainm.v1",
            "location": {"lat": a.lat, "lon": a.lon, "label": a.label, "cell": {"lat": clat, "lon": clon, "sizeDeg": 0.1}},
            "provenance": provenance("NASA GPM IMERG V07 monthly (Final run, GPM_3IMERGM.07)", "satellite", f"{months[-1]}-01",
                                     date_from=f"{months[0]}-01", url="https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary"),
            "units": "mm/month",
            "reference": f"full IMERG record from {a.start_year} (WMO 1991-2020 not available for IMERG)",
            "months": [{"month": m, "mm": done[m]["mm"]} for m in months],
        },
    )
    print(f"wrote {out}: {len(months)} months {months[0]}..{months[-1]}, missing {sum(1 for m in months if done[m]['mm'] is None)}")


if __name__ == "__main__":
    main()
