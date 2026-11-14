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

## 2026-11-14 15:30 PKT - Phase 4 Core engine - commit 42126d2

- FLOW: daily series -> et0Climatology + monthlyClimate/hazards -> candidatePlans (cited windows) -> evaluatePlan (FAO-56 Kc x ET0, bare spans, legume/forage days, vulnerable stages) -> priorityScores (3/2/1) -> existing + 2 alternatives with why/evidence/benefits/gaps/risks; compareSeason -> seasonTwins -> nextWindowIndicators -> twinOutlook + backtestTwins -> confidenceMeter
- Crop rules: 9 crops, every value with a source (FAO-56 Tables 11/12/22/23, Sindh Agriculture Dept, Feedipedia, Dawn); gaps left out and listed. docs/crop-rules.md generated from code.
- Hyderabad result (water + forage priorities): existing cotton -> wheat ~1885 mm, 38 bare days (29 in Apr-Jun); sorghum fodder -> berseem 19% less water; mung -> berseem 25% less water but 57 more bare days (flagged as a risk).
- Track record example (90-day window, next 60 days Tmax): 81% vs naive 73%. Hot-days outcome in winter is flagged as not informative.
- 53 core tests pass (incl. integration test on real Hyderabad POWER data).

## 2026-11-14 16:30 PKT - Phase 5 Must screens - commit 36cf2ea

- FLOW: My farm (Zod store) + pin -> useClimate (one POWER fetch) -> core compareRotations / monthTimeline / seasonTwins -> Rotations, Calendar, Season screens; priority chips -> store -> instant re-rank
- Rotations: main number = water relative to the existing rotation ("19% less water"); absolute mm shown as "estimate, likely high";
  trade-off line (e.g. "less water, more legume time, but 51 more bare days"); score bars per chosen priority with x3/x2/x1 weights;
  why / evidence / benefits / gaps / risks with a source tag on every line.
- Calendar: bare Apr 16 - May 14 (29 days, all in the hottest months), wheat heat-sensitive in April, cotton in August heavy rain.
- Season: Twins 2002, 2014, 2016; next-60-day outlook with Confidence Meter and Track Record (81% vs 73% naive).
- About: NASA datasets, FAO-56, Sindh Agriculture Dept, Feedipedia, Dawn, ETCCDI/WMO, "Place names: GeoNames, CC BY 4.0".
- Places index in repo: 1517 files, 9.47 MB raw (about 2.5 MB gzipped).

## 2026-11-14 16:40 PKT - Phase 6 Pipeline JSON

