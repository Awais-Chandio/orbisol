/* Orbisol web - display formatting helpers. AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import i18n from '@/i18n';

export function monthName(m: number, style: 'short' | 'long' = 'short'): string {
  return new Date(Date.UTC(2001, m - 1, 1)).toLocaleDateString(i18n.language, { month: style, timeZone: 'UTC' });
}

/** 'MM-DD' -> '15 May' */
export function formatMonthDay(md: string): string {
  const [m, d] = md.split('-').map(Number);
  return new Date(Date.UTC(2001, m! - 1, d!)).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function formatInt(x: number): string {
  return Math.round(x).toLocaleString(i18n.language);
}
