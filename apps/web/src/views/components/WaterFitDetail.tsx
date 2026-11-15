/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowRight, Check, Drop, Flag, Plant, Minus } from '@phosphor-icons/react';
import type { Provenance, WaterFit } from '@orbisol/core';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFarmStore } from '@/stores/farmStore';
import { Link } from 'react-router-dom';
import { referenceProvenance } from '@/config/citations';
import { monthName } from '@/views/format';
import { SourceTag } from './SourceTag';

const STATUS_ICON = { ok: Check, over: Flag, young: Plant, none: Minus } as const;

/** Canal turn interval vs FAO-56 safe interval, month by month. Status is shown by icon + word, never colour alone. */
export function WaterFitDetail({ fit, fitWith, climate }: { fit: WaterFit | null; fitWith?: ((days: number) => WaterFit) | null; climate?: Provenance }) {
  const { t } = useTranslation();
  const saved = fit?.intervalDays ?? 7;
  const [days, setDays] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  if (prevSaved !== saved) {
    // the saved turn changed (here or in My farm): the what-if starts again from it
    setPrevSaved(saved);
    setDays(saved);
  }
  const shown = useMemo(() => (fit && fitWith && days !== fit.intervalDays ? fitWith(days) : fit), [fit, fitWith, days]);
  const canal = useFarmStore((s) => s.farm.canal);
  const update = useFarmStore((s) => s.update);
  const sliderId = useId();
  if (!fit)
    return (
      <section className="note-section water-fit empty-state" aria-label={t('waterFit.title')}>
        <h3 className="small-head">{t('waterFit.title')}</h3>
        <p className="empty-line">
          <Drop size={24} aria-hidden /> <strong>{t('waterFit.empty')}</strong>
        </p>
        <p className="small">{t('waterFit.noCanal')}</p>
        <Link className="btn btn-secondary btn-small" to="/farm#canal">
          {t('waterFit.goFarm')} <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    );
  const n = fit.overMonths.length;
  const overList = fit.overMonths.map((m) => monthName(m, 'long')).join(', ');
  const anyYoung = (shown ?? fit).months.some((m) => m.status === 'young');
  const et0: Provenance | null = climate ? { ...climate, dateFrom: '1991-01-01', date: '2020-12-31' } : null;
  return (
    <details className={'note-section water-fit' + (n ? ' risks' : '')} open={n > 0}>
      <summary>
        {t('waterFit.title')} ({n ? t('waterFit.flagged', { count: n }) : t('waterFit.allFit')})
      </summary>
      <p className={n ? 'gap-note' : ''}>
        {n ? t('waterFit.summaryOver', { days: fit.intervalDays, months: overList }) : t('waterFit.summaryOk', { days: fit.intervalDays })}
      </p>
      {fitWith && shown && <WhatIf id={sliderId} saved={fit.intervalDays} days={days} setDays={setDays} shown={shown} onUse={canal ? () => update({ canal: { ...canal, intervalDays: days } }) : undefined} />}
      <p className="small">{t('waterFit.intro')}</p>
      <p className="small">
        {fit.textureAssumed ? t('waterFit.soilAssumed') : t('waterFit.soilUsed', { soil: t('farm.textures.' + fit.texture) })}
      </p>
      <table className="fit-table">
        <thead>
          <tr>
            <th scope="col">{t('waterFit.month')}</th>
            <th scope="col">{t('waterFit.crop')}</th>
            <th scope="col">{t('waterFit.safe')}</th>
            <th scope="col">{days !== fit.intervalDays ? t('waterFit.withTurn', { days }) : t('waterFit.fit')}</th>
          </tr>
        </thead>
        <tbody>
          {(shown ?? fit).months.map((m) => {
            const I = STATUS_ICON[m.status];
            const lim = m.limiting;
            return (
              <tr key={m.month} className={'fit-' + m.status}>
                <th scope="row">{monthName(m.month)}</th>
                <td>{lim ? t('crops.' + lim.crop) : m.flooded.length ? t('waterFit.flooded') : t('rotations.bare')}</td>
                <td>
                  {lim ? (
                    <>
                      <strong>{lim.young ? '≤ ' : ''}{Math.round(lim.safeDays)}</strong>
                      <span className="fit-range">{t('waterFit.range', { low: Math.round(lim.safeLow), high: Math.round(lim.safeHigh) })}</span>
                    </>
                  ) : (
                    '–'
                  )}
                </td>
                <td>
                  <span className="fit-status">
                    <I size={16} weight="bold" aria-hidden /> {t('waterFit.status.' + m.status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {anyYoung && <p className="small">{t('waterFit.youngNote')}</p>}
      <p className="small gap-note">{t('waterFit.limitVolume')}</p>
      <p className="small">{t('waterFit.limitRain')}</p>
      <p className="small">{t('waterFit.sources')}</p>
      <p className="small fit-sources">
        <SourceTag provenance={referenceProvenance('fao56_t19')} />
        <SourceTag provenance={referenceProvenance('fao56_t22')} />
        <SourceTag provenance={referenceProvenance('fao56_t12')} />
        {et0 && <SourceTag provenance={et0} />}
      </p>
    </details>
  );
}

const TURN_MIN = 3;
const TURN_MAX = 21;

/** "What if my canal turn were every N days": recomputes only the Water Fit table; saves nothing until "Use this turn". */
function WhatIf({ id, saved, days, setDays, shown, onUse }: { id: string; saved: number; days: number; setDays: (d: number) => void; shown: WaterFit; onUse?: () => void }) {
  const { t } = useTranslation();
  const n = shown.overMonths.length;
  const young = shown.months.filter((m) => m.status === 'young').length;
  const months = shown.overMonths.map((m) => monthName(m, 'long')).join(', ');
  return (
    <div className="what-if">
      <label htmlFor={id} className="what-if-label">
        {t('waterFit.whatIf', { days })}
      </label>
      <input
        id={id}
        type="range"
        min={Math.min(TURN_MIN, saved)}
        max={Math.max(TURN_MAX, saved)}
        step={1}
        value={days}
        aria-valuetext={t('waterFit.whatIfDays', { days })}
        onChange={(e) => setDays(Number(e.target.value))}
      />
      <p className="what-if-result" aria-live="polite">
        {n ? t('waterFit.whatIfOver', { days, count: n, months }) : t('waterFit.whatIfOk', { days })}
        {young > 0 && <> {t('waterFit.whatIfYoung', { count: young })}</>}
      </p>
      {days !== saved && (
        <div className="what-if-actions">
          <p className="small">{t('waterFit.whatIfNotSaved', { days: saved })}</p>
          {onUse && (
            <button type="button" className="btn btn-secondary btn-small" onClick={onUse}>
              {t('waterFit.useTurn')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
