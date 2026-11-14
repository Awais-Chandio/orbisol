"""Orbisol pipeline - slope around a pin from NASA SRTM (SRTMGL1 v003, 1 arc-second) -> data/<place>/slope.json.

Needs an Earthdata login in ~/.netrc (LP DAAC). Slope: Horn (1981) 3x3 method on the 1" grid within +/- WINDOW_KM km;
classes: FAO (2006) Guidelines for soil description, Table 7 (same limits as packages/core/src/terrain).

Usage: .venv/bin/python scripts/srtm.py [--lat 25.48 --lon 68.41 --place hyderabad]
AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import argparse
import math
import statistics
import struct
import zipfile
from pathlib import Path

import earthaccess

from common import HYDERABAD, ROOT, provenance, write_json

RAW = ROOT / "pipeline" / "raw" / "srtm"
WINDOW_KM = 1.0
N = 3601  # 1 arc-second tile
VOID = -32768
FAO_CLASSES = [("01", "Flat", 0, 0.2), ("02", "Level", 0.2, 0.5), ("03", "Nearly level", 0.5, 1), ("04", "Very gently sloping", 1, 2),
               ("05", "Gently sloping", 2, 5), ("06", "Sloping", 5, 10), ("07", "Strongly sloping", 10, 15),
               ("08", "Moderately steep", 15, 30), ("09", "Steep", 30, 60), ("10", "Very steep", 60, math.inf)]


def tile_name(lat: float, lon: float) -> str:
    return f"{'N' if lat >= 0 else 'S'}{abs(math.floor(lat)):02d}{'E' if lon >= 0 else 'W'}{abs(math.floor(lon)):03d}"


def fetch_tile(lat: float, lon: float) -> Path:
    name = tile_name(lat, lon)
    hgt = RAW / f"{name}.hgt"
    if hgt.exists():
        return hgt
    earthaccess.login(strategy="netrc")
    results = earthaccess.search_data(short_name="SRTMGL1", version="003", bounding_box=(lon - 0.001, lat - 0.001, lon + 0.001, lat + 0.001))
    if not results:
        raise RuntimeError("no SRTMGL1 granule found")
    RAW.mkdir(parents=True, exist_ok=True)
    files = earthaccess.download(results[:1], str(RAW))
    with zipfile.ZipFile(files[0]) as z:
        member = next(m for m in z.namelist() if m.endswith(".hgt"))
        hgt.write_bytes(z.read(member))
    return hgt


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, default=HYDERABAD["lat"])
    ap.add_argument("--lon", type=float, default=HYDERABAD["lon"])
    ap.add_argument("--place", default="hyderabad")
    ap.add_argument("--label", default=HYDERABAD["label"])
    a = ap.parse_args()

    data = fetch_tile(a.lat, a.lon).read_bytes()
    elev = struct.unpack(f">{N * N}h", data)  # big-endian int16, rows north -> south

    def z(r: int, c: int) -> float:
        v = elev[r * N + c]
        return math.nan if v == VOID else float(v)

    lat0, lon0 = math.floor(a.lat), math.floor(a.lon)
    r0 = round((lat0 + 1 - a.lat) * (N - 1))
    c0 = round((a.lon - lon0) * (N - 1))
    dy = 110_574 / 3600  # metres per arc-second of latitude (approx.)
    dx = 111_320 * math.cos(math.radians(a.lat)) / 3600
    half_r = round(WINDOW_KM * 1000 / dy)
    half_c = round(WINDOW_KM * 1000 / dx)

    half_r, half_c = half_r + 4, half_c + 4  # small margin so 270 m blocks cover the whole window
    win = [[z(r, c) for c in range(c0 - half_c, c0 + half_c + 1)] for r in range(r0 - half_r, r0 + half_r + 1)]

    def block(grid: list[list[float]], k: int) -> list[list[float]]:
        if k == 1:
            return grid
        R, C = len(grid) // k, len(grid[0]) // k
        out = []
        for r in range(R):
            row = []
            for c in range(C):
                vals = [grid[r * k + i][c * k + j] for i in range(k) for j in range(k) if not math.isnan(grid[r * k + i][c * k + j])]
                row.append(statistics.fmean(vals) if len(vals) >= k * k // 2 else math.nan)
            out.append(row)
        return out

    def horn(grid: list[list[float]], sx: float, sy: float) -> list[float]:
        out = []
        for r in range(1, len(grid) - 1):
            for c in range(1, len(grid[0]) - 1):
                A, B, C = grid[r - 1][c - 1:c + 2]
                D, _, F = grid[r][c - 1:c + 2]
                G, H, I = grid[r + 1][c - 1:c + 2]
                if any(math.isnan(v) for v in (A, B, C, D, F, G, H, I)):
                    continue
                out.append(100 * math.hypot(((C + 2 * F + I) - (A + 2 * D + G)) / (8 * sx), ((G + 2 * H + I) - (A + 2 * B + C)) / (8 * sy)))
        return out

    scales = {}
    for k in (1, 3, 9):  # ~30 m, ~90 m, ~270 m cells
        sl = sorted(horn(block(win, k), dx * k, dy * k))
        scales[f"{30 * k}m"] = {"cells": len(sl), "median": round(statistics.median(sl), 2), "p90": round(sl[int(0.9 * (len(sl) - 1))], 2)}

    # least-squares plane over the whole window: the overall terrain gradient
    pts = [(c * dx, -r * dy, v) for r, row in enumerate(win) for c, v in enumerate(row) if not math.isnan(v)]
    n = len(pts)
    mx, my, mz = (sum(p[k] for p in pts) / n for k in range(3))
    sxx = sum((p[0] - mx) ** 2 for p in pts); syy = sum((p[1] - my) ** 2 for p in pts)
    sxy = sum((p[0] - mx) * (p[1] - my) for p in pts)
    sxz = sum((p[0] - mx) * (p[2] - mz) for p in pts); syz = sum((p[1] - my) * (p[2] - mz) for p in pts)
    det = sxx * syy - sxy ** 2
    gradient = 100 * math.hypot((sxz * syy - syz * sxy) / det, (syz * sxx - sxz * sxy) / det)

    primary = scales["270m"]["median"]
    sl270 = horn(block(win, 9), dx * 9, dy * 9)
    classes = [{"code": code, "name": name, "from": lo, "to": None if hi == math.inf else hi,
                "share": round(sum(1 for v in sl270 if lo <= v < hi) / len(sl270), 3)} for code, name, lo, hi in FAO_CLASSES]
    cls = next(c for c in FAO_CLASSES if c[2] <= primary < c[3])
    elevs = [v for row in win for v in row if not math.isnan(v)]
    out = write_json(
        f"{a.place}/slope.json",
        {
            "format": "orbisol.slope.v1",
            "location": {"lat": a.lat, "lon": a.lon, "label": a.label, "elevationM": z(r0, c0)},
            "provenance": provenance("NASA SRTM SRTMGL1 v003 (1 arc-second)", "satellite", "2000-02-22",
                                     date_from="2000-02-11", url="https://www.earthdata.nasa.gov/data/instruments/srtm"),
            "method": {"windowKm": WINDOW_KM, "algorithm": "Horn (1981) 3x3 on block-averaged elevation",
                       "classes": "FAO (2006) Guidelines for soil description, Table 7",
                       "note": "30 m slopes are dominated by SRTM height noise and crop/building heights on flat plains; the 270 m value and the plane fit describe the terrain."},
            "elevation": {"min": min(elevs), "median": statistics.median(elevs), "max": max(elevs), "std": round(statistics.pstdev(elevs), 2)},
            "slopePct": {"primary": primary, "planeFit": round(gradient, 3), "byScale": scales},
            "faoClass": {"code": cls[0], "name": cls[1]},
            "classes": classes,
        },
    )
    print(f"wrote {out}: slope {primary}% at 270 m ({cls[1]}), plane fit {gradient:.3f}%, 30 m median {scales['30m']['median']}%")


if __name__ == "__main__":
    main()
