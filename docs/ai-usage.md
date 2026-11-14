# AI usage

Orbisol follows the NASA Space Apps 2026 rules on AI use: AI helped build it; the idea and the
decisions are the author's (Muhammad Awais).

- **Tool:** Claude (Anthropic), via Claude Code.
- **AI-generated images/video:** none so far. Any future AI image or video will carry a visible watermark.
- **Code:** AI-assisted source files carry a header comment, e.g. `AI-assisted: drafted with Claude (Anthropic)`.

## Log

| Date (PKT) | Phase | AI generated | Author decided / changed |
|---|---|---|---|
| 2026-11-14 | 1 Foundation | Monorepo scaffold, configs, brand tokens CSS, core types and stats helpers + tests, pipeline skeleton, docs drafts | Product idea, challenge choice, features (Season Twins, Confidence Meter, Track Record, Water Fit), tech stack, architecture rules, brand rules, Hyderabad case study, baseline cotton -> wheat rotation |
| 2026-11-14 | 2 App shell + map | Router, layout, bottom nav, PWA manifest + service worker, MapLibre map on GIBS, GPS service, field store, i18n setup, styles, icons from own SVG mark | Approved MVC layering, kept GIBS-only basemap (no OSM tiles), accepted dropping GIBS labels after the opaque-tile issue |
| 2026-11-14 | 3 Data layer | POWER Zod model, service, Dexie cache, static fallback, season indicators (ETCCDI/WMO definitions), FAO-56 ET0 implementation + tests, Season screen, pipeline power.py | Accepted switching from POWER model ET to FAO-56 ET0 after the irrigation issue; median as normal; 1991-2020 WMO baseline |
| 2026-11-14 | 2b Map labels re-check | Re-tested GIBS reference layers byte by byte, coastline overlay, GeoNames place-search pipeline + sharding, core search + tests, search UI | Asked to re-check labels with .png and the right matrix set; chose place search without OSM/Nominatim as the fallback |
| 2026-11-14 | 4 Core engine | Read FAO-56 Tables 11/12/22/23, Sindh Agriculture sowing page, Feedipedia and Dawn; transcribed values with sources; calendar, water need, strategies, twins, backtest, confidence + 53 tests; generated docs/crop-rules.md | Rule "never invent numbers"; asked for cited sources and a gaps list; Hyderabad case and cotton -> wheat baseline |
