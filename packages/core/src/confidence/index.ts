/**
 * Orbisol core - Confidence Meter: high / medium / low, with the reasons.
 * Point rules (design choice, documented in docs/limitations.md):
 *   twins close (RMS z <= 0.75: +2, <= 1.25: +1), twins agree (>= 80%: +2, >= 60%: +1),
 *   complete data (>= 95% of days: +1), track record (n >= 10: beats naive baseline by >= 10 points: +1,
 *   no better than baseline: -1). High >= 5, medium >= 3, else low.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { ConfidenceLevel } from '../types';

export interface ConfidenceInput {
  nTwins: number;
  meanDistance: number;
  agreement: number;
  coverage: number;
  backtest?: { n: number; hitRate: number; baselineRate: number };
}

export interface ConfidenceFactor {
  key: string;
  params?: Record<string, number>;
  points: number;
}

export interface ConfidenceResult {
  level: ConfidenceLevel;
  points: number;
  /** Key of the factor that matters most for the level (for the one-line reason). */
  reason: string;
  factors: ConfidenceFactor[];
}

export function confidenceMeter(i: ConfidenceInput): ConfidenceResult {
  const f: ConfidenceFactor[] = [];
  if (i.nTwins === 0) {
    return { level: 'low', points: 0, reason: 'confidence.noTwins', factors: [{ key: 'confidence.noTwins', points: 0 }] };
  }
  const d = Math.round(i.meanDistance * 100) / 100;
  f.push(
    i.meanDistance <= 0.75
      ? { key: 'confidence.twinsClose', params: { d }, points: 2 }
      : i.meanDistance <= 1.25
        ? { key: 'confidence.twinsFairlyClose', params: { d }, points: 1 }
        : { key: 'confidence.twinsFar', params: { d }, points: 0 },
  );
  const pct = Math.round(i.agreement * 100);
  f.push(
    i.agreement >= 0.8
      ? { key: 'confidence.twinsAgree', params: { pct }, points: 2 }
      : i.agreement >= 0.6
        ? { key: 'confidence.twinsMostlyAgree', params: { pct }, points: 1 }
        : { key: 'confidence.twinsDisagree', params: { pct }, points: 0 },
  );
  const cov = Math.round(i.coverage * 100);
  f.push(i.coverage >= 0.95 ? { key: 'confidence.dataComplete', params: { pct: cov }, points: 1 } : { key: 'confidence.dataGaps', params: { pct: cov }, points: 0 });
  if (i.backtest && i.backtest.n >= 10 && Number.isFinite(i.backtest.hitRate)) {
    const hit = Math.round(i.backtest.hitRate * 100);
    const base = Math.round(i.backtest.baselineRate * 100);
    if (hit - base >= 10) f.push({ key: 'confidence.trackGood', params: { hit, base, n: i.backtest.n }, points: 1 });
    else if (hit <= base) f.push({ key: 'confidence.trackNoSkill', params: { hit, base, n: i.backtest.n }, points: -1 });
    else f.push({ key: 'confidence.trackSmallSkill', params: { hit, base, n: i.backtest.n }, points: 0 });
  }
  const points = f.reduce((a, x) => a + x.points, 0);
  const level: ConfidenceLevel = points >= 5 ? 'high' : points >= 3 ? 'medium' : 'low';
  // reason: weakest factor for medium/low, strongest for high
  const sorted = [...f].sort((a, b) => (level === 'high' ? b.points - a.points : a.points - b.points));
  return { level, points, reason: sorted[0]!.key, factors: f };
}
