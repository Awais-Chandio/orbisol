/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowRight, Check, Drop, Flag, Plant, Minus } from '@phosphor-icons/react';
import type { Provenance, WaterFit } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { referenceProvenance } from '@/config/citations';
import { monthName } from '@/views/format';
import { SourceTag } from './SourceTag';

const STATUS_ICON = { ok: Check, over: Flag, young: Plant, none: Minus } as const;

/** Canal turn interval vs FAO-56 safe interval, month by month. Status is shown by icon + word, never colour alone. */
export function WaterFitDetail({ fit, climate }: { fit: WaterFit | null; climate?: Provenance }) {
  const { t } = useTranslation();
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
  const anyYoung = fit.months.some((m) => m.status === 'young');
  const et0: Provenance | null = climate ? { ...climate, dateFrom: '1991-01-01', date: '2020-12-31' } : null;
  return (
    <details className={'note-section water-fit' + (n ? ' risks' : '')} open={n > 0}>
      <summary>
        {t('waterFit.title')} ({n ? t('waterFit.flagged', { count: n }) : t('waterFit.allFit')})
      </summary>
      <p className={n ? 'gap-note' : ''}>
        {n ? t('waterFit.summaryOver', { days: fit.intervalDays, months: overList }) : t('waterFit.summaryOk', { days: fit.intervalDays })}
      </p>
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
            <th scope="col">{t('waterFit.fit')}</th>
          </tr>
        </thead>
        <tbody>
          {fit.months.map((m) => {
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
