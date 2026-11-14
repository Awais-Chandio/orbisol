"""Orbisol pipeline - offline place search index from GeoNames (not OpenStreetMap).

GeoNames gazetteer, licensed CC BY 4.0 (https://www.geonames.org/). Downloads into pipeline/raw/geonames
(git-ignored) and writes a sharded index to data/places/:
  - Pakistan: all populated places (towns and villages, feature class P)
  - World: cities with population >= 15,000 (so any pin can be searched)
  - idx/<xy>.json: rows whose normalized name starts with the two characters "xy" (small files for weak networks)
  - index.json: manifest (shard keys, counts, provenance)

Row format: [name, admin1 (province/state), country code, lat, lon, population]
Normalization must match packages/core/src/places (lowercase, strip accents, keep a-z0-9).

Usage: .venv/bin/python scripts/places.py
AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import csv
import io
import re
import shutil
import unicodedata
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

import requests

from common import ROOT, provenance, write_json

BASE = "https://download.geonames.org/export/dump/"
RAW = ROOT / "pipeline" / "raw" / "geonames"
csv.field_size_limit(10_000_000)


def download(name: str) -> Path:
    RAW.mkdir(parents=True, exist_ok=True)
    out = RAW / name
    if not out.exists():
        r = requests.get(BASE + name, timeout=300)
        r.raise_for_status()
        out.write_bytes(r.content)
    return out


def read_zip_tsv(path: Path, member: str):
    with zipfile.ZipFile(path) as z, z.open(member) as f:
        yield from csv.reader(io.TextIOWrapper(f, encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE)


def admin1_names() -> dict[str, str]:
    p = download("admin1CodesASCII.txt")
    out = {}
    for row in csv.reader(p.open(encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE):
        if len(row) >= 3:
            out[row[0]] = row[2]  # "PK.05" -> "Sindh" (ascii name)
    return out


def rows_from(path: Path, member: str, admin1: dict[str, str], keep) -> list[list]:
    seen: set[tuple] = set()
    rows = []
    for r in read_zip_tsv(path, member):
        # geonames columns: 1 name, 2 asciiname, 4 lat, 5 lon, 6 class, 7 code, 8 country, 10 admin1, 14 population
        if len(r) < 15 or r[6] != "P" or not keep(r):
            continue
        name = r[2] or r[1]
        a1 = admin1.get(f"{r[8]}.{r[10]}", "")
        lat, lon = round(float(r[4]), 4), round(float(r[5]), 4)
        key = (name.lower(), a1, round(lat, 2), round(lon, 2))
        if key in seen:
            continue
        seen.add(key)
        rows.append([name, a1, r[8], lat, lon, int(r[14] or 0)])
    rows.sort(key=lambda x: -x[5])
    return rows


def normalize(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


MAX_ROWS = 1500  # per shard; bigger prefixes are split by the next character
MAX_KEY = 10


def compact(name: str) -> str:
    return normalize(name).replace(" ", "")


def build_shards(rows: list[list]) -> dict[str, list]:
    """Adaptive prefix shards: start with 2 characters, split any shard above MAX_ROWS by one more character.
    Names shorter than the split length stay in the parent shard (stored under key + "~")."""
    out: dict[str, list] = {}
    pending: list[tuple[str, list]] = []
    first: dict[str, list] = defaultdict(list)
    for r in rows:
        c = compact(r[0])
        if len(c) >= 2:
            first[c[:2]].append(r)
    pending.extend(first.items())
    while pending:
        key, rs = pending.pop()
        if len(rs) <= MAX_ROWS or len(key) >= MAX_KEY:
            out[key] = rs
            continue
        children: dict[str, list] = defaultdict(list)
        stay: list = []
        for r in rs:
            c = compact(r[0])
            (children[c[: len(key) + 1]] if len(c) > len(key) else stay).append(r)
        if stay:
            out[key + "~"] = stay  # exact-length names, e.g. "goth" itself
        pending.extend(children.items())
    return out


def main() -> None:
    a1 = admin1_names()
    today = date.today().isoformat()
    prov = provenance("GeoNames gazetteer (CC BY 4.0)", "reference", today, url="https://www.geonames.org/")
    fields = ["name", "admin1", "country", "lat", "lon", "population"]

    pk = rows_from(download("PK.zip"), "PK.txt", a1, lambda r: True)
    world = rows_from(download("cities15000.zip"), "cities15000.txt", a1, lambda r: r[8] != "PK")
    shards = build_shards(pk + world)

    out_dir = ROOT / "data" / "places"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    for k, rows in shards.items():
        rows.sort(key=lambda x: -x[5])
        write_json(f"places/idx/{k.replace('~', '_')}.json", {"format": "orbisol.places.v1", "fields": fields, "rows": rows})
    write_json(
        "places/index.json",
        {
            "format": "orbisol.places-index.v1",
            "provenance": prov,
            "fields": fields,
            "count": {"pakistan": len(pk), "world": len(world)},
            "shards": sorted(shards),  # "~" suffix -> file name with "_"
        },
    )
    sizes = sorted((p.stat().st_size for p in (out_dir / "idx").glob("*.json")), reverse=True)
    print(f"pk {len(pk)} + world {len(world)} rows -> {len(sizes)} shards; largest {sizes[0] // 1024} KB, median {sizes[len(sizes) // 2] // 1024} KB")


if __name__ == "__main__":
    main()
