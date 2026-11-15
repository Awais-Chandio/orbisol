/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
/** Decorative hero: a globe with a tilted orbit ring and a small satellite (CSS perspective + SVG). Static under reduced motion. */
export function OrbitHero() {
  return (
    <div className="orbit-hero" aria-hidden>
      <svg className="orbit-globe" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="var(--c-electric-blue)" stroke="var(--c-blue-yonder)" strokeWidth="2" />
        <ellipse cx="32" cy="32" rx="12" ry="30" fill="none" stroke="var(--c-blue-yonder)" strokeWidth="1.5" opacity=".7" />
        <path d="M2 32h60M7 18h50M7 46h50" stroke="var(--c-blue-yonder)" strokeWidth="1.5" opacity=".7" />
        <path d="M20 24c4-4 10-3 12 1s-2 8 2 11-1 9-6 8-9-7-8-12 0-5 0-8z" fill="var(--c-neon-yellow)" opacity=".85" />
      </svg>
      <div className="orbit-plane">
        <div className="orbit-ring">
          <span className="orbit-sat">
            <svg viewBox="0 0 20 12" width="20" height="12">
              <rect x="0" y="3" width="6" height="6" fill="var(--c-blue-yonder)" />
              <rect x="7" y="2" width="6" height="8" rx="1" fill="var(--c-white)" />
              <rect x="14" y="3" width="6" height="6" fill="var(--c-blue-yonder)" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
