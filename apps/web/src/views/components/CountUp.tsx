/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import type { CSSProperties, ReactNode } from 'react';

/**
 * Whole numbers count up from 0 on first paint, in CSS only (registered @property + counter, under 400 ms).
 * Screen readers get the number as text; with reduced motion, or a browser without @property, the final value shows
 * at once. Anything that is not a whole number is shown as it is.
 */
export function CountUp({ children }: { children?: ReactNode }) {
  const text = String(Array.isArray(children) ? children.join('') : (children ?? ''));
  if (!/^-?\d+$/.test(text)) return <>{text}</>;
  return (
    <span className="count-up" style={{ '--to': Number(text) } as CSSProperties}>
      <span className="count-up-v" aria-hidden />
      <span className="sr-only">{text}</span>
    </span>
  );
}