- FLOW: pipeline script -> data/hyderabad/*.json (format-versioned, provenance) -> sync to public/data -> service (fetchStaticJson: missing file = null, not an error) -> Zod -> core (greenness / terrain / rain) -> card with SourceTag
- Demo pin moved to cropland near Tando Jam (25.48, 68.41): 77% cropland (MCD12Q1 2025, 2 km), same NASA POWER cell (static fallback still matches); button "Demo farm near Tando Jam, Hyderabad".
- SRTM (Earthdata login): slope 0.35% at 270 m, plane fit 0.14% -> FAO class 02 "Level"; 30 m slope (3.15%) is SRTM noise on flat plains and is kept as a note only. Calendar shows slope + windiest months (May-Jul) + bare days in them.
- NDVI (MODIS Terra MOD13Q1 + MCD12Q1 cropland mask, TESViS): code and cards done; JSON committed separately when the slow TESViS run finishes. Bug found: TESViS cache was keyed by place name, so a moved pin reused old-pin chunks; cache is now keyed by lat/lon.
- IMERG: script works (OPeNDAP, one pixel per day) but the full series is ~10,500 requests; the GES DISC server started refusing connections at ~2,400 days. Skipped at the time cap; cards hide when the file is missing. Future work.
- SMAP: no data on TESViS for the pin; NSIDC route too heavy. Soil moisture stays NASA POWER GWETTOP, tagged as model. Future work.
- Fixed in browser test: Calendar said "No frost or frequent heavy-rain months" while August showed heavy rain -> now "No frost months here." 63 core tests pass, precache 18 entries / 3,007 KiB, no console errors.

## 2026-11-14 16:55 PKT - Fix: desktop-like render on Android

- Viewport meta was present in index.html, dist and on Vercel. Cause: on the Field screen the coordinate form grid used
  `1fr 1fr`, so the inputs' intrinsic width pushed the layout to 480 px at a 360 px phone; Android Chrome then zooms
  the whole page out (narrow column, tiny text).
- Fix: `minmax(0, 1fr)` in all grids, inputs `width: 100%`, global guard (controls/media never wider than their column),
  `text-size-adjust: 100%`.
- Verified with headless Chrome DevTools mobile emulation (360x800, DPR 3, mobile viewport): every screen 360 px wide,
  scale 1, no element past the right edge (old deployed build: Field 480 px).

## 2026-11-14 17:55 PKT - Phase 6 NDVI data

- `data/hyderabad/ndvi.json`: MOD13Q1 2000-02-18 .. 2026-10-16, 614 composites (611 with values), cropland pixels 122-385 per year (MCD12Q1, 3 km).
- Sanity check (2001-2020 monthly medians): rabi peak Jan-Feb 0.49, bare/harvest Apr-May 0.24, kharif Aug-Sep 0.46: matches the cotton -> wheat calendar.
- Season screen: greenness 0.46 vs normal 0.44 (Aug 3 - Oct 31, 2026); twins greenness outlook works; no console errors.

## 2026-11-14 20:15 PKT - Phase 6 close-out

- IMERG retry (15-minute cap, 4 connections): not blocked, but listing + fetch reached only ~3,000 of 10,544 days; left as future work. Month listing is now cached so the next run resumes straight into fetching.
- SMAP re-probe on TESViS: HTTP 503. Soil moisture stays NASA POWER GWETTOP (model); SMAP is future work.

## 2026-11-14 20:50 PKT - Phase 7 Water fit, share, observed trend - commits e2a9f06, 3073d41, f06a693, 217588b

- FLOW (water fit): My farm canal turn + soil -> core waterFit(plan, ET0 normal) -> per month: ETc = Kc x ET0, TAW = 1000 (thetaFC - thetaWP) Zr, RAW = p TAW (p adjusted for ETc), safe days = RAW / ETc -> Rotations card table (fits / too long / young crop)
- Sources: FAO-56 Table 19 (Ch. 7, soil water), Table 22 (Ch. 8, root depth + p, smaller depth per footnote 1), p + 0.04 (5 - ETc). p added to the cited crop rules (rice: none, flooded crop).
- Demo (sandy soil, 7-day turn): cotton -> wheat too long in Mar, Jul, Aug, Sep; sorghum fodder -> berseem in 6 months. Canal flow volume unknown: shown on screen as a limitation (each turn assumed to refill the root zone).
- Share: Web Share API, wa.me fallback; text = top-ranked rotation, water % vs current, main risk (canal turn first), app root link. No coordinates anywhere in the URL (tested both paths with stubs).
- Observed trend (Season): NASA POWER 1990-2025, OLS change per decade + 95% range. Hyderabad: hot days (> 42.5 °C) -4.5/decade, rain - ET0 +185 mm/decade (rain up, ET0 down; more humid, less wind). Labelled "observed trend, not a forecast", with a reanalysis caveat.
- Stretch (NEX-GDDP-CMIP6 2050 heat): skipped. Planetary Computer access works, but global daily chunks make a pixel-year ~246 MB (~44 GB for the plan) at a measured 0.5 MB/s.
- Verified at 360x800 (same-origin 360 px iframe): all 6 screens, no element past the right edge, no console errors. 71 core tests pass; build precache 19 entries / 3,065 KiB.

## 2026-11-14 21:05 PKT - Phase 7 follow-ups - commits 14bbe95, 233046d, and the demo-soil commit

- 2050 heat (NEX-GDDP-CMIP6 via NCCS THREDDS NCSS point subset, ~1.3 s per point-year, 180 point-years in ~8 min):
  ACCESS-CM2, MPI-ESM1-2-HR, MRI-ESM2-0; hot days > 42.5 °C rise by +11 to +27 a year (SSP2-4.5) and +16 to +33
  (SSP5-8.5), 2041-2060 vs 1995-2014. Model baseline is 6-9 days vs ~36 in POWER, so the card leads with the change.
  Labelled "climate model projection, not a forecast"; credit on About.
- Trend card: warm nights (TN90p, > 27.8 °C) +5.7/decade (clear); hottest day of the year -0.25 °C/decade (unclear);
  plain line on irrigation cooling and the ~50 km grid.
- Demo farm soil: loam (no cited texture for the pin; Tandojam studies report several textures).
- Verified at 360x800: Season screen with both cards, no element past the right edge, no console errors; 71 tests pass.

## 2026-11-14 23:59 PKT - UI polish pass for judges (presentation only) - commits 4cc06fb .. fb4ce14

- Overview "Your field at a glance" is the landing screen once a field is pinned (`/` -> `/overview`, else `/field`);
  4 insight cards (bare days in the hottest months, best option water %, season vs normal, 2050 hot-day range),
  Confidence Meter, "Supports, not replaces, your judgment". Bottom nav: Field, My farm, Overview, Rotations, Calendar, Season.
- Crop-year timeline (Calendar, Overview; compact on rotation cards, replacing the "Whe/Cot" strip): crop bars named in
  text (number + legend when a name does not fit), hatched bare gaps, hottest-months band + icons, MODIS NDVI monthly
  normal underneath ("What NASA's MODIS satellite sees on your field"). The NDVI curve is not drawn for alternatives
  (it describes the field as farmed, not a rotation that was never grown). New core function `monthlyGreennessNormal`
  (median of 2001-2020 composites by month) + test; no existing calculation changed.
- Desktop (>= 1024 px): nav in the header, field map left / controls right, rotations 3 across, 2-column grids
  for Overview, Season, Calendar and My farm. Phone layout unchanged.
- Fixes: score bars say "best / middle / lowest of 3" (no bare 0%); Water fit without a canal turn shows a visible
  empty state + "Add canal turn" button; About no longer credits IMERG as used (moved with SMAP and VIIRS NDVI to
  "Planned, not in this version", README matches); season cards get a range bar (usual range, normal, this season) with
  the explanation under "What does this mean?"; glossary popovers (NDVI, ET0, water balance, soil moisture anomaly,
  frost risk; native Popover API); "Next step" button in story order; one-tap Sindh rotation presets in My farm.
- No new dependencies. Screenshots: docs/screenshots/ (7 screens x 360x800 @2x and 1440x900). Checked: no horizontal
  overflow at 360, 1024 or 1440; 72 core tests pass; typecheck and production build pass.

## 2026-11-15 PKT - Polish follow-ups

- Demo farm = cotton -> wheat preset (one `COTTON_WHEAT` definition), inside the cited Sindh windows: cotton mid-May to
  late Oct, wheat early Nov to late Mar (was mid-April, outside the March harvest window). A device that saved the old
  demo rotation is moved to the new one on load. Fresh start, old saved demo and tapping the preset all give the same
  Overview: 44 bare days in the hottest months, best option 12% less water.
- Bottom nav at 360 px: 6 items of 60 x 60 px (>= 44 px), every label on one line (widest, bold "Rotations", 49 of
  58 px); also fits at 320 px (53 px items). No change needed.
- Full-length captures (whole page, 2x, viewport grown to page height so the header and nav sit in place) of Overview,
  Rotations and Calendar at 360 and 1440 wide: docs/screenshots/*-full@2x.png. Viewport screenshots retaken with the
  new demo numbers.

## 2026-11-15 PKT - Screenshot review fixes (presentation only)

- Field: "Or type coordinates" is a visible toggle (flex summaries had lost their marker; every disclosure now has a
  chevron); value line + 3-step strip (Pin your field, Tell us how you farm, See your options). Value line says
  "25 years of NASA satellite data and 30 years of NASA climate records" (MODIS 2001-2025; rotation numbers use NASA
  POWER 1991-2020, a model, so "satellite" alone would overclaim).
- My farm desktop: right column stacks on its own (no stretched gaps). Rotations: priorities collapse to one
  "Ranked for: ... Change" row (first card visible on the first phone screen), full width on desktop.
- Calendar: NDVI chart annotates its lowest month "Bare soil: the satellite sees it too" with a pointer (only when the
  farmer's plan has >= 10 bare days that month); month list under "Month-by-month details". Timeline: narrow crop
  pieces get the legend number.
- Plain words: nitrogen-adding crop (legume), similar past years (Season Twins) with the outcome named, starting point,
  emissions paths, salt rating in words, model squares; glossary popovers kept.
- Verified: nav 6 x 60x60 px at 360, labels on one line; fresh start shows the cotton -> wheat preset selected.
  Screenshots recaptured (top of screen for all 7 screens + full-length 2x for Overview, Rotations, Calendar).

## 2026-11-15 PKT - Farmer layer + science layer (presentation only) - commits c6d3590 .. 9be79b9

- Basis: GSMA AgriTech UX guidance (insights, not just data; plain local language; icons; voice; less is more) and
  2024 Space Apps winners that turned NASA data into simple decisions.
- Two layers on Overview, Rotations, Calendar, Season: one plain sentence + icon per screen and card; charts, ranges,
  sources and method text under one "Show the science" switch (open by default >= 1024 px, closed on phones). Nothing
  removed; risks to check locally and the canal-turn empty state stay in the farmer layer.
- Farmer units: water as "about 1 in N canal turns saved" (N = round(100 / %), only from 5%), bare days as
  "X hot days with bare soil: sun and wind take the topsoil"; exact numbers beside them.
- Crop-year chart: Current | Option 1 | Option 2; bars and bare gaps glide (CSS transitions on SVG geometry, stable
  keys) and the hottest-months bare-day count updates; MODIS curve with Current only.
- Motion (< 400 ms, off with prefers-reduced-motion, checked by emulation): count-up via CSS @property counter, bars
  grow in, NDVI and trend lines draw in.
- Listen: browser speechSynthesis reads the four Overview sentences (arrows and ranges spoken in words); hidden when
  unsupported. No network, no dependency.
- Urdu (DRAFT, needs native review; src/i18n/locales/ur.ts): Field screen, Overview plain sentences, nav labels and
  the buttons on those screens. RTL with Noto Nastaliq Urdu; untranslated English keeps left-to-right
  (unicode-bidi: plaintext); numbers, ranges and units isolated left-to-right; dates stay English while Urdu is partial.
  English remains the default; the choice is remembered on the device.
- Screenshots recaptured (docs/screenshots/), plus two Urdu draft phone shots (08-*-ur-draft-360x800.png).

## 2026-11-15 PKT - Objective coverage pass

- docs/objectives.md: each objective, NASA dataset, condition, farmer priority and consideration in the official
  Field Shift statement -> screen and component, with Covered / Partial / Gap.
- Rotation cards: "Pests, soil and income" cited notes (pink bollworm carry-over and cotton-free break: Dawn 2013,
  UC IPM; whitefly host range: Saeed et al. CottonGen poster; infiltration: FAO Soils Bulletin 80; fodder income:
  ARY News 2026, Dawn 2005). No reliable source for non-cotton pest carry-over or the legume effect on infiltration:
  shown as "information gap - check with your local extension officer". Sources added to About.

## 2026-11-15 PKT - Salinity made visible

- Before: "salty: yes" only added a risk line for S/MS crops (berseem) inside the collapsed "Risks to check locally";
  cotton -> wheat showed nothing, crops without an FAO value (mung bean) showed nothing, Overview showed nothing.
- After: each rotation card shows a "Salty soil" box with every crop's FAO-56 Table 23 (FAO-29) rating in plain words
  (warning icon for sensitive, check icon for tolerant, question mark + information gap for no value), a one-line ECe
  explanation, a soil-test "Check locally" flag and the FAO-56 source; Overview shows one sentence linking to it.
  Read from the cited crop rules; scoring unchanged (ranks and water identical with salty yes/no).
