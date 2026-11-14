"""Orbisol pipeline - shared helpers.

AI-assisted: drafted with Claude (Anthropic); see docs/ai-usage.md.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"

# Demo case study: Hyderabad, Sindh, Pakistan (canal-irrigated)
HYDERABAD = {"lat": 25.40, "lon": 68.37, "label": "Hyderabad, Sindh"}


def provenance(source: str, kind: str, date: str, date_from: str | None = None, url: str | None = None) -> dict:
    """Provenance block attached to every number (mirrors packages/core Provenance)."""
    p = {"source": source, "kind": kind, "date": date}
    if date_from:
        p["dateFrom"] = date_from
    if url:
        p["url"] = url
    return p


def write_json(rel_path: str, payload: dict) -> Path:
    """Write payload under data/ with a generation stamp."""
    out = DATA_DIR / rel_path
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), **payload}
    out.write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return out
