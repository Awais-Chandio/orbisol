# Architecture

Orbisol is one static PWA (Vercel) plus a pure TypeScript engine and an offline Python pipeline.

```
farmer pin + inputs
   -> controller (apps/web/src/controllers)
   -> service (apps/web/src/services: NASA POWER live, or data/*.json fallback)
   -> Zod model (apps/web/src/models)  -- every number keeps { source, kind, date }
   -> @orbisol/core (season stats, twins, rotation scoring, confidence, backtest)
   -> store (Zustand) -> views (screens/components)
```

## Layers (MVC-inspired)

| Folder | Role | Rule |
|---|---|---|
| `models/` | Zod schemas + inferred types for API/JSON payloads | Every external response is parsed here |
| `services/` | Fetch from NASA APIs or static JSON, cache with Dexie | No React |
| `controllers/` | Hooks that orchestrate services + core (TanStack Query) | The only bridge between views and services |
| `stores/` | Zustand state: field pin, rotation, priorities, canal turn | |
| `views/` | Screens and components | Never call services directly |
| `packages/core` | Domain logic | No network, DOM or React; fully unit-tested |

## Fallback strategy

1. Try live NASA POWER for any pin.
2. If it fails or is slow, use the precomputed `data/` JSON (Hyderabad region).
3. Cache the last good result in IndexedDB (Dexie) for offline use.
