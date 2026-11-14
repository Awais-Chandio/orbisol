# Field Shift objectives coverage

How Orbisol answers each objective and farmer priority in the official challenge statement
([Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/),
NASA Space Apps Challenge 2026), read on 15 Nov 2026.

Status: **Covered** = answered on screen with a source; **Partial** = answered in part, limit stated in the app;
**Gap** = not answered in this version (listed in [limitations.md](limitations.md) where relevant).
Paths are under `apps/web/src/views/`.

## Core objectives

| Objective (official statement) | Where Orbisol answers it (screen -> component) | Status |
|---|---|---|
| Decision-support tool combining NASA Earth observations with local soil information, crop characteristics and farmer priorities | Field -> `screens/FieldScreen`, `components/FieldMap` (NASA GIBS imagery); My farm -> `screens/FarmScreen` (rotation, canal turn, soil texture, salinity, priorities); Rotations -> `components/RotationCard` | Covered |
| Help farmers explore rotation options that improve soil health and resilience to weather and water | Overview -> `screens/OverviewScreen`; Rotations -> `RotationCard` (water, bare days, legume time, risks) | Covered |
| Compare at least three rotation strategies, including the existing one | Rotations -> `screens/RotationsScreen` (current + 2 options, ranked by priorities) | Covered |
| For each strategy: why suggested, evidence, benefits, information gaps, risks for local review | Rotations -> `RotationCard` note sections (why, evidence, benefits, gaps; "Risks to check locally") | Covered |
| Highlight times when fields are typically bare | Calendar -> `components/CropYearTimeline`, `components/TimelineSwitcher` (hatched bare gaps, Current / Option 1 / Option 2); Overview bare-days card | Covered |
| Highlight seasons when current crops appear more vulnerable | Calendar -> month-by-month details (sensitive stage x hottest / frost / heavy-rain months); Rotations risks | Covered |
| Rotations that could interrupt pest cycles | Rotations -> `components/CitedNotes` (pink bollworm carry-over and cotton-free break, whitefly host range; cited) and engine benefit "new plant family" | Partial: cotton pests only; other crops say "information gap - check with your local extension officer" |
| Rotations that reduce water demand | Rotations -> water headline (FAO-56 Kc x NASA POWER ET0) and "about 1 in N canal turns saved"; `components/WaterFitDetail` (canal turn vs safe interval) | Covered |
| Rotations that improve infiltration | Rotations -> `CitedNotes` (cover, residues, root channels, organic matter; FAO Soils Bulletin 80) | Partial: cited explanation only, not measured; legume effect marked as an information gap |
| Rotations that add supplemental income | Rotations -> `CitedNotes` fodder note (Karachi dairy demand, Hyderabad net-return study) with a "check current prices" flag | Partial: cited context, no prices or income numbers (no reliable current price data) |
| A supportive tool that does not replace farmer judgment | `components/JudgmentNotice` on every screen, Overview line, `components/JudgmentFlag` ("Check locally") beside judgment-heavy items | Covered |

## NASA data named in the statement

| Dataset | Use in Orbisol | Status |
|---|---|---|
| NASA POWER | Heat, frost, rain, dew point, wind, sunlight, top-soil wetness, ET0 inputs (Season, Rotations, Calendar, trend) | Covered |
| MODIS | MOD13Q1 NDVI greenness (Season card, Calendar curve, Season Twins outcome) and MCD12Q1 cropland mask | Covered (demo region only; elsewhere shown as a data gap) |
| SRTM | Slope class and erosion context (`components/TerrainCard`) | Covered |
| GPM (IMERG) | Monthly product (GPM_3IMERGM.07): Season -> "Satellite rain vs normal" (`components/SatelliteRainMonthlyCard`), reference = IMERG record from 2000; daily product not shipped | Partial: monthly only, latest months lag by months |
| SMAP | Probed, no data for the demo farm; NASA POWER model soil wetness used instead | Gap |
| GRACE / GRACE-FO | Not used | Gap: no groundwater / water-storage trend |
| ECOSTRESS, Landsat, GEDI | Not used | Gap |
| (extra) NEX-GDDP-CMIP6, NASA GIBS | 2050 hot-day projection (`components/Heat2050Card`); map imagery | Covered |

## Conditions to analyse

