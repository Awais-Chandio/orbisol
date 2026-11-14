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
