"""Orbisol pipeline - greenness (NDVI) for cropland around a pin, from NASA MODIS via ORNL DAAC TESViS (no login).

- NDVI: MOD13Q1 (Terra, 16-day, 250 m), band 250m_16_days_NDVI (scale 0.0001), 2000 to latest.
- Quality: 250m_16_days_pixel_reliability, keep 0 (good) and 1 (marginal); drop 2 (snow/ice), 3 (cloudy), -1 (fill).
- Cropland mask: MCD12Q1 LC_Type1 (IGBP) classes 12 (Croplands) and 14 (Cropland/Natural Vegetation Mosaics),
  year-matched (nearest available year), mapped from the 500 m grid to the 250 m grid by map coordinates.
- Window: +/- WINDOW_KM km around the pin; only cropland pixels count, so nearby towns and roads do not dilute it.
- Output per composite: median NDVI of good cropland pixels and the pixel count. Fewer than MIN_PIXELS -> null.

VIIRS NOAA-20 (VJ113A1) is not offered by TESViS (checked 14 Nov 2026); Suomi NPP (VNP13A1) is not used by design.

Usage: .venv/bin/python scripts/ndvi.py [--lat 25.40 --lon 68.37 --place hyderabad]
AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import argparse
import json
import statistics
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

from common import HYDERABAD, ROOT, provenance, write_json

API = "https://modis.ornl.gov/rst/api/v1"
RAW = ROOT / "pipeline" / "raw" / "tesvis"
WINDOW_KM = 3
CROP_CLASSES = {12, 14}
GOOD_RELIABILITY = {0, 1}
MIN_PIXELS = 10
CHUNK = 10  # TESViS returns at most 10 dates per request
WORKERS = 2
HEADERS = {"Accept": "application/json", "User-Agent": "orbisol-pipeline (NASA Space Apps 2026)"}


def get_json(url: str, cache: Path) -> dict:
    if cache.exists():
        return json.loads(cache.read_text())
    for attempt in range(10):
        try:
            r = requests.get(url, headers=HEADERS, timeout=180)
            if r.status_code == 200:
                try:
                    data = r.json()
                except ValueError:
                    data = None
                # TESViS sometimes answers 200 with an empty body or a plain string when busy
                if isinstance(data, dict):
                    cache.parent.mkdir(parents=True, exist_ok=True)
                    cache.write_text(r.text)
                    return data
                print(f"  busy/invalid response ({r.text[:60]!r}); retry {attempt + 1}")
            else:
                print(f"  HTTP {r.status_code}; retry {attempt + 1}")
        except requests.RequestException as e:
            print(f"  {e}; retry {attempt + 1}")
        time.sleep(min(120, 10 * 2 ** attempt))
    raise RuntimeError(f"failed: {url}")


def dates(product: str, lat: float, lon: float, place: str) -> list[str]:
    d = get_json(f"{API}/{product}/dates?latitude={lat}&longitude={lon}", RAW / f"{place}_{lat}_{lon}" / f"{product}_dates.json")
    return [x["modis_date"] for x in d["dates"]]


def subset(product: str, band: str, lat: float, lon: float, d0: str, d1: str, place: str) -> dict:
    url = (f"{API}/{product}/subset?latitude={lat}&longitude={lon}&band={band}"
           f"&startDate={d0}&endDate={d1}&kmAboveBelow={WINDOW_KM}&kmLeftRight={WINDOW_KM}")
    return get_json(url, RAW / f"{place}_{lat}_{lon}" / f"{product}_{band}_{d0}_{d1}.json")  # keyed by pin: a moved pin must not reuse old chunks


def fetch_band(product: str, band: str, all_dates: list[str], lat: float, lon: float, place: str) -> dict[str, tuple[dict, list]]:
    chunks = [all_dates[i:i + CHUNK] for i in range(0, len(all_dates), CHUNK)]
    out: dict[str, tuple[dict, list]] = {}

    def job(ch: list[str]) -> dict:
        return subset(product, band, lat, lon, ch[0], ch[-1], place)

    with ThreadPoolExecutor(WORKERS) as ex:
        for i, res in enumerate(ex.map(job, chunks)):
            meta = {k: res[k] for k in ("xllcorner", "yllcorner", "cellsize", "nrows", "ncols")}
            for s in res["subset"]:
                out[s["modis_date"]] = (meta | {"calendar_date": s["calendar_date"]}, s["data"])
            if (i + 1) % 10 == 0:
                print(f"  {product} {band}: {i + 1}/{len(chunks)} requests")
    return out


def lc_lookup(meta_lc: dict, lc: list, meta: dict):
    """Function (row, col) on the 250 m grid -> land cover class from the 500 m grid, by map coordinates."""
    x0, y0, c0 = float(meta["xllcorner"]), float(meta["yllcorner"]), float(meta["cellsize"])
    X0, Y0, C0 = float(meta_lc["xllcorner"]), float(meta_lc["yllcorner"]), float(meta_lc["cellsize"])
    nr, nR, nC = int(meta["nrows"]), int(meta_lc["nrows"]), int(meta_lc["ncols"])

    def f(r: int, c: int):
        x = x0 + (c + 0.5) * c0
        y = y0 + (nr - r - 0.5) * c0
        C = int((x - X0) // C0)
        R = nR - 1 - int((y - Y0) // C0)
        if 0 <= R < nR and 0 <= C < nC:
            return lc[R * nC + C]
        return None

    return f


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, default=HYDERABAD["lat"])
    ap.add_argument("--lon", type=float, default=HYDERABAD["lon"])
    ap.add_argument("--place", default="hyderabad")
    ap.add_argument("--label", default=HYDERABAD["label"])
    a = ap.parse_args()

    lc_dates = dates("MCD12Q1", a.lat, a.lon, a.place)
    lc = fetch_band("MCD12Q1", "LC_Type1", lc_dates, a.lat, a.lon, a.place)
    lc_by_year = {int(m["calendar_date"][:4]): (m, data) for m, data in lc.values()}
    print(f"land cover years: {min(lc_by_year)}-{max(lc_by_year)}")

    vi_dates = dates("MOD13Q1", a.lat, a.lon, a.place)
    print(f"MOD13Q1 composites: {len(vi_dates)} ({vi_dates[0]} .. {vi_dates[-1]})")
    ndvi = fetch_band("MOD13Q1", "250m_16_days_NDVI", vi_dates, a.lat, a.lon, a.place)
    rel = fetch_band("MOD13Q1", "250m_16_days_pixel_reliability", vi_dates, a.lat, a.lon, a.place)

    series = []
    crop_pixels_by_year: dict[int, int] = {}
    for d in vi_dates:
        if d not in ndvi or d not in rel:
            continue
        meta, vals = ndvi[d]
        _, rels = rel[d]
        year = int(meta["calendar_date"][:4])
        ly = min(lc_by_year, key=lambda y: abs(y - year))
        lookup = lc_lookup(lc_by_year[ly][0], lc_by_year[ly][1], meta)
        nr, ncol = int(meta["nrows"]), int(meta["ncols"])
        good = []
        crop = 0
        for i, v in enumerate(vals):
            r, c = divmod(i, ncol)
            if lookup(r, c) not in CROP_CLASSES:
                continue
            crop += 1
            if rels[i] in GOOD_RELIABILITY and -2000 <= v <= 10000:
                good.append(v * 0.0001)
        crop_pixels_by_year[year] = crop
        value = round(statistics.median(good), 4) if len(good) >= MIN_PIXELS else None
        series.append({"date": meta["calendar_date"], "ndvi": value, "n": len(good)})

    last = next(s["date"] for s in reversed(series) if s["ndvi"] is not None)
    out = write_json(
        f"{a.place}/ndvi.json",
        {
            "format": "orbisol.ndvi.v1",
            "location": {"lat": a.lat, "lon": a.lon, "label": a.label},
            "provenance": provenance(
                "NASA MODIS Terra MOD13Q1 NDVI (250 m, 16-day) via ORNL DAAC TESViS",
                "satellite",
                last,
                date_from=series[0]["date"],
                url="https://modis.ornl.gov/",
            ),
            "method": {
                "windowKm": WINDOW_KM,
                "mask": "MCD12Q1 LC_Type1 classes 12 (Croplands) and 14 (Cropland/Natural Vegetation Mosaics), nearest year",
                "quality": "MOD13Q1 pixel reliability 0 (good) or 1 (marginal)",
                "statistic": "median of cropland pixels",
                "minPixels": MIN_PIXELS,
                "cropPixelsByYear": crop_pixels_by_year,
            },
            "series": series,
        },
    )
    valid = sum(1 for s in series if s["ndvi"] is not None)
    print(f"wrote {out}: {len(series)} composites, {valid} with values, last {last}")


if __name__ == "__main__":
    main()
