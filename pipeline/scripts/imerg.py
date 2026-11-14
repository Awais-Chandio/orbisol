"""Orbisol pipeline - daily rainfall at a pin from NASA GPM IMERG V07 -> data/<place>/imerg_daily.json.

- Final run (GPM_3IMERGDF.07, research quality) where available; Late run (GPM_3IMERGDL.07) for recent months.
- One 0.1 deg pixel (nearest cell centre) per daily file, read with OPeNDAP point subsetting (no full downloads).
- Variable: precipitation, "Daily mean precipitation rate (combined microwave-IR)", mm/day; fill -9999.9 -> null.
Needs an Earthdata login in ~/.netrc with the GES DISC app authorised.

Usage: .venv/bin/python scripts/imerg.py [--lat 25.48 --lon 68.41 --place hyderabad --start 1998-01-01]
AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import earthaccess

from common import HYDERABAD, ROOT, provenance, write_json

BASE = "https://gpm1.gesdisc.eosdis.nasa.gov"
RUNS = [("final", "GPM_3IMERGDF.07"), ("late", "GPM_3IMERGDL.07")]
CACHE = ROOT / "pipeline" / "raw" / "imerg"
# Keep this low: 8 + 16 parallel connections got the gpm1 server to refuse connections (14 Nov 2026).
WORKERS = int(os.environ.get("IMERG_WORKERS", "4"))


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
    ap.add_argument("--start", default="1998-01-01")
    ap.add_argument("--cache-tag", default="", help="separate cache file, e.g. for a parallel run over a later date range")
    ap.add_argument("--from-cache", action="store_true", help="skip listing/fetching; rebuild the JSON from cached days")
    a = ap.parse_args()

    earthaccess.login(strategy="netrc")
    local = threading.local()

    def session():
        # one authenticated session per thread (sharing one across threads caused SSL errors)
        if not hasattr(local, "s"):
            local.s = earthaccess.get_requests_https_session()
        return local.s

    def get(url: str):
        for attempt in range(6):
            try:
                r = session().get(url, timeout=120)
                if r.status_code in (200, 404):
                    return r
            except Exception:  # noqa: BLE001 - network/SSL hiccup: new session, back off, retry
                local.__dict__.pop("s", None)
            time.sleep(2 * (attempt + 1))
        return None
    i, j, clon, clat = cell(a.lat, a.lon)
    print(f"IMERG cell centre {clat}, {clon} (i={i}, j={j})")

    files: dict[str, tuple[str, str]] = {}
    CACHE.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE / f"{a.place}{a.cache_tag}_{i}_{j}.jsonl"
    done: dict[str, dict] = {}
    for part in sorted(CACHE.glob(f"{a.place}*_{i}_{j}.jsonl")) if a.from_cache else [cache_file]:
        if part.exists():
            for line in part.read_text().splitlines():
                rec = json.loads(line)
                if rec["date"] not in done or rec["run"] == "final":
                    done[rec["date"]] = rec
    if a.from_cache:
        return build(a, done, clat, clon)

    # 1) map each day to a file, preferring the Final run
    d0, today = date.fromisoformat(a.start), date.today()
    months = sorted({(d0 + timedelta(days=k)).strftime("%Y/%m") for k in range((today - d0).days + 1)})

    def list_month(ym: str):
        out = {}
        for run, coll in RUNS:
            r = get(f"{BASE}/data/GPM_L3/{coll}/{ym}/")
            if r is None or r.status_code != 200:
                continue
            for name in set(re.findall(r'href="(3B-DAY[^"]+?\.nc4)"', r.text)):
                day = re.search(r"\.(\d{8})-S", name).group(1)
                iso = f"{day[:4]}-{day[4:6]}-{day[6:]}"
                out.setdefault(iso, (run, f"{coll}/{ym}/{name}"))
        return out

    with ThreadPoolExecutor(WORKERS) as ex:
        for res in ex.map(list_month, months):
            files.update(res)
    print(f"{len(files)} daily files found ({sum(1 for r, _ in files.values() if r == 'final')} final)")

    # 2) read one pixel per file (cached, resumable)
    todo = sorted(d for d in files if d not in done or done[d]["run"] != files[d][0])
    print(f"{len(todo)} days to fetch ({len(done)} cached)")
    lock = threading.Lock()

    def fetch(day: str):
        run, path = files[day]
        url = f"{BASE}/opendap/GPM_L3/{path}.ascii?precipitation[0:0][{i}:{i}][{j}:{j}]"
        for _ in range(3):
            try:
                r = get(url)
                if r is not None and r.status_code == 200:
                    m = re.search(r"\]\s*,\s*(-?[\d.eE+-]+)\s*$", r.text.strip().splitlines()[-1]) or re.search(r",\s*(-?[\d.eE+-]+)", r.text.split("precipitation.precipitation")[1])
                    v = float(m.group(1))
                    rec = {"date": day, "run": run, "mm": None if v < -9000 else round(v, 3)}
                    with lock, cache_file.open("a") as f:
                        f.write(json.dumps(rec) + "\n")
                    return rec
            except Exception:  # noqa: BLE001 - retry on any network/parse error
                pass
        return None

    with ThreadPoolExecutor(WORKERS) as ex:
        for k, rec in enumerate(ex.map(fetch, todo), 1):
            if rec:
                done[rec["date"]] = rec
            if k % 500 == 0:
                print(f"  {k}/{len(todo)}")
    build(a, done, clat, clon)


def build(a, done: dict[str, dict], clat: float, clon: float) -> None:
    days = sorted(done)
    start = date.fromisoformat(days[0])
    n = (date.fromisoformat(days[-1]) - start).days + 1
    mm, run = [None] * n, [None] * n
    for d in days:
        k = (date.fromisoformat(d) - start).days
        mm[k], run[k] = done[d]["mm"], done[d]["run"]
    first_late = next((start + timedelta(days=k)).isoformat() for k in range(n) if run[k] == "late") if "late" in run else None
    out = write_json(
        f"{a.place}/imerg_daily.json",
        {
            "format": "orbisol.rain.v1",
            "location": {"lat": a.lat, "lon": a.lon, "label": a.label, "cell": {"lat": clat, "lon": clon, "sizeDeg": 0.1}},
            "provenance": provenance("NASA GPM IMERG V07 daily (Final; Late for recent days)", "satellite", days[-1],
                                     date_from=days[0], url="https://gpm.nasa.gov/data/imerg"),
            "start": days[0],
            "firstLateDay": first_late,
            "units": "mm/day",
            "rain": mm,
        },
    )
    print(f"wrote {out}: {n} days {days[0]}..{days[-1]}, missing {sum(1 for x in mm if x is None)}, late from {first_late}")


if __name__ == "__main__":
    main()
