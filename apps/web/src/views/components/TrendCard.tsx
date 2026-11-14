/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ChartLineUp } from '@phosphor-icons/react';
import type { LinearTrend, ObservedTrend, Provenance } from '@orbisol/core';
import { useTranslation } from 'react-i18next';
import { JudgmentFlag } from './JudgmentFlag';
import { SourceTag } from './SourceTag';

type Measure = 'hotDays' | 'waterBalance';

const W = 320;
const H = 120;
const PAD = { l: 40, r: 8, t: 8, b: 18 };

/** One measure per chart (never two y-scales): yearly values as a 2px line with points, least-squares line dashed. */
function YearChart({ tr, m, label }: { tr: ObservedTrend; m: Measure; label: string }) {
  const ys = tr.years.map((y) => y[m]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo || 1;
  const x = (yr: number) => PAD.l + ((yr - tr.fromYear) / Math.max(1, tr.toYear - tr.fromYear)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);
  const line = tr.years.map((v, i) => `${i ? 'L' : 'M'}${x(v.year).toFixed(1)},${y(v[m]).toFixed(1)}`).join('');
  const fit = tr[m];
  const fmt = (v: number) => String(Math.round(v));
  return (
    <svg className="trend-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className="trend-axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
      <text className="trend-tick" x={PAD.l - 4} y={y(hi) + 4} textAnchor="end">{fmt(hi)}</text>
      <text className="trend-tick" x={PAD.l - 4} y={y(lo) + 4} textAnchor="end">{fmt(lo)}</text>
      <text className="trend-tick" x={PAD.l} y={H - 4}>{tr.fromYear}</text>
      <text className="trend-tick" x={W - PAD.r} y={H - 4} textAnchor="end">{tr.toYear}</text>
      <path className="trend-line" d={line} />
      {fit && <line className="trend-fit" x1={x(tr.fromYear)} x2={x(tr.toYear)} y1={y(fit.fitFirst)} y2={y(fit.fitLast)} />}
      {tr.years.map((v) => (
        <circle key={v.year} className="trend-dot" cx={x(v.year)} cy={y(v[m])} r={2.5}>
          <title>{`${v.year}: ${fmt(v[m])}`}</title>
        </circle>
      ))}
    </svg>
  );
}

function TrendLine({ fit, unit, m }: { fit: LinearTrend | null; unit: string; m: Measure }) {
  const { t } = useTranslation();
  if (!fit) return <p className="small">{t('trend.tooShort')}</p>;
  const r = (v: number) => (Math.abs(v) < 10 ? v.toFixed(1) : String(Math.round(v)));
  const sign = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + r(Math.abs(v));
  const dir = !fit.clear ? 'unclear' : fit.perDecade > 0 ? 'up' : 'down';
  return (
    <p className="trend-value">
      <strong>{t('trend.perDecade', { v: sign(fit.perDecade), unit })}</strong>{' '}
      <span className="small">{t('trend.interval', { lo: sign(fit.low), hi: sign(fit.high) })}</span>
      <br />
      <span className="small">{t(`trend.${m}.${dir}`)}</span>
    </p>
  );
}

export function TrendCard({ tr, climate }: { tr: ObservedTrend; climate?: Provenance }) {
  const { t } = useTranslation();
  const prov: Provenance | null = climate ? { ...climate, dateFrom: `${tr.fromYear}-01-01`, date: `${tr.toYear}-12-31` } : null;
  return (
    <article className="card light trend-card">
      <header className="indicator-head">
        <h3>{t('trend.title', { from: tr.fromYear, to: tr.toYear })}</h3>
        <span className="tercile tercile-none">
          <ChartLineUp size={16} weight="bold" aria-hidden />
          {t('trend.badge')}
        </span>
      </header>
      <p className="gap-note small">{t('trend.notForecast')}</p>

      <h4 className="small-head">{t('trend.hotDays.name')}</h4>
      <p className="small">{t('trend.hotDays.what', { t: tr.hotTmaxC.toFixed(1) })}</p>
      <TrendLine fit={tr.hotDays} unit={t('trend.daysUnit')} m="hotDays" />
      <p className="small">{t('trend.hotDays.decades', { a: Math.round(tr.firstDecade.hotDays), b: Math.round(tr.lastDecade.hotDays) })}</p>
      <YearChart tr={tr} m="hotDays" label={t('trend.hotDays.chart')} />

      <h4 className="small-head">{t('trend.waterBalance.name')}</h4>
      <p className="small">{t('trend.waterBalance.what')}</p>
      <TrendLine fit={tr.waterBalance} unit="mm" m="waterBalance" />
      <p className="small">
        {t('trend.waterBalance.decades', { a: Math.round(tr.firstDecade.waterBalance), b: Math.round(tr.lastDecade.waterBalance) })}
      </p>
      <YearChart tr={tr} m="waterBalance" label={t('trend.waterBalance.chart')} />
      <p className="small trend-legend">{t('trend.legend')}</p>

      <details className="note-section">
        <summary>{t('trend.table')}</summary>
        <table className="fit-table">
          <thead>
            <tr>
              <th scope="col">{t('trend.year')}</th>
              <th scope="col">{t('trend.hotDays.short')}</th>
              <th scope="col">{t('trend.rain')}</th>
              <th scope="col">ET0</th>
              <th scope="col">{t('trend.balance')}</th>
            </tr>
          </thead>
          <tbody>
            {tr.years.map((v) => (
              <tr key={v.year}>
                <th scope="row">{v.year}</th>
                <td>{v.hotDays}</td>
                <td>{Math.round(v.rain)}</td>
                <td>{Math.round(v.et0)}</td>
                <td>{Math.round(v.waterBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="small"><JudgmentFlag reason={t('trend.caveat')} /></p>
      <p className="small">{t('trend.method')}</p>
      {prov && <SourceTag provenance={prov} />}
    </article>
  );
}
