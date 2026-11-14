/**
 * Orbisol web - root component (placeholder until Phase 2 app shell).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { Info } from '@phosphor-icons/react';
import { mean } from '@orbisol/core';
import { APP_NAME, DEMO_FIELD, TAGLINE } from '@/config/env';

export function App() {
  // Smoke check that the web app consumes the core engine.
  const coreOk = Number.isFinite(mean([1, 2, 3]));
  return (
    <main className="container">
      <h1>{APP_NAME}</h1>
      <p>{TAGLINE}</p>
      <p>
        Demo field: {DEMO_FIELD.label} ({DEMO_FIELD.lat}, {DEMO_FIELD.lon})
      </p>
      <div className="notice" role="note">
        <Info size={24} weight="regular" aria-hidden />
        <span>
          Orbisol supports, not replaces, your judgment and local expertise.
        </span>
      </div>
      <p>Core engine: {coreOk ? 'connected' : 'error'}</p>
    </main>
  );
}