| Condition | Where | Status |
|---|---|---|
| Temperature, heat stress | Season -> hot days card, `components/TrendCard` (hot days, warm nights, hottest day), `Heat2050Card` | Covered |
| Rainfall, extreme precipitation | Season -> rain and extreme rain days (NASA POWER model rain); satellite rain vs normal (GPM IMERG monthly) | Covered (satellite extreme-rain days need the daily product) |
| Soil moisture | Season -> top-layer soil moisture vs normal (NASA POWER GWETTOP, model) | Partial: model value, does not see canal irrigation (stated on screen) |
| Evaporation | Season -> evaporation demand (ET0, FAO-56) | Covered |
| Frost risk | Season -> frost days; Calendar frost months | Covered |
| Vegetation stress | Season -> greenness (NDVI) vs normal; Calendar NDVI curve | Covered (demo region) |
| Long-term water trends | Season -> `TrendCard` rain minus ET0 per year | Partial: no groundwater storage (GRACE) |

## Farmer priorities

| Priority | Where | Status |
|---|---|---|
| Water use | Scored; water headline, canal turns, Water fit | Covered |
| Forage value | Scored (fodder days + residue) | Covered |
| Nitrogen-fixing potential | Scored (legume share); legume notes | Covered |
| Erosion reduction | Scored (field cover); bare days in hot and windy months; SRTM slope | Covered |
| Organic matter improvement | Scored with a proxy (cover + legume time; no soil organic-matter data, see [limitations.md](limitations.md)) | Partial |
| Market suitability | Never scored (no price data); shown as a "Check locally" flag and an information gap on every option | Gap by design |
| Supplemental income | Fodder income note (cited) | Partial |
| Improving soil structure | Infiltration note (cited) | Partial |

## Potential considerations

| Consideration | Where | Status |
|---|---|---|
| Explain ET, soil moisture anomalies, NDVI, frost risk, water balance | `components/GlossaryTip` popovers; "What does this mean?" on each Season card | Covered |
| How satellite differs from ground measurements | `components/SourceTag` (satellite / model / ground / reference / your input, by icon, label and border); Season "How sure is this?" | Partial: no ground station data is combined |
| Statistical approach to historical patterns; uncertainty | Season Twins (analogue years), Track Record (back-test), `components/ConfidenceMeter`, usual ranges, 95% trend ranges | Covered |
| Where local expertise is needed to validate results | `JudgmentFlag` items; risks for local review | Covered |
| Harmonise datasets to a common grid | Point-based per pin; NDVI as a 3 km cropland median | Partial |
| Nutrient cycling, erosion, organic matter, pest-cycle disruption, water use, forage, market | Rotations (scores, notes, cited notes) | Covered except market (gap by design) |
| Explain nitrogen-fixing, cover, deep-rooting, drought-tolerant crops | Legume notes and glossary; cover via bare-day and infiltration notes | Partial: no deep-rooting or drought-tolerance notes |
| Interactive maps and trends over time | Field map (GIBS); trend charts (Season) | Partial: no map layers of trends |
| Field-level vulnerability zones (erosion, water stress, frost) | Not mapped; point values only | Gap |
| Timelines, overlays, scenario sliders | Crop-year timeline with plan switch; NDVI curve under the crop bars | Partial: no rainfall or temperature sliders |
| Easy for farmers with little technical experience | Plain sentence first on every screen and card, "Show the science" layer, farmer units (canal turns), icons, Listen (speech), Urdu draft, 360 px phones | Covered (Urdu strings are a draft needing native review) |
| Farmer inputs: priorities and constraints (water availability, equipment, market) | My farm: priorities, canal turn, soil, salinity, rotation presets | Partial: equipment and market preferences not captured (new-crop risk asks to check machinery) |
| Reminders that the tool supports, not replaces, expertise | `JudgmentNotice`, Overview line, About | Covered |

## Gaps in one place

- Pest cycles beyond cotton; legume effect on infiltration (shown in the app as "information gap - check with your local extension officer").
- Income and market: no prices; fodder note is context only.
- Daily satellite rain (GPM IMERG daily), SMAP soil moisture, GRACE water storage, ECOSTRESS, Landsat, GEDI.
- Field-level vulnerability maps and scenario sliders.
- Equipment constraints and market preferences as inputs.
- Ground-station data combined with satellite and model data.
