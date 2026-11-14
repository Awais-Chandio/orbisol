/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowDown, ArrowUp, Equals, Question, type Icon } from '@phosphor-icons/react';
import type { Tercile } from '@orbisol/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { IndicatorView } from '@/controllers/useSeasonVsNormal';
import { GlossaryTip, type GlossaryTerm } from './GlossaryTip';
import { SourceTag } from './SourceTag';

const TERM: Partial<Record<IndicatorView['key'], GlossaryTerm>> = {
  greenness: 'ndvi',
  et0Total: 'et0',
  waterBalance: 'waterBalance',
  soilWetness: 'soilAnomaly',
  frostDays: 'frost',
};

const TERCILE: Record<Tercile, Icon> = { above: ArrowUp, near: Equals, below: ArrowDown };

type Unit = 'days' | 'mm' | 'pct' | 'ndvi';
const UNIT: Record<IndicatorView['key'], Unit> = {
  hotDays: 'days',
  heavyRainDays: 'days',
  frostDays: 'days',
  rainTotal: 'mm',
  et0Total: 'mm',
  waterBalance: 'mm',
  soilWetness: 'pct',
  tmaxMean: 'days',
  greenness: 'ndvi',
};

export function formatIndicator(key: IndicatorView['key'], x: number): string {
  if (!Number.isFinite(x)) return '–';
  const unit = UNIT[key];
  if (unit === 'pct') return String(Math.round(x * 100));
  if (unit === 'ndvi') return x.toFixed(2);
  if (unit === 'days') return Number.isInteger(x) ? String(x) : x.toFixed(1);
  return Math.abs(x) < 10 ? x.toFixed(1) : String(Math.round(x));
}

/** Usual range (band), normal (tick) and this season (dot) on one line: three different shapes, never colour alone. */
function RangeBar({ v, fmt }: { v: IndicatorView; fmt: (x: number) => string }) {
  const { t } = useTranslation();
  const xs = [v.p10, v.p90, v.normal, v.value].filter(Number.isFinite);
  if (xs.length < 4) return null;
  let lo = Math.min(...xs);
  let hi = Math.max(...xs);
  const pad = (hi - lo) * 0.08;
  lo -= pad;
  hi += pad;
  if (hi - lo < 1e-9) hi = lo + Math.max(1, Math.abs(lo) * 0.1);
  if (lo < 0 && Math.min(...xs) >= 0) lo = 0; // counts and amounts never go below zero
  const pos = (x: number) => `${(((x - lo) / (hi - lo)) * 100).toFixed(1)}%`;
  return (
    <div className="range-bar-wrap">
      <div
        className="range-bar"
        role="img"
        aria-label={t('season.rangeAria', { value: fmt(v.value), normal: fmt(v.normal), lo: fmt(v.p10), hi: fmt(v.p90) })}
      >
        <span className="rb-band" style={{ left: pos(v.p10), width: `calc(${pos(v.p90)} - ${pos(v.p10)})` }} />
        <span className="rb-normal" style={{ left: pos(v.normal) }} />
        <span className="rb-dot" style={{ left: pos(v.value) }} />
      </div>
      <p className="rb-legend" aria-hidden>
        <span><i className="rb-key-dot" /> {t('season.legend.now')}</span>
        <span><i className="rb-key-normal" /> {t('season.legend.normal')}</span>
        <span><i className="rb-key-band" /> {t('season.legend.range')}</span>
      </p>
    </div>
  );
}

export function IndicatorCard({ v, children, titleKey, explain }: { v: IndicatorView; children?: ReactNode; titleKey?: string; explain?: ReactNode }) {
  const { t } = useTranslation();
  const fmt = (x: number) => {
    const shown = formatIndicator(v.key, x);
    return `${shown} ${t('season.unit.' + UNIT[v.key], { count: Number(shown) })}`;
  };
  const TI = v.tercile ? TERCILE[v.tercile] : Question;
  return (
    <article className="card light indicator">
      <header className="indicator-head">
        <h3>
          {t(titleKey ?? `season.ind.${v.key}.name`)}
          {TERM[v.key] && <GlossaryTip term={TERM[v.key]!} />}
        </h3>
        <span className={'tercile tercile-' + (v.tercile ?? 'none')}>
          <TI size={16} weight="bold" aria-hidden />
          {t('season.tercile.' + (v.tercile ?? 'none'))}
        </span>
      </header>
      {v.available ? (
        <>
          <p className="indicator-value">{fmt(v.value)}</p>
          <RangeBar v={v} fmt={fmt} />
          <p className="small">
            {t('season.normal', { v: fmt(v.normal) })} · {t('season.range', { lo: fmt(v.p10), hi: fmt(v.p90) })}
          </p>
        </>
      ) : (
        <p className="indicator-value">–</p>
      )}
      {children}
      <SourceTag provenance={v.provenance} />
      <details className="what-means">
        <summary>{t('season.whatMeans')}</summary>
        <p className="small">{t(`season.ind.${v.key}.what`)}</p>
        {explain}
      </details>
    </article>
  );
}
