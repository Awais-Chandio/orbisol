# data/

Precomputed JSON written by `pipeline/`. The web app loads these files when live APIs are slow or
down, so the Hyderabad demo always works.

Contract (validated with Zod in `apps/web/src/models`):

- Every file has `generatedAt` (ISO UTC) and a `location` `{ lat, lon, label }`.
- Every numeric value travels with a `provenance` block:
  `{ source, kind: "satellite" | "ground" | "model" | "reanalysis" | "farmer" | "reference", date, dateFrom?, url? }`.
- Missing values are `null`, never invented or filled silently.
