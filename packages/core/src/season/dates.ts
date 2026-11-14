/**
 * Orbisol core - UTC date helpers for daily series (ISO YYYY-MM-DD).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
const DAY_MS = 86_400_000;

export function parseIso(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid ISO date: ${date}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return toIso(parseIso(date) + days * DAY_MS);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseIso(b) - parseIso(a)) / DAY_MS);
}

export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

/** Same month-day in another year; Feb 29 becomes Feb 28 in non-leap years. */
export function sameDayInYear(date: string, year: number): string {
  const md = date.slice(5);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return `${String(year).padStart(4, '0')}-${md === '02-29' && !leap ? '02-28' : md}`;
}

/** Month 1-12 of an ISO date. */
export function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}
