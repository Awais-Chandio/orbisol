# Orbisol

**From orbit to soil.** A mobile-first web app (PWA) that helps farmers explore crop rotation
strategies using NASA Earth observations, local soil information, crop characteristics and their
own priorities.

> Orbisol **supports, not replaces,** farmer judgment and local expertise.

- **Event:** NASA Space Apps Challenge 2026, Hyderabad (Pakistan) virtual local event
- **Challenge:** Field Shift: Adapting Farms with NASA Data
- **Team:** Orbisol, solo: Muhammad Awais
- **Case study:** Hyderabad, Sindh, Pakistan (25.40 N, 68.37 E), canal-irrigated. Works for any pin on land.

## What it does

1. Pin your field (GPS or map); enter your current rotation (e.g. cotton -> wheat), canal turn
   (warabandi), soil type and top priorities.
2. See **this season vs normal**: hot days, rain, extreme rain, frost, soil moisture and greenness,
   each with its source and date.
3. Compare **your existing rotation plus two alternatives**: why each was suggested, evidence,
   benefits, information gaps and risks that need local review.
4. **Season Twins** (past years most like this one), **Confidence Meter**, **seasonal calendar**
   (bare-field and vulnerable months), **Track Record** and **Water Fit**.

## Repo layout

```
apps/web/        Vite + React PWA (MVC-inspired: models, views, controllers, services, stores)
packages/core/   Pure TypeScript domain engine + Vitest tests (no network, DOM or React)
pipeline/        Python scripts that precompute NASA data into data/*.json
data/            Static JSON fallback so the demo works offline / when APIs are down
docs/            architecture, data sources, limitations, AI usage, build log
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # core engine tests
npm run check      # typecheck + tests
npm run build      # production build -> apps/web/dist
```

## Data credits

NASA POWER, MODIS Terra NDVI and land cover (ORNL DAAC), SRTM, NEX-GDDP-CMIP6 (NCCS THREDDS),
NASA GIBS VIIRS NOAA-20 imagery, and FAO GAEZ / FAO-56 for crop references. Planned, not in this
version: GPM IMERG satellite rain, SMAP soil moisture, VIIRS NOAA-20 NDVI. Full list: [docs/data-sources.md](docs/data-sources.md).
Data is credited in text only; Orbisol uses no NASA or Space Apps logos.

## AI usage

This project was built with AI assistance (Claude by Anthropic) for code and documentation drafts.
The idea, product decisions and final review are the author's. Details in
[docs/ai-usage.md](docs/ai-usage.md); AI-assisted source files carry a header comment saying so.

## License

MIT
