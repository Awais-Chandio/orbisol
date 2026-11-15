/**
 * Orbisol web - farmer-layer sentences: one plain sentence per screen or card, built from numbers already computed.
 * Presentation only (no new calculations). Shared by the screens and the "Listen" button.
 * AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md.
 */
import type { TFunction } from 'i18next';
import type { Tercile } from '@orbisol/core';
import type { IndicatorView } from '@/controllers/useSeasonVsNormal';
import type { Heat2050 } from '@/models/heat2050';
import type { StrategyView } from '@/controllers/useRotationComparison';

const round = (x: number) => String(Math.round(x));
const lowerFirst = (x: string) => x.charAt(0).toLocaleLowerCase() + x.slice(1);
export const span = (v: [number, number]) => (round(v[0]) === round(v[1]) ? round(v[0]) : `${round(v[0])}–${round(v[1])}`);

/** Bare days in the hottest months. */
export function barePlain(t: TFunction, bareHotDays: number): string {
  return bareHotDays > 0 ? t('plain.bareHot', { count: bareHotDays }) : t('plain.bareCovered');
}

/**
 * Water of a rotation vs the current one (pct: + = more water), in canal turns: x% less water = about 1 in
 * round(100 / x) turns saved; only from 5% (below that the turn count would be noise).
 */
export function waterPlain(t: TFunction, pct: number, crops: string): string {
  if (pct <= -5) return t('plain.turnsSaved', { crops, n: Math.round(100 / -pct), pct: -pct });
  if (pct >= 5) return t('plain.turnsExtra', { crops, n: Math.round(100 / pct), pct });
  if (pct <= -3) return t('plain.waterLess', { crops, pct: -pct });
  if (pct >= 3) return t('plain.waterMore', { crops, pct });
  return t('plain.waterSame', { crops });
}

export function seasonPlain(t: TFunction, hot: Tercile | null, rain: Tercile | null, days: 30 | 90 = 90): string {
  return t('plain.season', {
    period: t(days === 30 ? 'plain.last1' : 'plain.last3'),
    hot: lowerFirst(t('overview.season.hot.' + (hot ?? 'none'))),
    rain: t('overview.season.rain.' + (rain ?? 'none')),
  });
}

export function heatPlain(t: TFunction, h: Heat2050): string | null {
  const c = h.range.ssp245.change;
  return c ? t('plain.heat2050', { v: span(c), t: h.hotTmaxC.toFixed(1), year: Math.round((h.future.from + h.future.to) / 2 / 10) * 10 }) : null;
}

/** One sentence per season card, by how it compares with normal. */
export function indicatorPlain(t: TFunction, v: IndicatorView): string {
  if (!v.available || !v.tercile) return t('plain.ind.none');
  if (v.key === 'frostDays' && v.value === 0 && v.normal === 0) return t('plain.ind.frostDays.zero');
  return t(`plain.ind.${v.key}.${v.tercile}`);
}

/** Trade-off of an option vs the current rotation: gains and losses in words (never by colour alone). */
export function tradeoffText(t: TFunction, s: StrategyView): string {
  const gains: string[] = [];
  const losses: string[] = [];
  if (s.waterPct <= -3) gains.push(t('rotations.gains.water'));
  if (s.waterPct >= 3) losses.push(t('rotations.losses.water'));
  if (s.bareDelta <= -7) gains.push(t('rotations.gains.bare'));
  if (s.bareDelta >= 7) losses.push(t('rotations.losses.bare', { days: s.bareDelta }));
  if (s.legumeDaysDelta >= 30) gains.push(t('rotations.gains.legume'));
  if (s.legumeDaysDelta <= -30) losses.push(t('rotations.losses.legume'));
  if (gains.length && losses.length) return t('rotations.tradeoff', { gains: gains.join(', '), losses: losses.join(', ') });
  if (gains.length) return gains.join(', ');
  if (losses.length) return losses.join(', ');
  return t('rotations.tradeoffNone');
}
