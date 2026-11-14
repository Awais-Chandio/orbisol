/**
 * Orbisol core - satellite rain by month (GPM IMERG monthly): the latest months on record vs the same calendar months
 * in every other year of the record. Uses the shared compareToBaseline (median, 10th-90th range, terciles).
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import { compareToBaseline, type IndicatorComparison } from './indicators';

export interface MonthlyRain {
  /** 'YYYY-MM' */
  month: string;
  /** Monthly total in mm; null when missing. */
  mm: number | null;
}

export interface MonthlyRainComparison {
  /** Months compared ('YYYY-MM'), oldest first. */
  months: string[];
  comparison: IndicatorComparison;
  /** Years whose same months are all present (the reference), oldest first. */
  years: number[];
}

const key = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

/**
 * Total of the last `n` months that have data, against the totals of the same calendar months in every other year
 * of the record (a year counts only if all `n` months are present).
 */
export function compareLatestMonths(series: readonly MonthlyRain[], n = 3): MonthlyRainComparison | null {
  const byKey = new Map(series.filter((p) => p.mm !== null && Number.isFinite(p.mm)).map((p) => [p.month, p.mm as number]));
  const last = [...byKey.keys()].sort().pop();
  if (!last) return null;
  const ly = Number(last.slice(0, 4));
  const lm = Number(last.slice(5, 7));
  // offsets back from the last month: (year delta, month) for each of the n months
  const slots = Array.from({ length: n }, (_, k) => {
    const idx = ly * 12 + (lm - 1) - (n - 1 - k);
    return { dy: Math.floor(idx / 12) - ly, m: (idx % 12) + 1 };
  });
  const total = (endYear: number) => {
    let s = 0;
    for (const { dy, m } of slots) {
      const v = byKey.get(key(endYear + dy, m));
      if (v === undefined) return null;
      s += v;
    }
    return s;
  };
  const current = total(ly);
  if (current === null) return null;
  const years: number[] = [];
  const baseline: number[] = [];
  const firstYear = Math.min(...[...byKey.keys()].map((k) => Number(k.slice(0, 4))));
  for (let y = firstYear; y < ly; y++) {
    const v = total(y);
    if (v !== null) {
      years.push(y);
      baseline.push(v);
    }
  }
  return { months: slots.map(({ dy, m }) => key(ly + dy, m)), comparison: compareToBaseline(current, baseline), years };
}
