/* AI-assisted: drafted with Claude (Anthropic). See docs/ai-usage.md. */
import { ArrowLeft, Printer } from '@phosphor-icons/react';
import type { Provenance } from '@orbisol/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGreennessMonthly } from '@/controllers/useGreenness';
import { useHeat2050State } from '@/controllers/useHeat2050';
import { useRotationComparison, type StrategyView } from '@/controllers/useRotationComparison';
import { useSeasonVsNormal } from '@/controllers/useSeasonVsNormal';
import { inCaseStudy } from '@/config/caseStudy';
import { referenceProvenance } from '@/config/citations';
import { ClimateStripes } from '@/views/components/ClimateStripes';
import { CropYearTimeline } from '@/views/components/CropYearTimeline';
import { NeedPin } from '@/views/components/NeedPin';
import { useNoteText } from '@/views/components/NoteList';
import { saltOf } from '@/views/components/SaltNote';
import { SourceTag } from '@/views/components/SourceTag';
import { monthName } from '@/views/format';
import { barePlain, heatPlain, seasonPlain, span, waterPlain } from '@/views/plain';
import { NASA_CREDITS, REFERENCE_CREDITS } from './AboutScreen';

const SEASON_DAYS = 90;
const FAO_ET: Provenance = { source: 'FAO-56 Kc × NASA POWER ET0', kind: 'model', date: '1991–2020' };

/**
 * Print-ready one-page field report (A4): the Overview findings, the rotation comparison, the crop-year
 * timeline with the greenness curve, the climate stripes and every source. Everything is read from app state.
 */
