# Build log

## 2026-11-14 13:05 PKT - Phase 1 Foundation - commit 948ce37

- FLOW: npm workspaces -> apps/web (Vite React) imports @orbisol/core -> vitest + tsc + vite build all green
- Built: monorepo (apps/web, packages/core, pipeline, data, docs), TypeScript strict, full agreed stack installed,
  brand tokens CSS (Space Apps 2026 palette + fonts), core Provenance/Confidence/Priority/CanalTurn types,
  stats helpers with 6 tests, pipeline helpers (provenance + JSON writer), README + docs, vercel.json.
- Notes: TypeScript 7 removed `baseUrl`, so the alias uses `paths: { "@/*": ["./src/*"] }`; `tsc --noEmit` instead of `tsc -b`.
- Next: Phase 2 app shell + map (router, PWA manifest, MapLibre + GIBS VIIRS NOAA-20 layer, GPS pin).

## 2026-11-14 13:35 PKT - Phase 2 App shell + map - commit 7387ee2

- FLOW: GPS / map tap / typed coords / demo -> useFieldPicker (controller) -> Zod FieldPin -> Zustand (persisted) -> map pin + pin card
- Built: router (Field, My farm, Season, Rotations, Calendar, About), header + bottom nav, judgment notice on every screen,
  offline banner, SourceTag (satellite / model / ground / reference / farmer shown by icon + label + border style),
  JudgmentFlag, MapLibre map on NASA GIBS VIIRS NOAA-20 true color (date = today - 3 days), PWA manifest + workbox
  (GIBS tiles and fonts cached), PNG icons from our own SVG mark, i18n (English, RTL-ready).
- Fixes found in browser test: MapLibre v6 worker needs setWorkerUrl with a Vite-bundled worker; GIBS reference
  label/feature overlays return opaque black tiles, so they were removed (logged in limitations.md).
