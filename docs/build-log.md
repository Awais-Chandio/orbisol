# Build log

## 2026-11-14 13:05 PKT - Phase 1 Foundation - commit 948ce37

- FLOW: npm workspaces -> apps/web (Vite React) imports @orbisol/core -> vitest + tsc + vite build all green
- Built: monorepo (apps/web, packages/core, pipeline, data, docs), TypeScript strict, full agreed stack installed,
  brand tokens CSS (Space Apps 2026 palette + fonts), core Provenance/Confidence/Priority/CanalTurn types,
  stats helpers with 6 tests, pipeline helpers (provenance + JSON writer), README + docs, vercel.json.
- Notes: TypeScript 7 removed `baseUrl`, so the alias uses `paths: { "@/*": ["./src/*"] }`; `tsc --noEmit` instead of `tsc -b`.
- Next: Phase 2 app shell + map (router, PWA manifest, MapLibre + GIBS VIIRS NOAA-20 layer, GPS pin).