export function ReportScreen() {
  const { t, i18n } = useTranslation();
  const r = useRotationComparison();
  const s = useSeasonVsNormal(SEASON_DAYS);
  const { data: heat } = useHeat2050State();
  const g = useGreennessMonthly();
  const noteText = useNoteText();
  const here = inCaseStudy(r.pin);

  if (!r.pin)
    return (
      <section className="screen">
        <h1>{t('report.title')}</h1>
        <NeedPin />
      </section>
    );

  const pin = r.pin;
  const ex = r.strategies[0];
  const best = r.strategies[1];
  const hotMonths = (r.hazards?.hot ?? []).map((m) => monthName(m, 'long')).join(', ');
  const ind = (k: 'hotDays' | 'rainTotal') => s.indicators.find((v) => v.key === k);
  const hot = ind('hotDays');
  const rain = ind('rainTotal');
  const fmt0 = (x: number | undefined) => (x === undefined || !Number.isFinite(x) ? '–' : Math.abs(x) < 10 ? x.toFixed(1).replace(/\.0$/, '') : String(Math.round(x)));
  const h245 = heat?.range.ssp245.change ?? null;
  const crops = (v: StrategyView) => v.plan.slots.map((x) => t('crops.' + x.crop)).join(' → ');
  const today = new Date().toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });
  const coords = `${pin.lat.toFixed(4)}, ${pin.lon.toFixed(4)}`;

  const waterCell = (v: StrategyView) =>
    v.plan.kind === 'existing' ? t('report.table.current') : v.waterPct <= -3 ? t('report.table.less', { pct: -v.waterPct }) : v.waterPct >= 3 ? t('report.table.more', { pct: v.waterPct }) : t('report.table.same');
  const fitCell = (v: StrategyView) => {
    if (!v.fit) return t('report.table.noCanal');
    const n = v.fit.overMonths.length;
    return n ? t('waterFit.summaryOver', { days: v.fit.intervalDays, months: v.fit.overMonths.map((m) => monthName(m)).join(', ') }) : t('waterFit.summaryOk', { days: v.fit.intervalDays });
  };
  const saltCell = (v: StrategyView) => {
    if (r.farm.soil.salty !== true) return t('report.table.notSalty');
    const uniq = [...new Set(v.plan.slots.map((x) => x.crop))];
    const sens = uniq.filter((c) => saltOf(c).cls === 'sensitive').map((c) => t('crops.' + c));
    const unk = uniq.filter((c) => saltOf(c).cls === 'unknown').map((c) => t('crops.' + c));
    const parts = [sens.length ? t('report.table.saltSens', { crops: sens.join(', ') }) : t('report.table.saltOk'), unk.length ? t('salt.overviewUnknown', { unknown: unk.join(', ') }) : ''];
    return parts.filter(Boolean).join('; ');
  };
  // Same rule as the WhatsApp share text: canal turn too long first, then the first engine risk that is not just "new crop".
  const riskCell = (v: StrategyView) => {
    if (v.fit?.overMonths.length) return t('share.riskCanal', { days: v.fit.intervalDays, months: v.fit.overMonths.map((m) => monthName(m)).join(', ') });
    const n = v.risks.find((x) => x.key !== 'risk.newCrop') ?? v.risks[0];
    return n ? noteText(n) : t('report.table.noRisk');
  };

  const findings: { title: string; plain: string; exact: string; prov: Provenance | null }[] = [];
  if (ex)
    findings.push({
      title: t('overview.bare.label'),
      plain: barePlain(t, ex.metrics.bareHotDays),
      exact: t('overview.bare.text', { months: hotMonths, total: ex.metrics.bareDays }),
      prov: r.provenance ? { ...r.provenance, dateFrom: '1991-01-01', date: '2020-12-31' } : null,
    });
  if (best && ex)
    findings.push({
      title: t('overview.best.label'),
      plain: ex.rank === 1 ? t('plain.existingFirst') : waterPlain(t, best.waterPct, crops(best)),
      exact: t(best.waterPct <= -3 ? 'report.bestLess' : best.waterPct >= 3 ? 'report.bestMore' : 'report.bestSame', { crops: crops(best), pct: Math.abs(best.waterPct) }),
      prov: FAO_ET,
    });
  if (s.comparison && hot && rain)
    findings.push({
      title: t('overview.season.label', { days: SEASON_DAYS }),
      plain: seasonPlain(t, hot.tercile ?? null, rain.tercile ?? null),
      exact: t('report.seasonExact', { hot: fmt0(hot.value), hotN: fmt0(hot.normal), rain: fmt0(rain.value), rainN: fmt0(rain.normal), bFrom: s.comparison.baseline.from, bTo: s.comparison.baseline.to }),
      prov: hot.provenance,
    });
  if (here && heat && h245) {
    const plain = heatPlain(t, heat);
    if (plain)
      findings.push({
        title: t('overview.heat.label', { from: heat.future.from, to: heat.future.to }),
        plain,
        exact: t('report.heatExact', { v: span(h245), hi: heat.range.ssp585?.change ? span(heat.range.ssp585.change) : '–' }),
        prov: heat.provenance,
      });
  }

  const ready = r.strategies.length > 0;
  const extra = [
    { name: 'GeoNames (place search, CC BY 4.0)', url: 'https://www.geonames.org/' },
    { name: '#ShowYourStripes, Ed Hawkins (stripe design, CC BY 4.0)', url: 'https://showyourstripes.info/' },
  ];

  return (
    <article className="report" lang={i18n.language}>
      <div className="report-tools">
        <Link to="/overview" className="btn btn-secondary"><ArrowLeft size={20} aria-hidden /> {t('report.back')}</Link>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={20} aria-hidden /> {t('report.print')}</button>
      </div>

      <header className="report-head">
        <p className="report-brand">Orbisol</p>
        <h1>{t('report.title')}</h1>
        <p className="report-meta">
          <span>{today}</span>
          <span>{pin.label ? `${pin.label} · ${coords}` : coords}</span>
        </p>
        <p className="report-judgment">{t('overview.judgment')}</p>
      </header>

      <section className="report-section">
        <h2>1. {t('report.s1')}</h2>
        {!ready && <p role="status">{t('overview.loading')}</p>}
        <ol className="report-findings">
          {findings.map((f) => (
            <li key={f.title}>
              <strong>{f.title}.</strong> {f.plain} <span className="report-exact">{f.exact}</span>{' '}
              {f.prov && <SourceTag provenance={f.prov} />}
            </li>
          ))}
        </ol>
      </section>

      {ready && (
        <section className="report-section">
          <h2>2. {t('report.s2')}</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">{t('report.table.head')}</th>
                  {r.strategies.map((v, k) => (
                    <th key={v.plan.id} scope="col">
                      {k === 0 ? t('timeline.current') : t('timeline.option', { n: k })}
                      <span className="report-crops">{crops(v)}</span>
                      <span className="report-rank">{t('rotations.rank', { rank: v.rank })}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    [t('report.table.water'), waterCell],
                    [t('report.table.bare', { months: hotMonths }), (v: StrategyView) => t('overview.bare.value', { count: v.metrics.bareHotDays })],
                    [t('report.table.fit'), fitCell],
                    [t('report.table.salt'), saltCell],
                    [t('report.table.risk'), riskCell],
                  ] as [string, (v: StrategyView) => string][]
                ).map(([label, cell]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {r.strategies.map((v) => (
                      <td key={v.plan.id}>{cell(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small">
            {t('report.tableNote')} <SourceTag provenance={FAO_ET} /> <SourceTag provenance={referenceProvenance('fao56_t23')} />
          </p>
        </section>
      )}

      {ex && (
        <section className="report-section report-satellite">
          <h2>3. {t('report.s3')}</h2>
          <p className="small">
            <strong>{t('timeline.current')}:</strong> {crops(ex)} · {t('timeline.bareHotLine', { count: ex.metrics.bareHotDays })}
          </p>
          <CropYearTimeline slots={ex.plan.slots} bare={ex.metrics.bare} hazards={r.hazards} ndvi={g.monthly} ndviProvenance={g.provenance} ndviGap={!g.isLoading && here} />
          <ClimateStripes className="report-stripes" />
        </section>
      )}

      <section className="report-section">
        <h2>4. {t('report.s4')}</h2>
        <ul className="report-sources">
          {[...NASA_CREDITS, ...REFERENCE_CREDITS].map((c) => (
            <li key={c.url + c.name}>
              <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> — {c.use}
              <span className="report-url">{c.url}</span>
            </li>
          ))}
          {extra.map((c) => (
            <li key={c.url}>
              <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a>
              <span className="report-url">{c.url}</span>
            </li>
          ))}
          <li>
            {t('sources.computed')} · {t('sources.farmer')} ({t('report.farmerInputs')})
            {r.provenance && <> · <SourceTag provenance={r.provenance} /></>}
          </li>
        </ul>
      </section>

      <footer className="report-foot">{t('report.footer')}</footer>
    </article>
  );
}
