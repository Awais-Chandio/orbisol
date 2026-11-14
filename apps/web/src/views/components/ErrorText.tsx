/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { Warning } from '@phosphor-icons/react';

/** Warning text: red is always paired with an icon and words, on a white surface. */
export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="form-error" role="alert">
      <Warning size={16} aria-hidden />
      <span>{children}</span>
    </p>
  );
}
