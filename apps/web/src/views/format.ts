/* Orbisol web - display formatting helpers. AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import i18n from '@/i18n';

/** Dates and numbers follow the app language (English). */
const locale = () => i18n.language;

export function monthName(m: number, style: 'short' | 'long' = 'short'): string {
  return new Date(Date.UTC(2001, m - 1, 1)).toLocaleDateString(locale(), { month: style, timeZone: 'UTC' });
}

/** 'MM-DD' -> '15 May' */
export function formatMonthDay(md: string): string {
  const [m, d] = md.split('-').map(Number);
  return new Date(Date.UTC(2001, m! - 1, d!)).toLocaleDateString(locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function formatInt(x: number): string {
  return Math.round(x).toLocaleString(locale());
}
