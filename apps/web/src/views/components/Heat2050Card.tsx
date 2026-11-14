/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ThermometerHot } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { Heat2050 } from '@/models/heat2050';
import { JudgmentFlag } from './JudgmentFlag';
import { SourceTag } from './SourceTag';
import { CaseStudyBadge } from './CaseStudy';

const r = (x: number) => String(Math.round(x));
const span = (v: [number, number] | null) => (v ? (r(v[0]) === r(v[1]) ? r(v[0]) : `${r(v[0])}–${r(v[1])}`) : '–');
const signed = (v: [number, number] | null) => (v ? `+${span(v)}` : '–');

/** Range across climate models, never a single number. */
export function Heat2050Card({ h }: { h: Heat2050 }) {
  const { t } = useTranslation();
  const scen = (['ssp245', 'ssp585'] as const).filter((s) => h.range[s]?.change);
  return (
    <article className="card light trend-card" id="heat-2050">
      <header className="indicator-head">
        <h3>{t('heat2050.title', { from: h.future.from, to: h.future.to })}</h3>
        <span className="tercile tercile-none">
          <ThermometerHot size={16} weight="bold" aria-hidden />
          {t('heat2050.badge')}
        </span>
      </header>
      <CaseStudyBadge />
      <p className="gap-note small">{t('heat2050.notForecast')}</p>
      <p className="small">{t('heat2050.what', { t: h.hotTmaxC.toFixed(1), n: h.models.length })}</p>
      {scen.map((s) => (
        <div key={s} className="trend-value">
          <h4 className="small-head">{t('heat2050.' + s)}</h4>
          <p className="indicator-value heat-change">{t('heat2050.change', { v: signed(h.range[s]!.change) })}</p>
          <p className="small">
            {t('heat2050.counts', {
              bFrom: h.baseline.from,
              bTo: h.baseline.to,
              base: span(h.range.baselineHotDays),
              fut: span(h.range[s]!.hotDays),
            })}
          </p>
        </div>
      ))}
      <details className="note-section">
        <summary>{t('heat2050.byModel')}</summary>
        <table className="fit-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: '40%' }}>{t('heat2050.model')}</th>
              <th scope="col">{h.baseline.from}–{String(h.baseline.to).slice(2)}</th>
              <th scope="col">SSP2-4.5</th>
              {scen.includes('ssp585') && <th scope="col">SSP5-8.5</th>}
            </tr>
          </thead>
          <tbody>
            {h.models.map((m) => (
              <tr key={m.model}>
                <th scope="row">{m.model}</th>
                <td>{m.baselineHotDays === null ? '–' : r(m.baselineHotDays)}</td>
                <td>{m.ssp245.hotDays === null ? '–' : r(m.ssp245.hotDays)}</td>
                {scen.includes('ssp585') && <td>{m.ssp585?.hotDays == null ? '–' : r(m.ssp585.hotDays)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="small"><JudgmentFlag reason={t('heat2050.bias')} /></p>
      <p className="small">{t('heat2050.scenarios')}</p>
      <SourceTag provenance={h.provenance} />
    </article>
  );
}
