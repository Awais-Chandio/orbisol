/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowDown, ArrowUp, Equals, Question, type Icon } from '@phosphor-icons/react';
import type { Tercile } from '@orbisol/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { IndicatorView } from '@/controllers/useSeasonVsNormal';
import { SourceTag } from './SourceTag';

const TERCILE: Record<Tercile, Icon> = { above: ArrowUp, near: Equals, below: ArrowDown };

type Unit = 'days' | 'mm' | 'pct';
const UNIT: Record<IndicatorView['key'], Unit> = {
  hotDays: 'days',
  heavyRainDays: 'days',
  frostDays: 'days',
  rainTotal: 'mm',
  et0Total: 'mm',
  waterBalance: 'mm',
  soilWetness: 'pct',
  tmaxMean: 'days',
  greenness: 'pct',
};

export function formatIndicator(key: IndicatorView['key'], x: number): string {
  if (!Number.isFinite(x)) return '–';
  const unit = UNIT[key];
  if (unit === 'pct') return String(Math.round(x * 100));
  if (unit === 'days') return Number.isInteger(x) ? String(x) : x.toFixed(1);
  return Math.abs(x) < 10 ? x.toFixed(1) : String(Math.round(x));
}

export function IndicatorCard({ v, children }: { v: IndicatorView; children?: ReactNode }) {
  const { t } = useTranslation();
  const fmt = (x: number) => {
    const shown = formatIndicator(v.key, x);
    return `${shown} ${t('season.unit.' + UNIT[v.key], { count: Number(shown) })}`;
  };
  const TI = v.tercile ? TERCILE[v.tercile] : Question;
  return (
    <article className="card light indicator">
      <header className="indicator-head">
        <h3>{t(`season.ind.${v.key}.name`)}</h3>
        <span className={'tercile tercile-' + (v.tercile ?? 'none')}>
          <TI size={16} weight="bold" aria-hidden />
          {t('season.tercile.' + (v.tercile ?? 'none'))}
        </span>
      </header>
      {v.available ? (
        <>
          <p className="indicator-value">{fmt(v.value)}</p>
          <p className="small">
            {t('season.normal', { v: fmt(v.normal) })} · {t('season.range', { lo: fmt(v.p10), hi: fmt(v.p90) })}
          </p>
        </>
      ) : (
        <p className="indicator-value">–</p>
      )}
      <p className="small muted">{t(`season.ind.${v.key}.what`)}</p>
      {children}
      <SourceTag provenance={v.provenance} />
    </article>
  );
}
