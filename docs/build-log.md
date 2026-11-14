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

## 2026-11-14 14:10 PKT - Phase 3 Data layer - commit 933a217

- FLOW: pin -> climateService (cache <12h -> live NASA POWER -> cache -> data/ JSON) -> Zod -> core buildDailyClimate (FAO-56 ET0) -> compareSeason (1991-2020 median, terciles) -> SeasonScreen cards with SourceTag
- Built: POWER client (7 params, 1990 to now, ~1.5 MB once, cached in IndexedDB), static Hyderabad file via pipeline/scripts/power.py,
  core season module (dates, windows, ETCCDI indicators, WMO normal, terciles) and FAO-56 ET0 (reproduces Example 18: 3.9 mm/day), 22 tests.
- Found in testing: POWER model ET ignores irrigation (about 2 mm in 90 days at Hyderabad), so it was replaced by FAO-56 ET0; mean-based
  "normal" contradicted tercile labels, so normal is now the median. ET0 likely reads high in irrigated Sindh (documented).
- Verified in browser: Hyderabad live, Hyderabad offline -> built-in data, Lahore live, 30/90-day toggle, no console errors.

## 2026-11-14 14:30 PKT - Map labels re-check + place search - commit 54685b1

- FLOW: type name -> core planShards -> fetch one small GeoNames shard (Zod) -> searchPlaceRows (exact > prefix, near pin first, dedupe 10 km) -> pin (source "search") -> map flies there
- Finding: format/matrix set were already png + GoogleMapsCompatible_Level13. The missing time segment ("default/default") caused
  opaque black blank tiles and 500s; with it, Labels/Features are transparent but empty everywhere tested (incl. New York, London).
  Coastlines_15m works and is now an overlay. Labels replaced by offline place search (no OSM/Nominatim).
- Index: 150k Pakistan places + 34k world cities in 1516 adaptive prefix shards (largest 116 KB, typical query ~25 KB), cached on use.
- Verified in browser: "tando ja" -> Tando Jam pins at 25.43, 68.53; "goth" asks for more letters; "hyderabad" shows Sindh first with km; coastlines visible near Karachi; no console errors. 30 core tests pass.
